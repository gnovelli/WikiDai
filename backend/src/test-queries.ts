/**
 * Test script for PoC demo queries
 * Run with: npm test
 */

import { GeminiOrchestrator } from './orchestrator';

const TEST_QUERIES = [
  {
    id: 1,
    query: "Who was Albert Einstein?",
    expectedAgent: 'get_wikipedia_summary',
    description: 'Simple Wikipedia query',
  },
  {
    id: 2,
    query: "Who is the mayor of Rome?",
    expectedAgent: 'query_wikidata',
    description: 'SPARQL query for factual data',
  },
  {
    id: 3,
    query: "Tell me about Einstein and then about his birthplace",
    expectedAgent: 'multiple',
    description: 'Multi-turn workflow (simulated)',
  },
];

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 WikidAI PoC - Test Suite');
  console.log('='.repeat(70) + '\n');

  const orchestrator = new GeminiOrchestrator();
  let passed = 0;
  let failed = 0;

  for (const test of TEST_QUERIES) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`Test ${test.id}: ${test.description}`);
    console.log(`Query: "${test.query}"`);
    console.log(`${'─'.repeat(70)}`);

    try {
      const result = await orchestrator.executeQuery(test.query);

      console.log('\n📊 Results:');
      console.log(`  Thoughts: ${result.thoughts.length}`);
      console.log(`  Agent Calls: ${result.agentCalls.length}`);
      console.log(`  Latency: ${result.latencyMs}ms`);
      console.log(`\n💬 Answer:\n${result.answer.substring(0, 300)}${result.answer.length > 300 ? '...' : ''}`);

      // Validation
      if (result.answer && result.answer.length > 10) {
        console.log('\n✅ Test PASSED');
        passed++;
      } else {
        console.log('\n❌ Test FAILED: Answer too short or empty');
        failed++;
      }
    } catch (error: any) {
      console.error('\n❌ Test FAILED:', error.message);
      failed++;
    }

    // Wait between tests to avoid rate limits
    if (test.id < TEST_QUERIES.length) {
      console.log('\n⏳ Waiting 3 seconds before next test...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📈 Test Summary');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${passed}/${TEST_QUERIES.length}`);
  console.log(`❌ Failed: ${failed}/${TEST_QUERIES.length}`);
  console.log(`📊 Success Rate: ${((passed / TEST_QUERIES.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(70) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
