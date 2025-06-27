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

// ========== 新增：消息传递和通信系统类型定义 ==========

/**
 * 消息路由常量
 */
export const MESSAGE_ROUTE_TO_ALL = '<all>';
export const MESSAGE_ROUTE_TO_SELF = '<self>';

/**
 * 消息接口 - 参考MetaGPT的Message设计
 */
export interface AgentMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  cause_by: string; // 触发此消息的动作类型
  sent_from: string; // 发送者ID
  send_to: Set<string>; // 接收者ID集合
  metadata: Record<string, any>; // 元数据
  timestamp: number; // 时间戳
}

/**
 * 消息队列接口
 */
export interface MessageQueue {
  push(message: AgentMessage): void;
  pop(): AgentMessage | null;
  popAll(): AgentMessage[];
  isEmpty(): boolean;
  size(): number;
}

/**
 * Agent上下文 - 包含消息缓冲和状态
 */
export interface AgentContext {
  agentId: string;
  messageBuffer: MessageQueue;
  memory: AgentMessage[]; // 消息历史记录
  workingMemory: AgentMessage[]; // 工作内存
  news: AgentMessage[]; // 新消息
  watch: Set<string>; // 关注的消息类型
  isIdle: boolean; // 是否空闲
}

/**
 * 环境接口 - 消息路由中心
 */
export interface AgentEnvironment {
  agents: Map<string, any>; // 注册的Agent
  messageHistory: AgentMessage[]; // 消息历史
  publishMessage(message: AgentMessage): boolean;
  addAgent(agent: any): void;
  removeAgent(agentId: string): boolean;
  routeMessage(message: AgentMessage): void;
}

/**
 * 可观察的Agent接口 - 具备消息观察和响应能力
 */
export interface ObservableAgent {
  context: AgentContext;
  observe(): Promise<number>; // 观察新消息，返回新消息数量
  receiveMessage(message: AgentMessage): void; // 接收消息
  publishMessage(message: AgentMessage): void; // 发布消息
  react(): Promise<AgentMessage>; // 响应消息
}

/**
 * Agent协作模式
 */
export enum CollaborationMode {
  SEQUENTIAL = 'sequential', // 顺序协作
  PARALLEL = 'parallel', // 并行协作
  REACTIVE = 'reactive' // 反应式协作
}

/**
 * 增强的协作结果 - 包含消息历史
 */
export interface EnhancedCollaborationResult extends CollaborationResult {
  messageHistory: AgentMessage[]; // 完整的消息交换历史
  collaborationMode: CollaborationMode; // 协作模式
  agentInteractions: AgentInteraction[]; // Agent间的交互详情
}

/**
 * Agent交互记录
 */
export interface AgentInteraction {
  from: string; // 发送者
  to: string; // 接收者
  message: AgentMessage; // 消息内容
  responseTime: number; // 响应时间
  success: boolean; // 是否成功
} 