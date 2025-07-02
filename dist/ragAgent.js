"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGAgent = void 0;
const google_genai_1 = require("@langchain/google-genai");
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
const output_parsers_1 = require("@langchain/core/output_parsers");
const vectorStore_1 = require("./vectorStore");
const documentLoader_1 = require("./documentLoader");
const config_1 = require("./config");
class RAGAgent {
    constructor() {
        // 初始化 Gemini 模型
        this.llm = new google_genai_1.ChatGoogleGenerativeAI({
            apiKey: config_1.config.geminiApiKey,
            model: 'gemini-1.5-flash-latest',
            temperature: 0.7,
        });
        this.vectorStore = new vectorStore_1.SimpleVectorStore();
        this.documentLoader = new documentLoader_1.DocumentLoader();
        this.setupChain();
    }
    // 设置 RAG 链
    setupChain() {
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            ['system', `你是一个智能助手，能够回答用户的各种问题。

工作模式：
1. 优先使用提供的上下文信息回答问题
2. 如果上下文信息充分，请基于上下文详细回答
3. 如果上下文信息不足或没有相关信息，可以使用你的通用知识回答
4. 当使用通用知识时，请明确说明这不是基于特定知识库的信息
5. 保持回答准确、有帮助且友好

上下文信息：
{context}

注意：如果上下文为空或不相关，说明知识库中没有相关信息，你可以使用通用知识回答问题。`],
            ['human', '{question}']
        ]);
        this.chain = runnables_1.RunnableSequence.from([
            {
                context: async (input) => {
                    const relevantDocs = await this.vectorStore.similaritySearch(input.question, 4);
                    if (relevantDocs.length === 0) {
                        return "知识库中没有相关信息。";
                    }
                    return relevantDocs.map(doc => doc.pageContent).join('\n\n');
                },
                question: (input) => input.question,
            },
            prompt,
            this.llm,
            new output_parsers_1.StringOutputParser(),
        ]);
    }
    // 加载知识库
    async loadKnowledgeBase(filePaths) {
        try {
            console.log('正在加载知识库...');
            const documents = await this.documentLoader.loadMultipleFiles(filePaths);
            console.log(`成功加载 ${documents.length} 个文档片段`);
            await this.vectorStore.addDocuments(documents);
            console.log('知识库向量化完成');
        }
        catch (error) {
            throw new Error(`加载知识库失败: ${error}`);
        }
    }
    // 添加文本到知识库
    async addText(text, metadata = {}) {
        try {
            const documents = await this.documentLoader.loadText(text, metadata);
            await this.vectorStore.addDocuments(documents);
            console.log(`添加了 ${documents.length} 个文档片段到知识库`);
        }
        catch (error) {
            throw new Error(`添加文本失败: ${error}`);
        }
    }
    // 问答
    async ask(question) {
        try {
            const response = await this.chain.invoke({ question });
            return response;
        }
        catch (error) {
            throw new Error(`问答失败: ${error}`);
        }
    }
    // 获取相关文档
    async getRelevantDocuments(query, k = 4) {
        return await this.vectorStore.similaritySearch(query, k);
    }
    // 获取知识库状态
    getKnowledgeBaseStatus() {
        return {
            documentCount: this.vectorStore.getDocumentCount(),
        };
    }
    // 清空知识库
    clearKnowledgeBase() {
        this.vectorStore.clear();
        console.log('知识库已清空');
    }
}
exports.RAGAgent = RAGAgent;
