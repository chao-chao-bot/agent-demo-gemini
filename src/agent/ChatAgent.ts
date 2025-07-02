import { ChatMessage, AgentConfig, ConversationContext, LLMProvider, RAGConfig, RAGStats } from '../types/index.js';
import { LLMService } from '../llm/LLMService.js';
import { ConfigManager } from '../config/ConfigManager.js';
import { RAGService } from '../rag/RAGService.js';
import { DocumentLoader } from '../rag/DocumentLoader.js';
import chalk from 'chalk';

export class ChatAgent {
  private config: AgentConfig;
  private context: ConversationContext;
  private llmService: LLMService;
  private ragService: RAGService;
  private documentLoader: DocumentLoader;
  private systemPrompt: string;
  private isRAGEnabled: boolean = false;

  constructor(config: AgentConfig) {
    this.config = config;
    this.context = {
      messages: [],
      sessionId: this.generateSessionId(),
      startTime: new Date()
    };

    // 初始化LLM服务
    const llmConfig = ConfigManager.getLLMConfig();
    this.llmService = new LLMService(llmConfig);

    // 初始化RAG服务
    const ragConfig: RAGConfig = {
      collectionName: process.env.RAG_COLLECTION_NAME || 'agent_knowledge_base',
      chromaUrl: process.env.CHROMA_URL || 'localhost',
      chromaPort: parseInt(process.env.CHROMA_PORT || '8000'),
      embeddingModel: 'default'
    };

    this.ragService = new RAGService(ragConfig);
    this.documentLoader = new DocumentLoader();

    this.systemPrompt = this.buildSystemPrompt();
  }

  async initialize(): Promise<void> {
    try {
      console.log(chalk.yellow('🔧 初始化Agent...'));
      
      // 尝试初始化RAG服务
      if (process.env.RAG_ENABLED === 'true') {
        try {
          await this.ragService.initialize();
          
          // 检查是否已有数据，如果没有才添加示例知识库
          const stats = this.ragService.getStats();
          if (stats.documentCount === 0) {
            console.log(chalk.yellow('📚 加载示例知识库...'));
            const sampleDocs = await this.createSampleKnowledgeBase();
            await this.ragService.addDocuments(sampleDocs);
          } else {
            console.log(chalk.cyan(`📖 已有 ${stats.documentCount} 个文档在知识库中`));
          }
          
          this.isRAGEnabled = true;
          console.log(chalk.green('✅ RAG功能已启用'));
        } catch (ragError) {
          console.log(chalk.yellow('⚠️ RAG服务初始化失败，使用基础对话模式'));
          console.log(chalk.gray(`   错误: ${ragError}`));
          this.isRAGEnabled = false;
        }
      } else {
        console.log(chalk.gray('ℹ️ RAG功能未启用（RAG_ENABLED=false）'));
        this.isRAGEnabled = false;
      }

      console.log(chalk.green(`✅ Agent初始化完成 (RAG: ${this.isRAGEnabled ? '启用' : '关闭'})`));
    } catch (error) {
      console.error(chalk.red('❌ Agent初始化失败:'), error);
      throw error;
    }
  }

