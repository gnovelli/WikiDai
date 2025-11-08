import axios from 'axios';
import { Parser } from 'sparqljs';
import { WikidataQueryResult } from '../types';

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';
const parser = new Parser();

/**
 * SPARQL Query Validator - "The SPARQL Gauntlet"
 */
class SPARQLValidator {
  private static DANGEROUS_KEYWORDS = ['DELETE', 'INSERT', 'DROP', 'CREATE', 'CLEAR', 'LOAD'];

  static validate(queryString: string): { valid: boolean; error?: string } {
    try {
      // Step 1: Syntax validation with sparqljs
      parser.parse(queryString);

      // Step 2: Security sanitization - check for dangerous keywords
      const upperQuery = queryString.toUpperCase();
      for (const keyword of this.DANGEROUS_KEYWORDS) {
        if (upperQuery.includes(keyword)) {
          return {
            valid: false,
            error: `Dangerous SPARQL keyword detected: ${keyword}. Only read-only queries are allowed.`,
          };
        }
      }

      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: `SPARQL syntax error: ${error.message}`,
      };
    }
  }
}

/**
 * Wikidata Agent
 * Executes validated SPARQL queries against Wikidata
 */
export class WikidataAgent {
  async execute(sparqlQuery: string): Promise<WikidataQueryResult> {
    console.log('🔍 [Wikidata] Executing SPARQL query...');
    console.log('Query:', sparqlQuery.substring(0, 200) + (sparqlQuery.length > 200 ? '...' : ''));

    // Validation
    const validation = SPARQLValidator.validate(sparqlQuery);
    if (!validation.valid) {
      throw new Error(`SPARQL validation failed: ${validation.error}`);
    }

    console.log('✅ [Wikidata] Query validated successfully');

    try {
      const response = await axios.get<WikidataQueryResult>(WIKIDATA_ENDPOINT, {
        params: {
          query: sparqlQuery,
          format: 'json',
        },
        headers: {
          'User-Agent': 'WikidAI-PoC/0.1 (Educational Project)',
        },
        timeout: 10000,
      });

      console.log(`✅ [Wikidata] Query executed. Results: ${response.data.results.bindings.length} rows`);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Wikidata] Query execution failed:', error.message);
      throw new Error(`Wikidata query failed: ${error.message}`);
    }
  }

  /**
   * Format Wikidata results for human-readable output
   */
  formatResults(results: WikidataQueryResult): string {
    if (!results.results.bindings.length) {
      return 'No results found.';
    }

    const bindings = results.results.bindings;
    const vars = results.head.vars;

    let output = `Found ${bindings.length} result(s):\n\n`;

    bindings.slice(0, 10).forEach((binding, idx) => {
      output += `${idx + 1}. `;
      vars.forEach((varName) => {
        if (binding[varName]) {
          const label = varName.replace('Label', '');
          output += `${label}: ${binding[varName].value} `;
        }
      });
      output += '\n';
    });

    if (bindings.length > 10) {
      output += `\n... and ${bindings.length - 10} more results`;
    }

    return output.trim();
  }
}
