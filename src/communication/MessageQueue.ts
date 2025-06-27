import { AgentMessage, MessageQueue as IMessageQueue } from '../types';

/**
 * 消息队列实现 - 支持异步消息处理
 */
export class MessageQueue implements IMessageQueue {
  private queue: AgentMessage[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * 向队列添加消息
   */
  push(message: AgentMessage): void {
    if (this.queue.length >= this.maxSize) {
      // 队列满时，移除最旧的消息
      this.queue.shift();
    }
    this.queue.push(message);
  }

  /**
   * 从队列中取出一条消息
   */
  pop(): AgentMessage | null {
    return this.queue.shift() || null;
  }

  /**
   * 取出所有消息
   */
  popAll(): AgentMessage[] {
    const all = [...this.queue];
    this.queue = [];
    return all;
  }

  /**
   * 队列是否为空
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * 队列大小
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * 查看队列中的消息（不移除）
   */
  peek(): AgentMessage | null {
    return this.queue[0] || null;
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * 根据条件过滤消息
   */
  filter(predicate: (message: AgentMessage) => boolean): AgentMessage[] {
    return this.queue.filter(predicate);
  }

  /**
   * 查找特定消息
   */
  find(predicate: (message: AgentMessage) => boolean): AgentMessage | undefined {
    return this.queue.find(predicate);
  }
} 