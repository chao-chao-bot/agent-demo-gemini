#!/usr/bin/env node

/**
 * ChromaDB 数据管理工具
 * 支持数据查看、导入、导出、备份等功能
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.cyan(`
🗄️ ChromaDB 数据管理工具
========================
`));

// 辅助函数：模拟LangChain的ChromaDB客户端
async function createSampleData() {
  console.log(chalk.yellow('📊 正在创建示例数据...'));
  
  try {
    // 检查是否有编译好的应用
    if (!fs.existsSync('dist/index-langchain.js')) {
      console.log(chalk.red('❌ 请先编译应用: npm run build'));
      return;
    }
    
    // 设置环境变量并运行应用来初始化数据
    console.log(chalk.blue('🚀 启动 LangChain 应用来初始化数据...'));
    
    const { spawn } = require('child_process');
    
    const env = {
      ...process.env,
      GEMINI_API_KEY: 'test_key_for_initialization',
      RAG_ENABLED: 'true',
      CHROMA_URL: 'localhost',
      CHROMA_PORT: '8000'
    };
    
    return new Promise((resolve, reject) => {
      const child = spawn('node', ['dist/index-langchain.js'], {
        env,
        stdio: 'pipe'
      });
      
      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
        console.log(chalk.gray(data.toString().trim()));
        
        // 检查是否初始化完成
        if (output.includes('系统就绪') || output.includes('LangChain Agent初始化完成')) {
          console.log(chalk.green('✅ 初始化完成，正在关闭应用...'));
          setTimeout(() => {
            child.kill();
            resolve(true);
          }, 2000);
        }
      });
      
      child.stderr.on('data', (data) => {
        console.log(chalk.yellow('⚠️', data.toString().trim()));
      });
      
      child.on('close', (code) => {
        resolve(code === 0);
      });
      
      // 10秒超时
      setTimeout(() => {
        child.kill();
        resolve(false);
      }, 10000);
    });
    
  } catch (error) {
    console.error(chalk.red('❌ 创建示例数据失败:'), error);
    return false;
  }
}

// 使用直接命令查看Docker容器内的数据
async function inspectContainerData() {
  console.log(chalk.yellow('🔍 检查容器内的数据...'));
  
  try {
    const { execSync } = require('child_process');
    
    // 获取ChromaDB容器ID
    const containers = execSync('docker ps --filter ancestor=chromadb/chroma --format "{{.ID}}"', { encoding: 'utf8' }).trim();
    
    if (!containers) {
      console.log(chalk.red('❌ 没有找到运行中的ChromaDB容器'));
      return;
    }
    
    const containerId = containers.split('\n')[0];
    console.log(chalk.blue(`📦 容器ID: ${containerId}`));
    
    // 查看容器内的文件结构
    console.log(chalk.yellow('📁 容器内文件结构:'));
    try {
      const fileList = execSync(`docker exec ${containerId} find /chroma -type f 2>/dev/null || docker exec ${containerId} ls -la /`, { encoding: 'utf8' });
      console.log(chalk.gray(fileList));
    } catch (error) {
      console.log(chalk.gray('无法访问容器文件系统'));
    }
    
    // 查看进程
    console.log(chalk.yellow('🔄 容器内进程:'));
    try {
      const processes = execSync(`docker exec ${containerId} ps aux`, { encoding: 'utf8' });
      console.log(chalk.gray(processes));
    } catch (error) {
      console.log(chalk.gray('无法查看进程信息'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ 检查容器数据失败:'), error.message);
  }
}

// 创建持久化数据卷的ChromaDB
async function createPersistentChromaDB() {
  console.log(chalk.yellow('💾 创建持久化的ChromaDB实例...'));
  
  try {
    const { execSync } = require('child_process');
    
    // 停止现有容器
    try {
      execSync('docker stop $(docker ps -q --filter ancestor=chromadb/chroma)', { stdio: 'ignore' });
      console.log(chalk.blue('🛑 已停止现有ChromaDB容器'));
    } catch (error) {
      // 忽略错误，可能没有运行的容器
    }
    
    // 创建数据目录
    const dataDir = path.join(process.cwd(), 'chromadb-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(chalk.green(`📁 创建数据目录: ${dataDir}`));
    }
    
    // 启动带持久化存储的ChromaDB
    console.log(chalk.blue('🚀 启动持久化ChromaDB...'));
    const command = `docker run -d --name chromadb-persistent -p 8000:8000 -v "${dataDir}:/chroma/chroma" chromadb/chroma`;
    
    try {
      const result = execSync(command, { encoding: 'utf8' });
      console.log(chalk.green('✅ 持久化ChromaDB启动成功'));
      console.log(chalk.blue(`📦 容器ID: ${result.trim()}`));
      console.log(chalk.cyan(`💾 数据存储在: ${dataDir}`));
      
      // 等待服务启动
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return true;
    } catch (error) {
      console.error(chalk.red('❌ 启动失败:'), error.message);
      return false;
    }
    
  } catch (error) {
    console.error(chalk.red('❌ 创建持久化ChromaDB失败:'), error);
    return false;
  }
}

// 备份ChromaDB数据
async function backupData() {
  console.log(chalk.yellow('💾 备份ChromaDB数据...'));
  
  const dataDir = path.join(process.cwd(), 'chromadb-data');
  if (!fs.existsSync(dataDir)) {
    console.log(chalk.red('❌ 没有找到数据目录，请先创建持久化实例'));
    return;
  }
  
  try {
    const { execSync } = require('child_process');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), `chromadb-backup-${timestamp}`);
    
    // 创建备份
    execSync(`cp -r "${dataDir}" "${backupDir}"`, { encoding: 'utf8' });
    console.log(chalk.green(`✅ 数据已备份到: ${backupDir}`));
    
    // 创建备份信息文件
    const backupInfo = {
      timestamp: new Date().toISOString(),
      source: dataDir,
      backup: backupDir,
      files: fs.readdirSync(dataDir, { recursive: true })
    };
    
    fs.writeFileSync(path.join(backupDir, 'backup-info.json'), JSON.stringify(backupInfo, null, 2));
    console.log(chalk.blue('📋 备份信息已保存'));
    
  } catch (error) {
    console.error(chalk.red('❌ 备份失败:'), error);
  }
}

// 主菜单
function showMenu() {
  console.log(chalk.cyan(`
📋 ChromaDB 数据管理菜单:

1. 🔍 预览当前数据库状态
2. 📊 创建示例数据
3. 🔍 检查容器内数据
4. 💾 创建持久化ChromaDB实例
5. 💾 备份数据
6. 📁 查看数据目录
7. 🔄 重启ChromaDB服务
8. ❌ 退出

选择操作 (1-8):`));
}

// 查看数据目录
function viewDataDirectory() {
  const dataDir = path.join(process.cwd(), 'chromadb-data');
  
  if (fs.existsSync(dataDir)) {
    console.log(chalk.green(`📁 数据目录: ${dataDir}`));
    console.log(chalk.blue('📂 目录内容:'));
    
    function listFiles(dir, indent = '') {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          console.log(chalk.blue(`${indent}📁 ${item}/`));
          if (indent.length < 6) { // 限制递归深度
            listFiles(itemPath, indent + '  ');
          }
        } else {
          console.log(chalk.gray(`${indent}📄 ${item} (${stats.size} bytes)`));
        }
      });
    }
    
    listFiles(dataDir);
  } else {
    console.log(chalk.yellow('⚠️ 数据目录不存在，使用临时存储'));
    console.log(chalk.blue('💡 运行选项4创建持久化实例'));
  }
}

// 重启服务
async function restartService() {
  console.log(chalk.yellow('🔄 重启ChromaDB服务...'));
  
  try {
    const { execSync } = require('child_process');
    
    // 停止所有ChromaDB容器
    try {
      execSync('docker stop $(docker ps -q --filter ancestor=chromadb/chroma)', { stdio: 'ignore' });
      execSync('docker rm $(docker ps -aq --filter ancestor=chromadb/chroma)', { stdio: 'ignore' });
    } catch (error) {
      // 忽略错误
    }
    
    // 重新启动
    const dataDir = path.join(process.cwd(), 'chromadb-data');
    if (fs.existsSync(dataDir)) {
      console.log(chalk.blue('🚀 启动持久化ChromaDB...'));
      execSync(`docker run -d --name chromadb-persistent -p 8000:8000 -v "${dataDir}:/chroma/chroma" chromadb/chroma`);
    } else {
      console.log(chalk.blue('🚀 启动临时ChromaDB...'));
      execSync('docker run -d -p 8000:8000 chromadb/chroma');
    }
    
    console.log(chalk.green('✅ 服务重启完成'));
    
  } catch (error) {
    console.error(chalk.red('❌ 重启失败:'), error.message);
  }
}

// 交互式主程序
async function main() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  try {
    while (true) {
      showMenu();
      const choice = await askQuestion('');

      switch (choice) {
        case '1':
          const { execSync } = require('child_process');
          execSync('node scripts/preview-chromadb.js', { stdio: 'inherit' });
          break;
        case '2':
          await createSampleData();
          break;
        case '3':
          await inspectContainerData();
          break;
        case '4':
          await createPersistentChromaDB();
          break;
        case '5':
          await backupData();
          break;
        case '6':
          viewDataDirectory();
          break;
        case '7':
          await restartService();
          break;
        case '8':
          console.log(chalk.cyan('👋 再见！'));
          rl.close();
          process.exit(0);
        default:
          console.log(chalk.red('❌ 无效选择，请输入1-8'));
      }

      console.log(chalk.gray('\n按任意键继续...'));
      await askQuestion('');
    }
  } catch (error) {
    console.error(chalk.red('❌ 程序错误:'), error);
  } finally {
    rl.close();
  }
}

// 如果直接运行脚本，启动交互式菜单
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createSampleData,
  inspectContainerData,
  createPersistentChromaDB,
  backupData
}; 