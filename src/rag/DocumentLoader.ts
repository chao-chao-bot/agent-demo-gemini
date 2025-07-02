import * as fs from 'fs';
import * as path from 'path';
import { RAGDocument, LoadedDocument } from '../types/index.js';

export class DocumentLoader {
  
  async loadTextFile(filePath: string): Promise<LoadedDocument> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      
      return {
        content: content.trim(),
        metadata: {
          fileName,
          filePath,
          fileType: 'text',
          size: content.length,
          loadedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`加载文本文件失败: ${error}`);
    }
  }

  async loadMultipleFiles(filePaths: string[]): Promise<RAGDocument[]> {
    const documents: RAGDocument[] = [];
    
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      if (!filePath) {
        continue;
      }
      
      try {
        const doc = await this.loadTextFile(filePath);
        
        // 将长文档分割为块
        const chunks = this.splitIntoChunks(doc.content, 1000, 200);
        
        chunks.forEach((chunk, chunkIndex) => {
          documents.push({
            id: `${path.basename(filePath)}_chunk_${chunkIndex}`,
            content: chunk,
            metadata: {
              ...doc.metadata,
              chunkIndex,
              totalChunks: chunks.length,
            },
          });
        });
      } catch (error) {
        console.error(`跳过文件 ${filePath}: ${error}`);
      }
    }
    
    return documents;
  }

  async loadFromDirectory(dirPath: string, extensions: string[] = ['.txt', '.md', '.json']): Promise<RAGDocument[]> {
    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      const filePaths: string[] = [];
      
      for (const file of files) {
        if (file.isFile()) {
          const fileName = file.name;
          const ext = path.extname(fileName).toLowerCase();
          if (extensions.includes(ext)) {
            filePaths.push(path.join(dirPath, fileName));
          }
        }
      }
      
      return await this.loadMultipleFiles(filePaths);
    } catch (error) {
      throw new Error(`加载目录失败: ${error}`);
    }
  }

  createDocumentFromText(text: string, metadata: Record<string, any> = {}): RAGDocument {
    return {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: text.trim(),
      metadata: {
        ...metadata,
        type: 'text',
        createdAt: new Date().toISOString(),
      },
    };
  }

  private splitIntoChunks(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    if (text.length <= chunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;
      
      // 如果不是最后一块，尝试在句号、感叹号或问号处分割
      if (end < text.length) {
        const sentenceEnd = text.lastIndexOf('.', end);
        const exclamationEnd = text.lastIndexOf('!', end);
        const questionEnd = text.lastIndexOf('?', end);
        
        const bestEnd = Math.max(sentenceEnd, exclamationEnd, questionEnd);
        if (bestEnd > start + chunkSize * 0.5) {
          end = bestEnd + 1;
        }
      }

      chunks.push(text.substring(start, end).trim());
      
      // 下一块的起始位置，保留重叠
      start = end - overlap;
      if (start < 0) start = 0;
      
      // 避免无限循环
      if (start >= end) break;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }
} 