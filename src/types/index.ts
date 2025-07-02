export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AgentConfig {
  name: string;
  version: string;
  personality: string;
  capabilities: string[];
  llmProvider: LLMProvider;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ConversationContext {
  messages: ChatMessage[];
  sessionId: string;
  startTime: Date;
}

export type LLMProvider = 'gemini' | 'mock';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  baseURL?: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
} 