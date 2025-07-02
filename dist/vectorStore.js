"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleVectorStore = void 0;
const fs_1 = require("fs");
const google_genai_1 = require("@langchain/google-genai");
const documents_1 = require("@langchain/core/documents");
const config_1 = require("./config");
class SimpleVectorStore {
    constructor() {
        this.documents = [];
        this.embeddings = new google_genai_1.GoogleGenerativeAIEmbeddings({
            apiKey: config_1.config.geminiApiKey,
            model: 'text-embedding-004',
        });
        this.loadFromFile();
    }
    // 计算余弦相似度
    cosineSimilarity(a, b) {
        const dotProduct = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }
    // 添加文档
    async addDocuments(documents) {
        for (const doc of documents) {
            const embedding = await this.embeddings.embedQuery(doc.pageContent);
            const vectorDoc = {
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
    async similaritySearch(query, k = 4) {
        const queryEmbedding = await this.embeddings.embedQuery(query);
        const similarities = this.documents.map(doc => ({
            document: doc,
            similarity: this.cosineSimilarity(queryEmbedding, doc.embedding),
        }));
        similarities.sort((a, b) => b.similarity - a.similarity);
        return similarities.slice(0, k).map(item => new documents_1.Document({
            pageContent: item.document.content,
            metadata: { ...item.document.metadata, similarity: item.similarity },
        }));
    }
    // 保存到文件
    saveToFile() {
        (0, fs_1.writeFileSync)(config_1.config.vectorStorePath, JSON.stringify(this.documents, null, 2));
    }
    // 从文件加载
    loadFromFile() {
        if ((0, fs_1.existsSync)(config_1.config.vectorStorePath)) {
            try {
                const data = (0, fs_1.readFileSync)(config_1.config.vectorStorePath, 'utf-8');
                this.documents = JSON.parse(data);
            }
            catch (error) {
                console.error('加载向量存储失败:', error);
                this.documents = [];
            }
        }
    }
    // 获取文档数量
    getDocumentCount() {
        return this.documents.length;
    }
    // 清空存储
    clear() {
        this.documents = [];
        this.saveToFile();
    }
}
exports.SimpleVectorStore = SimpleVectorStore;
