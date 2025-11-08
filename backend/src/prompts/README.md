# WikidAI System Prompts

This directory contains comprehensive system instructions for the Gemini 2.5 Pro orchestrator.

## Files

### 1. `wikidata-focused-instructions.ts` ⭐ **PRIMARY**
**Use this by default** for WikidAI's core mission: Wikidata SPARQL education.

**Contents**:
- 15+ comprehensive SPARQL examples (basic → advanced)
- Essential property reference (P31, P569, P1082, etc.)
- Entity ID reference (Q5, Q64, Q1490, etc.)
- Query optimization strategies
- Common query patterns
- SPARQL troubleshooting guide
- Educational response formatting

**When to use**:
- User asks factual questions answerable by Wikidata
- Focus is on teaching SPARQL query generation
- Structured data queries (populations, relationships, facts)
- Default mode for WikidAI

**Example queries**:
- "Who is the mayor of Berlin?"
- "List Nobel Prize winners in Physics"
- "Which inventors were killed by their own inventions?"
- "Population of Tokyo"

---

### 2. `system-instructions.ts`
Balanced multi-agent orchestration for diverse query types.

**Contents**:
- Core principles (zero hallucination, orchestration model)
- Guidelines for all 6 agents (Wikidata, Wikipedia, DuckDuckGo, Nominatim, Geocoding, OpenMeteo)
- Multi-step workflow patterns
- Basic SPARQL examples
- Error handling
- Optimization strategies

**When to use**:
- Queries require multiple knowledge sources
- Geographic/weather queries are frequent
- Need comprehensive agent coverage
- Testing all agents together

**Example queries**:
- "What's the weather where Einstein was born?" (Wikidata → Geocoding → Weather)
- "Tell me about Marie Curie" (Wikipedia)
- "Weather in Springfield" (Geocoding disambiguation → Weather)

---

### 3. `workflow-patterns.md`
Documentation (not a prompt) explaining multi-turn conversation patterns.

**Contents**:
- Sequential workflows (Geocoding → Weather)
- Parallel workflows (independent queries)
- Conditional workflows (fallback on error)
- Cascading workflows (3+ step chains)
- Disambiguation protocols
- Error recovery patterns

**Audience**: Developers implementing or debugging the orchestrator

**Use as**: Reference for understanding how multi-step queries should flow

---

### 4. `index.ts`
Exports and utilities for prompt selection.

**Usage**:
```typescript
import { getWikidataFocusedInstructions, getSystemInstructions, PromptMode, getPromptByMode } from './prompts';

// Recommended: Wikidata-focused (default)
const instructions = getWikidataFocusedInstructions();

// Alternative: Balanced multi-agent
const instructions = getSystemInstructions();

// Dynamic selection
const instructions = getPromptByMode(PromptMode.WIKIDATA_FOCUSED);
```

---

## Prompt Design Principles

### 1. Zero Hallucination (CRITICAL)
All prompts enforce:
- Respond ONLY from FunctionResponse data
- Never use internal knowledge
- Declare when information is unavailable

### 2. Educational Transparency
- Show generated SPARQL queries
- Explain reasoning (via Thinking Mode)
- Provide source links (Wikidata, Wikipedia URLs)
- Make complex queries understandable

### 3. Security
- SPARQL validation (only SELECT, ASK, DESCRIBE, CONSTRUCT)
- Blocklist dangerous operations (DELETE, INSERT, DROP)
- Input sanitization

### 4. Workflow Management
- Analyze dependencies before calling functions
- Handle ambiguity by asking users
- Graceful error recovery
- Optimize for parallel execution when possible

### 5. Wikidata Expertise (wikidata-focused-instructions.ts)
- 15+ few-shot SPARQL examples
- Property/Entity ID reference
- Query patterns for common questions
- Optimization techniques (LIMIT, FILTER, OPTIONAL)

---

## Integration with Orchestrator

Current implementation in `orchestrator.ts`:

```typescript
import { getWikidataFocusedInstructions } from './prompts/wikidata-focused-instructions';

class GeminiOrchestrator {
  private getSystemInstructions(mode: 'wikidata-focused' | 'balanced' = 'wikidata-focused'): string {
    return mode === 'wikidata-focused'
      ? getWikidataFocusedInstructions()
      : getSystemInstructions();
  }

  async executeQuery(userQuery: string): Promise<QueryResponse> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-thinking-exp-01-21',
      systemInstruction: this.getSystemInstructions(), // Defaults to Wikidata-focused
      tools: [{ functionDeclarations: this.getFunctionDeclarations() }],
    });
    // ...
  }
}
```

---

## Customization Guide

### Adding New SPARQL Examples

