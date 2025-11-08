/**
 * Conversation Manager
 *
 * Manages conversation sessions with persistent history.
 * Supports multiple concurrent conversations.
 */

import { QueryResponse } from './types';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  queryResponse?: QueryResponse;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    totalQueries: number;
    totalLatencyMs: number;
    agentsUsed: Set<string>;
  };
}

export class ConversationManager {
  private conversations: Map<string, Conversation>;
  private maxConversations: number;

  constructor(maxConversations: number = 100) {
    this.conversations = new Map();
    this.maxConversations = maxConversations;
  }

  /**
   * Create a new conversation
   */
  createConversation(title?: string): Conversation {
    const id = this.generateId();
    const conversation: Conversation = {
      id,
      title: title || `Conversation ${this.conversations.size + 1}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        totalQueries: 0,
        totalLatencyMs: 0,
        agentsUsed: new Set(),
      },
    };

    this.conversations.set(id, conversation);

    // Cleanup old conversations if limit exceeded
    if (this.conversations.size > this.maxConversations) {
      this.cleanupOldConversations();
    }

    console.log(`💬 Created conversation: ${id} - "${conversation.title}"`);
    return conversation;
  }

  /**
   * Get conversation by ID
   */
  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  /**
   * List all conversations
   */
  listConversations(): Conversation[] {
    return Array.from(this.conversations.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  /**
   * Add user message to conversation
   */
  addUserMessage(conversationId: string, content: string): ConversationMessage {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const message: ConversationMessage = {
      id: this.generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();

    // Auto-update title from first user message
    if (conversation.messages.filter((m) => m.role === 'user').length === 1) {
      conversation.title = this.generateTitle(content);
    }

    return message;
  }

  /**
   * Add assistant response to conversation
   */
  addAssistantMessage(
    conversationId: string,
    content: string,
    queryResponse: QueryResponse
  ): ConversationMessage {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const message: ConversationMessage = {
      id: this.generateId(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      queryResponse,
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();

    // Update metadata
    if (conversation.metadata) {
      conversation.metadata.totalQueries++;
      conversation.metadata.totalLatencyMs += queryResponse.latencyMs;
      queryResponse.agentCalls.forEach((call) => {
        conversation.metadata!.agentsUsed.add(call.agent);
      });
    }

    return message;
  }

  /**
   * Get conversation history for Gemini context
   * Returns array of {role, parts} for Gemini API
   */
  getGeminiHistory(conversationId: string): Array<{ role: string; parts: Array<{ text: string }> }> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return [];
    }

    // Convert conversation messages to Gemini history format
    return conversation.messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
  }

  /**
   * Delete conversation
   */
  deleteConversation(id: string): boolean {
    const deleted = this.conversations.delete(id);
    if (deleted) {
      console.log(`🗑️  Deleted conversation: ${id}`);
    }
    return deleted;
  }

  /**
   * Clear all conversations
   */
  clearAll(): void {
    const count = this.conversations.size;
    this.conversations.clear();
    console.log(`🗑️  Cleared ${count} conversations`);
  }

  /**
   * Generate conversation title from first message
   */
  private generateTitle(firstMessage: string): string {
    const maxLength = 50;
    if (firstMessage.length <= maxLength) {
      return firstMessage;
    }
    return firstMessage.substring(0, maxLength - 3) + '...';
  }

  /**
   * Cleanup old conversations (keep most recent N)
   */
  private cleanupOldConversations(): void {
    const sorted = this.listConversations();
    const toDelete = sorted.slice(this.maxConversations);

    toDelete.forEach((conv) => {
      this.conversations.delete(conv.id);
    });

    if (toDelete.length > 0) {
      console.log(`🧹 Cleaned up ${toDelete.length} old conversations`);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get conversation statistics
   */
  getStats(conversationId: string): {
    messageCount: number;
    avgLatency: number;
    agentsUsed: string[];
  } | null {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || !conversation.metadata) {
      return null;
    }

    return {
      messageCount: conversation.messages.length,
      avgLatency:
        conversation.metadata.totalQueries > 0
          ? Math.round(conversation.metadata.totalLatencyMs / conversation.metadata.totalQueries)
          : 0,
      agentsUsed: Array.from(conversation.metadata.agentsUsed),
    };
  }
}
