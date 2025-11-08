import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { config } from './config';
import { WikidataAgent } from './agents/wikidata-agent';
import { WikipediaAgent } from './agents/wikipedia-agent';
import { NominatimAgent } from './agents/nominatim-agent';
import { OpenMeteoAgent } from './agents/openmeteo-agent';
import { QueryResponse } from './types';
import { PromptMode, getPromptByMode, type PromptModeType } from './prompts';

/**
 * Gemini Orchestrator
 * Uses Gemini 2.5 Pro with Function Calling to orchestrate agents
 */
export class GeminiOrchestrator {
  private genAI: GoogleGenerativeAI;
  private wikidataAgent: WikidataAgent;
  private wikipediaAgent: WikipediaAgent;
  private nominatimAgent: NominatimAgent;
  private openMeteoAgent: OpenMeteoAgent;
  private promptMode: PromptModeType;

  /**
   * @param promptMode - System prompt variant to use
   *                     'wikidata-focused' (default): Extensive SPARQL examples, Wikidata-first
   *                     'balanced': Multi-agent orchestration with all sources
   */
  constructor(promptMode: PromptModeType = PromptMode.WIKIDATA_FOCUSED) {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.wikidataAgent = new WikidataAgent();
    this.wikipediaAgent = new WikipediaAgent();
    this.nominatimAgent = new NominatimAgent();
    this.openMeteoAgent = new OpenMeteoAgent();
    this.promptMode = promptMode;

    console.log(`🤖 GeminiOrchestrator initialized with prompt mode: ${promptMode}`);
  }