  private async createSampleKnowledgeBase() {
    const sampleTexts = [
      {
        content: `
        人工智能（AI）是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。
        AI的研究领域包括机器学习、深度学习、自然语言处理、计算机视觉、知识表示、推理和规划等。
        
        机器学习是AI的核心技术之一，它使计算机能够在没有明确编程的情况下学习和改进性能。
        深度学习是机器学习的一个子集，使用人工神经网络来模拟人脑处理信息的方式。
        `,
        metadata: { topic: 'AI基础', category: '技术概念' }
      },
      {
        content: `
        RAG（Retrieval-Augmented Generation）是一种结合了信息检索和文本生成的AI技术。
        它通过检索相关文档来增强语言模型的生成能力，使模型能够生成更准确、更有根据的回答。
        
        RAG系统通常包含三个主要组件：
        1. 文档存储和索引系统
        2. 检索系统（通常使用向量相似度搜索）
        3. 生成模型（如GPT、Gemini等大语言模型）
        
        向量数据库如Chroma、Pinecone等在RAG系统中起着关键作用。
        `,
        metadata: { topic: 'RAG技术', category: '技术实现' }
      },
      {
        content: `
        LangChain是一个用于开发由语言模型驱动的应用程序的框架。
        它提供了构建复杂AI应用的工具和抽象，包括：
        
        - 提示模板管理
        - 链式组合（Chains）
        - 代理（Agents）和工具
        - 内存管理
        - 向量存储集成
        
        LangChain支持多种语言模型，包括OpenAI、Anthropic、Google等厂商的模型。
        它还提供了与各种向量数据库、API服务的集成。
        `,
        metadata: { topic: 'LangChain框架', category: '开发工具' }
      }
    ];

    return sampleTexts.map((text, index) => ({
      id: `sample_${index}`,
      content: text.content.trim(),
      metadata: text.metadata,
    }));
  }

  async chat(message: string): Promise<string> {
    try {
      // 添加用户消息到上下文
      this.addMessage('user', message);

      // 处理特殊命令
      const specialResponse = await this.handleSpecialCommands(message);
      if (specialResponse) {
        this.addMessage('assistant', specialResponse);
        return specialResponse;
      }

      // RAG增强响应
      let finalMessage = message;
      let ragContext = '';

      if (this.isRAGEnabled) {
        try {
          ragContext = await this.ragService.retrieveContext(message);
          if (ragContext) {
            finalMessage = `基于以下知识库信息回答用户问题：

${ragContext}

用户问题：${message}

请基于上述知识库信息进行回答。如果知识库信息不足以回答问题，请说明并提供你能给出的通用回答。`;

            // 创建临时消息数组，包含增强的用户消息
            const tempMessages = [...this.context.messages];
            tempMessages[tempMessages.length - 1] = {
              role: 'user',
              content: finalMessage,
              timestamp: new Date()
            };

            // 调用LLM生成响应
            const response = await this.llmService.generateResponse(
              tempMessages,
              this.systemPrompt
            );

            let finalResponse = response.content;

            // 添加RAG指示器
            if (ragContext) {
              finalResponse = `🔍 已从知识库检索到相关信息\n\n${finalResponse}`;
            }

            this.addMessage('assistant', finalResponse);
            return finalResponse;
          }
        } catch (ragError) {
          console.log(chalk.yellow('⚠️ RAG检索失败，使用基础模式'));
        }
      }

      // 如果没有RAG上下文或RAG失败，使用基础模式
      const response = await this.llmService.generateResponse(
        this.context.messages,
        this.systemPrompt
      );

      const finalResponse = response.content;
      this.addMessage('assistant', finalResponse);
      return finalResponse;

    } catch (error) {
      const errorMsg = `抱歉，我遇到了一些问题：${error}`;
      this.addMessage('assistant', errorMsg);
      return errorMsg;
    }
  }

  private async handleSpecialCommands(message: string): Promise<string | null> {
    const lowerMessage = message.toLowerCase().trim();

    switch (lowerMessage) {
      case 'help':
      case '帮助':
        return this.getHelpMessage();

      case 'rag':
      case '知识库':
        return this.getRAGStatus();

      case '添加文档':
        return this.getDocumentManagementHelp();

      case 'stats':
      case '统计':
        return this.getStats();

      case 'config':
      case '配置':
        return this.getConfig();

      case 'clear':
      case '清除':
        this.clearHistory();
        return '✅ 对话历史已清除';

      case 'history':
      case '历史':
      case '对话记录':
        return this.getHistory();

      case 'exit':
      case 'quit':
      case '再见':
        return '👋 再见！感谢使用智能Agent系统！';

      default:
        return null;
    }
  }

