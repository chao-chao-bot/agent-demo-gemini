import * as dotenv from 'dotenv';
import { LLMConfig, LLMProvider } from '../types/index';

// 加载环境变量
dotenv.config();

export class ConfigManager {
  public static getLLMConfig(provider?: LLMProvider): LLMConfig {
    const selectedProvider = provider || this.getDefaultProvider();
    
    switch (selectedProvider) {
      case 'openai':
        return {
          provider: 'openai',
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          maxTokens: parseInt(process.env.MAX_TOKENS || '2000'),
          temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
          baseURL: process.env.OPENAI_BASE_URL
        };
      
      case 'claude':
        return {
          provider: 'claude',
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
          maxTokens: parseInt(process.env.MAX_TOKENS || '2000'),
          temperature: parseFloat(process.env.TEMPERATURE || '0.7')
        };
      
      case 'gemini':
        return {
          provider: 'gemini',
          apiKey: process.env.GOOGLE_API_KEY,
          model: process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest',
          maxTokens: parseInt(process.env.MAX_TOKENS || '2000'),
          temperature: parseFloat(process.env.TEMPERATURE || '0.7')
        };
      
      case 'mock':
        return {
          provider: 'mock',
          model: 'mock-model',
          maxTokens: 2000,
          temperature: 0.7
        };
      
      default:
        throw new Error(`不支持的LLM提供商: ${selectedProvider}`);
    }
  }

  private static getDefaultProvider(): LLMProvider {
    // 现在VPN环境下Gemini可用，优先使用Gemini
    if (process.env.GOOGLE_API_KEY) {
      return 'gemini';
    }
    
    if (process.env.OPENAI_API_KEY) {
      return 'openai';
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      return 'claude';
    }
    
    // 最后才使用mock模式
    return 'mock';
  }

  public static getAvailableProviders(): LLMProvider[] {
    const providers: LLMProvider[] = ['mock']; // 模拟模式总是可用的
    
    if (process.env.GOOGLE_API_KEY) {
      providers.push('gemini');
    }
    
    if (process.env.OPENAI_API_KEY) {
      providers.push('openai');
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      providers.push('claude');
    }
    
    return providers;
  }

  public static validateConfig(config: LLMConfig): boolean {
    switch (config.provider) {
      case 'openai':
        return !!config.apiKey;
      case 'claude':
        return !!config.apiKey;
      case 'gemini':
        return !!config.apiKey;
      case 'mock':
        return true;
      default:
        return false;
    }
  }

  public static getConfigHelp(): string {
    return `
📋 LLM配置说明：

环境变量设置：
• GOOGLE_API_KEY - Google Gemini API密钥
• OPENAI_API_KEY - OpenAI API密钥
• ANTHROPIC_API_KEY - Anthropic API密钥
• GEMINI_MODEL - Gemini模型名称 (默认: gemini-1.5-flash-latest)
• OPENAI_MODEL - OpenAI模型名称 (默认: gpt-3.5-turbo)
• CLAUDE_MODEL - Claude模型名称 (默认: claude-3-sonnet-20240229)
• MAX_TOKENS - 最大token数 (默认: 2000)
• TEMPERATURE - 温度参数 (默认: 0.7)
• OPENAI_BASE_URL - OpenAI API基础URL (可选)

使用示例：
export GOOGLE_API_KEY="your-google-api-key-here"
export GEMINI_MODEL="gemini-1.5-flash-latest"

如果没有设置API密钥，将使用模拟模式。

⚠️ 注意：如果遇到Gemini API问题，可能是：
1. API密钥权限问题
2. 地区限制
3. 配额用完
4. 需要在Google AI Studio中启用API
`;
  }
} 