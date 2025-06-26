import { AgentConfig, ChatMessage, LLMResponse } from '../types';
import { LLMService } from '../llm/LLMService';
import { ConfigManager } from '../config/ConfigManager';

export class IndividualAgent {
  private config: AgentConfig;
  private llmService: LLMService;

  constructor(config: AgentConfig) {
    this.config = config;
    this.llmService = this.initializeLLMService();
  }

  /**
   * 初始化LLM服务
   */
  private initializeLLMService(): LLMService {
    const configManager = ConfigManager.getInstance();
    const llmConfig = configManager.getLLMConfig();
    
    // 使用Agent特定的配置覆盖默认配置
    const agentLLMConfig = {
      ...llmConfig,
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature
    };
    
    return new LLMService(agentLLMConfig);
  }

  /**
   * 处理分配给该Agent的任务
   */
  public async processTask(
    taskDescription: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<LLMResponse> {
    try {
      // 构建系统提示，包含Agent的人格和专长
      const systemPrompt = this.buildSystemPrompt(taskDescription);
      
      // 创建包含当前任务的消息
      const messages: ChatMessage[] = [
        ...conversationHistory,
        {
          id: `task-${Date.now()}`,
          role: 'user',
          content: taskDescription,
          timestamp: new Date(),
          agentId: this.config.id
        }
      ];

      return await this.llmService.generateResponse(messages, systemPrompt);
      
    } catch (error) {
      console.error(`Agent ${this.config.name} 处理任务失败:`, error);
      throw error;
    }
  }

  /**
   * 构建Agent特定的系统提示
   */
  private buildSystemPrompt(taskDescription: string): string {
    return `${this.config.personality}

我的专长领域：${this.config.specialization}
我的主要能力：${this.config.capabilities.join('、')}

当前任务：${taskDescription}

请基于我的专长和能力，为这个任务提供最有价值的回答。
- 如果是分析类任务，请提供深入的分析和见解
- 如果是建议类任务，请提供实用可行的解决方案
- 保持专业但友好的语调
- 使用中文回答
- 回答要有针对性，突出我的专长优势`;
  }

  /**
   * 获取Agent名称
   */
  public getName(): string {
    return this.config.name;
  }

  /**
   * 获取Agent专长
   */
  public getSpecialization(): string {
    return this.config.specialization || '通用助手';
  }

  /**
   * 获取Agent能力列表
   */
  public getCapabilities(): string[] {
    return [...this.config.capabilities];
  }

  /**
   * 获取Agent配置
   */
  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * 更新Agent配置
   */
  public updateConfig(updates: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // 如果更新了LLM相关配置，重新初始化LLM服务
    if (updates.model || updates.maxTokens || updates.temperature) {
      this.llmService = this.initializeLLMService();
    }
  }

  /**
   * 获取Agent的简短描述
   */
  public getDescription(): string {
    return `${this.config.name}（${this.config.specialization}）- 擅长：${this.config.capabilities.slice(0, 3).join('、')}`;
  }

  /**
   * 检查Agent是否能处理特定类型的任务
   */
  public canHandleTask(taskKeywords: string[]): boolean {
    const allCapabilities = [
      ...this.config.capabilities.map(c => c.toLowerCase()),
      this.config.specialization?.toLowerCase() || ''
    ];

    return taskKeywords.some(keyword => 
      allCapabilities.some(capability => 
        capability.includes(keyword.toLowerCase())
      )
    );
  }
} 