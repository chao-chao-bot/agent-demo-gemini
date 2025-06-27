import { AgentConfig, ChatMessage, LLMResponse, AgentMessage, ObservableAgent, AgentContext, MESSAGE_ROUTE_TO_ALL } from '../types';
import { IndividualAgent } from './IndividualAgent';
import { MessageQueue } from '../communication/MessageQueue';
import { AgentEnvironment } from '../communication/AgentEnvironment';
import { v4 as uuidv4 } from 'uuid';

/**
 * 支持通信的Agent - 基于IndividualAgent扩展
 * 实现了ObservableAgent接口，具备消息观察和响应能力
 */
export class CommunicatingAgent extends IndividualAgent implements ObservableAgent {
  context: AgentContext;
  private environment?: AgentEnvironment;
  private messageMemoryLimit: number = 100;

  constructor(config: AgentConfig, environment?: AgentEnvironment) {
    super(config);
    this.environment = environment;
    
    // 初始化Agent上下文
    this.context = {
      agentId: config.id,
      messageBuffer: new MessageQueue(),
      memory: [],
      workingMemory: [],
      news: [],
      watch: new Set(['UserRequirement', 'AgentResponse', 'TaskAssignment']),
      isIdle: true
    };

    // 如果有环境，自动注册
    if (this.environment) {
      this.environment.addAgent(this);
    }
  }

  /**
   * 设置环境
   */
  setEnvironment(environment: AgentEnvironment): void {
    if (this.environment) {
      this.environment.removeAgent(this.context.agentId);
    }
    this.environment = environment;
    this.environment.addAgent(this);
  }

  /**
   * 观察新消息 - 从消息缓冲区读取并过滤感兴趣的消息
   */
  async observe(): Promise<number> {
    this.context.news = [];
    
    // 从消息缓冲区获取所有新消息
    const newMessages = this.context.messageBuffer.popAll();
    
    if (newMessages.length === 0) {
      this.context.isIdle = true;
      return 0;
    }

    // 过滤感兴趣的消息
    for (const message of newMessages) {
      if (this.isInterestedInMessage(message)) {
        this.context.news.push(message);
        // 添加到记忆中
        this.addToMemory(message);
      }
    }

    this.context.isIdle = this.context.news.length === 0;
    
    if (this.context.news.length > 0) {
      console.log(`👁️ ${this.getName()} 观察到 ${this.context.news.length} 条新消息`);
    }

    return this.context.news.length;
  }

  /**
   * 判断是否对消息感兴趣
   */
  private isInterestedInMessage(message: AgentMessage): boolean {
    // 1. 检查是否是发送给自己的
    if (message.send_to.has(this.context.agentId) || message.send_to.has(this.getName())) {
      return true;
    }

    // 2. 检查是否是关注的消息类型
    if (this.context.watch.has(message.cause_by)) {
      return true;
    }

    // 3. 检查是否是广播消息
    if (message.send_to.has(MESSAGE_ROUTE_TO_ALL)) {
      return true;
    }

    return false;
  }

  /**
   * 接收消息 - 放入消息缓冲区
   */
  receiveMessage(message: AgentMessage): void {
    this.context.messageBuffer.push(message);
    console.log(`📨 ${this.getName()} 收到消息: ${message.content.substring(0, 30)}...`);
  }

  /**
   * 发布消息
   */
  publishMessage(message: AgentMessage): void {
    if (!this.environment) {
      console.warn(`⚠️ ${this.getName()} 没有连接到环境，无法发布消息`);
      return;
    }

    // 设置发送者信息
    message.sent_from = this.context.agentId;
    
    // 发布到环境
    this.environment.publishMessage(message);
  }

  /**
   * 响应消息 - 处理观察到的消息并生成回复
   */
  async react(): Promise<AgentMessage> {
    if (this.context.news.length === 0) {
      throw new Error(`${this.getName()} 没有新消息需要响应`);
    }

    try {
      this.context.isIdle = false;

      // 选择最重要的消息进行响应
      const primaryMessage = this.selectPrimaryMessage();
      
      // 构建上下文：包含相关的历史消息
      const contextMessages = this.buildContextForResponse(primaryMessage);
      
      // 生成响应
      const response = await this.processTask(
        primaryMessage.content,
        contextMessages
      );

      // 创建回复消息
      const replyMessage = this.createReplyMessage(response, primaryMessage);
      
      // 清空新消息
      this.context.news = [];
      this.context.isIdle = true;

      return replyMessage;

    } catch (error) {
      console.error(`❌ ${this.getName()} 响应消息失败:`, error);
      throw error;
    }
  }