Edit `wikidata-focused-instructions.ts` → `COMPREHENSIVE_SPARQL_EXAMPLES`:

```typescript
**Example N: [Description]**
Question: "[Natural language question]"
\`\`\`sparql
[Your SPARQL query]
\`\`\`
Entities: wd:Q### = [Name]
Properties: wdt:P### = [Property name]
```

### Adding New Agents

1. Update `system-instructions.ts` → `AGENT_GUIDELINES`:
   ```typescript
   ### 🆕 new_agent_name
   **When to use**: [Description]
   **Input**: [Parameters]
   **Output**: [Response format]
   **Best practices**: [Usage tips]
   ```

2. Add to `workflow-patterns.md` with examples

3. Update `orchestrator.ts` → `getFunctionDeclarations()`

### Modifying Core Principles

Edit both files (ensure consistency):
- `wikidata-focused-instructions.ts` → `WIKIDATA_CORE`
- `system-instructions.ts` → `CORE_PRINCIPLES`

---

## Testing Prompts

### Unit Testing Approach

Create test cases in `orchestrator.test.ts`:

```typescript
describe('Wikidata-Focused Prompt', () => {
  it('should generate valid SPARQL for simple queries', async () => {
    const query = "What is the population of Tokyo?";
    const response = await orchestrator.executeQuery(query);

    expect(response.agentCalls[0].agent).toBe('query_wikidata');
    expect(response.agentCalls[0].params.sparql_query).toContain('wd:Q1490');
    expect(response.agentCalls[0].params.sparql_query).toContain('wdt:P1082');
  });

  it('should handle multi-step workflows', async () => {
    const query = "Weather where Einstein was born";
    const response = await orchestrator.executeQuery(query);

    // Should call Wikidata → Geocoding → Weather
    expect(response.agentCalls.length).toBeGreaterThanOrEqual(2);
    expect(response.agentCalls.map(c => c.agent)).toContain('query_wikidata');
  });
});
```

### Manual Testing Queries

**Wikidata-focused mode**:
- ✅ "Who is the mayor of Berlin?"
- ✅ "Population of Tokyo"
- ✅ "List Nobel Prize winners in Physics since 2010"
- ✅ "Which inventors were killed by their own inventions?"

**Balanced mode**:
- ✅ "Tell me about Albert Einstein" (Wikipedia)
- ✅ "Weather in Paris tomorrow" (Geocoding → Weather)
- ✅ "What is quantum computing?" (DuckDuckGo fallback)

**Edge cases**:
- ❌ "Weather in Springfield" → Should ask for disambiguation
- ❌ "Population of Atlantis" → Should declare no data, explain it's fictional
- ❌ Invalid SPARQL → Should retry or fallback to Wikipedia

---

## Prompt Versioning

When making significant changes:

1. **Document changes** in this README
2. **Create version tag** in file header:
   ```typescript
   /**
    * Version: 2.0.0
    * Last updated: 2025-01-15
    * Changes: Added 5 new SPARQL examples for geospatial queries
    */
   ```
3. **Update tests** to match new behavior
4. **Monitor metrics**: Track SPARQL error rate, hallucination incidents, user satisfaction

---

## Known Limitations

### Current Prompts
- **Token size**: Wikidata-focused prompt is ~6000 tokens (acceptable for Gemini 2.5 Pro's 1M context)
- **Language**: English only (Italian version in comments, not fully implemented)
- **Agents**: Only Wikidata + Wikipedia implemented; others (DuckDuckGo, Nominatim, OpenMeteo) have stubs

### Future Improvements
- [ ] Add Italian language version
- [ ] Expand to 30+ SPARQL examples
- [ ] Add CONSTRUCT query examples (currently only SELECT/ASK)
- [ ] Include Wikidata qualifier examples (P580/P582 for time periods)
- [ ] Add federated query examples (SPARQL + external endpoints)
- [ ] Dynamic few-shot selection based on query type

---

## References

- **Gemini Function Calling**: https://ai.google.dev/gemini-api/docs/function-calling
- **Gemini Thinking Mode**: https://ai.google.dev/gemini-api/docs/thinking
- **Wikidata SPARQL Examples**: https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service/queries/examples
- **WikidAI Architecture**: `/CLAUDE.md`
- **WikidAI Specification**: `/WIKIDAI_spec.pdf`

---

## Maintenance

**Owner**: Backend team
**Review cycle**: After every 100 production queries
**Metrics to monitor**:
- SPARQL syntax error rate
- Hallucination incidents (user reports)
- Multi-turn workflow success rate
- Average response quality (user feedback)

**Update triggers**:
- New agent added
- SPARQL error rate >5%
- User feedback indicates confusion
- Wikidata schema changes
