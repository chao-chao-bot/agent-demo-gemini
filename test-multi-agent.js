#!/usr/bin/env node

const { ChatAgent } = require('./dist/agent/ChatAgent');
const { AgentOrchestrator } = require('./dist/agent/AgentOrchestrator');
const chalk = require('chalk');

async function testMultiAgentSystem() {
  console.log(chalk.blue('🧪 开始测试多Agent系统...'));
  
  try {
    // 测试1: 初始化Agent团队
    console.log(chalk.yellow('\n📋 测试1: 初始化Agent团队'));
    const chatAgent = new ChatAgent();
    console.log(chalk.green('✅ ChatAgent初始化成功'));
    
    // 测试2: 检查Agent状态
    console.log(chalk.yellow('\n📋 测试2: 检查Agent状态'));
    const orchestrator = new AgentOrchestrator();
    const agentStatus = orchestrator.getAgentStatus();
    console.log(chalk.cyan('Agent状态:', JSON.stringify(agentStatus, null, 2)));
    console.log(chalk.green('✅ Agent状态检查通过'));
    
    // 测试3: 简单问题处理
    console.log(chalk.yellow('\n📋 测试3: 简单问题处理'));
    const simpleQuestion = '什么是人工智能？';
    console.log(chalk.gray(`问题: ${simpleQuestion}`));
    
    const response = await chatAgent.processMessage(simpleQuestion);
    console.log(chalk.gray('回答长度:', response.length, '字符'));
    console.log(chalk.green('✅ 简单问题处理成功'));
    
    // 测试4: 复杂问题处理
    console.log(chalk.yellow('\n📋 测试4: 复杂问题处理'));
    const complexQuestion = '如何学习机器学习？请给出详细的学习路径和实用建议。';
    console.log(chalk.gray(`问题: ${complexQuestion}`));
    
    const complexResponse = await chatAgent.processMessage(complexQuestion);
    console.log(chalk.gray('回答长度:', complexResponse.length, '字符'));
    console.log(chalk.green('✅ 复杂问题处理成功'));
    
    // 测试5: 命令处理
    console.log(chalk.yellow('\n📋 测试5: 命令处理'));
    const helpResponse = await chatAgent.handleCommand('help');
    console.log(chalk.gray('帮助信息长度:', helpResponse.length, '字符'));
    console.log(chalk.green('✅ 命令处理成功'));
    
    // 测试6: 统计信息
    console.log(chalk.yellow('\n📋 测试6: 统计信息'));
    console.log(chalk.cyan('会话ID:', chatAgent.getSessionId()));
    console.log(chalk.cyan('消息数量:', chatAgent.getMessageCount()));
    console.log(chalk.cyan('Token使用:', chatAgent.getTotalTokens()));
    console.log(chalk.green('✅ 统计信息获取成功'));
    
    console.log(chalk.green.bold('\n🎉 所有测试通过！多Agent系统运行正常'));
    
  } catch (error) {
    console.error(chalk.red('❌ 测试失败:'), error);
    
    if (error.message && error.message.includes('GOOGLE_API_KEY')) {
      console.log(chalk.yellow('\n💡 需要设置API密钥:'));
      console.log(chalk.yellow('1. 创建 .env 文件'));
      console.log(chalk.yellow('2. 添加: GOOGLE_API_KEY=your_api_key'));
      console.log(chalk.yellow('3. 重新运行测试'));
    }
    
    process.exit(1);
  }
}

// 运行测试
testMultiAgentSystem(); 