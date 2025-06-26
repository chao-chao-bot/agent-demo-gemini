import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMConfig, LLMResponse, ChatMessage } from '../types';

export class LLMService {
  private genAI: GoogleGenerativeAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.apiKey);
  }

  async generateResponse(
    messages: ChatMessage[],
    systemPrompt?: string
  ): Promise<LLMResponse> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.config.model,
        generationConfig: {
          maxOutputTokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }
      });

      // 检查是否有消息
      if (messages.length === 0) {
        throw new Error('没有可处理的消息');
      }

      // 构建对话历史
      const history = messages
        .filter(msg => msg.role !== 'user' || messages.indexOf(msg) !== messages.length - 1)
        .map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

      // 获取最新的用户消息
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) {
        throw new Error('没有找到用户消息');
      }

      let prompt = lastMessage.content;

      // 如果有系统提示，添加到prompt前面
      if (systemPrompt) {
        prompt = `${systemPrompt}\n\n用户问题: ${prompt}`;
      }

      let result;
      if (history.length > 0) {
        // 如果有历史对话，使用chat模式
        const chat = model.startChat({ history });
        result = await chat.sendMessage(prompt);
      } else {
        // 如果没有历史，直接生成内容
        result = await model.generateContent(prompt);
      }

      const response = result.response;
      const text = response.text();
      
      // 估算token使用量（Gemini API可能不返回精确的token数）
      const inputTokens = this.estimateTokens(prompt);
      const outputTokens = this.estimateTokens(text);

      return {
        content: text,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens
        }
      };

    } catch (error) {
      console.error('Gemini API调用失败:', error);
      throw new Error(`LLM服务调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private estimateTokens(text: string): number {
    // 简单的token估算：大约1个token = 4个字符（对中文可能更准确）
    return Math.ceil(text.length / 4);
  }

  // 检查API连接状态
  async checkConnection(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.config.model });
      const result = await model.generateContent('测试连接');
      return !!result.response.text();
    } catch (error) {
      console.error('Gemini连接检查失败:', error);
      return false;
    }
  }
} 