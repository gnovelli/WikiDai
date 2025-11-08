/**
 * Type definitions for WikidAI PoC
 */

export interface QueryRequest {
  query: string;
  sessionId?: string;
}

export interface ThoughtPart {
  type: 'thought';
  content: string;
  timestamp: number;
}

export interface AgentCall {
  type: 'agent_call';
  agent: string;
  params: Record<string, any>;
  timestamp: number;
}

export interface AgentResponse {
  type: 'agent_response';
  agent: string;
  data: any;
  timestamp: number;
}

export interface FinalAnswer {
  type: 'final_answer';
  content: string;
  timestamp: number;
}

export type StreamChunk = ThoughtPart | AgentCall | AgentResponse | FinalAnswer;

export interface QueryResponse {
  query: string;
  thoughts: string[];
  agentCalls: Array<{
    agent: string;
    params: Record<string, any>;
    response: any;
  }>;
  answer: string;
  latencyMs: number;
}

// Agent-specific types
export interface WikidataQueryResult {
  head: {
    vars: string[];
  };
  results: {
    bindings: Array<Record<string, { type: string; value: string }>>;
  };
}

export interface WikipediaSummary {
  title: string;
  extract: string;
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
}
