import { readFileSync } from 'fs';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { config } from './config';

export class DocumentLoader {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
    });
  }

  // 加载文本文件
  async loadTextFile(filePath: string): Promise<Document[]> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const documents = await this.textSplitter.createDocuments([content], [
        { source: filePath, type: 'text' }
      ]);
      return documents;
    } catch (error) {
      throw new Error(`加载文件失败: ${error}`);
    }
  }

  // 加载文本内容
  async loadText(text: string, metadata: Record<string, any> = {}): Promise<Document[]> {
    const documents = await this.textSplitter.createDocuments([text], [metadata]);
    return documents;
  }

  // 加载多个文本文件
  async loadMultipleFiles(filePaths: string[]): Promise<Document[]> {
    const allDocuments: Document[] = [];
    
    for (const filePath of filePaths) {
      try {
        const documents = await this.loadTextFile(filePath);
        allDocuments.push(...documents);
      } catch (error) {
        console.error(`加载文件 ${filePath} 失败:`, error);
      }
    }
    
    return allDocuments;
  }
} 