"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLI = void 0;
const readline = __importStar(require("readline"));
const chalk_1 = __importDefault(require("chalk"));
const ragAgent_1 = require("./ragAgent");
class CLI {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.agent = new ragAgent_1.RAGAgent();
    }
    // 显示欢迎信息
    showWelcome() {
        console.log(chalk_1.default.blue.bold('\n🤖 LangChain RAG Agent'));
        console.log(chalk_1.default.gray('基于 Google Gemini 的智能问答助手\n'));
        this.showHelp();
    }
    // 显示帮助信息
    showHelp() {
        console.log(chalk_1.default.yellow('可用命令:'));
        console.log(chalk_1.default.green('  /load <文件路径>     - 加载文档到知识库'));
        console.log(chalk_1.default.green('  /add <文本内容>      - 添加文本到知识库'));
        console.log(chalk_1.default.green('  /status             - 查看知识库状态'));
        console.log(chalk_1.default.green('  /clear              - 清空知识库'));
        console.log(chalk_1.default.green('  /help               - 显示帮助信息'));
        console.log(chalk_1.default.green('  /quit               - 退出程序'));
        console.log(chalk_1.default.gray('  直接输入问题进行对话\n'));
    }
    // 处理命令
    async handleCommand(input) {
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
    async loadDocument(filePath) {
        try {
            console.log(chalk_1.default.blue(`正在加载文档: ${filePath}`));
            await this.agent.loadKnowledgeBase([filePath]);
            console.log(chalk_1.default.green('✅ 文档加载成功!'));
        }
        catch (error) {
            console.log(chalk_1.default.red(`❌ 加载失败: ${error}`));
        }
    }
    // 添加文本
    async addText(text) {
        try {
            console.log(chalk_1.default.blue('正在添加文本到知识库...'));
            await this.agent.addText(text, { type: 'manual_input', timestamp: new Date().toISOString() });
            console.log(chalk_1.default.green('✅ 文本添加成功!'));
        }
        catch (error) {
            console.log(chalk_1.default.red(`❌ 添加失败: ${error}`));
        }
    }
    // 显示状态
    showStatus() {
        const status = this.agent.getKnowledgeBaseStatus();
        console.log(chalk_1.default.cyan('\n📊 知识库状态:'));
        console.log(chalk_1.default.white(`  文档片段数量: ${status.documentCount}`));
        console.log();
    }
    // 清空知识库
    clearKnowledgeBase() {
        this.agent.clearKnowledgeBase();
        console.log(chalk_1.default.green('✅ 知识库已清空!'));
    }
    // 询问问题
    async askQuestion(question) {
        try {
            console.log(chalk_1.default.blue('\n🤔 思考中...'));
            const answer = await this.agent.ask(question);
            console.log(chalk_1.default.green('\n🤖 回答:'));
            console.log(chalk_1.default.white(answer));
            console.log();
        }
        catch (error) {
            console.log(chalk_1.default.red(`❌ 回答失败: ${error}`));
        }
    }
    // 获取用户输入
    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, (answer) => {
                resolve(answer);
            });
        });
    }
    // 启动 CLI
    async start() {
        this.showWelcome();
        while (true) {
            try {
                const input = await this.question(chalk_1.default.cyan('> '));
                const shouldContinue = await this.handleCommand(input);
                if (!shouldContinue) {
                    console.log(chalk_1.default.yellow('👋 再见!'));
                    break;
                }
            }
            catch (error) {
                console.log(chalk_1.default.red(`错误: ${error}`));
            }
        }
        this.rl.close();
    }
}
exports.CLI = CLI;
