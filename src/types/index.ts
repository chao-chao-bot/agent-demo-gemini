export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentId?: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  version: string;
  personality: string;
  capabilities: string[];
  specialization?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  agentType?: 'coordinator' | 'specialist';
}

export interface ConversationContext {
  sessionId: string;
  messages: ChatMessage[];
  startTime: Date;
  messageCount: number;
  totalTokens: number;
  lastActivity: Date;
}

export interface LLMConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface LLMResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface TaskBreakdown {
  taskId: string;
  originalQuery: string;
  subtasks: Subtask[];
  timestamp: Date;
  coordinatorAnalysis?: string;
}

export interface Subtask {
  id: string;
  description: string;
  assignedAgent: string;
  priority: number;
  result?: string;
  completed: boolean;
  reasoning?: string;
}

export interface CollaborationResult {
  taskId: string;
  subtaskResults: SubtaskResult[];
  finalResponse: string;
  participatingAgents: string[];
  totalTokens: number;
  processingTime: number;
  coordinatorSummary?: string;
}

export interface SubtaskResult {
  subtaskId: string;
  agentId: string;
  result: string;
  tokens: number;
  processingTime: number;
}

export interface CoordinationAnalysis {
  originalQuery: string;
  complexity: 'simple' | 'moderate' | 'complex';
  requiredSpecializations: string[];
  suggestedApproach: string;
  taskBreakdown: string[];
  reasoning: string;
  taskAssignments?: Array<{
    description: string;
    assignedAgent: string;
    reasoning: string;
  }>;
}

export interface FinalSummary {
  originalQuery: string;
  keyInsights: string[];
  actionableAdvice: string[];
  synthesizedConclusion: string;
  nextSteps?: string[];
} 