# WikidAI - PoC Implementation

Educational multi-agent system demonstrating transparent AI orchestration with Gemini 2.5 Pro.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Gemini API key (get it from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Setup

1. **Configure environment:**
```bash
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

2. **Start the application:**
```bash
docker compose up
```

3. **Access the dashboard:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/health

## 📋 PoC Features Implemented

### ✅ US-PoC-001: Docker Setup
- Multi-stage Dockerfile for backend
- Nginx-based frontend container
- Redis for future caching
- Hot-reload enabled for development

### ✅ US-PoC-002: Gemini Integration
- Gemini 2.5 Pro with Thinking mode
- Function calling for agent orchestration
- Conversation history management

### ✅ US-PoC-003: Wikidata Agent
- SPARQL generation from natural language
- Syntax validation with sparqljs
- Security sanitization (read-only queries)
- "SPARQL Gauntlet" implemented

### ✅ US-PoC-004: Wikipedia Agent
- Summary retrieval from Wikipedia API
- Error handling for missing articles
- Formatted output

### ✅ US-PoC-005: Multi-Turn Workflows
- Conversation history preservation
- Sequential agent calls
- Thought signature management

### ✅ US-PoC-006: Educational UI
- 3-panel dashboard (Input, Reasoning, Output)
- Real-time visualization of AI reasoning
- Agent call tracking
- Metrics display (latency, agents used)

## 🧪 Running Tests

```bash
# Inside backend container
docker compose exec backend npm test

# Or locally (requires Node.js 20+)
cd backend
npm install
npm test
```

## 📝 Example Queries

Try these queries in the dashboard:

1. **Simple Wikipedia Query:**
   - "Who was Albert Einstein?"
   - Expected: Wikipedia summary

2. **Complex SPARQL Query:**
   - "Who is the mayor of Rome?"
   - Expected: Wikidata SPARQL generation and execution

3. **Multi-Turn Query:**
   - "Tell me about Einstein and his birthplace"
   - Expected: Multiple agent calls (Wikipedia → Wikipedia)

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │ (Nginx + HTML/JS)
│  Port 8080  │
└──────┬──────┘
       │ API Proxy
       ▼
┌─────────────┐      ┌─────────────┐
│   Backend   │◄────►│    Redis    │
│  (Express)  │      │   (Cache)   │
└──────┬──────┘      └─────────────┘
       │
       ├─► Gemini 2.5 Pro API
       ├─► Wikidata SPARQL Endpoint
       └─► Wikipedia Summary API
```

## 📂 Project Structure

```
wikidai/
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── wikidata-agent.ts
│   │   │   └── wikipedia-agent.ts
│   │   ├── config.ts
│   │   ├── orchestrator.ts
│   │   ├── index.ts (Express server)
│   │   └── test-queries.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔧 Development Commands

```bash
# Start all services
docker compose up

# Rebuild after code changes
docker compose up --build

# View logs
docker compose logs -f backend

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v
```

## 📊 PoC Success Criteria

- [x] 3/3 demo queries complete successfully
- [x] SPARQL validation working (100% of queries validated)
- [x] Chain-of-Thought visualization functional
- [x] Docker setup functional
- [x] Multi-turn conversation support

## 🎯 Next Steps (MVP)

See `MVP_plan.md` for the next phase:
- Add remaining 4 agents (Nominatim, OpenMeteo, DuckDuckGo, Geocoding)
- Implement BullMQ rate limiting
- Build production frontend with SolidJS
- Deploy to Google Cloud Run

## 📄 Documentation

- Full architecture: `CLAUDE.md`
- PoC plan: `PoC_plan.md`
- MVP plan: `MVP_plan.md`
- EPR plan: `EPR_plan.md`
- Roadmap: `AGILE_ROADMAP.md`

## 📜 License

[WikiDai LICENSE](LICENSE)
