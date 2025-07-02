#!/usr/bin/env node

/**
 * LangChain版本功能测试脚本
 * 验证系统的核心组件是否正常工作
 */

const chalk = require('chalk');
const { spawn } = require('child_process');
const path = require('path');

console.log(chalk.cyan(`
🧪 LangChain版本功能测试
========================
`));

async function testComponent(name, command, expectedOutput) {
  return new Promise((resolve) => {
    console.log(chalk.yellow(`📋 测试: ${name}`));
    
    const child = spawn('node', command.split(' '), {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        GEMINI_API_KEY: 'test_key',
        RAG_ENABLED: 'false'
      }
    });

    let output = '';
    let hasExpectedOutput = false;

    child.stdout.on('data', (data) => {
      output += data.toString();
      if (expectedOutput && output.includes(expectedOutput)) {
        hasExpectedOutput = true;
        child.kill();
      }
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (hasExpectedOutput || code === 0) {
        console.log(chalk.green(`✅ ${name} - 通过`));
      } else {
        console.log(chalk.red(`❌ ${name} - 失败`));
        console.log(chalk.gray(`   输出: ${output.slice(0, 200)}...`));
      }
      resolve({ name, passed: hasExpectedOutput || code === 0, output });
    });

    // 5秒超时
    setTimeout(() => {
      child.kill();
      if (hasExpectedOutput) {
        console.log(chalk.green(`✅ ${name} - 通过 (超时但找到预期输出)`));
        resolve({ name, passed: true, output });
      } else {
        console.log(chalk.red(`❌ ${name} - 超时`));
        resolve({ name, passed: false, output });
      }
    }, 5000);
  });
}

async function runTests() {
  const tests = [
    {
      name: 'TypeScript编译',
      command: 'npm run build',
      expectedOutput: null
    },
    {
      name: 'LangChain版本启动',
      command: 'dist/index-langchain.js',
      expectedOutput: 'LangChain AI'
    }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testComponent(test.name, test.command, test.expectedOutput);
    results.push(result);
  }

  console.log(chalk.cyan(`
📊 测试结果汇总
===============`));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const status = result.passed ? chalk.green('✅ 通过') : chalk.red('❌ 失败');
    console.log(`${status} ${result.name}`);
  });

  console.log(chalk.cyan(`
总计: ${passed}/${total} 测试通过
`));

  if (passed === total) {
    console.log(chalk.green(`🎉 所有测试通过！LangChain版本已就绪。`));
    console.log(chalk.yellow(`
🚀 启动命令：
npm run build
node dist/index-langchain.js
`));
  } else {
    console.log(chalk.red(`❌ 有 ${total - passed} 个测试失败，请检查相关组件。`));
  }
}

// 运行测试
runTests().catch(console.error); 