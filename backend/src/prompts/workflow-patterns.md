# WikidAI Multi-Step Workflow Patterns

This document provides detailed examples of how the Gemini orchestrator should handle complex, multi-turn queries that require sequential or parallel agent calls.

## Pattern Categories

1. **Sequential Workflows**: Agent B depends on output from Agent A
2. **Parallel Workflows**: Multiple independent agents called simultaneously
3. **Conditional Workflows**: Agent selection depends on previous results
4. **Cascading Workflows**: Chain of 3+ dependent agents
5. **Disambiguation Workflows**: Handle ambiguous user input

---

## 1. Sequential Workflows

### Pattern 1A: Geocoding → Weather

**User Query**: "What's the weather in Naples tomorrow?"

**Dependency Analysis**:
- `get_weather` requires: `latitude`, `longitude`
- `geocode_location` provides: `latitude`, `longitude`
- **Execution Order**: geocode → weather

**Turn-by-Turn Execution**:

```
TURN 1: User sends query
→ Orchestrator analyzes: Need weather → Need coordinates first
→ FunctionCall: geocode_location("Naples")

TURN 2: Backend executes geocode
→ FunctionResponse: {lat: 40.8518, lon: 14.2681, display_name: "Naples, Italy"}
→ Orchestrator analyzes: Have coordinates, now get weather
→ FunctionCall: get_weather(lat=40.8518, lon=14.2681, forecast_days=2)

TURN 3: Backend executes weather API
→ FunctionResponse: {temperature: 18°C, conditions: "partly cloudy", ...}
→ Orchestrator synthesizes: "Tomorrow in Naples, Italy, expect partly cloudy skies with temperatures around 18°C."
```

**Thinking Mode Output** (visible to user):
```
Turn 1 Thought: "User wants weather for Naples. I need coordinates first. Calling geocoding service..."
Turn 2 Thought: "Received coordinates for Naples, Italy (40.85°N, 14.27°E). Now fetching weather forecast..."
Turn 3 Thought: "Weather data retrieved. Synthesizing response..."
```

---

### Pattern 1B: Wikidata → Wikipedia Enrichment

**User Query**: "Who wrote '1984' and tell me more about them"

**Dependency Analysis**:
- First: Find author via Wikidata
- Then: Get author biography via Wikipedia

**Execution**:

```
TURN 1:
FunctionCall: query_wikidata(
  sparql: "SELECT ?authorLabel WHERE {
    ?book rdfs:label '1984'@en .
    ?book wdt:P50 ?author .
    SERVICE wikibase:label { bd:serviceParam wikibase:language 'en'. }
  }"
)

TURN 2:
FunctionResponse: {results: [{authorLabel: "George Orwell"}]}
FunctionCall: get_wikipedia_summary("George_Orwell")

TURN 3:
FunctionResponse: {summary: "Eric Arthur Blair, known by his pen name George Orwell..."}
Final Answer: "1984 was written by George Orwell. [Biography summary from Wikipedia]"
```

---

## 2. Parallel Workflows

### Pattern 2A: Independent Queries

**User Query**: "Tell me about Einstein and what's the population of Berlin?"

**Dependency Analysis**:
- Two completely independent queries
- No dependencies between them
- Can execute simultaneously

**Execution**:

```
TURN 1:
FunctionCall 1: get_wikipedia_summary("Albert_Einstein")
FunctionCall 2: query_wikidata(
  sparql: "SELECT ?population WHERE { wd:Q64 wdt:P1082 ?population . }"
)

TURN 2:
FunctionResponse 1: {summary: "Albert Einstein was a theoretical physicist..."}
FunctionResponse 2: {results: [{population: "3,850,809"}]}

Final Answer:
"Albert Einstein was a theoretical physicist who developed the theory of relativity...

Berlin's population is approximately 3.85 million."
```

**Key**: Both function calls in TURN 1, processed together in TURN 2.

---

