import dotenv from 'dotenv';
import { LLMConfig } from '../types';

// 加载环境变量
dotenv.config();

export class ConfigManager {
  private static instance: ConfigManager;
  private config: LLMConfig;

  private constructor() {
    this.config = this.initializeConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private initializeConfig(): LLMConfig {
    // 只支持Gemini
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        '缺少必要的API密钥。请在.env文件中设置 GOOGLE_API_KEY'
      );
    }

    return {
      apiKey,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest',
      maxTokens: parseInt(process.env.MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7')
    };
  }

  public getLLMConfig(): LLMConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // 验证配置是否有效
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.apiKey) {
      errors.push('Google API密钥未设置');
    }

    if (!this.config.model) {
      errors.push('模型名称未设置');
    }

    if (this.config.maxTokens <= 0) {
      errors.push('maxTokens必须大于0');
    }

    if (this.config.temperature < 0 || this.config.temperature > 2) {
      errors.push('temperature必须在0-2之间');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 获取环境信息
  public getEnvironmentInfo(): { [key: string]: string | undefined } {
    return {
      'Google API Key': this.config.apiKey ? '已设置' : '未设置',
      'Model': this.config.model,
      'Max Tokens': this.config.maxTokens.toString(),
      'Temperature': this.config.temperature.toString(),
      'Node Version': process.version,
      'Platform': process.platform
    };
  }
} 