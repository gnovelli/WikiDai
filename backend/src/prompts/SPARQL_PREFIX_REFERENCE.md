# SPARQL PREFIX Declarations Reference

## ⚠️ CRITICAL: Required Prefixes for All Queries

Every SPARQL query sent to Wikidata MUST include these PREFIX declarations:

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>
```

**Why these are mandatory**:
- Without these prefixes, queries will fail with "Unknown prefix" errors
- The Wikidata SPARQL endpoint does NOT provide default prefixes
- Even simple queries using `wd:Q###` or `wdt:P###` need explicit declarations

---

## Standard Prefixes (Use in ALL Queries)

### `wd:` - Wikidata Entities
**URI**: `<http://www.wikidata.org/entity/>`

**Usage**: References to specific Wikidata items and properties

**Examples**:
- `wd:Q64` = Berlin
- `wd:Q5` = human
- `wd:Q1490` = Tokyo
- `wd:Q142` = France

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>

SELECT ?population WHERE {
  wd:Q1490 wdt:P1082 ?population .  # Tokyo's population
}
```

---

### `wdt:` - Direct Properties
**URI**: `<http://www.wikidata.org/prop/direct/>`

**Usage**: Simple property relationships without qualifiers

**Examples**:
- `wdt:P31` = instance of
- `wdt:P569` = date of birth
- `wdt:P1082` = population
- `wdt:P36` = capital

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>

SELECT ?birthDate WHERE {
  wd:Q937 wdt:P569 ?birthDate .  # Einstein's birth date
}
```

---

### `wikibase:` - Wikibase Ontology
**URI**: `<http://wikiba.se/ontology#>`

**Usage**: Required for `SERVICE wikibase:label`

**Why it's needed**: Provides human-readable labels for entity IDs

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>

SELECT ?capitalLabel WHERE {
  wd:Q142 wdt:P36 ?capital .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
```

**Without wikibase prefix**: Error - "Unknown prefix: wikibase"

---

### `bd:` - Blazegraph Extensions
**URI**: `<http://www.bigdata.com/rdf#>`

**Usage**: Required for `bd:serviceParam` in label service

**Why it's needed**: Wikidata uses Blazegraph database extensions

```sparql
SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
```

**Without bd prefix**: Error - "Unknown prefix: bd"

---

## Advanced Prefixes (Use When Needed)

### `p:` - Property Statements (with qualifiers)
**URI**: `<http://www.wikidata.org/prop/>`

**When to use**: Accessing full statements including qualifiers (dates, references, etc.)

**Example**: Get current mayor with start date
```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX ps: <http://www.wikidata.org/prop/statement/>
PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>

SELECT ?mayorLabel ?startDate WHERE {
  wd:Q64 p:P6 ?statement .           # Berlin has head-of-gov statement
  ?statement ps:P6 ?mayor .          # statement value is mayor
  ?statement pq:P580 ?startDate .    # statement qualified by start time
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
```

---

### `ps:` - Statement Simple Values
**URI**: `<http://www.wikidata.org/prop/statement/>`

**When to use**: Extracting the main value from a statement

**Example**: See mayor example above

---

### `pq:` - Qualifier Properties
**URI**: `<http://www.wikidata.org/prop/qualifier/>`

**When to use**: Accessing qualifiers like dates, locations, etc.

**Common qualifiers**:
- `pq:P580` = start time
- `pq:P582` = end time
- `pq:P585` = point in time

---

### `rdfs:` - RDF Schema
**URI**: `<http://www.w3.org/2000/01/rdf-schema#>`

**When to use**: Searching by labels, working with RDF properties

**Example**: Find entities by label
```sparql
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?entity WHERE {
  ?entity rdfs:label "Einstein"@en .
}
LIMIT 10
```

---

### `schema:` - Schema.org
**URI**: `<http://schema.org/>`

**When to use**: Accessing descriptions, article links

**Example**: Get entity description
```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX schema: <http://schema.org/>

SELECT ?description WHERE {
  wd:Q937 schema:description ?description .
  FILTER(LANG(?description) = "en")
}
```

---

## Complete Template

For most Wikidata queries, use this complete template:

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>

SELECT ?itemLabel WHERE {
  # Your query pattern here

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 100
```

### For Advanced Queries with Qualifiers

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX ps: <http://www.wikidata.org/prop/statement/>
PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>

SELECT ?itemLabel ?date WHERE {
  # Your query with statements and qualifiers

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 100
```

---

## Common Errors and Fixes

### Error: "Unknown prefix: wikibase"
**Cause**: Missing `PREFIX wikibase: <http://wikiba.se/ontology#>`

**Fix**: Add to start of query
```sparql
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>
```

---

### Error: "Unknown prefix: bd"
**Cause**: Missing `PREFIX bd: <http://www.bigdata.com/rdf#>`

**Fix**: Required whenever using `SERVICE wikibase:label`

---

### Error: "Unknown prefix: wd"
**Cause**: Missing `PREFIX wd: <http://www.wikidata.org/entity/>`

**Fix**: Add even for simple entity references like `wd:Q64`

---

### Error: "Unknown prefix: wdt"
**Cause**: Missing `PREFIX wdt: <http://www.wikidata.org/prop/direct/>`

**Fix**: Required for ALL property paths like `wdt:P31`, `wdt:P569`, etc.

---

## Quick Reference Table

| Prefix | URI | Use Case | Required? |
|--------|-----|----------|-----------|
| `wd:` | `http://www.wikidata.org/entity/` | Entity IDs (Q###) | ✅ Always |
| `wdt:` | `http://www.wikidata.org/prop/direct/` | Simple properties (P###) | ✅ Always |
| `wikibase:` | `http://wikiba.se/ontology#` | Label service | ✅ Always |
| `bd:` | `http://www.bigdata.com/rdf#` | Service parameters | ✅ Always |
| `p:` | `http://www.wikidata.org/prop/` | Statement properties | ⚠️ When using qualifiers |
| `ps:` | `http://www.wikidata.org/prop/statement/` | Statement values | ⚠️ When using qualifiers |
| `pq:` | `http://www.wikidata.org/prop/qualifier/` | Qualifier properties | ⚠️ When using qualifiers |
| `rdfs:` | `http://www.w3.org/2000/01/rdf-schema#` | Label searches | 🔷 Optional |
| `schema:` | `http://schema.org/` | Descriptions | 🔷 Optional |

---

## Testing Your Prefixes

After adding prefixes, validate your query:

1. **Check all shortcuts have declarations**: If you use `wd:Q64`, ensure `PREFIX wd:` exists
2. **Verify label service prefixes**: Both `wikibase:` and `bd:` must be declared
3. **Test on Wikidata Query Service**: https://query.wikidata.org/

---

## References

- **Wikidata SPARQL Endpoint**: https://query.wikidata.org/
- **Wikidata SPARQL Tutorial**: https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial
- **RDF Prefixes Documentation**: https://www.w3.org/TR/sparql11-query/#prefNames
