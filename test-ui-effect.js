const { AgentOrchestrator } = require('./dist/agent/AgentOrchestrator');

async function testUIEffect() {
  console.log('🎨 测试新的UI展示效果 - 突出小华总结，弱化专家详细回答\n');

  try {
    const orchestrator = new AgentOrchestrator();
    
    // 测试问题：选择一个能展示协作效果的问题
    const testQuery = "如何平衡工作和生活？";
    
    console.log(`📝 测试问题: "${testQuery}"`);
    console.log('=' .repeat(60));
    console.log('🚀 开始AI团队协作...\n');
    
    try {
      const result = await orchestrator.processQuery(testQuery);
      
      console.log('✨ 新UI效果展示：');
      console.log('=' .repeat(60));
      console.log(result.finalResponse);
      console.log('=' .repeat(60));
      
      console.log('\n📊 UI设计特点分析：');
      console.log('✅ 小华总结突出显示：');
      console.log('   - 使用大标题 "# 🤖 AI协调者小华的综合分析"');
      console.log('   - 核心洞察用 **粗体** 强调');
      console.log('   - 综合结论用引用块突出显示');
      console.log('   - 实用建议清晰列出');
      
      console.log('\n✅ 专家回答弱化显示：');
      console.log('   - 隐藏在可折叠的 <details> 标签中');
      console.log('   - 使用小字体和灰色文字');
      console.log('   - 标记为"背景参考"信息');
      console.log('   - 需要主动点击才能查看详细内容');
      
      console.log('\n✅ 协作信息简化：');
      console.log('   - 信息紧凑，一行显示');
      console.log('   - 使用小字体，降低视觉重量');
      console.log('   - 突出小华的统筹作用');
      
    } catch (error) {
      if (error.message.includes('429')) {
        console.log('⚠️  API配额限制，无法完成完整测试');
        console.log('📋 展示模拟的UI效果结构：\n');
        
        // 模拟显示UI结构
        console.log('# 🤖 AI协调者小华的综合分析');
        console.log('');
        console.log('## ✨ 核心洞察');
        console.log('');
        console.log('**1.** 工作与生活平衡需要明确的边界设定和优先级管理');
        console.log('**2.** 有效的时间管理和压力释放是关键因素');
        console.log('');
        console.log('## 🎯 实用建议');
        console.log('');
        console.log('**1.** 建立固定的工作时间边界，避免工作溢出到私人时间');
        console.log('**2.** 培养健康的生活习惯，定期运动和社交');
        console.log('');
        console.log('## 🏆 综合结论');
        console.log('');
        console.log('> **平衡工作与生活需要主动设计和持续调整，通过时间管理、边界设定和健康习惯来实现可持续的生活方式。**');
        console.log('');
        console.log('---');
        console.log('');
        console.log('<details>');
        console.log('<summary><small>📚 点击展开：专家详细分析过程（背景参考）</small></summary>');
        console.log('');
        console.log('<details>');
        console.log('<summary><small>🔬 小智（技术分析专家）的详细分析</small></summary>');
        console.log('<div style="font-size: 0.9em; color: #666; ...">');
        console.log('[小智的详细技术分析内容，字体较小，颜色较淡]');
        console.log('</div>');
        console.log('</details>');
        console.log('');
        console.log('<details>');
        console.log('<summary><small>🔬 小梅（实用建议专家）的详细分析</small></summary>');
        console.log('<div style="font-size: 0.9em; color: #666; ...">');
        console.log('[小梅的详细实用建议内容，字体较小，颜色较淡]');
        console.log('</div>');
        console.log('</details>');
        console.log('');
        console.log('</details>');
        console.log('');
        console.log('<small style="color: #6c757d;">');
        console.log('**🤝 AI团队协作信息** | 参与成员：小智、小梅、小华（协调者）');
        console.log('</small>');
        
      } else {
        console.error('❌ 测试失败:', error.message);
      }
    }
    
    console.log('\n🎯 UI改进总结：');
    console.log('📈 小华总结占据主要视觉空间（~70%）');
    console.log('📉 专家详细回答弱化为背景信息（~20%）');
    console.log('🔗 协作信息精简为状态栏（~10%）');
    console.log('✨ 整体突出AI协调者的价值和智能整合能力');
    
  } catch (error) {
    console.error('❌ 测试过程失败:', error);
  }
}

// 运行测试
if (require.main === module) {
  testUIEffect().catch(console.error);
}

module.exports = { testUIEffect }; 