#!/usr/bin/env node

import { ChatAgent } from './agent/ChatAgent';
import { TerminalUI } from './ui/TerminalUI';
import { AgentConfig } from './types/index';

async function main() {
  // 配置agent
  const config: AgentConfig = {
    name: '小智',
    version: '1.0.0',
    personality: '友善、耐心、乐于助人的AI助手',
    capabilities: [
      '日常对话',
      '问题解答',
      '信息查询',
      '学习交流',
      '情感支持'
    ],
    llmProvider: 'gemini', // 现在VPN环境下使用Gemini
    model: 'gemini-1.5-flash-latest',
    maxTokens: 2000,
    temperature: 0.7
  };

  try {
    // 创建agent实例
    const agent = new ChatAgent(config);
    
    // 创建终端UI
    const ui = new TerminalUI(agent);
    
    // 启动应用
    await ui.start();
    
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

// 启动应用
main().catch((error) => {
  console.error('应用启动时发生错误:', error);
  process.exit(1);
}); 