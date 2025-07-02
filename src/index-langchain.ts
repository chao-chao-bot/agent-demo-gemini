import dotenv from 'dotenv';
import chalk from 'chalk';
import figlet from 'figlet';
import { createInterface } from 'readline';
import { LangChainChatAgent } from './agent/LangChainChatAgent.js';
import { ConfigManager } from './config/ConfigManager.js';

// 加载环境变量
dotenv.config();

class LangChainApp {
  private agent: LangChainChatAgent;
  private rl: any;

  constructor() {
    // 验证必要的环境变量
    this.validateEnvironment();

    // 初始化Agent
    const config = ConfigManager.getAgentConfig();
    this.agent = new LangChainChatAgent(config);

    // 初始化命令行界面
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('你> ')
    });
  }

  private validateEnvironment(): void {
    const requiredVars = ['GEMINI_API_KEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error(chalk.red('❌ 缺少必要的环境变量:'));
      missingVars.forEach(varName => {
        console.error(chalk.red(`   ${varName}`));
      });
      console.error(chalk.yellow('\n请创建 .env 文件并设置这些变量。'));
      process.exit(1);
    }

    // 可选变量提醒
    const optionalVars = [
      { name: 'RAG_ENABLED', default: 'false', description: 'RAG功能开关' },
      { name: 'CHROMA_URL', default: 'localhost', description: 'ChromaDB地址' },
      { name: 'CHROMA_PORT', default: '8000', description: 'ChromaDB端口' }
    ];

    console.log(chalk.gray('🔧 环境变量检查:'));
    optionalVars.forEach(({ name, default: defaultValue, description }) => {
      const value = process.env[name] || defaultValue;
      console.log(chalk.gray(`   ${name}: ${value} (${description})`));
    });
  }

  private displayWelcome(): void {
    console.clear();
    
    // ASCII艺术标题
    console.log(chalk.cyan(figlet.textSync('LangChain AI', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    })));

    console.log(chalk.green(`
🦜 欢迎使用基于 LangChain.js 的智能对话系统

🚀 技术栈：
   • LLM：LangChain + Google Gemini
   • RAG：ChromaDB + Gemini Embeddings  
   • 文本处理：RecursiveCharacterTextSplitter

🔍 功能亮点：
   • 专业RAG检索增强生成
   • 智能文档分块和向量化
   • 可扩展的LangChain架构
   • 实时向量相似度搜索

💡 输入 'help' 查看可用命令
🎯 开始对话吧！
    `));

    console.log(chalk.yellow('='.repeat(60)));
  }

  async start(): Promise<void> {
    try {
      this.displayWelcome();

      // 初始化Agent
      console.log(chalk.cyan('🔄 正在初始化LangChain系统...'));
      await this.agent.initialize();
      
      console.log(chalk.green('✅ 系统就绪！'));
      console.log(chalk.yellow('='.repeat(60)));

      // 开始对话循环
      this.startConversation();

    } catch (error) {
      console.error(chalk.red('❌ 系统初始化失败:'), error);
      console.log(chalk.yellow(`
🔧 故障排除建议：
1. 检查 ChromaDB 是否运行: docker run -p 8000:8000 chromadb/chroma
2. 验证 GEMINI_API_KEY 是否正确设置
3. 确认网络连接正常
4. 查看完整错误日志

💡 如果只想测试基础功能，请设置 RAG_ENABLED=false
      `));
      process.exit(1);
    }
  }

  private startConversation(): void {
    this.rl.prompt();

    this.rl.on('line', async (input: string) => {
      const message = input.trim();

      if (!message) {
        this.rl.prompt();
        return;
      }

      try {
        // 显示思考状态
        process.stdout.write(chalk.gray('🤔 思考中...'));

        // 获取Agent响应
        const response = await this.agent.chat(message);

        // 清除思考状态
        process.stdout.write('\r' + ' '.repeat(20) + '\r');

        // 显示响应
        console.log(chalk.magenta('AI> ') + response);
        console.log();

        // 检查退出命令
        if (['exit', 'quit', '再见'].includes(message.toLowerCase())) {
          this.rl.close();
          return;
        }

      } catch (error) {
        // 清除思考状态
        process.stdout.write('\r' + ' '.repeat(20) + '\r');
        
        console.error(chalk.red('❌ 处理消息时出错:'), error);
        console.log(chalk.yellow('💡 请尝试重新输入或检查系统状态'));
      }

      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log(chalk.cyan('\n👋 感谢使用LangChain智能对话系统！'));
      process.exit(0);
    });

    // 处理Ctrl+C
    this.rl.on('SIGINT', () => {
      console.log(chalk.yellow('\n🔄 正在安全退出...'));
      this.rl.close();
    });
  }
}

// 启动应用
async function main() {
  try {
    const app = new LangChainApp();
    await app.start();
  } catch (error) {
    console.error(chalk.red('💥 应用启动失败:'), error);
    process.exit(1);
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('🚨 未处理的Promise拒绝:'), reason);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('🚨 未捕获的异常:'), error);
  process.exit(1);
});

// 启动
main(); 