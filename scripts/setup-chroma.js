#!/usr/bin/env node

const { exec } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue.bold('🐳 Chroma向量数据库设置向导'));

function executeCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(chalk.yellow(`\n📦 ${description}...`));
    console.log(chalk.gray(`执行命令: ${command}`));
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red(`❌ 错误: ${error.message}`));
        reject(error);
        return;
      }
      
      if (stderr) {
        console.log(chalk.yellow(`警告: ${stderr}`));
      }
      
      if (stdout) {
        console.log(chalk.green(stdout));
      }
      
      console.log(chalk.green(`✅ ${description}完成`));
      resolve();
    });
  });
}

async function setupChroma() {
  try {
    console.log(chalk.cyan(`
╔══════════════════════════════════════════╗
║          🎯 Chroma设置选项                ║
║                                          ║
║  1. 使用Docker运行 (推荐)                ║
║  2. 使用Python pip安装                   ║
║  3. 检查现有Chroma服务                   ║
╚══════════════════════════════════════════╝
    `));

    // 检查Docker是否可用
    console.log(chalk.blue('\n🔍 检查系统环境...'));
    
    try {
      await executeCommand('docker --version', '检查Docker');
      console.log(chalk.green('✅ Docker可用，推荐使用Docker方式'));
      
      console.log(chalk.cyan('\n🚀 启动Chroma Docker容器...'));
      await executeCommand(
        'docker run -d -p 8000:8000 --name chroma-db chromadb/chroma',
        '启动Chroma容器'
      );
      
      console.log(chalk.green.bold('\n🎉 Chroma数据库启动成功！'));
      console.log(chalk.cyan(`
📊 连接信息：
- URL: http://localhost:8000
- 状态: 运行中
- 容器名: chroma-db

🔧 管理命令：
- 停止: docker stop chroma-db
- 启动: docker start chroma-db  
- 删除: docker rm -f chroma-db

🔗 在Agent中使用：
export CHROMA_URL=localhost
export CHROMA_PORT=8000
      `));
      
    } catch (dockerError) {
      console.log(chalk.yellow('⚠️  Docker不可用，尝试Python安装方式...'));
      
      try {
        await executeCommand('python --version', '检查Python');
        await executeCommand('pip --version', '检查pip');
        
        console.log(chalk.cyan('\n📦 使用pip安装ChromaDB...'));
        await executeCommand('pip install chromadb', '安装ChromaDB');
        
        console.log(chalk.green.bold('\n🎉 ChromaDB安装成功！'));
        console.log(chalk.cyan(`
🚀 启动命令：
chroma run --host localhost --port 8000

📊 连接信息：
- URL: http://localhost:8000

🔗 在Agent中使用：
export CHROMA_URL=localhost  
export CHROMA_PORT=8000
        `));
        
      } catch (pythonError) {
        console.error(chalk.red('\n❌ 无法设置Chroma数据库'));
        console.log(chalk.yellow(`
🔧 手动安装选项：

1. 安装Docker后运行：
   docker run -p 8000:8000 chromadb/chroma

2. 安装Python和pip后运行：
   pip install chromadb
   chroma run --host localhost --port 8000

3. 或者在无RAG模式下使用Agent（功能受限）

💡 参考文档: https://docs.trychroma.com/getting-started
        `));
      }
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ 设置过程中发生错误:'), error.message);
    process.exit(1);
  }
}

// 检查Chroma服务状态
async function checkChromaStatus() {
  try {
    console.log(chalk.blue('🔍 检查Chroma服务状态...'));
    
    const { default: fetch } = await import('node-fetch');
    const response = await fetch('http://localhost:8000/api/v1/heartbeat');
    
    if (response.ok) {
      console.log(chalk.green('✅ Chroma服务运行正常'));
      console.log(chalk.cyan('🔗 可以在Agent中使用RAG功能'));
    } else {
      console.log(chalk.yellow('⚠️  Chroma服务响应异常'));
    }
  } catch (error) {
    console.log(chalk.red('❌ 无法连接到Chroma服务'));
    console.log(chalk.yellow('💡 请确保Chroma服务在localhost:8000运行'));
  }
}

// 主程序
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--check')) {
    await checkChromaStatus();
    return;
  }
  
  if (args.includes('--help')) {
    console.log(chalk.cyan(`
使用方法：
  node scripts/setup-chroma.js          # 设置Chroma数据库
  node scripts/setup-chroma.js --check  # 检查服务状态
  node scripts/setup-chroma.js --help   # 显示帮助
    `));
    return;
  }
  
  await setupChroma();
}

main().catch(error => {
  console.error(chalk.red('脚本执行失败:'), error);
  process.exit(1);
}); 