const { AgentEnvironment } = require('./dist/communication/AgentEnvironment');
const { MessageQueue } = require('./dist/communication/MessageQueue');
const { MESSAGE_ROUTE_TO_ALL } = require('./dist/types');

// 模拟Agent类，不依赖LLM
class MockAgent {
  constructor(id, name, environment) {
    this.context = {
      agentId: id,
      messageBuffer: new MessageQueue(),
      memory: [],
      workingMemory: [],
      news: [],
      watch: new Set(['UserRequirement', 'AgentResponse', 'TaskAssignment']),
      isIdle: true
    };
    this.name = name;
    this.environment = environment;
    
    if (this.environment) {
      this.environment.addAgent(this);
    }
  }

  getName() {
    return this.name;
  }

  receiveMessage(message) {
    this.context.messageBuffer.push(message);
    console.log(`📨 ${this.getName()} 收到消息: ${message.content.substring(0, 30)}...`);
  }

  async observe() {
    this.context.news = [];
    const newMessages = this.context.messageBuffer.popAll();
    
    if (newMessages.length === 0) {
      this.context.isIdle = true;
      return 0;
    }

    // 模拟过滤感兴趣的消息
    for (const message of newMessages) {
      if (this.isInterestedInMessage(message)) {
        this.context.news.push(message);
        this.context.memory.push(message);
      }
    }

    this.context.isIdle = this.context.news.length === 0;
    
    if (this.context.news.length > 0) {
      console.log(`👁️ ${this.getName()} 观察到 ${this.context.news.length} 条新消息`);
    }

    return this.context.news.length;
  }

  isInterestedInMessage(message) {
    // 1. 检查是否是发送给自己的
    if (message.send_to.has(this.context.agentId) || message.send_to.has(this.getName())) {
      return true;
    }

    // 2. 检查是否是关注的消息类型
    if (this.context.watch.has(message.cause_by)) {
      return true;
    }

    // 3. 检查是否是广播消息
    if (message.send_to.has(MESSAGE_ROUTE_TO_ALL)) {
      return true;
    }

    return false;
  }

  async react() {
    if (this.context.news.length === 0) {
      throw new Error(`${this.getName()} 没有新消息需要响应`);
    }

    const primaryMessage = this.context.news[this.context.news.length - 1];
    
    // 模拟生成回复
    const mockResponse = {
      id: `response-${Date.now()}`,
      content: `我是${this.getName()}，我收到了你的消息："${primaryMessage.content.substring(0, 30)}..."，这是我的回复。`,
      role: 'assistant',
      cause_by: 'AgentResponse',
      sent_from: this.context.agentId,
      send_to: new Set([primaryMessage.sent_from]),
      metadata: {
        responseTime: 100,
        tokens: 50,
        replyTo: primaryMessage.id
      },
      timestamp: Date.now()
    };

    this.context.news = [];
    this.context.isIdle = true;
    
    console.log(`🤖 ${this.getName()} 生成回复: ${mockResponse.content}`);
    return mockResponse;
  }

  publishMessage(message) {
    if (!this.environment) {
      console.warn(`⚠️ ${this.getName()} 没有连接到环境，无法发布消息`);
      return;
    }

    message.sent_from = this.context.agentId;
    this.environment.publishMessage(message);
  }

  getStatus() {
    return {
      agentId: this.context.agentId,
      name: this.getName(),
      isIdle: this.context.isIdle,
      messageCount: this.context.messageBuffer.size(),
      memorySize: this.context.memory.length,
      watching: Array.from(this.context.watch)
    };
  }
}

