#!/usr/bin/env node

const { ChatAgent } = require('../dist/agent/ChatAgent');
const { DocumentLoader } = require('../dist/rag/DocumentLoader');
const { RAGService } = require('../dist/rag/RAGService');
const chalk = require('chalk');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

// 加载环境变量
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function addKnowledge() {
  console.log(chalk.blue.bold('📚 知识库录入工具'));
  console.log(chalk.cyan(`
╔══════════════════════════════════════════╗
║              知识录入选项                ║
║                                          ║
║  1. 添加文本内容                        ║
║  2. 添加单个文件                        ║
║  3. 添加整个文件夹                      ║
║  4. 退出                                ║
╚══════════════════════════════════════════╝
  `));

  try {
    // 初始化RAG服务
    const ragConfig = {
      collectionName: process.env.RAG_COLLECTION_NAME || 'agent_knowledge_base',
      chromaUrl: process.env.CHROMA_URL || 'localhost',
      chromaPort: parseInt(process.env.CHROMA_PORT || '8000'),
      embeddingModel: 'default'
    };

    const ragService = new RAGService(ragConfig);
    const documentLoader = new DocumentLoader();
    
    console.log(chalk.yellow('🔧 初始化RAG服务...'));
    await ragService.initialize();
    console.log(chalk.green('✅ RAG服务初始化完成'));

    while (true) {
      const choice = await question(chalk.cyan('\n请选择操作 (1-4): '));
      
      switch (choice.trim()) {
        case '1':
          await addTextContent(ragService, documentLoader);
          break;
        case '2':
          await addSingleFile(ragService, documentLoader);
          break;
        case '3':
          await addDirectory(ragService, documentLoader);
          break;
        case '4':
          console.log(chalk.yellow('👋 再见！'));
          rl.close();
          return;
        default:
          console.log(chalk.red('❌ 无效选择，请输入 1-4'));
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ 错误:'), error.message);
    rl.close();
  }
}

async function addTextContent(ragService, documentLoader) {
  console.log(chalk.blue('\n📝 添加文本内容'));
  
  const title = await question('请输入文档标题: ');
  const category = await question('请输入文档分类 (可选): ');
  
  console.log(chalk.yellow('\n请输入文档内容 (输入"END"结束):'));
  
  let content = '';
  while (true) {
    const line = await question('');
    if (line.trim() === 'END') {
      break;
    }
    content += line + '\n';
  }

  if (content.trim()) {
    const document = documentLoader.createDocumentFromText(content.trim(), {
      title: title || '未命名文档',
      category: category || '默认分类',
      addedBy: 'manual',
      addedAt: new Date().toISOString()
    });

    await ragService.addDocuments([document]);
    console.log(chalk.green('✅ 文档已成功添加到知识库'));
  } else {
    console.log(chalk.yellow('⚠️ 内容为空，未添加文档'));
  }
}

async function addSingleFile(ragService, documentLoader) {
  console.log(chalk.blue('\n📄 添加单个文件'));
  
  const filePath = await question('请输入文件路径: ');
  
  if (!fs.existsSync(filePath)) {
    console.log(chalk.red('❌ 文件不存在'));
    return;
  }

  try {
    const documents = await documentLoader.loadMultipleFiles([filePath]);
    await ragService.addDocuments(documents);
    console.log(chalk.green(`✅ 文件已成功添加到知识库 (${documents.length} 个文档块)`));
  } catch (error) {
    console.log(chalk.red('❌ 添加文件失败:'), error.message);
  }
}

async function addDirectory(ragService, documentLoader) {
  console.log(chalk.blue('\n📁 添加文件夹'));
  
  const dirPath = await question('请输入文件夹路径: ');
  
  if (!fs.existsSync(dirPath)) {
    console.log(chalk.red('❌ 文件夹不存在'));
    return;
  }

  try {
    const documents = await documentLoader.loadFromDirectory(dirPath);
    if (documents.length > 0) {
      await ragService.addDocuments(documents);
      console.log(chalk.green(`✅ 文件夹已成功添加到知识库 (${documents.length} 个文档块)`));
    } else {
      console.log(chalk.yellow('⚠️ 文件夹中没有找到支持的文档格式'));
    }
  } catch (error) {
    console.log(chalk.red('❌ 添加文件夹失败:'), error.message);
  }
}

// 启动程序
addKnowledge().catch(error => {
  console.error(chalk.red('程序运行失败:'), error);
  process.exit(1);
}); 