  private getHelpMessage(): string {
    return `
🤖 ${this.config.name} 帮助信息

📋 可用命令：
• 帮助/help - 显示此帮助信息
• 知识库/rag - 查看RAG系统状态  
• 添加文档 - 了解文档管理功能
• 历史/对话记录 - 查看对话历史
• 统计/stats - 查看会话统计
• 配置/config - 查看当前配置
• 清除/clear - 清除对话历史
• 再见/exit/quit - 退出程序

🔍 RAG功能：
${this.isRAGEnabled ? 
  '✅ 已启用 - 我可以基于知识库回答问题' : 
  '❌ 未启用 - 当前使用基础对话模式'
}

💡 使用提示：
• 直接提问，我会智能检索相关知识
• 支持技术问题、概念解释、工具使用等
• 支持中英文混合对话

🎯 核心能力：${this.config.capabilities.join('、')}
    `;
  }

  private getRAGStatus(): string {
    if (!this.isRAGEnabled) {
      return `
❌ RAG知识库未启用

原因可能包括：
• 环境变量 RAG_ENABLED 未设置为 true
• Chroma数据库未启动
• 初始化过程中出现错误

💡 启用方法：
1. 确保 Chroma 服务运行: docker run -p 8000:8000 chromadb/chroma
2. 设置环境变量: RAG_ENABLED=true
3. 重启应用
      `;
    }

    const stats = this.ragService.getStats();
    return `
✅ RAG知识库状态

📊 基本信息：
• 状态: ${stats.isInitialized ? '已初始化' : '未初始化'}
• 集合名称: ${stats.collectionName}
• 文档数量: ${stats.documentCount}

🔧 配置信息：
• Chroma地址: ${process.env.CHROMA_URL || 'localhost'}:${process.env.CHROMA_PORT || '8000'}
• 嵌入模型: default (简化实现)

💡 功能特性：
• 智能文档检索
• 语义相似度搜索  
• 自动知识增强
• 多格式文档支持
    `;
  }

  private getDocumentManagementHelp(): string {
    return `
📚 文档管理功能

当前实现：
• ✅ 内置示例知识库（AI、RAG、LangChain相关）
• ✅ 支持文本文档加载和分块
• ✅ 简化的向量化实现

🔧 编程方式添加文档：

\`\`\`javascript
// 添加文本文档
const doc = this.documentLoader.createDocumentFromText(
  '文档内容...',
  { title: '文档标题', category: '分类' }
);
await this.ragService.addDocuments([doc]);

// 加载文件
const docs = await this.documentLoader.loadMultipleFiles([
  '/path/to/file1.txt',
  '/path/to/file2.md'
]);
await this.ragService.addDocuments(docs);

// 加载目录
const docs = await this.documentLoader.loadFromDirectory('/path/to/docs/');
await this.ragService.addDocuments(docs);
\`\`\`

📝 支持格式：txt, md, json
🔮 未来计划：Web界面、批量上传、PDF支持
    `;
  }

  // 添加文档到知识库的方法
  async addDocumentFromText(text: string, metadata: Record<string, any> = {}): Promise<void> {
    if (!this.isRAGEnabled) {
      throw new Error('RAG功能未启用');
    }

    const document = this.documentLoader.createDocumentFromText(text, metadata);
    await this.ragService.addDocuments([document]);
  }

  async addDocumentFromFile(filePath: string): Promise<void> {
    if (!this.isRAGEnabled) {
      throw new Error('RAG功能未启用');
    }

    const documents = await this.documentLoader.loadMultipleFiles([filePath]);
    await this.ragService.addDocuments(documents);
  }

  async addDocumentFromDirectory(dirPath: string): Promise<void> {
    if (!this.isRAGEnabled) {
      throw new Error('RAG功能未启用');
    }

    const documents = await this.documentLoader.loadFromDirectory(dirPath);
    await this.ragService.addDocuments(documents);
  }

