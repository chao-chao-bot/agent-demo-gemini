import { Document } from '@langchain/core/documents';
import { Embeddings } from '@langchain/core/embeddings';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { RAGDocument, RAGConfig, RAGStats } from '../types/index.js';

export class LangChainRAGService {
  private vectorStore: Chroma | null = null;
  private embeddings: Embeddings;
  private config: RAGConfig;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(config: RAGConfig) {
    this.config = config;

    // 初始化Gemini嵌入模型
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY,
      model: "text-embedding-004", // Gemini最新的embedding模型
    });

    // 初始化文本分割器
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '。', '！', '？', '；', '，', ' ', ''],
    });
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 初始化LangChain RAG服务...');
      
      // 初始化Chroma向量存储
      this.vectorStore = new Chroma(this.embeddings, {
        url: `http://${this.config.chromaUrl}:${this.config.chromaPort}`,
        collectionName: this.config.collectionName,
      });

      // 测试连接
      await this.testConnection();

      console.log(`✅ LangChain向量存储 "${this.config.collectionName}" 已就绪`);
      console.log(`🔗 使用Gemini Embeddings: text-embedding-004`);
    } catch (error) {
      console.error('❌ LangChain RAG服务初始化失败:', error);
      throw error;
    }
  }

  private async testConnection(): Promise<void> {
    try {
      // 尝试进行一个简单的查询来测试连接
      if (this.vectorStore) {
        await this.vectorStore.similaritySearch('test', 1);
        console.log('✅ ChromaDB连接正常');
      }
    } catch (error) {
      throw new Error(`ChromaDB连接失败: 请确保ChromaDB服务正在运行在 ${this.config.chromaUrl}:${this.config.chromaPort}`);
    }
  }

  async addDocuments(documents: RAGDocument[]): Promise<void> {
    if (!this.vectorStore) {
      throw new Error('RAG服务未初始化');
    }

    try {
      console.log(`📚 开始处理 ${documents.length} 个文档...`);
      
      const langchainDocs: Document[] = [];

      for (const doc of documents) {
        // 使用LangChain的文本分割器
        const chunks = await this.textSplitter.splitText(doc.content);
        
        // 为每个分块创建LangChain文档
        chunks.forEach((chunk, index) => {
          langchainDocs.push(new Document({
            pageContent: chunk,
            metadata: {
              ...doc.metadata,
              originalId: doc.id,
              chunkIndex: index,
              totalChunks: chunks.length,
              source: doc.metadata?.fileName || doc.metadata?.title || '未知来源'
            }
          }));
        });
      }

      // 添加到向量存储
      await this.vectorStore.addDocuments(langchainDocs);
      
      console.log(`✅ 已成功添加 ${langchainDocs.length} 个文档分块到ChromaDB`);
    } catch (error) {
      console.error('❌ 添加文档失败:', error);
      throw error;
    }
  }

  async retrieveContext(query: string, topK: number = 4): Promise<string> {
    if (!this.vectorStore) {
      console.log('⚠️ 向量存储未初始化');
      return '';
    }

    try {
      console.log(`🔍 检索查询: "${query}"`);
      
      // 使用LangChain的相似度搜索
      const relevantDocs = await this.vectorStore.similaritySearch(query, topK);
      
      if (!relevantDocs || relevantDocs.length === 0) {
        console.log('📭 未找到相关文档');
        return '';
      }

      console.log(`📖 找到 ${relevantDocs.length} 个相关文档分块`);

      // 格式化检索结果
      const contextParts = relevantDocs.map((doc, index) => {
        const metadata = doc.metadata || {};
        const source = metadata.source || metadata.fileName || metadata.title || '未知来源';
        const chunkInfo = metadata.chunkIndex !== undefined ? 
          ` (分块 ${metadata.chunkIndex + 1}/${metadata.totalChunks})` : '';
        
        return `【来源 ${index + 1}：${source}${chunkInfo}】\n${doc.pageContent}`;
      });

      return contextParts.join('\n\n---\n\n');

    } catch (error) {
      console.error('❌ 检索上下文失败:', error);
      return '';
    }
  }

  getStats(): RAGStats {
    return {
      documentCount: 0, // ChromaDB需要额外查询获取
      isInitialized: this.vectorStore !== null,
      collectionName: this.config.collectionName
    };
  }

  async searchSimilar(query: string, topK: number = 5): Promise<Array<{content: string, score: number, metadata: any}>> {
    if (!this.vectorStore) {
      return [];
    }

    try {
      const results = await this.vectorStore.similaritySearchWithScore(query, topK);
      
      return results.map(([doc, score]) => ({
        content: doc.pageContent,
        score,
        metadata: doc.metadata
      }));
    } catch (error) {
      console.error('❌ 相似度搜索失败:', error);
      return [];
    }
  }
} 