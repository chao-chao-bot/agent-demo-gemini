const { AgentEnvironment } = require('./dist/communication/AgentEnvironment');
const { CommunicatingAgent } = require('./dist/agent/CommunicatingAgent');
const { MESSAGE_ROUTE_TO_ALL } = require('./dist/types');

async function testAgentCommunication() {
  console.log('🧪 开始测试Agent通信系统...\n');

  // 1. 创建环境
  const environment = new AgentEnvironment();
  console.log('✅ 创建Agent环境');

  // 2. 创建具有通信能力的Agent
  const xiaozhi = new CommunicatingAgent({
    id: 'xiaozhi',
    name: '小智',
    version: '1.0.0',
    personality: '我是小智，一个充满求知欲的理论研究专家。我善于深入分析问题的本质，提供科学严谨的解释。',
    capabilities: ['深度分析', '理论研究', '科学解释', '逻辑推理'],
    specialization: '理论分析与科学研究',
    model: 'deepseek-chat',
    maxTokens: 1000,
    temperature: 0.3
  }, environment);

  const xiaomei = new CommunicatingAgent({
    id: 'xiaomei',
    name: '小梅',
    version: '1.0.0',
    personality: '我是小梅，一个实用主义的解决方案专家。我专注于提供可行的建议和具体的实施步骤。',
    capabilities: ['实用建议', '方案设计', '步骤规划', '问题解决'],
    specialization: '实用方案与具体实施',
    model: 'deepseek-chat',
    maxTokens: 1000,
    temperature: 0.7
  }, environment);

  console.log('✅ 创建两个可通信的Agent');
  console.log(`📊 环境状态: ${JSON.stringify(environment.getStatus(), null, 2)}\n`);

  // 3. 测试直接通信
  console.log('🔄 测试1: 小智向小梅发送消息');
  await xiaozhi.sendMessage(
    '你好小梅！我刚刚研究了一个关于学习效率的理论，想和你讨论如何将这个理论转化为实际的学习方法。这个理论叫做"分布式练习效应"，指的是将学习内容分散到多个时间段比集中学习更有效。你觉得如何将这个理论应用到具体的学习计划中？',
    'xiaomei',
    'CollaborationRequest'
  );

  // 等待消息传递
  await new Promise(resolve => setTimeout(resolve, 100));

  // 4. 小梅观察并响应
  console.log('\n👁️ 小梅观察新消息...');
  const newsCount = await xiaomei.observe();
  console.log(`📨 小梅观察到 ${newsCount} 条新消息`);

  if (newsCount > 0) {
    console.log('\n🤔 小梅开始响应...');
    const response = await xiaomei.react();
    console.log(`✨ 小梅的回复: ${response.content.substring(0, 100)}...`);
    
    // 发布小梅的回复
    xiaomei.publishMessage(response);
  }

  // 等待消息传递
  await new Promise(resolve => setTimeout(resolve, 100));

  // 5. 小智观察小梅的回复
  console.log('\n👁️ 小智观察小梅的回复...');
  const xiaozhi_news = await xiaozhi.observe();
  console.log(`📨 小智观察到 ${xiaozhi_news} 条新消息`);

  if (xiaozhi_news > 0) {
    console.log('\n🤔 小智对小梅的建议进行深入分析...');
    const followUp = await xiaozhi.react();
    console.log(`✨ 小智的深入分析: ${followUp.content.substring(0, 100)}...`);
  }

  // 6. 测试广播通信
  console.log('\n\n🔄 测试2: 广播消息');
  await xiaozhi.broadcastMessage(
    '大家好！我想分享一个有趣的发现：根据认知负荷理论，我们的工作记忆容量有限，通常只能同时处理7±2个信息块。这对我们的协作方式有什么启示吗？',
    'KnowledgeSharing'
  );

  // 7. 查看对话历史
  console.log('\n📚 查看两个Agent之间的对话历史:');
  const conversation = xiaozhi.getConversationWith('xiaomei');
  conversation.forEach((msg, index) => {
    console.log(`${index + 1}. [${msg.sent_from}]: ${msg.content.substring(0, 80)}...`);
  });

  // 8. 显示最终状态
  console.log('\n📊 最终环境状态:');
  console.log(JSON.stringify(environment.getStatus(), null, 2));

  console.log('\n📊 Agent状态:');
  console.log('小智状态:', JSON.stringify(xiaozhi.getStatus(), null, 2));
  console.log('小梅状态:', JSON.stringify(xiaomei.getStatus(), null, 2));

  console.log('\n🎉 Agent通信测试完成！');
}

// 运行测试
testAgentCommunication().catch(console.error); 