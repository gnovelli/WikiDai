<div align="center">

# WikidAI

### **AI-Powered Knowledge Assistant with Transparent Multi-Agent Orchestration**

*Educational demonstration of how modern LLMs orchestrate specialized agents to answer complex queries*

[![License: WDL](https://img.shields.io/badge/License-WikidAI_LICENSE-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Gemini 2.5 Pro](https://img.shields.io/badge/Gemini-2.5%20Pro-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Quick Start](#-quick-start) • [Features](#-what-makes-wikidai-special) • [Architecture](#-architecture) • [Demo Queries](#-try-it-yourself)

</div>

---

## 💡 What is WikidAI?

WikidAI is an **educational proof-of-concept** that demonstrates how Large Language Models can orchestrate multiple specialized agents to answer complex questions. Unlike black-box AI assistants, WikidAI shows you **exactly how it thinks** - you can watch in real-time as it:

- 🧠 **Reasons** about which data sources to query
- 🔧 **Generates** SPARQL queries for Wikidata's knowledge graph
- 🌐 **Fetches** summaries from Wikipedia and OpenStreetMap
- ⛅ **Retrieves** real-time weather data
- 🔄 **Chains** multiple queries together to answer complex questions

I have built it in a few hours for a short lightning talk for **itWikiCon 2025** on November 8, 2025 in Catania. This Proof of Concept showcases the power of transparent AI orchestration with **Gemini 2.5 Pro**.

## 🚀 Quick Start

Get WikidAI running in **under 2 minutes**:

### Prerequisites
- 🐳 Docker and Docker Compose installed
- 🔑 Gemini API key ([Get it free from Google AI Studio](https://makersuite.google.com/app/apikey))

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/gnovelli/wikidai.git
cd wikidai

# 2. Configure your API key
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 3. Launch with Docker
cd ..
docker compose up
```

### 🎉 You're Ready!

Open your browser and navigate to:
- **🖥️ Dashboard**: http://localhost:8080
- **🔌 API**: http://localhost:3000
- **💚 Health Check**: http://localhost:3000/health

---

## ✨ What Makes WikidAI Special?

### 🔍 Transparent AI Reasoning
Unlike typical AI assistants that hide their decision-making process, WikidAI provides a **real-time window** into the AI's thoughts:

```
User: "Who is the mayor of Rome and what's the weather there?"

AI Reasoning (visible to you):
├─ 🤔 Need to find current mayor → Query Wikidata with SPARQL
├─ 📍 Got Roberto Gualtieri → Need location coordinates
├─ 🗺️ Query Nominatim for Rome coordinates
└─ ⛅ Query OpenMeteo for current weather

Final Answer: "Roberto Gualtieri is the mayor of Rome.
Current weather: 22°C, partly cloudy..."
```

### 🎯 Production-Grade Features

| Feature | Description |
|---------|-------------|
| **🛡️ SPARQL Gauntlet** | Multi-layer security validation for generated queries |
| **🧪 Syntax Validation** | Uses `sparqljs` to validate queries before execution |
| **💬 Multi-Turn Conversations** | Maintains context across multiple questions |
| **⚡ Function Calling** | Native Gemini 2.5 Pro function orchestration |
| **🎨 Educational UI** | 3-panel dashboard showing Input → Reasoning → Output |
| **🐳 Docker-First** | Zero-config deployment with hot-reload for development |

### 🤖 Four Specialized Agents

1. **WikidataAgent** - Queries the world's largest open knowledge graph
   - Generates SPARQL queries from natural language
   - Handles entity disambiguation (e.g., "Paris the city" vs "Paris Hilton")
   - Validates and sanitizes all queries

2. **WikipediaAgent** - Fetches concise summaries
   - Multi-language support
   - Fallback handling for missing articles

3. **NominatimAgent** - Geocoding and reverse geocoding
   - Powered by OpenStreetMap data
   - Returns detailed location information

4. **OpenMeteoAgent** - Real-time weather data
   - No API key required
   - Current conditions and forecasts

---

## 🎮 Try It Yourself!

### Simple Queries
```
💬 "Who was Albert Einstein?"
→ Fetches Wikipedia summary

💬 "What's the population of Tokyo?"
→ Generates and executes SPARQL query on Wikidata
```

### Complex Multi-Agent Orchestration
```
💬 "Who is the mayor of Rome and what's the weather there today?"
→ Chains: Wikidata → Nominatim → OpenMeteo

💬 "Tell me about Marie Curie and the weather in her birthplace"
→ Chains: Wikipedia → Wikidata → Nominatim → OpenMeteo
```

### Advanced SPARQL Generation
```
💬 "List all Italian cities with more than 500,000 inhabitants"
→ Generates complex SPARQL with filters and aggregations

💬 "Who are the Nobel Prize winners born in Germany?"
→ Demonstrates entity disambiguation and property navigation
```

---

## 🏗️ Architecture

WikidAI uses a **clean, layered architecture** designed for educational clarity:

```
┌─────────────────────────────────────────────────────┐
│                  🌐 User Browser                    │
│              http://localhost:8080                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│         📱 Frontend (Nginx + Vanilla JS)            │
│   • 3-Panel Dashboard (Input/Reasoning/Output)      │
│   • Real-time thought stream visualization          │
│   • Agent call tracking & metrics                   │
└────────────────────┬────────────────────────────────┘
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────┐
│        🎯 Backend (Express + TypeScript)            │
│                                                     │
│  ┌──────────────────────────────────────────┐      │
│  │     🧠 Gemini Orchestrator               │      │
│  │  (Function Calling + Thinking Mode)      │      │
│  └──────────┬───────────────────────────────┘      │
│             │                                       │
│    ┌────────┴────────┬──────────┬─────────┐        │
│    ▼                 ▼          ▼         ▼        │
│  ┌────┐          ┌────┐      ┌────┐    ┌────┐     │
│  │ 📚 │          │ 🗺️ │      │ 🌍 │    │ ⛅ │     │
│  │Wiki│          │Nom │      │Wiki│    │Open│     │
│  │data│          │inat│      │pedi│    │Mete│     │
│  │    │          │im  │      │a   │    │o   │     │
│  └────┘          └────┘      └────┘    └────┘     │
│                                                     │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
     ┌──────────────────┐
     │   💾 Redis Cache  │
     │  (Future: Rate    │
     │   Limiting)       │
     └──────────────────┘

External APIs:
├─ Wikidata SPARQL Endpoint (query.wikidata.org)
├─ Wikipedia API (en.wikipedia.org/api)
├─ Nominatim (nominatim.openstreetmap.org)
├─ OpenMeteo (api.open-meteo.com)
└─ Gemini 2.5 Pro (generativelanguage.googleapis.com)
```

### Key Design Decisions

**🎨 Why Vanilla JS for Frontend?**
- Educational clarity - no framework magic to understand
- Fast iteration during PoC phase
- Easy for contributors to jump in

**🤖 Why Gemini 2.5 Pro?**
- Native function calling (no custom parsing needed)
- "Thinking mode" for transparent reasoning
- Extended context window (1M tokens)
- Cost-effective for educational projects

**🐳 Why Docker-First?**
- Zero dependency conflicts
- Identical dev/prod environments
- Hot-reload for rapid development

---

## 📂 Project Structure

```
wikidai/
├── 🎨 frontend/
│   ├── index.html              # 3-panel dashboard UI
│   ├── nginx.conf              # Reverse proxy config
│   └── Dockerfile              # Nginx container
│
├── ⚙️ backend/
│   ├── src/
│   │   ├── 🤖 agents/
│   │   │   ├── wikidata-agent.ts      # SPARQL generation & validation
│   │   │   ├── wikipedia-agent.ts     # Wikipedia API wrapper
│   │   │   ├── nominatim-agent.ts     # Geocoding service
│   │   │   └── openmeteo-agent.ts     # Weather data
│   │   │
│   │   ├── 📝 prompts/
│   │   │   ├── system-instructions.ts        # Balanced mode
│   │   │   └── wikidata-focused-instructions.ts  # SPARQL-first mode
│   │   │
│   │   ├── orchestrator.ts            # Gemini function calling logic
│   │   ├── conversation-manager.ts    # Multi-turn state management
│   │   ├── reflexive-mode.ts          # Advanced reasoning loops
│   │   ├── config.ts                  # Environment configuration
│   │   ├── types.ts                   # TypeScript interfaces
│   │   └── index.ts                   # Express server
│   │
│   ├── Dockerfile              # Multi-stage Node.js build
│   ├── package.json
│   └── tsconfig.json
│
├── 🐳 docker-compose.yml       # Full stack orchestration
├── 📖 README.md                #    
```

---

## 🧪 Development & Testing

### Running Tests

```bash
# Inside Docker container
docker compose exec backend npm test

# Or locally (requires Node.js 20+)
cd backend
npm install
npm test
```

### Development Commands

```bash
# Start all services with hot-reload
docker compose up

# Rebuild after Dockerfile changes
docker compose up --build

# View logs in real-time
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v

# Run a specific agent test
docker compose exec backend npm run test:wikidata
```

### Environment Variables

Create `backend/.env` with:

```bash
# Required
GEMINI_API_KEY=your_api_key_here

# Optional
NODE_ENV=development
PORT=3000
REDIS_URL=redis://redis:6379
LOG_LEVEL=debug
```

---

## 📊 Implementation Status

### ✅ Phase 1: PoC (Completed)

| Feature | Status | Details |
|---------|--------|---------|
| Docker Setup | ✅ Complete | Multi-stage builds, hot-reload, health checks |
| Gemini Integration | ✅ Complete | Function calling, thinking mode, history |
| Wikidata Agent | ✅ Complete | SPARQL generation, validation, gauntlet |
| Wikipedia Agent | ✅ Complete | Summary fetching, error handling |
| Nominatim Agent | ✅ Complete | Geocoding and reverse geocoding |
| OpenMeteo Agent | ✅ Complete | Real-time weather data |
| Educational UI | ✅ Complete | 3-panel dashboard with reasoning display |
| Multi-Turn Conversations | ✅ Complete | Context preservation across queries |

**PoC Success Metrics:**
- ✅ All demo queries working (100% success rate)
- ✅ SPARQL validation operational (prevents injection)
- ✅ Thought visualization functional
- ✅ Multi-agent orchestration working

### 🚧 Phase 2: MVP (In Progress)

- [ ] Rate limiting with BullMQ
- [ ] DuckDuckGo web search agent
- [ ] Production frontend (SolidJS rewrite)
- [ ] Advanced error handling
- [ ] Performance metrics dashboard
- [ ] API documentation (OpenAPI/Swagger)

### 🔮 Phase 3: Production (Planned)

See [`EPR_plan.md`](EPR_plan.md) for full details:
- [ ] Cloud deployment (Google Cloud Run)
- [ ] Authentication & user management
- [ ] Query caching & optimization
- [ ] Monitoring & observability (Prometheus/Grafana)
- [ ] Multi-language support
- [ ] Advanced SPARQL optimization

---

## 🤝 Contributing

WikidAI is an **educational project** - contributions are welcome!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit with clear messages**: `git commit -m 'Add amazing feature'`
5. **Push to your fork**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow the existing TypeScript style (we use ESLint)
- Add tests for new agents or features
- Update documentation for significant changes
- Keep the educational focus - clarity over cleverness

### Ideas for Contributions

- 🌍 New agents (e.g., DBpedia, Europeana, arXiv)
- 🎨 UI improvements (dark mode, mobile responsiveness)
- 📊 Better visualization of SPARQL queries
- 🧪 More comprehensive test coverage
- 📝 Documentation improvements or translations
- 🔧 Performance optimizations

---

## 📖 Learn More

### Related Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Wikidata Query Service](https://query.wikidata.org/)
- [SPARQL Tutorial](https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial)
- [OpenStreetMap Nominatim](https://nominatim.org/release-docs/latest/)
- [Open-Meteo API](https://open-meteo.com/en/docs)

---

## 🙏 Acknowledgments

WikidAI was created by **Giovanni Novelli Ph.D.** for **itWikiCon 2025** in Catania, Italy.

Special thanks to:
- The Wikimedia community for Wikidata and Wikipedia
- Google for the Gemini API
- OpenStreetMap contributors
- The open-source community

**Author:** Giovanni Novelli Ph.D.
- 🌐 Website: [novelli.me](https://www.novelli.me)
- 💼 GitHub: [@gnovelli](https://github.com/gnovelli)
- 📧 Email: [giovanni@novelli.me](mailto:giovanni@novelli.me)
- 🔗 Project: [novelli.me/wikidai](https://www.novelli.me/wikidai/)

---

## 📜 License

This project is licensed under the **WikidAI LICENSE (WDL)** - see the [LICENSE](LICENSE) file for details.

**Key Points:**
- ✅ Free for personal, educational, and research use
- ✅ Institutional use allowed with attribution
- ⚠️ Commercial use requires written authorization
- 📧 Contact: [giovanni@novelli.me](mailto:giovanni@novelli.me)

**Copyright © 2025 Giovanni Novelli Ph.D.**

---

## 📬 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/wikidai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/wikidai/discussions)

---

<div align="center">

[⬆ Back to Top](#-wikidai)

</div>
