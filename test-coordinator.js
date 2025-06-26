const { ChatAgent } = require('./dist/agent/ChatAgent');
const { AgentOrchestrator } = require('./dist/agent/AgentOrchestrator');

async function testCoordinatorAgent() {
  console.log('🚀 测试AI协调者Agent功能\n');

  try {
    // 初始化系统
    const chatAgent = new ChatAgent();
    const orchestrator = new AgentOrchestrator();
    
    console.log('='.repeat(60));
    console.log('📊 团队信息');
    console.log('='.repeat(60));
    console.log(await chatAgent.handleCommand('team'));
    console.log('\n');

    console.log('='.repeat(60));
    console.log('🧪 测试案例1：简单技术问题');
    console.log('='.repeat(60));
    const question1 = "什么是JavaScript的闭包？";
    console.log(`问题：${question1}\n`);
    
    const result1 = await orchestrator.processQuery(question1);
    console.log('✅ 协作结果：');
    console.log(result1.finalResponse);
    console.log(`\n📈 统计：参与者 ${result1.participatingAgents.join('、')}，用时 ${result1.processingTime}ms，Token ${result1.totalTokens}个\n`);

    console.log('='.repeat(60));
    console.log('🧪 测试案例2：复杂综合问题');
    console.log('='.repeat(60));
    const question2 = "我想学习编程，应该选择什么语言？请分析不同语言的优缺点，并给出学习建议。";
    console.log(`问题：${question2}\n`);
    
    const result2 = await orchestrator.processQuery(question2);
    console.log('✅ 协作结果：');
    console.log(result2.finalResponse);
    console.log(`\n📈 统计：参与者 ${result2.participatingAgents.join('、')}，用时 ${result2.processingTime}ms，Token ${result2.totalTokens}个\n`);

    console.log('='.repeat(60));
    console.log('🧪 测试案例3：实用生活问题');
    console.log('='.repeat(60));
    const question3 = "如何保持健康的生活习惯？";
    console.log(`问题：${question3}\n`);
    
    const result3 = await orchestrator.processQuery(question3);
    console.log('✅ 协作结果：');
    console.log(result3.finalResponse);
    console.log(`\n📈 统计：参与者 ${result3.participatingAgents.join('、')}，用时 ${result3.processingTime}ms，Token ${result3.totalTokens}个\n`);

    console.log('='.repeat(60));
    console.log('📊 协调者功能验证');
    console.log('='.repeat(60));
    const coordinatorAgent = orchestrator.getCoordinatorAgent();
    console.log(`协调者名称：${coordinatorAgent.getName()}`);
    console.log(`专业领域：${coordinatorAgent.getSpecialization()}`);
    
    // 测试协调者分析功能
    console.log('\n🧠 协调者智能分析演示：');
    const analysis = await coordinatorAgent.analyzeAndCoordinate(
      "比较Python和Java的区别，并推荐适合的使用场景",
      []
    );
    console.log(`问题复杂度：${analysis.complexity}`);
    console.log(`所需专业领域：${analysis.requiredSpecializations.join('、')}`);
    console.log(`建议处理方式：${analysis.suggestedApproach}`);
    console.log(`分析理由：${analysis.reasoning}`);
    if (analysis.taskBreakdown.length > 0) {
      console.log('任务分解：');
      analysis.taskBreakdown.forEach((task, index) => {
        console.log(`  ${index + 1}. ${task}`);
      });
    }

    console.log('\n🎉 AI协调者Agent功能测试完成！');
    console.log('✨ 系统成功支持：');
    console.log('   - 智能问题分析和复杂度评估');
    console.log('   - 动态任务分解和专家分配');
    console.log('   - 多专家协作和结果整合');
    console.log('   - 协调者主导的团队管理');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('详细错误:', error.stack);
  }
}

// 运行测试
if (require.main === module) {
  testCoordinatorAgent().catch(console.error);
}

module.exports = { testCoordinatorAgent }; 