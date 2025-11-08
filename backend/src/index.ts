import express from 'express';
import { config } from './config';
import { GeminiOrchestrator } from './orchestrator';
import { ConversationManager } from './conversation-manager';
import { ReflexiveMode } from './reflexive-mode';

const app = express();
app.use(express.json());

// CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const orchestrator = new GeminiOrchestrator();
const conversationManager = new ConversationManager();
const reflexiveMode = new ReflexiveMode();

/**
 * POST /api/query
 * Main endpoint for processing user queries
 * Supports both standalone and conversation-based queries
 */
app.post('/api/query', async (req, res) => {
  try {
    const { query, conversationId } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string required' });
    }

    console.log(`\n📥 Received query: "${query}"${conversationId ? ` (conversation: ${conversationId})` : ''}`);

    // Check if reflexive/meta question
    const reflexiveCheck = reflexiveMode.handleReflexive(query);
    if (reflexiveCheck.isReflexive) {
      console.log(`🤔 Reflexive query detected: ${reflexiveCheck.command || 'meta-question'}`);

      // Handle special commands
      if (reflexiveCheck.command === 'clear' && conversationId) {
        conversationManager.deleteConversation(conversationId);
      }

      // Return reflexive response
      return res.json({
        success: true,
        reflexive: true,
        command: reflexiveCheck.command,
        data: {
          query,
          answer: reflexiveCheck.answer || '',
          thoughts: [],
          agentCalls: [],
          latencyMs: 0,
        },
      });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = conversationManager.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: `Conversation ${conversationId} not found` });
      }
    }

    // Get conversation history (before adding current message)
    let history: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    if (conversation) {
      history = conversationManager.getGeminiHistory(conversation.id);
    }

    // Add user message to conversation history
    if (conversation) {
      conversationManager.addUserMessage(conversation.id, query);
    }

    // Execute query with Gemini (passing conversation history)
    const result = await orchestrator.executeQuery(query, history);

    // Add assistant response to conversation
    if (conversation) {
      conversationManager.addAssistantMessage(conversation.id, result.answer, result);
    }

    res.json({
      success: true,
      reflexive: false,
      conversationId: conversation?.id,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Query processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/conversations
 * Create a new conversation
 */
app.post('/api/conversations', (req, res) => {
  try {
    const { title } = req.body;
    const conversation = conversationManager.createConversation(title);

    res.json({
      success: true,
      data: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/conversations
 * List all conversations
 */
app.get('/api/conversations', (req, res) => {
  try {
    const conversations = conversationManager.listConversations();

    res.json({
      success: true,
      data: conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        messageCount: conv.messages.length,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/conversations/:id
 * Get conversation details with full history
 */
app.get('/api/conversations/:id', (req, res) => {
  try {
    const conversation = conversationManager.getConversation(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/conversations/:id/stats
 * Get conversation statistics
 */
app.get('/api/conversations/:id/stats', (req, res) => {
  try {
    const stats = conversationManager.getStats(req.params.id);

    if (!stats) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/conversations/:id
 * Delete a conversation
 */
app.delete('/api/conversations/:id', (req, res) => {
  try {
    const deleted = conversationManager.deleteConversation(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wikidai-poc' });
});

/**
 * Start server
 */
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 WikidAI PoC Backend Started`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`🔑 Gemini API: ${config.geminiApiKey ? '✅ Configured' : '❌ Missing'}`);
  console.log(`📦 Redis: ${config.redisUrl}`);
  console.log(`${'='.repeat(60)}\n`);
});