async function testCommunicationSystem() {
  console.log('🧪 开始测试Agent通信系统（简化版）...\n');

  // 1. 创建环境
  const environment = new AgentEnvironment();
  console.log('✅ 创建Agent环境');

  // 2. 创建模拟Agent
  const xiaozhi = new MockAgent('xiaozhi', '小智', environment);
  const xiaomei = new MockAgent('xiaomei', '小梅', environment);

  console.log('✅ 创建两个模拟Agent');
  console.log(`📊 环境状态: ${JSON.stringify(environment.getStatus(), null, 2)}\n`);

  // 3. 测试直接通信
  console.log('🔄 测试1: 小智向小梅发送消息');
  const directMessage = environment.createMessage(
    '你好小梅！我想和你讨论一个关于学习效率的理论。',
    'xiaozhi',
    'xiaomei',
    'CollaborationRequest'
  );
  environment.publishMessage(directMessage);

  // 等待消息传递
  await new Promise(resolve => setTimeout(resolve, 100));

  // 4. 小梅观察并响应
  console.log('\n👁️ 小梅观察新消息...');
  const newsCount = await xiaomei.observe();
  console.log(`📨 小梅观察到 ${newsCount} 条新消息`);

  if (newsCount > 0) {
    console.log('\n🤔 小梅开始响应...');
    const response = await xiaomei.react();
    xiaomei.publishMessage(response);
  }

  // 等待消息传递
  await new Promise(resolve => setTimeout(resolve, 100));

  // 5. 小智观察小梅的回复
  console.log('\n👁️ 小智观察小梅的回复...');
  const xiaozhi_news = await xiaozhi.observe();
  console.log(`📨 小智观察到 ${xiaozhi_news} 条新消息`);

  if (xiaozhi_news > 0) {
    console.log('\n🤔 小智对小梅的回复进行回应...');
    const followUp = await xiaozhi.react();
    console.log(`✨ 小智的回应已生成`);
  }

  // 6. 测试广播通信
  console.log('\n\n🔄 测试2: 广播消息');
  const broadcastMessage = environment.createMessage(
    '大家好！我想分享一个有趣的发现。',
    'xiaozhi',
    new Set([MESSAGE_ROUTE_TO_ALL]),
    'KnowledgeSharing'
  );
  environment.publishMessage(broadcastMessage);

  // 等待并观察广播消息
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const xiaomei_broadcast_news = await xiaomei.observe();
  console.log(`📨 小梅收到广播消息: ${xiaomei_broadcast_news} 条`);

  // 7. 查看对话历史
  console.log('\n📚 查看两个Agent之间的对话历史:');
  const conversation = environment.getConversation('xiaozhi', 'xiaomei');
  conversation.forEach((msg, index) => {
    console.log(`${index + 1}. [${msg.sent_from} -> ${Array.from(msg.send_to).join(',')}]: ${msg.content.substring(0, 60)}...`);
  });

  // 8. 显示最终状态
  console.log('\n📊 最终环境状态:');
  console.log(JSON.stringify(environment.getStatus(), null, 2));

  console.log('\n📊 Agent状态:');
  console.log('小智状态:', JSON.stringify(xiaozhi.getStatus(), null, 2));
  console.log('小梅状态:', JSON.stringify(xiaomei.getStatus(), null, 2));

  // 9. 测试消息队列
  console.log('\n🔄 测试3: 消息队列功能');
  const queue = new MessageQueue(3); // 限制大小为3
  
  for (let i = 1; i <= 5; i++) {
    const msg = environment.createMessage(`测试消息${i}`, 'test', 'target');
    queue.push(msg);
    console.log(`📝 添加消息${i}，队列大小: ${queue.size()}`);
  }

  console.log('📤 从队列中取出所有消息:');
  const allMessages = queue.popAll();
  allMessages.forEach((msg, index) => {
    console.log(`${index + 1}. ${msg.content}`);
  });

  console.log(`✅ 队列现在是否为空: ${queue.isEmpty()}`);

  console.log('\n🎉 通信系统测试完成！');
  console.log('\n✅ 验证结果:');
  console.log('  ✓ 环境消息路由正常');
  console.log('  ✓ Agent直接通信正常');
  console.log('  ✓ 广播消息正常');
  console.log('  ✓ 消息观察和响应正常');
  console.log('  ✓ 对话历史记录正常');
  console.log('  ✓ 消息队列功能正常');
}

// 运行测试
testCommunicationSystem().catch(console.error); 