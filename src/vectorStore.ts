import { writeFileSync, readFileSync, existsSync } from 'fs';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';
import { config } from './config';

interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding: number[];
}

interface QueryVector {
  query: string;
  embedding: number[];
  timestamp: string;
}

export class SimpleVectorStore {
  private documents: VectorDocument[] = [];
  private embeddings: GoogleGenerativeAIEmbeddings;

  constructor() {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: config.geminiApiKey,
      model: 'text-embedding-004',
    });
    this.loadFromFile();
  }

  // 计算余弦相似度
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // 保存查询向量到文件（覆盖）
  private saveQueryVector(query: string, embedding: number[]): void {
    const queryVector: QueryVector = {
      query,
      embedding,
      timestamp: new Date().toISOString(),
    };
    
    try {
      writeFileSync(config.queryVectorPath, JSON.stringify(queryVector, null, 2));
      console.log(`查询向量已保存到 ${config.queryVectorPath}`);
    } catch (error) {
      console.error('保存查询向量失败:', error);
    }
  }

  // 添加文档
  async addDocuments(documents: Document[]): Promise<void> {
    for (const doc of documents) {
      const embedding = await this.embeddings.embedQuery(doc.pageContent);
      const vectorDoc: VectorDocument = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        content: doc.pageContent,
        metadata: doc.metadata,
        embedding,
      };
      this.documents.push(vectorDoc);
    }
    this.saveToFile();
  }

  // 相似性搜索
  async similaritySearch(query: string, k: number = 4): Promise<Document[]> {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    
    // 每次都将查询向量保存到文件中（覆盖之前的）
    this.saveQueryVector(query, queryEmbedding);
    
    const similarities = this.documents.map(doc => ({
      document: doc,
      similarity: this.cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);
    
    return similarities.slice(0, k).map(item => 
      new Document({
        pageContent: item.document.content,
        metadata: { ...item.document.metadata, similarity: item.similarity },
      })
    );
  }

  // 保存到文件
  private saveToFile(): void {
    writeFileSync(config.vectorStorePath, JSON.stringify(this.documents, null, 2));
  }

  // 从文件加载
  private loadFromFile(): void {
    if (existsSync(config.vectorStorePath)) {
      try {
        const data = readFileSync(config.vectorStorePath, 'utf-8');
        this.documents = JSON.parse(data);
      } catch (error) {
        console.error('加载向量存储失败:', error);
        this.documents = [];
      }
    }
  }

  // 获取文档数量
  getDocumentCount(): number {
    return this.documents.length;
  }

  // 清空存储
  clear(): void {
    this.documents = [];
    this.saveToFile();
  }

  // 获取最后的查询向量
  getLastQueryVector(): QueryVector | null {
    if (existsSync(config.queryVectorPath)) {
      try {
        const data = readFileSync(config.queryVectorPath, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        console.error('读取查询向量失败:', error);
        return null;
      }
    }
    return null;
  }
} 