  /**
   * Define function declarations for Gemini
   * These are derived from OpenAPI specs
   */
  private getFunctionDeclarations(): FunctionDeclaration[] {
    return [
      {
        name: 'query_wikidata',
        description:
          'Execute a SPARQL query on Wikidata to retrieve structured knowledge graph data. ' +
          'Use this for factual queries about entities, relationships, and properties. ' +
          'IMPORTANT: When searching by entity name (rdfs:label), ALWAYS add type constraints (wdt:P31) to disambiguate. ' +
          'Example: For "Paris", add ?city wdt:P31 wd:Q515 to ensure you get the city, not the person. ' +
          'Verify entity IDs are correct for the context before using hardcoded wd:Q### codes.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            sparql_query: {
              type: SchemaType.STRING,
              description:
                'A complete SPARQL query string. Must be syntactically valid SPARQL 1.1. ' +
                'Use prefixes like wd: for entities and wdt: for properties. ' +
                'Always include SERVICE wikibase:label for human-readable labels. ' +
                'CRITICAL: When using entity IDs (wd:Q###), ensure they match the intended entity. ' +
                'When searching by label, add wdt:P31 (instance of) filters to avoid ambiguity.',
            },
          },
          required: ['sparql_query'],
        },
      },
      {
        name: 'get_wikipedia_summary',
        description:
          'Retrieve a concise summary of a Wikipedia article. ' +
          'Use this for encyclopedic information about people, places, concepts, events.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            term: {
              type: SchemaType.STRING,
              description:
                'The Wikipedia article title or search term (e.g., "Albert_Einstein", "Solar_energy")',
            },
          },
          required: ['term'],
        },
      },
      {
        name: 'geocode_location',
        description:
          'Convert a location name or address into geographic coordinates (latitude, longitude). ' +
          'Use this when you need coordinates for a place, city, address, or landmark. ' +
          'Uses OpenStreetMap Nominatim geocoding service.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description:
                'Location name, address, or place to geocode (e.g., "Rome, Italy", "Eiffel Tower", "10 Downing Street")',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_weather',
        description:
          'Get current weather and forecast for geographic coordinates. ' +
          'Use this after geocoding a location to provide weather information. ' +
          'Uses Open-Meteo weather API.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            latitude: {
              type: SchemaType.NUMBER,
              description: 'Latitude coordinate (-90 to 90)',
            },
            longitude: {
              type: SchemaType.NUMBER,
              description: 'Longitude coordinate (-180 to 180)',
            },
            include_forecast: {
              type: SchemaType.BOOLEAN,
              description: 'Include 3-day forecast (default: false)',
            },
          },
          required: ['latitude', 'longitude'],
        },
      },
    ];
  }

  /**
   * Get system instructions based on configured prompt mode
   */
  private getSystemInstructions(): string {
    return getPromptByMode(this.promptMode);
  }

  /**
   * Main query execution method
   * @param userQuery - The user's question
   * @param conversationHistory - Optional conversation history in Gemini format
   */
  async executeQuery(
    userQuery: string,
    conversationHistory?: Array<{ role: string; parts: Array<{ text: string }> }>
  ): Promise<QueryResponse> {
    const startTime = Date.now();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Processing query: "${userQuery}"`);
    console.log(`${'='.repeat(60)}\n`);

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-thinking-exp-01-21',
      generationConfig: {
        temperature: 0.7,
      },
      systemInstruction: this.getSystemInstructions(),
      tools: [
        {
          functionDeclarations: this.getFunctionDeclarations(),
        },
      ],
    });

    const thoughts: string[] = [];
    const agentCalls: Array<{
      agent: string;
      params: Record<string, any>;
      response: any;
    }> = [];

    // Start conversation with history (if provided)
    const chat = model.startChat({
      history: conversationHistory || [],
    });

    if (conversationHistory && conversationHistory.length > 0) {
      console.log(`📚 Using conversation history: ${conversationHistory.length} messages`);
    }

    let response = await chat.sendMessage(userQuery);
    let turn = 1;

    // Multi-turn conversation loop
    while (true) {
      console.log(`\n--- Turn ${turn} ---`);

      // Extract thoughts if present
      if (response.response.candidates?.[0]?.content?.parts) {
        for (const part of response.response.candidates[0].content.parts) {
          if ('thought' in part && part.thought) {
            console.log('💭 Thought:', part.text?.substring(0, 200));
            thoughts.push(part.text || 'Thinking...');
          }
        }
      }

      // Check for function calls
      const functionCalls = response.response.functionCalls();

      if (!functionCalls || functionCalls.length === 0) {
        // No more function calls - we have the final answer
        const finalText = response.response.text();
        console.log('\n✅ Final Answer:', finalText.substring(0, 200) + '...');

        const latencyMs = Date.now() - startTime;
        console.log(`\n⏱️  Total latency: ${latencyMs}ms`);

        return {
          query: userQuery,
          thoughts,
          agentCalls,
          answer: finalText,
          latencyMs,
        };
      }

      // Execute function calls
      const functionResponses = await Promise.all(
        functionCalls.map(async (call) => {
          console.log(`\n🔧 Function Call: ${call.name}`);
          console.log('Parameters:', JSON.stringify(call.args, null, 2));

          try {
            let result: any;

            switch (call.name) {
              case 'query_wikidata': {
                const sparqlQuery = (call.args as any).sparql_query as string;
                const wikidataResult = await this.wikidataAgent.execute(sparqlQuery);
                result = this.wikidataAgent.formatResults(wikidataResult);
                break;
              }

              case 'get_wikipedia_summary': {
                const term = (call.args as any).term as string;
                const summary = await this.wikipediaAgent.execute(term);
                result = this.wikipediaAgent.formatSummary(summary);
                break;
              }

              case 'geocode_location': {
                const query = (call.args as any).query as string;
                const locations = await this.nominatimAgent.geocode(query);
                result = this.nominatimAgent.formatResults(locations);
                break;
              }

              case 'get_weather': {
                const latitude = (call.args as any).latitude as number;
                const longitude = (call.args as any).longitude as number;
                const includeForecast = (call.args as any).include_forecast || false;
                const weather = await this.openMeteoAgent.getWeather(latitude, longitude, includeForecast);
                result = this.openMeteoAgent.formatWeather(weather);
                break;
              }

              default:
                throw new Error(`Unknown function: ${call.name}`);
            }

            agentCalls.push({
              agent: call.name,
              params: call.args,
              response: result,
            });

            console.log('✅ Function Response:', result.substring(0, 300) + '...');

            return {
              functionResponse: {
                name: call.name,
                response: { result },
              },
            };
          } catch (error: any) {
            console.error(`❌ Function ${call.name} failed:`, error.message);
            return {
              functionResponse: {
                name: call.name,
                response: { error: error.message },
              },
            };
          }
        })
      );

      // Send function responses back to model
      response = await chat.sendMessage(functionResponses);
      turn++;

      // Safety: max 10 turns
      if (turn > 10) {
        console.warn('⚠️  Max turns reached, stopping conversation');
        break;
      }
    }

    // Fallback if loop exits without answer
    return {
      query: userQuery,
      thoughts,
      agentCalls,
      answer: 'Query processing incomplete',
      latencyMs: Date.now() - startTime,
    };
  }
}