### Pattern 2B: Comparative Queries

**User Query**: "Compare the populations of Tokyo and New York"

**Execution**:

```
TURN 1:
FunctionCall 1: query_wikidata(
  sparql: "SELECT ?pop WHERE { wd:Q1490 wdt:P1082 ?pop . }"  # Tokyo
)
FunctionCall 2: query_wikidata(
  sparql: "SELECT ?pop WHERE { wd:Q60 wdt:P1082 ?pop . }"   # New York
)

TURN 2:
FunctionResponse 1: {results: [{pop: "13,960,000"}]}
FunctionResponse 2: {results: [{pop: "8,336,817"}]}

Final Answer: "Tokyo has a population of approximately 13.96 million, while New York City has about 8.34 million. Tokyo is larger by approximately 5.62 million people."
```

---

## 3. Conditional Workflows

### Pattern 3A: Fallback on Error

**User Query**: "Population of Atlantis"

**Execution**:

```
TURN 1:
FunctionCall: query_wikidata(
  sparql: "SELECT ?pop WHERE {
    ?city rdfs:label 'Atlantis'@en .
    ?city wdt:P1082 ?pop .
  }"
)

TURN 2:
FunctionResponse: {results: []}  # Empty results

Orchestrator Decision: Wikidata has no data. Try Wikipedia as fallback.

FunctionCall: get_wikipedia_summary("Atlantis")

TURN 3:
FunctionResponse: {summary: "Atlantis is a fictional island mentioned in Plato's works..."}

Final Answer: "Atlantis is a fictional location from Plato's dialogues and does not have a real population. According to Wikipedia: [summary]"
```

---

### Pattern 3B: Entity Disambiguation

**User Query**: "What's the capital of Georgia?"

**Problem**: Georgia (country) vs Georgia (US state)

**Execution**:

```
TURN 1:
FunctionCall: query_wikidata(
  sparql: "SELECT ?entity ?entityLabel ?capital ?capitalLabel WHERE {
    ?entity rdfs:label 'Georgia'@en .
    ?entity wdt:P36 ?capital .
    SERVICE wikibase:label { bd:serviceParam wikibase:language 'en'. }
  } LIMIT 5"
)

TURN 2:
FunctionResponse: {
  results: [
    {entityLabel: "Georgia (country)", capitalLabel: "Tbilisi"},
    {entityLabel: "Georgia (U.S. state)", capitalLabel: "Atlanta"}
  ]
}

Orchestrator Decision: Multiple valid answers. Ask user for clarification.

Response: "I found two entities named 'Georgia':
1. Georgia (country) - capital: Tbilisi
2. Georgia (U.S. state) - capital: Atlanta

Which one did you mean?"

User: "The country"

TURN 3:
Final Answer: "The capital of Georgia (country) is Tbilisi."
```

---

## 4. Cascading Workflows (3+ Steps)

### Pattern 4A: Birthplace Weather

**User Query**: "What's the weather like where Marie Curie was born?"

**Dependency Chain**:
1. Wikidata: Find birthplace
2. Geocoding: Get coordinates
3. Weather: Get forecast

**Execution**:

```
TURN 1:
FunctionCall: query_wikidata(
  sparql: "SELECT ?birthplaceLabel WHERE {
    wd:Q7186 wdt:P19 ?birthplace .
    SERVICE wikibase:label { bd:serviceParam wikibase:language 'en'. }
  }"
)

TURN 2:
FunctionResponse: {results: [{birthplaceLabel: "Warsaw"}]}
FunctionCall: geocode_location("Warsaw")

TURN 3:
FunctionResponse: {lat: 52.2297, lon: 21.0122, display_name: "Warsaw, Poland"}
FunctionCall: get_weather(lat=52.2297, lon=21.0122)

TURN 4:
FunctionResponse: {temperature: 12°C, conditions: "overcast"}
Final Answer: "Marie Curie was born in Warsaw, Poland. The current weather there is 12°C with overcast skies."
```

