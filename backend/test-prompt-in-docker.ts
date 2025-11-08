/**
 * Test script to verify Wikidata-focused prompt in Docker
 * Run with: docker compose exec backend npx tsx test-prompt-in-docker.ts
 */

import { GeminiOrchestrator } from './src/orchestrator';

async function testWikidataPrompt() {
  console.log('🧪 Testing Wikidata-Focused Prompt in Docker\n');
  console.log('='.repeat(60));

  const orchestrator = new GeminiOrchestrator();

  // Test query: Simple population lookup
  const testQuery = "What is the population of Tokyo?";

  console.log(`\n📝 Test Query: "${testQuery}"`);
  console.log('Expected: SPARQL query with PREFIX declarations\n');

  try {
    const response = await orchestrator.executeQuery(testQuery);

    console.log('\n✅ Query completed!');
    console.log('='.repeat(60));
    console.log('\n📊 Results:');
    console.log(`- Agent calls: ${response.agentCalls.length}`);
    console.log(`- Latency: ${response.latencyMs}ms`);
    console.log(`- Thoughts: ${response.thoughts.length}`);

    if (response.agentCalls.length > 0) {
      const firstCall = response.agentCalls[0];
      console.log(`\n🔍 First Agent Call: ${firstCall.agent}`);

      if (firstCall.agent === 'query_wikidata' && firstCall.params.sparql_query) {
        const query = firstCall.params.sparql_query;
        console.log('\n📝 Generated SPARQL Query:');
        console.log('-'.repeat(60));
        console.log(query);
        console.log('-'.repeat(60));

        // Check for required PREFIX declarations
        const requiredPrefixes = [
          'PREFIX wd:',
          'PREFIX wdt:',
        ];

        const recommendedPrefixes = [
          'PREFIX wikibase:',
          'PREFIX bd:',
        ];

        console.log('\n✓ Prefix Validation:');
        requiredPrefixes.forEach(prefix => {
          const hasPrefix = query.includes(prefix);
          console.log(`  ${hasPrefix ? '✅' : '❌'} ${prefix} ${hasPrefix ? 'found' : 'MISSING'}`);
        });

        recommendedPrefixes.forEach(prefix => {
          const hasPrefix = query.includes(prefix);
          console.log(`  ${hasPrefix ? '✅' : '⚠️ '} ${prefix} ${hasPrefix ? 'found' : 'missing (needed for labels)'}`);
        });

        // Check for SERVICE wikibase:label
        if (query.includes('SERVICE wikibase:label')) {
          console.log('  ✅ SERVICE wikibase:label found');
        } else {
          console.log('  ⚠️  SERVICE wikibase:label missing');
        }
      }
    }

    console.log('\n💬 Final Answer:');
    console.log('-'.repeat(60));
    console.log(response.answer);
    console.log('-'.repeat(60));

  } catch (error) {
    console.error('\n❌ Error during test:', error);
    process.exit(1);
  }

  console.log('\n✅ Test completed successfully!\n');
  process.exit(0);
}

testWikidataPrompt();
