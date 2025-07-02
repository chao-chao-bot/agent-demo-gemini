import * as readline from 'readline';
import chalk from 'chalk';
import figlet from 'figlet';
import { ChatAgent } from '../agent/ChatAgent';

export class TerminalUI {
  private rl: readline.Interface;
  private agent: ChatAgent;
  private isRunning: boolean = false;
  private exitResolve?: (value: void | PromiseLike<void>) => void;

  constructor(agent: ChatAgent) {
    this.agent = agent;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('> ')
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.rl.on('line', async (input: string) => {
      if (!this.isRunning) {
        return; // 如果已经停止运行，不处理输入
      }
      
      const trimmedInput = input.trim();
      
      if (this.isExitCommand(trimmedInput)) {
        this.exit();
        return;
      }

      if (trimmedInput === '') {
        this.rl.prompt();
        return;
      }

      try {
        await this.handleUserInput(trimmedInput);
      } catch (error) {
        // 确保即使出错也不会退出程序
        console.error(chalk.red('❌ 处理输入时发生错误:'), error instanceof Error ? error.message : '未知错误');
        console.log();
        this.rl.prompt(); // 继续提示用户输入
      }
    });

    this.rl.on('close', () => {
      if (this.isRunning) {
        this.exit();
      }
    });

    this.rl.on('SIGINT', () => {
      console.log(chalk.yellow('\n\n再见！感谢使用我们的对话助手！'));
      this.exit();
    });

    // 处理Ctrl+C
    process.on('SIGINT', () => {
      if (this.isRunning) {
        console.log(chalk.yellow('\n\n再见！感谢使用我们的对话助手！'));
        this.exit();
      }
    });
  }

  private isExitCommand(input: string): boolean {
    const exitCommands = ['exit', 'quit', '再见', 'bye', 'goodbye'];
    return exitCommands.includes(input.toLowerCase());
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    
    // 显示欢迎界面
    await this.showWelcome();
    
    // 显示agent信息
    this.showAgentInfo();
    
    // 显示使用提示
    this.showUsageHints();
    
    console.log(chalk.gray('输入 "帮助" 或 "help" 查看可用命令'));
    console.log(chalk.gray('输入 "exit"、"quit" 或 "再见" 退出程序\n'));
    
    this.rl.prompt();
    
    // 返回一个Promise，只有当程序明确退出时才resolve
    return new Promise<void>((resolve) => {
      // 保存resolve函数，在exit时调用
      this.exitResolve = resolve;
    });
  }

  private async showWelcome(): Promise<void> {
    return new Promise<void>((resolve) => {
      figlet('Chat Agent', {
        font: 'Small',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      }, (err, data) => {
        if (!err && data) {
          console.log(chalk.cyan(data));
        } else {
          console.log(chalk.cyan('=== 终端对话助手 ==='));
        }
        console.log(chalk.green('欢迎使用基于TypeScript的智能对话助手！\n'));
        resolve();
      });
    });
  }

  private showAgentInfo(): void {
    console.log(chalk.yellow(`助手名称: 小智Plus`));
    console.log(chalk.yellow(`版本: 2.0.0`));
    console.log(chalk.yellow(`个性: 友善、耐心、乐于助人的RAG增强AI助手`));
    console.log(chalk.yellow(`能力: 日常对话、问题解答、知识库检索、信息查询、学习交流、情感支持、RAG增强回答\n`));
  }

  private showUsageHints(): void {
    console.log(chalk.gray('💡 使用提示:'));
    console.log(chalk.gray('• 直接输入文字与我对话'));
    console.log(chalk.gray('• 支持中文和英文命令'));
    console.log(chalk.gray('• 可以查看对话历史和统计信息'));
  }

  private async handleUserInput(input: string): Promise<void> {
    if (!this.isRunning) {
      return; // 确保不在已停止的状态下处理输入
    }

    // 显示简单的加载提示
    console.log(chalk.gray('🤔 正在思考...'));

    try {
      const response = await this.agent.chat(input);
      
      // 显示回复
      console.log(chalk.green('🤖 助手:'), response);
      console.log(); // 空行
      
    } catch (error) {
      console.error(chalk.red('❌ 错误:'), error instanceof Error ? error.message : '未知错误');
      console.log(chalk.gray('💡 提示: 如果问题持续，请检查网络连接或输入"配置"查看设置'));
      console.log();
    } finally {
      // 无论成功还是失败，都要继续提示用户输入
      if (this.isRunning) {
        this.rl.prompt();
      }
    }
  }

  private exit(): void {
    if (this.isRunning) {
      this.isRunning = false;
      console.log(chalk.yellow('\n👋 再见！感谢使用我们的对话助手！'));
      this.rl.close();
      
      // 调用resolve函数来完成start方法的Promise
      if (this.exitResolve) {
        this.exitResolve();
      }
      
      process.exit(0);
    }
  }

  public stop(): void {
    this.exit();
  }
} 