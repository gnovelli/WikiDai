/**
 * Quick utility to check prompt token lengths
 * Run with: npx ts-node src/prompts/test-prompt-length.ts
 */

import { getWikidataFocusedInstructions } from './wikidata-focused-instructions';
import { getSystemInstructions } from './system-instructions';

function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

function main() {
  console.log('📊 WikidAI System Prompt Analysis\n');
  console.log('='.repeat(60));

  const wikidataPrompt = getWikidataFocusedInstructions();
  const balancedPrompt = getSystemInstructions();

  console.log('\n🔍 Wikidata-Focused Prompt (DEFAULT)');
  console.log('-'.repeat(60));
  console.log(`Characters: ${wikidataPrompt.length.toLocaleString()}`);
  console.log(`Lines: ${wikidataPrompt.split('\n').length.toLocaleString()}`);
  console.log(`Estimated tokens: ~${estimateTokens(wikidataPrompt).toLocaleString()}`);
  console.log(`Gemini context usage: ${((estimateTokens(wikidataPrompt) / 1000000) * 100).toFixed(3)}%`);

  console.log('\n🔍 Balanced Multi-Agent Prompt');
  console.log('-'.repeat(60));
  console.log(`Characters: ${balancedPrompt.length.toLocaleString()}`);
  console.log(`Lines: ${balancedPrompt.split('\n').length.toLocaleString()}`);
  console.log(`Estimated tokens: ~${estimateTokens(balancedPrompt).toLocaleString()}`);
  console.log(`Gemini context usage: ${((estimateTokens(balancedPrompt) / 1000000) * 100).toFixed(3)}%`);

  console.log('\n📈 Statistics');
  console.log('-'.repeat(60));

  // Count SPARQL examples
  const sparqlExampleCount = (wikidataPrompt.match(/```sparql/g) || []).length;
  console.log(`SPARQL examples (Wikidata-focused): ${sparqlExampleCount}`);

  // Count property references
  const propertyCount = (wikidataPrompt.match(/\*\*P\d+\*\*/g) || []).length;
  console.log(`Wikidata properties referenced: ${propertyCount}`);

  // Count entity references
  const entityCount = (wikidataPrompt.match(/\*\*Q\d+\*\*/g) || []).length;
  console.log(`Wikidata entities referenced: ${entityCount}`);

  console.log('\n✅ All prompts loaded successfully!\n');
  console.log('='.repeat(60));
}

main();