  // 现有方法...
  private getStats(): string {
    const messageCount = this.context.messages.length;
    const userMessages = this.context.messages.filter(m => m.role === 'user').length;
    const assistantMessages = this.context.messages.filter(m => m.role === 'assistant').length;
    const sessionDuration = Date.now() - this.context.startTime.getTime();

    let statsText = `
📊 会话统计信息

💬 对话统计：
• 总消息数: ${messageCount}
• 用户消息: ${userMessages}  
• 助手回复: ${assistantMessages}
• 会话时长: ${Math.round(sessionDuration / 1000)}秒
• 会话ID: ${this.context.sessionId}

🤖 Agent信息：
• 名称: ${this.config.name}
• 版本: ${this.config.version}
• LLM: ${this.config.llmProvider}
• 模型: ${this.config.model}
    `;

    if (this.isRAGEnabled) {
      const ragStats = this.ragService.getStats();
      statsText += `
📚 RAG统计：
• 知识库文档: ${ragStats.documentCount}
• 集合名称: ${ragStats.collectionName}
• 状态: ${ragStats.isInitialized ? '正常' : '异常'}
      `;
    }

    return statsText;
  }

  private getConfig(): string {
    return `
⚙️ 当前配置信息

🤖 Agent配置：
• 名称: ${this.config.name}
• 版本: ${this.config.version}
• 个性: ${this.config.personality}

🧠 LLM配置：
• 提供商: ${this.config.llmProvider}
• 模型: ${this.config.model}
• 最大Token: ${this.config.maxTokens}
• 温度: ${this.config.temperature}

🔍 RAG配置：
• 状态: ${this.isRAGEnabled ? '启用' : '禁用'}
• Chroma地址: ${process.env.CHROMA_URL || 'localhost'}:${process.env.CHROMA_PORT || '8000'}
• 集合名称: ${process.env.RAG_COLLECTION_NAME || 'agent_knowledge_base'}

🌍 环境变量：
• RAG_ENABLED: ${process.env.RAG_ENABLED || 'false'}
• GOOGLE_GEMINI_API_KEY: ${process.env.GOOGLE_GEMINI_API_KEY ? '已设置' : '未设置'}
    `;
  }

  private getHistory(): string {
    if (this.context.messages.length === 0) {
      return '📭 暂无对话历史';
    }

    const recentMessages = this.context.messages.slice(-10); // 显示最近10条消息
    let history = '📜 最近对话历史：\n\n';

    recentMessages.forEach((msg, index) => {
      const role = msg.role === 'user' ? '👤 用户' : '🤖 助手';
      const time = msg.timestamp.toLocaleTimeString();
      const content = msg.content.length > 100 
        ? msg.content.substring(0, 100) + '...' 
        : msg.content;
      
      history += `${role} [${time}]:\n${content}\n\n`;
    });

    if (this.context.messages.length > 10) {
      history += `... （共${this.context.messages.length}条消息，仅显示最近10条）`;
    }

    return history;
  }

  private clearHistory(): void {
    this.context.messages = [];
    this.context.sessionId = this.generateSessionId();
    this.context.startTime = new Date();
  }

  private addMessage(role: 'user' | 'assistant' | 'system', content: string): void {
    this.context.messages.push({
      role,
      content,
      timestamp: new Date()
    });
  }

  private buildSystemPrompt(): string {
    return `你是${this.config.name}，一个${this.config.personality}的AI助手。

你的核心能力包括：${this.config.capabilities.join('、')}

${this.isRAGEnabled ? 
  '你具有RAG（检索增强生成）能力，可以基于知识库信息提供更准确的回答。当你检索到相关知识时，请基于这些信息进行回答，并在合适的时候引用来源。' :
  '当前运行在基础对话模式下，请尽你所能提供有帮助的回答。'
}

请始终保持友善、专业的对话风格，并尽可能提供有价值的信息。`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 