import { RAGDocument, RAGConfig, RAGStats, SearchResult } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

export class RAGService {
  private config: RAGConfig;
  private documents: Map<string, RAGDocument> = new Map();
  private isInitialized = false;
  private persistencePath: string;

  constructor(config: RAGConfig) {
    this.config = config;
    // 设置持久化文件路径
    this.persistencePath = path.join(process.cwd(), 'data', `${config.collectionName}.json`);
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 初始化RAG服务...');
      
      // 确保数据目录存在
      const dataDir = path.dirname(this.persistencePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // 尝试加载已存在的数据
      await this.loadPersistedData();
      
      console.log(`📊 集合名称: ${this.config.collectionName}`);
      console.log(`🔗 Chroma地址: ${this.config.chromaUrl || 'localhost'}:${this.config.chromaPort || 8000}`);
      console.log(`💾 数据文件: ${this.persistencePath}`);
      
      this.isInitialized = true;
      console.log('✅ RAG服务初始化完成');
    } catch (error) {
      console.error('❌ RAG服务初始化失败:', error);
      throw error;
    }
  }

  private async loadPersistedData(): Promise<void> {
    try {
      if (fs.existsSync(this.persistencePath)) {
        const data = fs.readFileSync(this.persistencePath, 'utf-8');
        const parsedData = JSON.parse(data);
        
        if (parsedData.documents && Array.isArray(parsedData.documents)) {
          for (const doc of parsedData.documents) {
            this.documents.set(doc.id, doc);
          }
          console.log(`📖 已加载 ${this.documents.size} 个文档从持久化存储`);
        }
      }
    } catch (error) {
      console.log('⚠️ 无法加载持久化数据，将使用空知识库');
    }
  }

  private async savePersistedData(): Promise<void> {
    try {
      const dataToSave = {
        timestamp: new Date().toISOString(),
        collectionName: this.config.collectionName,
        documents: Array.from(this.documents.values())
      };
      
      fs.writeFileSync(this.persistencePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (error) {
      console.error('⚠️ 保存持久化数据失败:', error);
    }
  }

  async addDocuments(documents: RAGDocument[]): Promise<void> {
    try {
      for (const doc of documents) {
        // 生成简单的向量嵌入（实际应该使用真实的embedding模型）
        doc.embedding = await this.generateSimpleEmbedding(doc.content);
        this.documents.set(doc.id, doc);
      }
      
      // 保存到持久化存储
      await this.savePersistedData();
      
      console.log(`📚 已添加 ${documents.length} 个文档到知识库`);
    } catch (error) {
      console.error('❌ 添加文档失败:', error);
      throw error;
    }
  }

  async retrieveContext(query: string, topK: number = 3): Promise<string> {
    try {
      if (this.documents.size === 0) {
        return '';
      }

      // 生成查询的嵌入向量
      const queryEmbedding = await this.generateSimpleEmbedding(query);
      
      // 计算相似度并排序
      const results: SearchResult[] = [];
      
      for (const [, doc] of this.documents) {
        if (doc && doc.embedding) {
          const similarity = this.calculateCosineSimilarity(queryEmbedding, doc.embedding);
          results.push({
            document: doc,
            score: similarity
          });
        }
      }
      
      // 按相似度排序并取前topK个
      results.sort((a, b) => b.score - a.score);
      const topResults = results.slice(0, topK);
      
      // 如果最高分数太低，说明没有相关内容
      if (topResults.length === 0 || (topResults[0] && topResults[0].score < 0.1)) {
        return '';
      }
      
      // 组合检索到的内容
      return topResults
        .map(result => {
          const metadata = result.document.metadata || {};
          const source = metadata.fileName || metadata.title || '未知来源';
          return `【来源：${source}】\n${result.document.content}`;
        })
        .join('\n\n---\n\n');
        
    } catch (error) {
      console.error('❌ 检索上下文失败:', error);
      return '';
    }
  }

  getStats(): RAGStats {
    return {
      documentCount: this.documents.size,
      isInitialized: this.isInitialized,
      collectionName: this.config.collectionName
    };
  }

  private async generateSimpleEmbedding(text: string): Promise<number[]> {
    // 简化的文本向量化实现
    // 实际应该使用真实的embedding模型
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const embedding = new Array(100).fill(0);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (word) {
        for (let j = 0; j < word.length && j < embedding.length; j++) {
          embedding[j] += word.charCodeAt(j % word.length) / 1000;
        }
      }
    }
    
    // 标准化向量
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => norm > 0 ? val / norm : 0);
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const aVal = a[i] || 0;
      const bVal = b[i] || 0;
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    const denominator = Math.sqrt(normA * normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
} 