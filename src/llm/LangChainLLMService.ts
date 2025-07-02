import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { LLMConfig, LLMResponse, ChatMessage } from '../types/index.js';
import chalk from 'chalk';

export class LangChainLLMService {
  private config: LLMConfig;
  private model!: ChatGoogleGenerativeAI;
  private chain: RunnableSequence<any, string> | null = null;

  constructor(config: LLMConfig) {
    this.config = config;
    this.initializeModel();
  }

  private initializeModel(): void {
    if (this.config.provider === 'mock') {
      // Mock模式：创建简单的测试链
      console.log(chalk.yellow('⚠️ 使用Mock模式，LangChain功能将被模拟'));
      this.createMockChain();
      return;
    }

    if (this.config.provider !== 'gemini') {
      throw new Error(`LangChain服务目前只支持Gemini和Mock模式，当前配置: ${this.config.provider}`);
    }

    if (!this.config.apiKey) {
      throw new Error('Google API密钥未设置。请设置GEMINI_API_KEY环境变量。');
    }

    // 初始化Gemini模型
    this.model = new ChatGoogleGenerativeAI({
      apiKey: this.config.apiKey,
      model: this.config.model,
      temperature: this.config.temperature,
      maxOutputTokens: this.config.maxTokens,
    });

    // 创建对话链
    this.createConversationChain();
  }

  private createConversationChain(): void {
    // 创建提示模板
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "{system_prompt}"],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"]
    ]);

    // 创建输出解析器
    const outputParser = new StringOutputParser();

    // 创建可运行链
    this.chain = RunnableSequence.from([
      prompt,
      this.model,
      outputParser
    ]);
  }

  private createMockChain(): void {
    // 为Mock模式创建一个简单的模拟链
    this.chain = {
      invoke: async (input: any) => {
        const { system_prompt, chat_history, input: userInput } = input;
        
        // 模拟处理延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 简单的模拟响应
        const responses = [
          `基于LangChain框架，我理解您询问关于"${userInput}"的问题。`,
          `这是一个模拟的LangChain响应。您的问题是：${userInput}`,
          `在Mock模式下，我会模拟LangChain的RAG功能来回答您关于"${userInput}"的问题。`,
          `LangChain模拟服务正在处理您的请求："${userInput}"。这是一个测试响应。`
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        return randomResponse;
      }
    } as any;
  }

  public async generateResponse(messages: ChatMessage[], systemPrompt?: string): Promise<LLMResponse> {
    if (!this.chain) {
      throw new Error('LangChain链未初始化');
    }

    try {
      console.log(chalk.green('🤖 使用LangChain处理对话...'));

      // 转换消息格式
      const chatHistory = this.convertToChatHistory(messages.slice(0, -1)); // 除了最后一条消息
      const lastMessage = messages[messages.length - 1];
      
      if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error('最后一条消息必须是用户消息');
      }

      const input = {
        system_prompt: systemPrompt || '你是一个有用的AI助手。',
        chat_history: chatHistory,
        input: lastMessage.content
      };

      console.log(chalk.blue('📤 发送到LangChain:'), {
        system_prompt: input.system_prompt.substring(0, 100) + '...',
        chat_history_length: chatHistory.length,
        input: input.input.substring(0, 100) + '...'
      });

      // 调用链
      const response = await this.chain.invoke(input);

      console.log(chalk.green('📥 LangChain响应:'), response.substring(0, 100) + '...');

      // 估算token使用量
      const promptTokens = this.estimateTokens(JSON.stringify(input));
      const completionTokens = this.estimateTokens(response);

      return {
        content: response,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens
        }
      };

    } catch (error) {
      console.error(chalk.red('❌ LangChain调用失败:'), error);
      throw error;
    }
  }

  private convertToChatHistory(messages: ChatMessage[]): BaseMessage[] {
    return messages.map(msg => {
      switch (msg.role) {
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        case 'system':
          return new SystemMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });
  }

  private estimateTokens(text: string): number {
    // 简单的token估算：1个token约等于4个字符
    return Math.floor(text.length / 4);
  }

  public getConfig(): LLMConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeModel();
  }

  // 创建RAG增强的对话链
  public async generateRAGResponse(
    query: string, 
    context: string, 
    chatHistory: ChatMessage[] = [],
    systemPrompt?: string
  ): Promise<LLMResponse> {
    if (!this.chain) {
      throw new Error('LangChain链未初始化');
    }

    try {
      console.log(chalk.green('🔍 使用LangChain处理RAG增强对话...'));

      // 构建RAG增强的消息
      const ragPrompt = this.buildRAGPrompt(query, context);
      
      const input = {
        system_prompt: systemPrompt || '你是一个基于知识库的AI助手。请基于提供的上下文信息回答问题。',
        chat_history: this.convertToChatHistory(chatHistory),
        input: ragPrompt
      };

      console.log(chalk.blue('📤 RAG查询:'), query);
      console.log(chalk.cyan('📖 上下文长度:'), context.length, '字符');

      // 调用链
      const response = await this.chain.invoke(input);

      // 估算token使用量
      const promptTokens = this.estimateTokens(JSON.stringify(input));
      const completionTokens = this.estimateTokens(response);

      return {
        content: response,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens
        }
      };

    } catch (error) {
      console.error(chalk.red('❌ RAG增强调用失败:'), error);
      throw error;
    }
  }

  private buildRAGPrompt(query: string, context: string): string {
    return `基于以下知识库信息回答用户问题：

${context}

用户问题：${query}

请基于上述知识库信息进行回答。如果知识库信息不足以回答问题，请说明并提供你能给出的通用回答。`;
  }

  // 流式响应支持
  public async *generateStreamResponse(
    messages: ChatMessage[], 
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    if (!this.model) {
      throw new Error('模型未初始化');
    }

    try {
      const chatHistory = this.convertToChatHistory(messages);
      
      if (systemPrompt) {
        chatHistory.unshift(new SystemMessage(systemPrompt));
      }

      const stream = await this.model.stream(chatHistory);

      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content.toString();
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ 流式响应失败:'), error);
      throw error;
    }
  }
} 