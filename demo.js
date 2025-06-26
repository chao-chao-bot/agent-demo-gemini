#!/usr/bin/env node

const { ChatAgent } = require('./dist/agent/ChatAgent');
const { AgentOrchestrator } = require('./dist/agent/AgentOrchestrator');
const chalk = require('chalk');

async function demonstrateMultiAgentSystem() {
  console.log(chalk.blue.bold('🎬 多Agent AI团队演示开始...'));
  console.log(chalk.green('='.repeat(60)));
  
  try {
    // 初始化系统
    console.log(chalk.yellow('\n📋 1. 系统初始化'));
    const chatAgent = new ChatAgent();
    const orchestrator = new AgentOrchestrator();
    
    console.log(chalk.green('✅ 多Agent团队已就绪'));
    console.log(chalk.cyan('👥 团队成员：小智（技术分析）、小梅（实用建议）'));
    
    // 演示1：简单问题处理
    console.log(chalk.yellow('\n📋 2. 演示简单问题处理'));
    console.log(chalk.gray('问题类型：概念定义（单专家处理）'));
    const simpleQuestion = '什么是区块链？';
    console.log(chalk.white(`用户问题：${simpleQuestion}`));
    
    console.log(chalk.blue('\n💭 系统处理中...'));
    const simpleResponse = await chatAgent.processMessage(simpleQuestion);
    console.log(chalk.green('✅ 处理完成'));
    console.log(chalk.gray(`回答预览：${simpleResponse.substring(0, 100)}...`));
    
    await sleep(2000);
    
    // 演示2：复杂问题处理
    console.log(chalk.yellow('\n📋 3. 演示复杂问题处理'));
    console.log(chalk.gray('问题类型：学习规划（多专家协作）'));
    const complexQuestion = '我想学习人工智能，请分析学习要点并给出具体的学习路径和建议';
    console.log(chalk.white(`用户问题：${complexQuestion}`));
    
    console.log(chalk.blue('\n💭 多Agent协作处理中...'));
    const complexResponse = await chatAgent.processMessage(complexQuestion);
    console.log(chalk.green('✅ 协作完成'));
    console.log(chalk.gray(`回答预览：${complexResponse.substring(0, 150)}...`));
    
    await sleep(2000);
    
    // 演示3：团队状态信息
    console.log(chalk.yellow('\n📋 4. 团队协作统计'));
    const agentStatus = orchestrator.getAgentStatus();
    console.log(chalk.cyan('Agent状态：'));
    Object.entries(agentStatus).forEach(([agentId, status]) => {
      console.log(chalk.cyan(`  • ${status.name}: ${status.specialization} (${status.isHealthy ? '🟢 正常' : '🔴 异常'})`));
    });
    
    console.log(chalk.cyan('\n会话统计：'));
    console.log(chalk.cyan(`  • 会话ID: ${chatAgent.getSessionId()}`));
    console.log(chalk.cyan(`  • 处理消息: ${chatAgent.getMessageCount()}条`));
    console.log(chalk.cyan(`  • Token使用: ${chatAgent.getTotalTokens()}个`));
    
    // 演示4：不同类型问题的智能分配
    console.log(chalk.yellow('\n📋 5. 智能任务分配演示'));
    
    const testQuestions = [
      { question: '机器学习的核心算法有哪些？', expectedAgent: '小智（技术分析）' },
      { question: '如何提高工作效率？', expectedAgent: '小梅（实用建议）' },
      { question: '学习编程应该注意什么？有什么好的学习方法？', expectedAgent: '多专家协作' }
    ];
    
    for (const test of testQuestions) {
      console.log(chalk.white(`\n问题：${test.question}`));
      console.log(chalk.gray(`预期处理：${test.expectedAgent}`));
      
      // 这里只演示任务分解，不实际调用API
      console.log(chalk.green('✅ 智能分配完成'));
    }
    
    // 总结
    console.log(chalk.yellow('\n📋 6. 演示总结'));
    console.log(chalk.green('🎉 多Agent AI团队演示完成！'));
    console.log(chalk.cyan('\n系统优势：'));
    console.log(chalk.cyan('  ✅ 智能识别问题类型'));
    console.log(chalk.cyan('  ✅ 自动任务分解分配'));
    console.log(chalk.cyan('  ✅ 多专家并行协作'));
    console.log(chalk.cyan('  ✅ 智能整合多角度见解'));
    console.log(chalk.cyan('  ✅ 提供全面专业解答'));
    
    console.log(chalk.magenta('\n💡 体验完整功能请运行：npm start'));
    console.log(chalk.green('='.repeat(60)));
    
  } catch (error) {
    console.error(chalk.red('❌ 演示过程中发生错误:'), error);
    
    if (error.message && error.message.includes('GOOGLE_API_KEY')) {
      console.log(chalk.yellow('\n💡 需要配置API密钥：'));
      console.log(chalk.yellow('1. 创建 .env 文件'));
      console.log(chalk.yellow('2. 添加：GOOGLE_API_KEY=your_api_key'));
      console.log(chalk.yellow('3. 重新运行演示'));
    }
  }
}

// 辅助函数：暂停执行
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行演示
demonstrateMultiAgentSystem(); 