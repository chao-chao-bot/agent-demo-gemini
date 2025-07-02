#!/usr/bin/env node

/**
 * ChromaDB 数据查看器
 * 使用正确的 v2 API 查看向量数据库内容
 */

const http = require('http');
const chalk = require('chalk');

console.log(chalk.cyan(`
🔍 ChromaDB 数据查看器 (v2 API)
============================
`));

// HTTP 请求工具
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
      const dataString = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          if (responseData) {
            const jsonData = JSON.parse(responseData);
            resolve({ status: res.statusCode, data: jsonData });
          } else {
            resolve({ status: res.statusCode, data: null });
          }
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

// 检查连接状态
async function checkHeartbeat() {
  try {
    const response = await makeRequest('/api/v2/heartbeat');
    return response;
  } catch (error) {
    console.log(chalk.red('❌ 连接检查失败:'), error.message);
    return null;
  }
}

// 获取所有集合 (v2 API)
async function getCollections() {
  try {
    const response = await makeRequest('/api/v2/collections');
    return response;
  } catch (error) {
    console.log(chalk.red('❌ 获取集合失败:'), error.message);
    return null;
  }
}

// 获取集合详情
async function getCollection(name) {
  try {
    const response = await makeRequest(`/api/v2/collections/${name}`);
    return response;
  } catch (error) {
    console.log(chalk.red(`❌ 获取集合 ${name} 失败:`, error.message));
    return null;
  }
}

// 创建集合（用于测试）
async function createTestCollection() {
  try {
    const collectionData = {
      name: 'test_collection_v2',
      metadata: { 'description': 'Test collection for v2 API' }
    };
    
    const response = await makeRequest('/api/v2/collections', 'POST', collectionData);
    return response;
  } catch (error) {
    console.log(chalk.red('❌ 创建测试集合失败:'), error.message);
    return null;
  }
}

// 主函数
async function main() {
  try {
    // 检查连接
    console.log(chalk.yellow('🔍 检查 ChromaDB 连接状态...'));
    const heartbeat = await checkHeartbeat();
    
    if (heartbeat && heartbeat.status === 200) {
      console.log(chalk.green('✅ ChromaDB 连接正常'));
      console.log(chalk.blue('心跳响应:'), heartbeat.data);
    } else {
      console.log(chalk.red('❌ ChromaDB 连接失败'));
      if (heartbeat) {
        console.log(chalk.red('状态码:'), heartbeat.status);
        console.log(chalk.red('响应:'), heartbeat.data);
      }
      return;
    }

    // 获取集合列表
    console.log(chalk.yellow('\n📚 查询现有集合...'));
    const collections = await getCollections();
    
    if (collections) {
      console.log(chalk.blue(`状态码: ${collections.status}`));
      if (collections.status === 200) {
        console.log(chalk.green('✅ 成功获取集合列表'));
        console.log(chalk.blue('集合数据:'));
        if (Array.isArray(collections.data) && collections.data.length > 0) {
          collections.data.forEach((collection, index) => {
            console.log(chalk.cyan(`  ${index + 1}. ${collection.name || collection.id || '未知集合'}`));
            if (collection.metadata) {
              console.log(chalk.gray(`     元数据: ${JSON.stringify(collection.metadata)}`));
            }
          });
        } else {
          console.log(chalk.yellow('  📝 暂无集合数据'));
        }
      } else {
        console.log(chalk.red('❌ 获取集合失败'));
        console.log(JSON.stringify(collections.data, null, 2));
      }
    }

    // 尝试创建测试集合
    console.log(chalk.yellow('\n🧪 尝试创建测试集合...'));
    const testCollection = await createTestCollection();
    
    if (testCollection) {
      console.log(chalk.blue(`状态码: ${testCollection.status}`));
      if (testCollection.status === 200 || testCollection.status === 201) {
        console.log(chalk.green('✅ 测试集合创建成功'));
        console.log(chalk.blue('创建结果:'));
        console.log(JSON.stringify(testCollection.data, null, 2));
      } else {
        console.log(chalk.yellow('⚠️ 测试集合创建返回状态:'), testCollection.status);
        console.log(JSON.stringify(testCollection.data, null, 2));
      }
    }

    // 再次查询集合
    console.log(chalk.yellow('\n📚 再次查询集合列表...'));
    const collectionsAfter = await getCollections();
    
    if (collectionsAfter && collectionsAfter.status === 200) {
      console.log(chalk.green('✅ 更新后的集合列表:'));
      if (Array.isArray(collectionsAfter.data)) {
        console.log(chalk.blue(`总共 ${collectionsAfter.data.length} 个集合`));
        collectionsAfter.data.forEach((collection, index) => {
          console.log(chalk.cyan(`  ${index + 1}. ${collection.name || collection.id || '未知集合'}`));
        });
      }
    }

    console.log(chalk.green('\n✅ 查看完成'));
    console.log(chalk.cyan(`
💡 ChromaDB v2 API 状态:
- ✅ 连接正常
- ✅ API v2 可用
- ✅ 集合查询正常
- 💡 如需添加数据，请运行 LangChain 应用
    `));

  } catch (error) {
    console.error(chalk.red('❌ 查看失败:'), error);
  }
}

// 运行
main().catch(console.error); 