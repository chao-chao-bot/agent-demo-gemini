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
  model: string;
  maxTokens: number;
  temperature: number;
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

// RAG相关类型定义
export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

export interface RAGStats {
  documentCount: number;
  isInitialized: boolean;
  collectionName: string;
}

export interface ChromaConfig {
  url?: string;
  port?: number;
  collectionName: string;
}

export interface RAGConfig {
  chromaUrl?: string;
  chromaPort?: number;
  collectionName: string;
  embeddingModel?: string;
}

export interface RAGDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface LoadedDocument {
  content: string;
  metadata: Record<string, any>;
}

export interface EmbeddingResult {
  embedding: number[];
  text: string;
}

export interface SearchResult {
  document: RAGDocument;
  score: number;
}

export interface VectorStoreConfig {
  collectionName: string;
  chromaUrl?: string;
  chromaPort?: number;
} 