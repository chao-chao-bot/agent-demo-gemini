"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentLoader = void 0;
const fs_1 = require("fs");
const text_splitter_1 = require("langchain/text_splitter");
const config_1 = require("./config");
class DocumentLoader {
    constructor() {
        this.textSplitter = new text_splitter_1.RecursiveCharacterTextSplitter({
            chunkSize: config_1.config.chunkSize,
            chunkOverlap: config_1.config.chunkOverlap,
        });
    }
    // 加载文本文件
    async loadTextFile(filePath) {
        try {
            const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
            const documents = await this.textSplitter.createDocuments([content], [
                { source: filePath, type: 'text' }
            ]);
            return documents;
        }
        catch (error) {
            throw new Error(`加载文件失败: ${error}`);
        }
    }
    // 加载文本内容
    async loadText(text, metadata = {}) {
        const documents = await this.textSplitter.createDocuments([text], [metadata]);
        return documents;
    }
    // 加载多个文本文件
    async loadMultipleFiles(filePaths) {
        const allDocuments = [];
        for (const filePath of filePaths) {
            try {
                const documents = await this.loadTextFile(filePath);
                allDocuments.push(...documents);
            }
            catch (error) {
                console.error(`加载文件 ${filePath} 失败:`, error);
            }
        }
        return allDocuments;
    }
}
exports.DocumentLoader = DocumentLoader;
