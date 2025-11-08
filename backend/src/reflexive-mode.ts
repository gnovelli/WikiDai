/**
 * Reflexive/Introspective Mode
 *
 * Handles meta-questions about how WikidAI works.
 * Triggered by special commands or questions about the system itself.
 */

export interface ReflexiveResponse {
  isReflexive: boolean;
  answer?: string;
  command?: string;
}

export class ReflexiveMode {
  private helpText = `
# WikidAI - Come Funziona

## 🎯 Architettura

WikidAI è un sistema **multi-agente educativo** che usa Gemini 2.5 Pro come orchestratore per coordinare diverse fonti di conoscenza aperte.

### Componenti Principali:

1. **Orchestratore (Gemini 2.5 Pro)**
   - Analizza la tua domanda in linguaggio naturale
   - Decide quali agenti chiamare e in che ordine
   - Compone la risposta finale dai dati ricevuti
   - **Thinking Mode**: Mostra il ragionamento interno

2. **Agenti Disponibili**:
   - 🔍 **Wikidata**: Query SPARQL su knowledge graph strutturato
   - 📚 **Wikipedia**: Riassunti enciclopedici
   - 🌐 **DuckDuckGo**: Ricerca web (fallback)
   - 📍 **Nominatim**: Geocoding (OpenStreetMap)
   - ☁️ **Open-Meteo**: Previsioni meteo

3. **Sistema di Conversazione**:
   - Mantiene storia messaggi per contesto
   - Supporta conversazioni multiple simultanee
   - Ogni conversazione ha ID univoco

## 🔄 Workflow Tipico

**Esempio**: "Qual è il meteo dove è nato Einstein?"

### Turn 1: Gemini analizza
- Identifica dipendenze: serve birthplace → coordinate → meteo
- Decide: chiamare Wikidata prima

### Turn 2: Query Wikidata
- Genera SPARQL: \`SELECT ?birthplace WHERE { wd:Q937 wdt:P19 ?birthplace }\`
- Risposta: "Ulm, Germany"

### Turn 3: Geocoding
- Chiama Nominatim con "Ulm, Germany"
- Risposta: lat=48.40, lon=9.99

### Turn 4: Meteo
- Chiama Open-Meteo con coordinate
- Risposta: 12°C, nuvoloso

### Turn 5: Sintesi Finale
- Gemini compone: "Einstein è nato a Ulm, Germania. Il meteo attuale è 12°C, nuvoloso"

## 🧠 Modalità Educativa

**Cosa vedi nell'UI**:
- **Reasoning Panel**: Tutti i pensieri e chiamate agenti in tempo reale
- **Final Answer**: Risposta sintetizzata con link alle fonti
- **SPARQL Queries**: Query generate mostrate per imparare

## 💬 Gestione Conversazioni

**Contesto Persistente**: Ogni conversazione mantiene:
- History completa messaggi user/assistant
- Metadata (latenza media, agenti usati)
- Titolo auto-generato dalla prima domanda

**Multi-Conversazione**: Puoi avere più conversazioni attive:
- Ogni conversazione è isolata
- Massimo 100 conversazioni in memoria
- Auto-cleanup delle più vecchie

## 🔒 Zero Allucinazioni

**Regola fondamentale**: Gemini risponde SOLO usando dati da API esterne.
- ❌ Non usa conoscenza interna
- ✅ Dichiara se informazione non disponibile
- ✅ Cita sempre la fonte

## 📊 SPARQL e Wikidata

**Focus Principale**: Insegnare SPARQL attraverso esempi reali

**PREFIX Declarations**:
\`\`\`sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>
\`\`\`

**Esempio Query**:
\`\`\`sparql
SELECT ?mayorLabel WHERE {
  wd:Q64 p:P6 ?statement .
  ?statement ps:P6 ?mayor .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
\`\`\`

## 🎨 UI Features

- **Link Cliccabili**: Tutti i URL automaticamente clickable
- **Copy Buttons**: Copia reasoning o risposte con 1-click
- **Feedback Visivo**: Conferme azioni utente
- **Responsive**: Funziona su mobile e desktop

## 🐳 Deployment Docker

**3 Container**:
- \`backend\`: Node.js + TypeScript + Gemini
- \`frontend\`: Nginx + Static HTML
- \`redis\`: Cache + Task Queue (BullMQ)

## 🤔 Comandi Speciali

- \`/help\` - Mostra questo messaggio
- \`/how\` - Spiega come funziona il sistema
- \`/stats\` - Statistiche conversazione corrente
- \`/clear\` - Cancella conversazione corrente
- \`/new\` - Inizia nuova conversazione

## 📍 Presentato a

**itWikiCon 2025 Catania**
Demo by: voce777 / Giovanni Novelli

## 🔗 Link Utili

- Repository: https://github.com/gnovelli/wikidai
- Wikidata Query Service: https://query.wikidata.org/
- Conference: https://meta.wikimedia.org/wiki/ItWikiCon/2025
`;