---

### Pattern 4B: Historical Event Location Context

**User Query**: "Where did the Treaty of Versailles get signed and what's nearby?"

**Dependency Chain**:
1. Wikidata: Location of signing
2. Geocoding: Coordinates
3. Wikidata: Nearby landmarks (within radius)

```
TURN 1:
FunctionCall: query_wikidata(
  sparql: "SELECT ?locationLabel WHERE {
    wd:Q8683 wdt:P276 ?location .  # Q8683 = Treaty of Versailles
    SERVICE wikibase:label { bd:serviceParam wikibase:language 'en'. }
  }"
)

TURN 2:
FunctionResponse: {results: [{locationLabel: "Palace of Versailles"}]}
FunctionCall: lookup_coordinates("Palace of Versailles")

TURN 3:
FunctionResponse: {lat: 48.8049, lon: 2.1204}
FunctionCall: query_wikidata(
  sparql: "SELECT ?placeLabel ?location WHERE {
    ?place wdt:P625 ?location .
    SERVICE wikibase:around {
      ?place wdt:P625 ?location .
      bd:serviceParam wikibase:center 'Point(2.1204 48.8049)'^^geo:wktLiteral .
      bd:serviceParam wikibase:radius '5' .  # 5km radius
    }
    SERVICE wikibase:label { bd:serviceParam wikibase:language 'en'. }
  } LIMIT 10"
)

TURN 4:
FunctionResponse: {results: [list of nearby landmarks]}
Final Answer: "The Treaty of Versailles was signed at the Palace of Versailles (48.80°N, 2.12°E). Nearby landmarks include: [list]"
```

---

## 5. Disambiguation Workflows

### Pattern 5A: Geographic Ambiguity (CRITICAL for Nominatim)

**User Query**: "Weather in Springfield"

**Problem**: Multiple cities named Springfield (IL, MA, MO, etc.)

**Execution**:

```
TURN 1:
FunctionCall: lookup_coordinates("Springfield", limit=5)

TURN 2:
FunctionResponse: {
  results: [
    {display_name: "Springfield, Illinois, USA", lat: 39.78, lon: -89.65},
    {display_name: "Springfield, Massachusetts, USA", lat: 42.10, lon: -72.59},
    {display_name: "Springfield, Missouri, USA", lat: 37.21, lon: -93.29},
    {display_name: "Springfield, Oregon, USA", lat: 44.05, lon: -122.98},
    {display_name: "Springfield, Ohio, USA", lat: 39.92, lon: -83.80}
  ]
}

Orchestrator Decision: STOP workflow. Multiple results - MUST ask user.

Response: "I found 5 cities named 'Springfield':
1. Springfield, Illinois, USA
2. Springfield, Massachusetts, USA
3. Springfield, Missouri, USA
4. Springfield, Oregon, USA
5. Springfield, Ohio, USA

Which location did you mean? (Reply with the number or full name)"

User: "2"

TURN 3:
Selected: Springfield, Massachusetts (lat: 42.10, lon: -72.59)
FunctionCall: get_weather(lat=42.10, lon=-72.59)

TURN 4:
FunctionResponse: {weather data}
Final Answer: "Current weather in Springfield, Massachusetts: [details]"
```

**CRITICAL RULE**:
- ❌ NEVER auto-select first result
- ❌ NEVER use `exactly_one=True`
- ✅ ALWAYS present options when results.length > 1
- ✅ ALWAYS wait for user selection

---

## 6. Error Recovery Workflows

### Pattern 6A: API Failure Fallback

**User Query**: "Tell me about quantum computing"

**Execution**:

