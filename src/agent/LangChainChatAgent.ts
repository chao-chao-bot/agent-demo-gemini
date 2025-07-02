import { ChatMessage, AgentConfig, ConversationContext, RAGConfig, RAGStats } from '../types/index.js';
import { LangChainLLMService } from '../llm/LangChainLLMService.js';
import { LangChainRAGService } from '../rag/LangChainRAGService.js';
import { DocumentLoader } from '../rag/DocumentLoader.js';
import { ConfigManager } from '../config/ConfigManager.js';
import chalk from 'chalk';

export class LangChainChatAgent {
  private config: AgentConfig;
  private context: ConversationContext;
  private llmService: LangChainLLMService;
  private ragService: LangChainRAGService;
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

    // 初始化LangChain LLM服务
    const llmConfig = ConfigManager.getLLMConfig();
    this.llmService = new LangChainLLMService(llmConfig);

    // 初始化LangChain RAG服务
    const ragConfig: RAGConfig = {
      collectionName: process.env.RAG_COLLECTION_NAME || 'langchain_knowledge_base',
      chromaUrl: process.env.CHROMA_URL || 'localhost',
      chromaPort: parseInt(process.env.CHROMA_PORT || '8000'),
      embeddingModel: 'text-embedding-004'
    };

    this.ragService = new LangChainRAGService(ragConfig);
    this.documentLoader = new DocumentLoader();

