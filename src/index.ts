#!/usr/bin/env node

import { ChatAgent } from './agent/ChatAgent';
import { TerminalUI } from './ui/TerminalUI';
import { AgentConfig } from './types/index';
import chalk from 'chalk';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function main() {
  console.log(chalk.blue.bold('🚀 启动智能Agent系统...'));
  
  // 配置agent
  const config: AgentConfig = {
    name: '小智Plus',
    version: '2.0.0',
    personality: '友善、耐心、乐于助人的RAG增强AI助手',
    capabilities: [
      '日常对话',
      '问题解答',
      '知识库检索',
      '信息查询',
      '学习交流',
      '情感支持',
      'RAG增强回答'
    ],
    llmProvider: 'gemini', // 现在VPN环境下使用Gemini
    model: 'gemini-1.5-flash-latest',
    maxTokens: 2000,
    temperature: 0.7
  };

  try {
    // 创建agent实例
    console.log(chalk.yellow('📦 初始化Agent...'));
    const agent = new ChatAgent(config);
    
    // 初始化Agent（包括RAG知识库）
    console.log(chalk.yellow('🔍 初始化系统...'));
    await agent.initialize();
    
    // 创建终端UI
    console.log(chalk.yellow('🖥️  初始化终端界面...'));
    const ui = new TerminalUI(agent);
    
    // 显示启动信息
    console.log(chalk.green.bold('✅ 系统启动完成！'));
    console.log(chalk.cyan(`
╔══════════════════════════════════════════╗
║          🤖 智能Agent系统 v2.0            ║
║                                          ║
║  ✨ 新功能：                             ║
║  📚 RAG知识库检索                        ║
║  🔍 智能文档理解                        ║
║  💡 增强回答准确性                      ║
║                                          ║
║  💬 输入"帮助"查看所有可用命令          ║
║  🔧 输入"知识库"查看RAG状态            ║
╚══════════════════════════════════════════╝
    `));
    
    // 启动应用
    await ui.start();
    
  } catch (error) {
    console.error(chalk.red('❌ 启动失败:'), error);
    
    // 提供故障排除建议
    console.log(chalk.yellow(`
🔧 故障排除建议：

1. 检查环境变量配置：
   - GOOGLE_GEMINI_API_KEY=your_api_key
   - CHROMA_URL=localhost (可选)
   - CHROMA_PORT=8000 (可选)

2. 确保依赖已安装：
   npm install

3. 如果使用Chroma，确保Chroma服务器正在运行：
   docker run -p 8000:8000 chromadb/chroma

4. 如果问题持续，可以在无RAG模式下运行
    `));
    
    process.exit(1);
  }
}

// 优雅关闭处理
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 正在退出...'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n👋 正在退出...'));
  process.exit(0);
});

// 启动应用
main().catch((error) => {
  console.error(chalk.red('❌ 应用启动时发生错误:'), error);
  process.exit(1);
}); 