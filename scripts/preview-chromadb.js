#!/usr/bin/env node

/**
 * ChromaDB 数据预览工具
 * 查看向量数据库中的集合和文档
 */

const chalk = require('chalk');
const http = require('http');

console.log(chalk.cyan(`
🔍 ChromaDB 数据预览工具
=======================
`));

// 发送HTTP请求的辅助函数
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 列出所有集合
async function listCollections() {
  try {
    console.log(chalk.yellow('📋 查询集合列表...'));
    
    // 尝试不同的API路径
    const paths = [
      '/api/v1/collections',
      '/api/v2/collections', 
      '/collections',
      '/api/v1'
    ];

    for (const path of paths) {
      try {
        const response = await makeRequest(path);
        console.log(chalk.blue(`🔗 API路径: ${path}`));
        console.log(chalk.blue(`📊 状态码: ${response.status}`));
        
        if (response.data && typeof response.data === 'object') {
          console.log(chalk.green('📦 响应数据:'));
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.gray('📄 响应:', response.data));
        }
        console.log(chalk.gray('-'.repeat(50)));
      } catch (error) {
        console.log(chalk.red(`❌ ${path} 失败:`, error.message));
      }
    }

  } catch (error) {
    console.error(chalk.red('❌ 查询集合失败:'), error);
  }
}

// 检查具体集合
async function checkCollection(collectionName) {
  try {
    console.log(chalk.yellow(`📋 检查集合: ${collectionName}`));
    
    const paths = [
      `/api/v1/collections/${collectionName}`,
      `/api/v2/collections/${collectionName}`,
      `/collections/${collectionName}`
    ];

    for (const path of paths) {
      try {
        const response = await makeRequest(path);
        console.log(chalk.blue(`🔗 集合路径: ${path}`));
        console.log(chalk.blue(`📊 状态码: ${response.status}`));
        
        if (response.data) {
          console.log(chalk.green('📦 集合信息:'));
          console.log(JSON.stringify(response.data, null, 2));
        }
        console.log(chalk.gray('-'.repeat(50)));
      } catch (error) {
        console.log(chalk.red(`❌ ${path} 失败:`, error.message));
      }
    }

  } catch (error) {
    console.error(chalk.red('❌ 查询集合失败:'), error);
  }
}

// 主函数
async function main() {
  try {
    // 首先检查 ChromaDB 是否运行
    console.log(chalk.cyan('🔍 检查 ChromaDB 连接...'));
    
    try {
      const healthCheck = await makeRequest('/');
      console.log(chalk.green('✅ ChromaDB 连接正常'));
      console.log(chalk.blue('📊 根路径响应:'), healthCheck.data);
    } catch (error) {
      console.log(chalk.red('❌ ChromaDB 连接失败:'), error.message);
      console.log(chalk.yellow('💡 请确保 ChromaDB 正在运行: docker run -p 8000:8000 chromadb/chroma'));
      process.exit(1);
    }

    console.log(chalk.cyan('\n📚 探索 ChromaDB 数据结构...'));
    
    // 列出所有集合
    await listCollections();
    
    // 检查我们的知识库集合
    const knowledgeBaseCollections = [
      'langchain_knowledge_base',
      'agent_knowledge_base',
      'default'
    ];

    for (const collection of knowledgeBaseCollections) {
      await checkCollection(collection);
    }

    console.log(chalk.green('\n✅ 数据预览完成'));
    console.log(chalk.yellow(`
💡 提示:
- 如果没有看到数据，可能是因为还没有运行 LangChain 应用
- 运行 'node dist/index-langchain.js' 来初始化示例数据
- ChromaDB 使用 v2 API，部分 v1 API 已废弃
    `));

  } catch (error) {
    console.error(chalk.red('❌ 预览失败:'), error);
  }
}

// 运行
main().catch(console.error); 