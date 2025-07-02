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
} 