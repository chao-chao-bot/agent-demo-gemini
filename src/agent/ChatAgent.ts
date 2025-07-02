import { ChatMessage, AgentConfig, ConversationContext, LLMProvider } from '../types/index';
import { LLMService } from '../llm/LLMService';
import { ConfigManager } from '../config/ConfigManager';
import chalk from 'chalk';

export class ChatAgent {
  private config: AgentConfig;
  private context: ConversationContext;
  private llmService: LLMService;
  private systemPrompt: string;

  constructor(config: AgentConfig) {
    this.config = config;
    this.context = {
      messages: [],
      sessionId: this.generateSessionId(),
      startTime: new Date()
    };

    // 初始化LLM服务
    const llmConfig = ConfigManager.getLLMConfig(config.llmProvider);
    this.llmService = new LLMService(llmConfig);

    // 设置系统提示
    this.systemPrompt = this.createSystemPrompt();
  }

  private createSystemPrompt(): string {
    return `你是${this.config.name}，${this.config.personality}。

你的主要能力包括：${this.config.capabilities.join('、')}。

请遵循以下指导原则：
1. 始终用中文回复，除非用户特别要求使用其他语言
2. 保持友善、耐心和专业的态度
3. 如果不确定答案，诚实地表达不确定性
4. 提供有用、准确且相关的信息
5. 主动询问是否需要更多帮助或澄清

特殊命令处理：
- 如果用户输入"帮助"或"help"，显示可用命令列表
- 如果用户输入"历史"或"对话记录"，说明这个功能需要在界面层处理
- 如果用户输入"统计"或"stats"，说明这个功能需要在界面层处理
- 如果用户输入"清除"或"clear"，说明这个功能需要在界面层处理

当前时间：${new Date().toLocaleString('zh-CN')}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  public async processMessage(userInput: string): Promise<string> {
    // 添加用户消息到上下文
    const userMessage: ChatMessage = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };
    
    this.context.messages.push(userMessage);

    try {
      // 检查是否是特殊命令
      // const specialResponse = this.handleSpecialCommands(userInput);
      // if (specialResponse) {
      //   // 添加特殊命令回复到上下文
      //   const assistantMessage: ChatMessage = {
      //     role: 'assistant',
      //     content: specialResponse,
      //     timestamp: new Date()
      //   };
      //   this.context.messages.push(assistantMessage);
      //   return specialResponse;
      // }

      // 使用LLM生成回复
      const response = await this.generateLLMResponse();
      
      // 添加助手回复到上下文
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date()
      };
      
      this.context.messages.push(assistantMessage);
      
      // 显示token使用情况（如果有）
      if (response.usage && this.config.llmProvider !== 'mock') {
        console.log(chalk.gray(`💰 Token使用: ${response.usage.totalTokens} (输入: ${response.usage.promptTokens}, 输出: ${response.usage.completionTokens})`));
      }
      
      return response.content;
    } catch (error) {
      console.error(chalk.red('生成回复时发生错误:'), error);
      
      // 降级到模拟模式
      const fallbackResponse = this.generateFallbackResponse(userInput);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      };
      this.context.messages.push(assistantMessage);
      
      return fallbackResponse;
    }
  }

  private handleSpecialCommands(userInput: string): string | null {
    const input = userInput.toLowerCase().trim();

    if (input.includes('帮助') || input.includes('help') || input.includes('命令')) {
      return this.getHelpMessage();
    }

    if (input.includes('历史') || input.includes('对话记录')) {
      return this.getConversationHistory();
    }

    if (input.includes('清除') || input.includes('clear') || input.includes('重置')) {
      this.clearHistory();
      return '对话历史已清除，让我们重新开始吧！';
    }

    if (input.includes('统计') || input.includes('stats')) {
      return this.getSessionStats();
    }

    if (input.includes('配置') || input.includes('config')) {
      return this.getConfigInfo();
    }

    return null;
  }

  private async generateLLMResponse() {
    // 准备发送给LLM的消息（不包括刚添加的用户消息，因为它会在LLM调用中处理）
    const messagesToSend = this.context.messages.slice();
    
    return await this.llmService.generateResponse(messagesToSend, this.systemPrompt);
  }

  private generateFallbackResponse(userInput: string): string {
    return `抱歉，我遇到了一些技术问题。让我试着简单回复您：

您刚才说：${userInput}

我正在努力恢复正常功能。如果问题持续，请检查您的网络连接和API配置。您可以输入"配置"查看当前设置。`;
  }

  private getHelpMessage(): string {
    const availableProviders = ConfigManager.getAvailableProviders();
    return chalk.cyan(`
可用命令：
• 你好/hello - 打招呼
• 你是谁/介绍 - 了解我的信息  
• 时间/现在几点 - 获取当前时间
• 帮助/help - 显示这个帮助信息
• 历史/对话记录 - 查看对话历史
• 清除/clear - 清除对话历史
• 统计/stats - 查看会话统计
• 配置/config - 查看当前配置
• exit/quit/再见 - 退出程序

当前LLM提供商：${this.config.llmProvider}
可用提供商：${availableProviders.join(', ')}

💡 提示：设置API密钥以使用真实的AI模型！
`);
  }

  private getConversationHistory(): string {
    if (this.context.messages.length === 0) {
      return '还没有对话记录。';
    }

    let history = chalk.yellow('=== 对话历史 ===\n');
    this.context.messages.forEach((msg, index) => {
      const time = msg.timestamp.toLocaleTimeString('zh-CN');
      const roleColor = msg.role === 'user' ? chalk.blue : chalk.green;
      const roleText = msg.role === 'user' ? '用户' : '助手';
      history += `${roleColor(`[${time}] ${roleText}:`)} ${msg.content}\n`;
    });
    
    return history;
  }

  private getSessionStats(): string {
    const messageCount = this.context.messages.length;
    const userMessages = this.context.messages.filter(m => m.role === 'user').length;
    const assistantMessages = this.context.messages.filter(m => m.role === 'assistant').length;
    const sessionDuration = Date.now() - this.context.startTime.getTime();
    const minutes = Math.floor(sessionDuration / 60000);
    const seconds = Math.floor((sessionDuration % 60000) / 1000);

    return chalk.yellow(`
=== 会话统计 ===
会话ID: ${this.context.sessionId}
开始时间: ${this.context.startTime.toLocaleString('zh-CN')}
会话时长: ${minutes}分${seconds}秒
总消息数: ${messageCount}
用户消息: ${userMessages}
助手回复: ${assistantMessages}
LLM提供商: ${this.config.llmProvider}
模型: ${this.llmService.getConfig().model}
`);
  }

  private getConfigInfo(): string {
    const llmConfig = this.llmService.getConfig();
    const hasApiKey = !!llmConfig.apiKey;
    
    return chalk.yellow(`
=== 当前配置 ===
Agent名称: ${this.config.name}
版本: ${this.config.version}
LLM提供商: ${llmConfig.provider}
模型: ${llmConfig.model}
API密钥: ${hasApiKey ? '✅ 已设置' : '❌ 未设置'}
最大Token: ${llmConfig.maxTokens}
温度: ${llmConfig.temperature}

${ConfigManager.getConfigHelp()}
`);
  }

  private clearHistory(): void {
    this.context.messages = [];
  }

  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  public switchLLMProvider(provider: LLMProvider): void {
    try {
      const newLLMConfig = ConfigManager.getLLMConfig(provider);
      this.llmService = new LLMService(newLLMConfig);
      this.config.llmProvider = provider;
      console.log(chalk.green(`✅ 已切换到 ${provider} 提供商`));
    } catch (error) {
      console.error(chalk.red(`❌ 切换到 ${provider} 失败:`), error);
    }
  }
} 