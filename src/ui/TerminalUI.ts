import * as readline from 'readline';
import figlet from 'figlet';
import chalk from 'chalk';
import { ChatAgent } from '../agent/ChatAgent';

export class TerminalUI {
  private rl: readline.Interface;
  private agent: ChatAgent;
  private isRunning: boolean = false;

  constructor(agent: ChatAgent) {
    this.agent = agent;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('💬 您: ')
    });

    // 设置readline事件
    this.setupReadlineEvents();
  }

  private setupReadlineEvents(): void {
    this.rl.on('line', (input) => {
      this.handleUserInput(input.trim());
    });

    this.rl.on('close', () => {
      this.handleExit();
    });

    // 处理Ctrl+C
    this.rl.on('SIGINT', () => {
      console.log(chalk.yellow('\n\n🤔 您想要退出吗？输入 "exit" 或 "退出" 来确认退出。'));
      this.rl.prompt();
    });
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    
    // 显示欢迎界面
    await this.showWelcome();
    
    // 开始交互
    this.rl.prompt();
  }

  private async showWelcome(): Promise<void> {
    return new Promise((resolve) => {
      figlet('AI Team Chat', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      }, (err, data) => {
        if (err) {
          console.log(chalk.blue.bold('🤖 多Agent AI团队助手'));
        } else {
          console.log(chalk.blue.bold(data));
        }
        
        console.log(chalk.green('━'.repeat(60)));
        console.log(chalk.yellow('🎉 欢迎使用多Agent AI团队协作系统！'));
        console.log(chalk.cyan('👥 团队成员：'));
        console.log(chalk.cyan('   • 小智 - 技术分析专家'));
        console.log(chalk.cyan('   • 小梅 - 实用建议专家'));
        console.log(chalk.magenta('\n💡 系统特色：'));
        console.log(chalk.magenta('   • 智能任务分解和分配'));
        console.log(chalk.magenta('   • 多专家协作处理复杂问题'));
        console.log(chalk.magenta('   • 自动整合多角度见解'));
        console.log(chalk.white('\n⚡ 输入任何问题开始对话，或输入 "help" 查看帮助'));
        console.log(chalk.green('━'.repeat(60)));
        console.log();
        
        resolve();
      });
    });
  }

  private async handleUserInput(input: string): Promise<void> {
    if (!input) {
      this.rl.prompt();
      return;
    }

    // 检查退出命令
    if (this.isExitCommand(input)) {
      this.handleExit();
      return;
    }

    try {
      // 显示用户输入
      console.log();
      
      // 处理用户输入
      const response = await this.agent.handleCommand(input);
      
      // 显示回复
      this.displayResponse(response);
      
    } catch (error) {
      console.error(chalk.red('💥 处理您的输入时发生错误:'), error);
      console.log(chalk.yellow('🔧 请稍后再试，或联系技术支持。'));
    } finally {
      console.log();
      this.rl.prompt();
    }
  }

  private isExitCommand(input: string): boolean {
    const exitCommands = ['exit', 'quit', '退出', '再见', 'bye', 'goodbye'];
    return exitCommands.includes(input.toLowerCase().trim());
  }

  private displayResponse(response: string): void {
    // 解析响应中的markdown格式
    const formattedResponse = this.formatResponse(response);
    
    console.log(chalk.green('🤖 AI团队: '));
    console.log(formattedResponse);
  }

  private formatResponse(response: string): string {
    // 简单的markdown格式处理
    let formatted = response;
    
    // 处理标题
    formatted = formatted.replace(/^## (.*$)/gm, chalk.blue.bold('$1'));
    formatted = formatted.replace(/^# (.*$)/gm, chalk.blue.bold.underline('$1'));
    
    // 处理粗体
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, chalk.bold('$1'));
    
    // 处理代码块
    formatted = formatted.replace(/`([^`]+)`/g, chalk.bgGray.white(' $1 '));
    
    // 处理分隔线
    formatted = formatted.replace(/^---+$/gm, chalk.gray('─'.repeat(50)));
    
    // 处理emoji和特殊字符，保持原样
    return formatted;
  }

  private handleExit(): void {
    if (this.isRunning) {
      console.log();
      console.log(chalk.yellow('👋 感谢使用多Agent AI团队助手！'));
      console.log(chalk.cyan('📊 本次会话统计：'));
      console.log(chalk.cyan(`   • 会话ID: ${this.agent.getSessionId()}`));
      console.log(chalk.cyan(`   • 处理消息: ${this.agent.getMessageCount()}条`));
      console.log(chalk.cyan(`   • Token使用: ${this.agent.getTotalTokens()}个`));
      console.log(chalk.cyan(`   • 最后活动: ${this.agent.getLastActivity().toLocaleString()}`));
      console.log(chalk.magenta('\n🎯 期待下次为您提供更好的AI协作体验！'));
      console.log(chalk.green('━'.repeat(50)));
      
      this.isRunning = false;
      this.rl.close();
      process.exit(0);
    }
  }

  public stop(): void {
    this.handleExit();
  }

  // 辅助方法：显示加载状态
  private showThinking(): NodeJS.Timeout {
    process.stdout.write(chalk.yellow('🤔 AI团队正在协作思考'));
    const thinkingInterval = setInterval(() => {
      process.stdout.write(chalk.yellow('.'));
    }, 500);

    return thinkingInterval;
  }

  // 辅助方法：清除加载状态
  private clearThinking(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    process.stdout.write('\r' + ' '.repeat(50) + '\r'); // 清除加载行
  }

  // 显示协作状态信息
  private displayCollaborationInfo(): void {
    const stats = this.agent.getRecentCollaborationStats();
    if (stats !== '暂无团队协作记录') {
      console.log(chalk.gray(`ℹ️  ${stats}`));
    }
  }

  // 获取用户确认
  private async getUserConfirmation(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const tempRl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      tempRl.question(chalk.yellow(`${message} (y/n): `), (answer) => {
        tempRl.close();
        resolve(answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes');
      });
    });
  }

  // 显示帮助信息的特殊格式
  private displayHelpMessage(): void {
    console.log(chalk.cyan('\n📚 多Agent AI团队 - 使用指南'));
    console.log(chalk.cyan('═'.repeat(50)));
    console.log(chalk.green('🎯 基本使用：'));
    console.log('   直接输入您的问题，我们的AI团队会自动协作处理');
    console.log(chalk.green('\n🤖 团队成员：'));
    console.log('   • 小智：专注技术分析和深度思考');
    console.log('   • 小梅：提供实用建议和解决方案');
    console.log(chalk.green('\n⚡ 特殊命令：'));
    console.log('   team/团队   - 查看团队成员详情');
    console.log('   status/状态 - 查看系统状态');
    console.log('   stats/统计  - 查看会话统计');
    console.log('   clear/清除  - 清除对话历史');
    console.log('   exit/退出   - 退出程序');
    console.log(chalk.cyan('═'.repeat(50)));
  }
} 