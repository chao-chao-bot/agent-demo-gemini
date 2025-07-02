#!/usr/bin/env node

/**
 * 通过 LangChain 查看 ChromaDB 数据
 * 使用与应用相同的方式连接和查询数据
 */

const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const chalk = require('chalk');
require('dotenv').config();

console.log(chalk.cyan(`
📊 LangChain ChromaDB 数据查看器
==============================
`));

async function viewData() {
  try {
    console.log(chalk.yellow('🔍 步骤 1: 初始化连接...'));
    
    // 获取 API 密钥
    const apiKey = process.env.GEMINI_API_KEY || 
                   process.env.GOOGLE_GEMINI_API_KEY || 
                   process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      throw new Error('缺少 Google Gemini API 密钥');
    }
    
    // 初始化嵌入模型
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: apiKey
    });
    
    console.log(chalk.green('✅ 嵌入模型初始化成功'));
    
    // 连接到相同的集合名（与应用保持一致）
    const vectorStore = new Chroma(embeddings, {
      url: "http://localhost:8000",
      collectionName: "agent_knowledge_base" // 与 LangChain 应用使用的集合名保持一致
    });
    
    console.log(chalk.green('✅ 连接到知识库集合'));
    
    console.log(chalk.yellow('🔍 步骤 2: 查询所有文档...'));
    
    try {
      // 执行一个广泛的搜索来获取所有文档
      const allResults = await vectorStore.similaritySearch("", 10); // 空查询，返回最多10个文档
      
      console.log(chalk.green(`✅ 找到 ${allResults.length} 个文档分块`));
      
      if (allResults.length === 0) {
        console.log(chalk.yellow('📝 集合中暂无数据'));
        return;
      }
      
      console.log(chalk.cyan('\n📄 文档内容预览：'));
      console.log('='.repeat(60));
      
      allResults.forEach((doc, index) => {
        console.log(chalk.blue(`\n📝 文档 ${index + 1}:`));
        console.log(chalk.gray('内容:'), doc.pageContent.substring(0, 200) + (doc.pageContent.length > 200 ? '...' : ''));
        
        if (doc.metadata) {
          console.log(chalk.gray('元数据:'));
          Object.entries(doc.metadata).forEach(([key, value]) => {
            console.log(chalk.gray(`  ${key}: ${value}`));
          });
        }
        console.log(chalk.gray('-'.repeat(40)));
      });
      
    } catch (searchError) {
      console.log(chalk.yellow('⚠️ 查询失败，尝试其他方法...'));
      console.log(chalk.gray(`错误: ${searchError.message}`));
      
      // 尝试特定的搜索词
      const keywords = ['LangChain', 'ChromaDB', 'RAG', '向量', '文档'];
      
      for (const keyword of keywords) {
        try {
          console.log(chalk.blue(`\n🔍 搜索关键词: "${keyword}"`));
          const results = await vectorStore.similaritySearch(keyword, 3);
          
          if (results.length > 0) {
            console.log(chalk.green(`  找到 ${results.length} 个相关文档`));
            results.forEach((doc, i) => {
              console.log(chalk.cyan(`  ${i + 1}. ${doc.pageContent.substring(0, 100)}...`));
            });
          } else {
            console.log(chalk.gray(`  未找到包含 "${keyword}" 的文档`));
          }
        } catch (err) {
          console.log(chalk.gray(`  搜索 "${keyword}" 失败`));
        }
      }
    }
    
    console.log(chalk.green('\n✅ 数据查看完成'));
    
  } catch (error) {
    console.error(chalk.red('❌ 查看数据失败:'));
    console.error(chalk.red(error.message));
    
    if (error.message.includes('Collection') && error.message.includes('does not exist')) {
      console.log(chalk.yellow('\n💡 集合不存在建议:'));
      console.log(chalk.cyan('1. 确认 LangChain 应用已经运行并加载了数据'));
      console.log(chalk.cyan('2. 检查集合名称是否正确'));
      console.log(chalk.cyan('3. 重新运行 LangChain 应用来创建集合'));
    }
  }
}

// 运行查看器
viewData().catch(console.error); 