  /**
   * Check if query is a reflexive/meta question
   */
  isReflexiveQuery(query: string): boolean {
    const normalized = query.toLowerCase().trim();

    // Special commands
    const commands = ['/help', '/how', '/stats', '/clear', '/new', '/explain'];
    if (commands.some((cmd) => normalized.startsWith(cmd))) {
      return true;
    }

    // Meta questions patterns
    const metaPatterns = [
      /come\s+funzion/i, // "come funziona"
      /how\s+(do|does)\s+(you|this|it)\s+work/i,
      /what\s+(is|are)\s+(you|this|wikidai)/i,
      /che\s+cos[''è]\s+(wikidai|questo)/i,
      /spiega(mi)?\s+(come|cosa)/i,
      /explain\s+(how|what)/i,
      /cosa\s+fai/i,
      /what\s+(do|can)\s+you\s+do/i,
      /quali\s+(agenti|fonti)/i,
      /what\s+(agents|sources)/i,
    ];

    return metaPatterns.some((pattern) => pattern.test(normalized));
  }

  /**
   * Handle reflexive query
   */
  handleReflexive(query: string): ReflexiveResponse {
    const normalized = query.toLowerCase().trim();

    // Commands
    if (normalized.startsWith('/help') || normalized.startsWith('/how')) {
      return {
        isReflexive: true,
        command: 'help',
        answer: this.helpText,
      };
    }

    if (normalized.startsWith('/stats')) {
      return {
        isReflexive: true,
        command: 'stats',
        answer:
          'Le statistiche della conversazione verranno mostrate separatamente. ' +
          'Usa il backend API endpoint /api/conversations/:id/stats per dettagli.',
      };
    }

    if (normalized.startsWith('/clear')) {
      return {
        isReflexive: true,
        command: 'clear',
        answer:
          '✅ Conversazione cancellata. Puoi iniziare una nuova conversazione con /new',
      };
    }

    if (normalized.startsWith('/new')) {
      return {
        isReflexive: true,
        command: 'new',
        answer: '✅ Nuova conversazione creata. Puoi iniziare a fare domande!',
      };
    }

    // Meta questions - provide summary
    if (this.isReflexiveQuery(query)) {
      return {
        isReflexive: true,
        answer: this.getShortExplanation(),
      };
    }

    return { isReflexive: false };
  }

  /**
   * Short explanation for meta questions
   */
  private getShortExplanation(): string {
    return `
# Come Funziona WikidAI

**WikidAI** è un sistema educativo multi-agente che usa **Gemini 2.5 Pro** per orchestrare fonti di conoscenza aperte.

## 🔄 Processo:

1. **Analizzo la tua domanda** in linguaggio naturale
2. **Decido quali agenti chiamare**:
   - 🔍 Wikidata (SPARQL queries)
   - 📚 Wikipedia (riassunti)
   - 📍 Nominatim (geocoding)
   - ☁️ Open-Meteo (meteo)
3. **Eseguo le chiamate** in sequenza o parallelo
4. **Compongo la risposta** dai dati ricevuti
5. **Mostro il ragionamento** nel pannello "AI Reasoning Process"

## 🎯 Obiettivo Educativo:

Non solo darti una risposta, ma **mostrarti COME** l'ho ottenuta:
- Query SPARQL generate
- Link alle fonti originali
- Workflow multi-step trasparente

## 💡 Esempi di Domande:

- "Chi è il sindaco di Roma?" → Wikidata SPARQL
- "Popolazione di Tokyo" → Wikidata
- "Meteo a Parigi domani" → Geocoding + Open-Meteo
- "Riassunto su Einstein" → Wikipedia

## 📖 Per saperne di più:

Usa \`/help\` per documentazione completa.

**Demo presentata a itWikiCon 2025 Catania**
by voce777 / Giovanni Novelli
`;
  }
}