  /**
   * 选择要响应的主要消息
   */
  private selectPrimaryMessage(): AgentMessage {
    // 优先级：直接发送给自己的 > 任务分配 > 广播消息
    
    // 1. 直接发送给自己的消息
    const directMessages = this.context.news.filter(msg => 
      msg.send_to.has(this.context.agentId) || msg.send_to.has(this.getName())
    );
    if (directMessages.length > 0) {
      const lastMessage = directMessages[directMessages.length - 1];
      if (!lastMessage) {
        throw new Error('无法获取直接消息');
      }
      return lastMessage;
    }

    // 2. 任务分配消息
    const taskMessages = this.context.news.filter(msg => 
      msg.cause_by === 'TaskAssignment'
    );
    if (taskMessages.length > 0) {
      const lastTask = taskMessages[taskMessages.length - 1];
      if (!lastTask) {
        throw new Error('无法获取任务消息');
      }
      return lastTask;
    }

    // 3. 其他消息
    if (this.context.news.length === 0) {
      throw new Error('没有可处理的消息');
    }
    const lastMessage = this.context.news[this.context.news.length - 1];
    if (!lastMessage) {
      throw new Error('无法获取消息');
    }
    return lastMessage;
  }

  /**
   * 为响应构建上下文消息
   */
  private buildContextForResponse(primaryMessage: AgentMessage): ChatMessage[] {
    // 获取相关的历史消息作为上下文
    const recentMemory = this.context.memory.slice(-5); // 最近5条消息
    
    return recentMemory.map(msg => ({
      id: msg.id,
      role: msg.role === 'system' ? 'assistant' : msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      agentId: msg.sent_from
    }));
  }

  /**
   * 创建回复消息
   */
  private createReplyMessage(response: LLMResponse, originalMessage: AgentMessage): AgentMessage {
    return {
      id: uuidv4(),
      content: response.content,
      role: 'assistant',
      cause_by: 'AgentResponse',
      sent_from: this.context.agentId,
      send_to: new Set([originalMessage.sent_from]), // 回复给发送者
      metadata: {
        responseTime: Date.now() - originalMessage.timestamp, // 计算响应时间
        tokens: response.usage?.totalTokens || 0, // 修复tokens访问
        replyTo: originalMessage.id
      },
      timestamp: Date.now()
    };
  }

  /**
   * 添加消息到记忆
   */
  private addToMemory(message: AgentMessage): void {
    this.context.memory.push(message);
    
    // 限制记忆大小
    if (this.context.memory.length > this.messageMemoryLimit) {
      this.context.memory.shift();
    }
  }

  /**
   * 发送消息给指定Agent
   */
  async sendMessage(content: string, targetAgentId: string, cause_by: string = 'DirectCommunication'): Promise<void> {
    if (!this.environment) {
      throw new Error('Agent没有连接到环境');
    }

    const message = this.environment.createMessage(
      content,
      this.context.agentId,
      targetAgentId,
      cause_by
    );

    this.publishMessage(message);
  }

  /**
   * 广播消息给所有Agent
   */
  async broadcastMessage(content: string, cause_by: string = 'Broadcast'): Promise<void> {
    if (!this.environment) {
      throw new Error('Agent没有连接到环境');
    }

    const message = this.environment.createMessage(
      content,
      this.context.agentId,
      MESSAGE_ROUTE_TO_ALL,
      cause_by
    );

    this.publishMessage(message);
  }

  /**
   * 获取与特定Agent的对话历史
   */
  getConversationWith(agentId: string): AgentMessage[] {
    if (!this.environment) {
      return [];
    }
    return this.environment.getConversation(this.context.agentId, agentId);
  }

  /**
   * 获取Agent状态
   */
  getStatus(): {
    agentId: string;
    name: string;
    isIdle: boolean;
    messageCount: number;
    memorySize: number;
    watching: string[];
  } {
    return {
      agentId: this.context.agentId,
      name: this.getName(),
      isIdle: this.context.isIdle,
      messageCount: this.context.messageBuffer.size(),
      memorySize: this.context.memory.length,
      watching: Array.from(this.context.watch)
    };
  }

  /**
   * 清理Agent状态
   */
  cleanup(): void {
    // 清空消息队列
    while (!this.context.messageBuffer.isEmpty()) {
      this.context.messageBuffer.pop();
    }
    this.context.memory = [];
    this.context.workingMemory = [];
    this.context.news = [];
    this.context.isIdle = true;
  }
} 