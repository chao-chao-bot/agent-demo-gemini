import * as readline from 'readline';
import chalk from 'chalk';
import { RAGAgent } from './ragAgent';

export class CLI {
  private rl: readline.Interface;
  private agent: RAGAgent;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.agent = new RAGAgent();
  }

  // 显示欢迎信息
  private showWelcome(): void {
    console.log(chalk.blue.bold('\n🤖 LangChain RAG Agent'));
    console.log(chalk.gray('基于 Google Gemini 的智能问答助手\n'));
    this.showHelp();
  }

  // 显示帮助信息
  private showHelp(): void {
    console.log(chalk.yellow('可用命令:'));
    console.log(chalk.green('  /load <文件路径>     - 加载文档到知识库'));
    console.log(chalk.green('  /add <文本内容>      - 添加文本到知识库'));
    console.log(chalk.green('  /status             - 查看知识库状态'));
    console.log(chalk.green('  /clear              - 清空知识库'));
    console.log(chalk.green('  /help               - 显示帮助信息'));
    console.log(chalk.green('  /quit               - 退出程序'));
    console.log(chalk.gray('  直接输入问题进行对话\n'));
  }

  // 处理命令
  private async handleCommand(input: string): Promise<boolean> {
    const trimmed = input.trim();

    if (trimmed.startsWith('/load ')) {
      const filePath = trimmed.substring(6).trim();
      await this.loadDocument(filePath);
      return true;
    }

    if (trimmed.startsWith('/add ')) {
      const text = trimmed.substring(5).trim();
      await this.addText(text);
      return true;
    }

    if (trimmed === '/status') {
      this.showStatus();
      return true;
    }

    if (trimmed === '/clear') {
      this.clearKnowledgeBase();
      return true;
    }

    if (trimmed === '/help') {
      this.showHelp();
      return true;
    }

    if (trimmed === '/quit' || trimmed === '/exit') {
      return false;
    }

    // 如果不是命令，则当作问题处理
    if (trimmed) {
      await this.askQuestion(trimmed);
    }

    return true;
  }

  // 加载文档
  private async loadDocument(filePath: string): Promise<void> {
    try {
      console.log(chalk.blue(`正在加载文档: ${filePath}`));
      await this.agent.loadKnowledgeBase([filePath]);
      console.log(chalk.green('✅ 文档加载成功!'));
    } catch (error) {
      console.log(chalk.red(`❌ 加载失败: ${error}`));
    }
  }

  // 添加文本
  private async addText(text: string): Promise<void> {
    try {
      console.log(chalk.blue('正在添加文本到知识库...'));
      await this.agent.addText(text, { type: 'manual_input', timestamp: new Date().toISOString() });
      console.log(chalk.green('✅ 文本添加成功!'));
    } catch (error) {
      console.log(chalk.red(`❌ 添加失败: ${error}`));
    }
  }

  // 显示状态
  private showStatus(): void {
    const status = this.agent.getKnowledgeBaseStatus();
    console.log(chalk.cyan('\n📊 知识库状态:'));
    console.log(chalk.white(`  文档片段数量: ${status.documentCount}`));
    console.log();
  }

  // 清空知识库
  private clearKnowledgeBase(): void {
    this.agent.clearKnowledgeBase();
    console.log(chalk.green('✅ 知识库已清空!'));
  }

  // 询问问题
  private async askQuestion(question: string): Promise<void> {
    try {
      console.log(chalk.blue('\n🤔 思考中...'));
      const answer = await this.agent.ask(question);
      console.log(chalk.green('\n🤖 回答:'));
      console.log(chalk.white(answer));
      console.log();
    } catch (error) {
      console.log(chalk.red(`❌ 回答失败: ${error}`));
    }
  }

  // 获取用户输入
  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  // 启动 CLI
  async start(): Promise<void> {
    this.showWelcome();

    while (true) {
      try {
        const input = await this.question(chalk.cyan('> '));
        const shouldContinue = await this.handleCommand(input);
        
        if (!shouldContinue) {
          console.log(chalk.yellow('👋 再见!'));
          break;
        }
      } catch (error) {
        console.log(chalk.red(`错误: ${error}`));
      }
    }

    this.rl.close();
  }
} 