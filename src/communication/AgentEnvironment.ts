import { AgentMessage, AgentEnvironment as IAgentEnvironment, MESSAGE_ROUTE_TO_ALL, ObservableAgent } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Agent环境 - 消息路由和管理中心
 * 参考MetaGPT的Environment设计
 */
export class AgentEnvironment implements IAgentEnvironment {
  agents: Map<string, ObservableAgent> = new Map();
  messageHistory: AgentMessage[] = [];
  private maxHistorySize: number = 10000;

  constructor(maxHistorySize?: number) {
    if (maxHistorySize) {
      this.maxHistorySize = maxHistorySize;
    }
  }

  /**
   * 添加Agent到环境
   */
  addAgent(agent: ObservableAgent): void {
    this.agents.set(agent.context.agentId, agent);
    console.log(`🌐 Agent ${agent.context.agentId} 加入环境`);
  }

  /**
   * 从环境移除Agent
   */
  removeAgent(agentId: string): boolean {
    const removed = this.agents.delete(agentId);
    if (removed) {
      console.log(`🌐 Agent ${agentId} 离开环境`);
    }
    return removed;
  }

  /**
   * 发布消息到环境中 - 核心路由功能
   */
  publishMessage(message: AgentMessage): boolean {
    // 记录消息历史
    this.addToHistory(message);
    
    // 路由消息到目标Agent
    this.routeMessage(message);
    
    console.log(`📢 消息发布: ${message.sent_from} -> ${Array.from(message.send_to).join(', ')}`);
    return true;
  }

  /**
   * 路由消息到目标Agent
   */
  routeMessage(message: AgentMessage): void {
    let routedCount = 0;

    // 如果是广播消息
    if (message.send_to.has(MESSAGE_ROUTE_TO_ALL)) {
      for (const [agentId, agent] of this.agents) {
        if (agentId !== message.sent_from) { // 不发送给自己
          agent.receiveMessage(message);
          routedCount++;
        }
      }
    } else {
      // 发送给指定的Agent
      for (const targetId of message.send_to) {
        const targetAgent = this.agents.get(targetId);
        if (targetAgent) {
          targetAgent.receiveMessage(message);
          routedCount++;
        } else {
          console.warn(`⚠️ 未找到目标Agent: ${targetId}`);
        }
      }
    }

    if (routedCount === 0) {
      console.warn(`⚠️ 消息没有找到接收者: ${message.content.substring(0, 50)}...`);
    }
  }

  /**
   * 添加消息到历史记录
   */
  private addToHistory(message: AgentMessage): void {
    this.messageHistory.push(message);
    
    // 限制历史记录大小
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift();
    }
  }

  /**
   * 获取消息历史
   */
  getMessageHistory(limit?: number): AgentMessage[] {
    if (limit) {
      return this.messageHistory.slice(-limit);
    }
    return [...this.messageHistory];
  }

  /**
   * 获取特定Agent之间的对话
   */
  getConversation(agentId1: string, agentId2: string): AgentMessage[] {
    return this.messageHistory.filter(msg => 
      (msg.sent_from === agentId1 && msg.send_to.has(agentId2)) ||
      (msg.sent_from === agentId2 && msg.send_to.has(agentId1))
    );
  }

  /**
   * 创建消息
   */
  createMessage(
    content: string,
    sent_from: string,
    send_to: string | string[] | Set<string>,
    cause_by: string = 'UserRequirement',
    role: 'user' | 'assistant' | 'system' = 'assistant'
  ): AgentMessage {
    let sendToSet: Set<string>;
    
    if (typeof send_to === 'string') {
      sendToSet = new Set([send_to]);
    } else if (Array.isArray(send_to)) {
      sendToSet = new Set(send_to);
    } else if (send_to instanceof Set) {
      sendToSet = new Set(send_to); // 创建副本
    } else {
      sendToSet = new Set();
    }

    return {
      id: uuidv4(),
      content,
      role,
      cause_by,
      sent_from,
      send_to: sendToSet,
      metadata: {},
      timestamp: Date.now()
    };
  }

  /**
   * 检查环境是否空闲
   */
  isIdle(): boolean {
    return Array.from(this.agents.values()).every(agent => agent.context.isIdle);
  }

  /**
   * 获取环境状态
   */
  getStatus(): {
    agentCount: number;
    messageCount: number;
    isIdle: boolean;
    agents: string[];
  } {
    return {
      agentCount: this.agents.size,
      messageCount: this.messageHistory.length,
      isIdle: this.isIdle(),
      agents: Array.from(this.agents.keys())
    };
  }

  /**
   * 清理环境
   */
  clear(): void {
    this.agents.clear();
    this.messageHistory = [];
    console.log('🧹 环境已清理');
  }
} 