```
TURN 1:
FunctionCall: query_wikidata(
  sparql: "SELECT ?description WHERE {
    ?item rdfs:label 'quantum computing'@en .
    ?item schema:description ?description .
    FILTER(LANG(?description) = 'en')
  }"
)

TURN 2:
FunctionResponse: {error: "SPARQL syntax error: unexpected token at line 3"}

Orchestrator Decision: SPARQL failed. Try Wikipedia instead.

FunctionCall: get_wikipedia_summary("Quantum_computing")

TURN 3:
FunctionResponse: {summary: "Quantum computing is a type of computation..."}
Final Answer: "Note: Wikidata query failed, using Wikipedia. Quantum computing is a type of computation that uses quantum-mechanical phenomena..."
```

---

### Pattern 6B: No Results → Broader Search

**User Query**: "Who is the mayor of a small village XYZ?"

**Execution**:

```
TURN 1:
FunctionCall: query_wikidata(
  sparql: "SELECT ?mayorLabel WHERE {
    ?village rdfs:label 'XYZ'@en .
    ?village wdt:P6 ?mayor .
    SERVICE wikibase:label { bd:serviceParam wikibase:language 'en'. }
  }"
)

TURN 2:
FunctionResponse: {results: []}  # No results

Orchestrator Decision: No specific mayor data. Broaden search.

Response: "I couldn't find specific information about the mayor of XYZ in Wikidata. This might be because:
- XYZ is a small locality not extensively documented
- The mayor information isn't recorded in Wikidata
- The village name might be spelled differently

Would you like me to:
1. Search for general information about XYZ?
2. Try a different spelling?
3. Search for the administrative region it belongs to?"
```

---

## Implementation Guidelines

### For Orchestrator (Gemini 2.5 Pro)

1. **Analyze Dependencies FIRST**
   - Before generating FunctionCalls, map out what depends on what
   - Identify parallel vs sequential opportunities

2. **Thinking Mode Visibility**
   - Your dependency analysis is automatically shown to users
   - Explain: "I need X before I can get Y"

3. **State Management**
   - Backend preserves conversation history
   - Each turn includes all previous FunctionCall/Response pairs
   - Your Thought Signatures are maintained

4. **Disambiguation Protocol**
   - IF multiple valid interpretations exist → ASK user
   - IF results.length > 1 for geocoding → SHOW options
   - NEVER guess user intent

5. **Error Handling**
   - IF FunctionResponse.error exists → explain to user, suggest alternatives
   - IF results empty → offer to broaden/refine search
   - NEVER hallucinate to fill gaps

### For Backend Implementation

1. **Multi-Turn Support**
   - Maintain chat history across turns
   - Resend full conversation context on each turn
   - Include all Thought Signatures

2. **Rate Limiting**
   - Nominatim calls MUST go through BullMQ queue (1 req/sec)
   - Other APIs: implement exponential backoff

3. **Caching**
   - Check cache before executing FunctionCalls
   - Use multi-TTL strategy (coordinates: 72h, weather: 15min, etc.)

4. **Validation**
   - SPARQL queries: validate with `sparqljs` before execution
   - Geocoding: always request limit=5, never exactly_one=True

---

## Metrics to Track

For each workflow pattern, track:
- Total turns required
- Total latency (ms)
- Cache hit ratio per agent
- Error rate per agent
- User disambiguation requests

These metrics inform optimization strategies and identify bottlenecks.

---

## Testing Workflow Patterns

Recommended test cases for each pattern:

**Sequential**:
- "Weather in Paris tomorrow"
- "Population of Einstein's birthplace"

**Parallel**:
- "Compare Tokyo and London populations"
- "Tell me about Marie Curie and show Berlin on map"

**Conditional**:
- "Population of Atlantis" (triggers fallback)
- "Capital of Georgia" (triggers disambiguation)

**Cascading**:
- "Weather where Shakespeare was born"
- "Nearby landmarks to where Treaty of Versailles was signed"

**Disambiguation**:
- "Weather in Springfield" (geographic)
- "Who is Jordan?" (person ambiguity)

**Error Recovery**:
- Invalid SPARQL → Wikipedia fallback
- Unknown entity → broader search suggestion
