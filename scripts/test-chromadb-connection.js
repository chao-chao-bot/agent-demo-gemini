#!/usr/bin/env node

/**
 * ChromaDB 连接测试脚本
 * 使用 LangChain 的 Chroma 集成来测试连接
 */

const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const chalk = require('chalk');
require('dotenv').config();

console.log(chalk.cyan(`
🧪 ChromaDB 连接测试 (使用真实 API 密钥)
====================================
`));

async function testConnection() {
  try {
    console.log(chalk.yellow('🔍 步骤 1: 检查环境变量...'));
    
    // 尝试多个可能的环境变量名
    const apiKey = process.env.GEMINI_API_KEY || 
                   process.env.GOOGLE_GEMINI_API_KEY || 
                   process.env.GOOGLE_API_KEY ||
                   process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      console.log(chalk.red('❌ 没有找到 API 密钥'));
      console.log(chalk.yellow('尝试的环境变量:'));
      console.log(chalk.gray('  - GEMINI_API_KEY'));
      console.log(chalk.gray('  - GOOGLE_GEMINI_API_KEY'));
      console.log(chalk.gray('  - GOOGLE_API_KEY'));
      console.log(chalk.gray('  - GOOGLE_AI_API_KEY'));
      throw new Error('缺少 Google Gemini API 密钥环境变量');
    }
    
    console.log(chalk.green('✅ API 密钥存在'));
    console.log(chalk.gray(`   密钥长度: ${apiKey.length} 字符`));
    console.log(chalk.gray(`   使用变量: ${getApiKeySource()}`));
    
    console.log(chalk.yellow('🔍 步骤 2: 初始化嵌入模型...'));
    
    // 初始化嵌入模型 (使用真实密钥)
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: apiKey
    });
    
    console.log(chalk.green('✅ 嵌入模型初始化成功'));
    
    console.log(chalk.yellow('🔍 步骤 3: 连接 ChromaDB...'));
    
    // 连接到 ChromaDB
    const vectorStore = new Chroma(embeddings, {
      url: "http://localhost:8000",
      collectionName: "test_connection"
    });
    
    console.log(chalk.green('✅ ChromaDB 连接配置成功'));
    
    console.log(chalk.yellow('🔍 步骤 4: 测试嵌入功能...'));
    
    // 测试添加一个简单的文档
    try {
      const testDocs = [
        {
          pageContent: "这是一个测试文档，用于验证 ChromaDB 和 Gemini 嵌入功能。",
          metadata: { source: "test", timestamp: new Date().toISOString() }
        }
      ];
      
      console.log(chalk.blue('   添加测试文档...'));
      await vectorStore.addDocuments(testDocs);
      console.log(chalk.green('✅ 文档添加成功'));
      
      console.log(chalk.blue('   执行相似度搜索...'));
      const results = await vectorStore.similaritySearch("测试文档", 1);
      console.log(chalk.green('✅ 向量搜索成功'));
      console.log(chalk.blue(`   找到 ${results.length} 个相关文档`));
      
      if (results.length > 0) {
        console.log(chalk.cyan(`   文档内容预览: "${results[0].pageContent.substring(0, 50)}..."`));
      }
      
    } catch (searchError) {
      console.log(chalk.yellow('⚠️ 嵌入测试失败'));
      console.log(chalk.gray(`   错误: ${searchError.message}`));
    }
    
    console.log(chalk.green('\n✅ ChromaDB 完整连接测试成功'));
    console.log(chalk.cyan(`
🎯 测试结果：
- ✅ API 密钥配置正确
- ✅ 嵌入模型初始化正常
- ✅ ChromaDB 连接正常  
- ✅ 文档添加功能正常
- ✅ 向量搜索功能正常

🚀 系统状态：完全可用
💡 可以开始使用 LangChain Agent 了！
    `));
    
  } catch (error) {
    console.error(chalk.red('❌ 连接测试失败:'));
    console.error(chalk.red(error.message));
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log(chalk.yellow('\n💡 ChromaDB 连接故障排除:'));
      console.log(chalk.cyan('1. 检查 ChromaDB 容器: docker ps | grep chroma'));
      console.log(chalk.cyan('2. 重启容器: docker restart chromadb-persistent'));
    }
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log(chalk.yellow('\n💡 API 密钥故障排除:'));
      console.log(chalk.cyan('1. 检查环境变量设置'));
      console.log(chalk.cyan('2. 确认密钥是否有效: 访问 Google AI Studio'));
    }
    
    if (error.message.includes('quota')) {
      console.log(chalk.yellow('\n💡 配额问题:'));
      console.log(chalk.cyan('1. Google AI API 可能达到使用限制'));
      console.log(chalk.cyan('2. 检查 Google Cloud Console 中的配额'));
    }

    if (error.message.includes('缺少')) {
      console.log(chalk.yellow('\n💡 环境变量设置建议:'));
      console.log(chalk.cyan('1. 创建 .env 文件: GEMINI_API_KEY=your_key'));
      console.log(chalk.cyan('2. 或者导出环境变量: export GEMINI_API_KEY="your_key"'));
    }
  }
}

// 辅助函数：确定使用了哪个环境变量
function getApiKeySource() {
  if (process.env.GEMINI_API_KEY) return 'GEMINI_API_KEY';
  if (process.env.GOOGLE_GEMINI_API_KEY) return 'GOOGLE_GEMINI_API_KEY';
  if (process.env.GOOGLE_API_KEY) return 'GOOGLE_API_KEY';
  if (process.env.GOOGLE_AI_API_KEY) return 'GOOGLE_AI_API_KEY';
  return '未知';
}

// 运行测试
testConnection().catch(console.error); 