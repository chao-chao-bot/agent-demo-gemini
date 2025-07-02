import { LLMConfig, LLMResponse, ChatMessage } from '../types/index';
import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';

export class LLMService {
  private config: LLMConfig;
  private geminiClient?: GoogleGenerativeAI;

  constructor(config: LLMConfig) {
    this.config = config;
    this.initializeClient();
  }

  private initializeClient(): void {
    switch (this.config.provider) {
      case 'gemini':
        if (!this.config.apiKey) {
          throw new Error('Google API密钥未设置。请设置GOOGLE_API_KEY环境变量。');
        }
        this.geminiClient = new GoogleGenerativeAI(this.config.apiKey);
        break;
      
      case 'mock':
        // 模拟模式，不需要初始化客户端
        break;
      
      default:
        throw new Error(`不支持的LLM提供商: ${this.config.provider}`);
    }
  }

  public async generateResponse(messages: ChatMessage[], systemPrompt?: string): Promise<LLMResponse> {
    try {
      switch (this.config.provider) {
        case 'gemini':
          return await this.generateGeminiResponse(messages, systemPrompt);
        
        case 'mock':
          return await this.generateMockResponse(messages);
        
        default:
          throw new Error(`不支持的LLM提供商: ${this.config.provider}`);
      }
    } catch (error) {
      console.error(chalk.red('LLM调用失败:'), error);
      throw error;
    }
  }

  private async generateGeminiResponse(messages: ChatMessage[], systemPrompt?: string): Promise<LLMResponse> {
    if (!this.geminiClient) {
      throw new Error('Gemini客户端未初始化');
    }

    const model = this.geminiClient.getGenerativeModel({ 
      model: this.config.model,
      generationConfig: {
        maxOutputTokens: this.config.maxTokens,
        temperature: this.config.temperature,
      }
    });

    // 获取最后一条用户消息
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      throw new Error('没有找到用户消息');
    }

    // 构建prompt，加上系统提示和基本的对话上下文
    let prompt = '';
    
    if (systemPrompt) {
      prompt += `${systemPrompt}\n\n`;
    }
    
    // 如果有历史消息，只包含最近的几条
    const recentMessages = messages.slice(-4); // 只保留最近4条消息
    if (recentMessages.length > 1) {
      recentMessages.slice(0, -1).forEach(msg => {
        const role = msg.role === 'user' ? '用户' : '助手';
        prompt += `${role}: ${msg.content}\n`;
      });
      prompt += '\n';
    }
    
    // 添加当前用户消息
    prompt += `用户: ${lastUserMessage.content}\n`;
    prompt += '助手: ';

    console.log(chalk.green('🤖 prompt------:'), prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text() || '抱歉，我无法生成回复。';

    // Gemini API目前不提供详细的token使用信息，我们进行估算
    const estimatedPromptTokens = Math.floor(prompt.length / 4);
    const estimatedCompletionTokens = Math.floor(content.length / 4);

    return {
      content,
      usage: {
        promptTokens: estimatedPromptTokens,
        completionTokens: estimatedCompletionTokens,
        totalTokens: estimatedPromptTokens + estimatedCompletionTokens
      }
    };
  }

  private async generateMockResponse(messages: ChatMessage[]): Promise<LLMResponse> {
    // 模拟思考时间
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const lastMessage = messages[messages.length - 1];
    const input = lastMessage?.content.toLowerCase().trim() || '';

    // 基础对话逻辑（保持原有的模拟逻辑）
    let content = '';

    if (input.includes('你好') || input.includes('hello') || input.includes('hi')) {
      content = '你好！我是一个智能AI助手，很高兴与您对话。我可以帮助您解答问题、进行讨论或提供信息。有什么我可以帮助您的吗？';
    } else if (input.includes('你是谁') || input.includes('介绍') || input.includes('about')) {
      content = '我是一个基于大语言模型的AI助手，具备自然语言理解和生成能力。我可以帮助您回答问题、进行对话、提供建议等。我会尽力为您提供准确、有用的信息。';
    } else if (input.includes('时间') || input.includes('现在几点')) {
      const now = new Date();
      content = `当前时间是：${now.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })}`;
    } else {
      // 生成更智能的默认回复
      const responses = [
        '这是一个很有趣的话题。能详细说说您的想法吗？',
        '我理解您的观点。这个问题确实值得深入思考。',
        '感谢您分享这个信息。您希望我从哪个角度来分析呢？',
        '这让我想到了相关的一些概念。您想了解更多背景信息吗？',
        '很好的问题！让我为您详细解释一下。',
        '我会尽力帮助您解决这个问题。请告诉我更多细节。'
      ];
      content = responses[Math.floor(Math.random() * responses.length)] || '我会尽力帮助您解决这个问题。';
    }

    return {
      content,
      usage: {
        promptTokens: Math.floor(input.length / 4), // 大概估算
        completionTokens: Math.floor(content.length / 4),
        totalTokens: Math.floor((input.length + content.length) / 4)
      }
    };
  }

  public getConfig(): LLMConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeClient();
  }
} 