    this.systemPrompt = this.buildSystemPrompt();
  }

  async initialize(): Promise<void> {
    try {
      console.log(chalk.yellow('🔧 初始化LangChain Agent...'));
      
      // 尝试初始化RAG服务
      if (process.env.RAG_ENABLED === 'true') {
        try {
          await this.ragService.initialize();
          
          // 检查是否已有数据，如果没有才添加示例知识库
          const stats = this.ragService.getStats();
          if (stats.documentCount === 0) {
            console.log(chalk.yellow('📚 加载示例知识库到ChromaDB...'));
            const sampleDocs = await this.createSampleKnowledgeBase();
            await this.ragService.addDocuments(sampleDocs);
          } else {
            console.log(chalk.cyan(`📖 ChromaDB中已有 ${stats.documentCount} 个文档`));
          }
          
          this.isRAGEnabled = true;
          console.log(chalk.green('✅ LangChain RAG功能已启用'));
        } catch (ragError) {
          console.log(chalk.yellow('⚠️ LangChain RAG服务初始化失败，使用基础对话模式'));
          console.log(chalk.gray(`   错误: ${ragError}`));
          this.isRAGEnabled = false;
        }
      } else {
        console.log(chalk.gray('ℹ️ RAG功能未启用（RAG_ENABLED=false）'));
        this.isRAGEnabled = false;
      }

      console.log(chalk.green(`✅ LangChain Agent初始化完成 (RAG: ${this.isRAGEnabled ? '启用' : '关闭'})`));
    } catch (error) {
      console.error(chalk.red('❌ LangChain Agent初始化失败:'), error);
      throw error;
    }
  }

  private async createSampleKnowledgeBase() {
    const sampleTexts = [
      {
        content: `
        LangChain是一个强大的框架，用于开发由大语言模型驱动的应用程序。
        它提供了构建复杂AI应用所需的所有工具和抽象：
        
        核心组件：
        - 提示模板(Prompt Templates)：结构化的提示管理
        - 链(Chains)：将多个组件链接在一起的工作流
        - 代理(Agents)：能够使用工具并做出决策的AI代理
        - 内存(Memory)：在对话中保持上下文状态
        - 向量存储(Vector Stores)：用于相似性搜索和RAG
        
        LangChain支持多种LLM提供商，包括OpenAI、Anthropic、Google Gemini等。
        `,
        metadata: { topic: 'LangChain框架', category: '技术框架' }
      },
      {
        content: `
        ChromaDB是一个开源的向量数据库，专为AI应用设计。
        它是构建RAG(检索增强生成)系统的理想选择：
        
        主要特性：
        - 高性能向量相似性搜索
        - 简单易用的API
        - 支持多种嵌入模型
        - 可扩展的架构
        - 丰富的元数据过滤
        
        ChromaDB与LangChain完美集成，提供了开箱即用的向量存储解决方案。
        在生产环境中，ChromaDB可以处理数百万个向量的高效检索。
        `,
        metadata: { topic: 'ChromaDB', category: '向量数据库' }
      },
      {
        content: `
        RAG(检索增强生成)是一种结合信息检索和文本生成的AI技术架构：
        
        工作流程：
        1. 文档预处理：将知识库文档分块并向量化
        2. 存储索引：将向量存储在向量数据库中
        3. 查询检索：根据用户问题检索相关文档片段
        4. 上下文增强：将检索结果作为上下文提供给LLM
        5. 生成回答：LLM基于上下文生成准确的回答
        
        RAG的优势：
        - 减少幻觉问题
        - 提供可追踪的信息来源
        - 支持实时知识更新
        - 无需重训练模型
        `,
        metadata: { topic: 'RAG技术', category: '技术架构' }
      }
    ];

    return sampleTexts.map((text, index) => ({
      id: `langchain_sample_${index}`,
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
      if (this.isRAGEnabled) {
        try {
          const ragContext = await this.ragService.retrieveContext(message);
          if (ragContext) {
            console.log(chalk.cyan('🔍 使用LangChain RAG增强响应'));
            
            // 使用LangChain的RAG响应方法
            const response = await this.llmService.generateRAGResponse(
              message,
              ragContext,
              this.context.messages.slice(0, -1), // 历史消息（不包括刚添加的用户消息）
              this.systemPrompt
            );

            const finalResponse = `🔍 已从ChromaDB检索到相关信息\n\n${response.content}`;
            this.addMessage('assistant', finalResponse);
            return finalResponse;
          }
        } catch (ragError) {
          console.log(chalk.yellow('⚠️ LangChain RAG检索失败，使用基础模式'));
          console.log(chalk.gray(`   错误: ${ragError}`));
        }
      }

      // 基础LangChain对话模式
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

      case 'test-langchain':
        return await this.testLangChainComponents();

      case 'exit':
      case 'quit':
      case '再见':
        return '👋 再见！感谢使用LangChain智能Agent系统！';

      default:
        return null;
    }
  }

  private async testLangChainComponents(): Promise<string> {
    let result = '🧪 LangChain组件测试结果：\n\n';
    
    try {
      // 测试LLM服务
      result += '🤖 LLM服务：';
      const testMessages = [{ role: 'user' as const, content: '你好', timestamp: new Date() }];
      await this.llmService.generateResponse(testMessages);
      result += '✅ 正常\n';
    } catch (error) {
      result += `❌ 错误 - ${error}\n`;
    }

    try {
      // 测试RAG服务
      result += '🔍 RAG服务：';
      if (this.isRAGEnabled) {
        await this.ragService.retrieveContext('测试查询');
        result += '✅ 正常\n';
      } else {
        result += '⚠️ 未启用\n';
      }
    } catch (error) {
      result += `❌ 错误 - ${error}\n`;
    }

    return result;
  }

  private getHelpMessage(): string {
    return `
🤖 ${this.config.name} (LangChain版) 帮助信息

📋 可用命令：
• 帮助/help - 显示此帮助信息
• 知识库/rag - 查看LangChain RAG系统状态  
• 添加文档 - 了解文档管理功能
• 历史/对话记录 - 查看对话历史
• 统计/stats - 查看会话统计
• 配置/config - 查看当前配置
• 清除/clear - 清除对话历史
• test-langchain - 测试LangChain组件
• 再见/exit/quit - 退出程序

🔍 LangChain RAG功能：
${this.isRAGEnabled ? 
  '✅ 已启用 - 使用ChromaDB + Gemini Embeddings' : 
  '❌ 未启用 - 当前使用基础LangChain对话模式'
}

💡 技术栈：
• LLM：LangChain + Google Gemini
• 向量数据库：ChromaDB
• 嵌入模型：text-embedding-004
• 文本分割：RecursiveCharacterTextSplitter

🎯 核心能力：${this.config.capabilities.join('、')}
    `;
  }

  private getRAGStatus(): string {
    if (!this.isRAGEnabled) {
      return `
❌ LangChain RAG知识库未启用

原因可能包括：
• 环境变量 RAG_ENABLED 未设置为 true
• ChromaDB服务未启动
• Gemini API密钥未配置
• 初始化过程中出现错误

💡 启用方法：
1. 启动ChromaDB: docker run -p 8000:8000 chromadb/chroma
2. 设置环境变量: RAG_ENABLED=true, GEMINI_API_KEY=your_key
3. 重启应用
      `;
    }

    const stats = this.ragService.getStats();
    return `
✅ LangChain RAG知识库状态

📊 基本信息：
• 状态: ${stats.isInitialized ? '已初始化' : '未初始化'}
• 集合名称: ${stats.collectionName}
• 文档数量: ${stats.documentCount}

🔧 LangChain配置：
• 向量存储: ChromaDB
• 嵌入模型: Gemini text-embedding-004
• 文本分割: RecursiveCharacterTextSplitter
• 分块大小: 1000字符，重叠200字符

🌐 服务信息：
• ChromaDB地址: ${process.env.CHROMA_URL || 'localhost'}:${process.env.CHROMA_PORT || '8000'}
• LLM提供商: Google Gemini
• 链类型: RunnableSequence
    `;
  }

  private getDocumentManagementHelp(): string {
    return `
📚 LangChain文档管理功能

当前实现：
• ✅ ChromaDB向量存储
• ✅ Gemini嵌入模型
• ✅ 智能文本分块
• ✅ 相似度搜索with评分

🔧 编程方式添加文档：

\`\`\`javascript
// 添加文本文档
await this.ragService.addDocuments([{
  id: 'doc_1',
  content: '文档内容...',
  metadata: { title: '文档标题', category: '分类' }
}]);

// 搜索相似文档
const results = await this.ragService.searchSimilar('查询内容', 5);
console.log(results); // 包含评分和元数据
\`\`\`

🌟 LangChain特性：
• 自动文档分块和向量化
• 元数据保留和过滤
• 相似度评分
• 流式处理支持

📝 支持格式：txt, md, json
🚀 高级功能：批量导入、增量更新、评分排序
    `;
  }

  // 文档管理方法
  async addDocumentFromText(text: string, metadata: Record<string, any> = {}): Promise<void> {
    if (!this.isRAGEnabled) {
      throw new Error('LangChain RAG功能未启用');
    }

    const document = this.documentLoader.createDocumentFromText(text, metadata);
    await this.ragService.addDocuments([document]);
  }

  async addDocumentFromFile(filePath: string): Promise<void> {
    if (!this.isRAGEnabled) {
      throw new Error('LangChain RAG功能未启用');
    }

    const documents = await this.documentLoader.loadMultipleFiles([filePath]);
    await this.ragService.addDocuments(documents);
  }

  async addDocumentFromDirectory(dirPath: string): Promise<void> {
    if (!this.isRAGEnabled) {
      throw new Error('LangChain RAG功能未启用');
    }

    const documents = await this.documentLoader.loadFromDirectory(dirPath);
    await this.ragService.addDocuments(documents);
  }

  // 其他方法保持不变...
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

🤖 LangChain Agent信息：
• 名称: ${this.config.name}
• 版本: ${this.config.version}
• LLM: LangChain + ${this.config.llmProvider}
• 模型: ${this.config.model}
    `;

    if (this.isRAGEnabled) {
      const ragStats = this.ragService.getStats();
      statsText += `
📚 LangChain RAG统计：
• ChromaDB文档: ${ragStats.documentCount}
• 集合名称: ${ragStats.collectionName}
• 状态: ${ragStats.isInitialized ? '正常' : '异常'}
• 嵌入模型: text-embedding-004
      `;
    }

    return statsText;
  }

  private getConfig(): string {
    return `
⚙️ LangChain配置信息

🤖 Agent配置：
• 名称: ${this.config.name}
• 版本: ${this.config.version}
• 个性: ${this.config.personality}

🧠 LangChain LLM配置：
• 提供商: ${this.config.llmProvider}
• 模型: ${this.config.model}
• 最大Token: ${this.config.maxTokens}
• 温度: ${this.config.temperature}
• 链类型: RunnableSequence

🔍 LangChain RAG配置：
• 状态: ${this.isRAGEnabled ? '启用' : '禁用'}
• 向量存储: ChromaDB
• 嵌入模型: text-embedding-004
• 文本分割器: RecursiveCharacterTextSplitter

🌍 环境变量：
• RAG_ENABLED: ${process.env.RAG_ENABLED || 'false'}
• GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '已设置' : '未设置'}
• CHROMA_URL: ${process.env.CHROMA_URL || 'localhost'}
• CHROMA_PORT: ${process.env.CHROMA_PORT || '8000'}
    `;
  }

  private getHistory(): string {
    if (this.context.messages.length === 0) {
      return '📭 暂无对话历史';
    }

    const recentMessages = this.context.messages.slice(-10);
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
    return `你是${this.config.name}，一个基于LangChain技术栈的${this.config.personality}AI助手。

技术架构：
- LLM：LangChain + Google Gemini
- RAG：ChromaDB + Gemini Embeddings
- 文本处理：RecursiveCharacterTextSplitter

你的核心能力包括：${this.config.capabilities.join('、')}

${this.isRAGEnabled ? 
  '你具有先进的LangChain RAG能力，可以基于ChromaDB中的知识库信息提供准确的回答。当你检索到相关知识时，请基于这些信息进行回答，并在合适的时候引用来源。' :
  '当前运行在基础LangChain对话模式下，请尽你所能提供有帮助的回答。'
}

请始终保持友善、专业的对话风格，并充分利用LangChain的强大能力提供有价值的信息。`;
  }

  private generateSessionId(): string {
    return `langchain_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 