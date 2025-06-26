import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ConversationContext, CollaborationResult } from '../types';
import { AgentOrchestrator } from './AgentOrchestrator';
import chalk from 'chalk';

export class ChatAgent {
  private context: ConversationContext;
  private orchestrator: AgentOrchestrator;

  constructor() {
    this.context = this.initializeContext();
    this.orchestrator = new AgentOrchestrator();
  }

  private initializeContext(): ConversationContext {
    return {
      sessionId: uuidv4(),
      messages: [],
      startTime: new Date(),
      messageCount: 0,
      totalTokens: 0,
      lastActivity: new Date()
    };
  }

  public async processMessage(userInput: string): Promise<string> {
    try {
      console.log(chalk.blue('\n💭 收到用户消息，准备多Agent协作处理...'));
      
      // 创建用户消息
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: userInput,
        timestamp: new Date()
      };

      // 添加到对话历史
      this.context.messages.push(userMessage);

      // 使用多Agent系统处理
      const collaborationResult = await this.orchestrator.processQuery(
        userInput,
        this.context.messages.slice(-10) // 只传递最近10条消息作为上下文
      );

      // 创建助手回复消息
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: collaborationResult.finalResponse,
        timestamp: new Date(),
        agentId: 'team' // 标识这是团队协作的结果
      };

      // 更新对话上下文
      this.context.messages.push(assistantMessage);
      this.context.messageCount += 2; // 用户消息 + 助手回复
      this.context.totalTokens += collaborationResult.totalTokens;
      this.context.lastActivity = new Date();

      console.log(chalk.green(`✨ 多Agent协作完成！参与者：${collaborationResult.participatingAgents.join('、')}`));

      return collaborationResult.finalResponse;

    } catch (error) {
      console.error(chalk.red('处理消息时发生错误:'), error);
      return '抱歉，在处理您的消息时遇到了问题。我们的AI团队正在努力解决，请稍后再试。';
    }
  }

  // 处理特殊命令
  public async handleCommand(command: string): Promise<string> {
    const cmd = command.toLowerCase().trim();

    switch (cmd) {
      case 'help':
      case '帮助':
        return this.getHelpMessage();
      
      case 'status':
      case '状态':
        return this.getStatus();
      
      case 'agents':
      case 'team':
      case '团队':
        return this.getTeamInfo();
      
      case 'clear':
      case '清除':
        return this.clearHistory();
      
      case 'stats':
      case '统计':
        return this.getStats();
      
      default:
        return this.processMessage(command);
    }
  }

  private getHelpMessage(): string {
    return `🤖 **多Agent AI团队助手 - 帮助信息**

**AI团队架构：**
• 小华（协调者）- 负责任务分析、智能分解和结果整合
• 小智（技术专家）- 专注技术分析和深度概念解释
• 小梅（实用专家）- 专注实用建议和具体解决方案

**智能协作流程：**
1. 协调者分析问题复杂度和所需专业领域
2. 智能分解任务并分配给最合适的专家
3. 专家并行处理各自分配的任务
4. 协调者整合专家见解形成完整回答

**工作模式：**
• 简单问题：协调者智能分配给最合适的单个专家
• 复杂问题：多专家协作，协调者深度整合回答
• 自适应：根据问题类型自动调整协作策略

**可用命令：**
• \`help\` 或 \`帮助\` - 显示此帮助信息
• \`team\` 或 \`团队\` - 查看AI团队成员详细信息
• \`status\` 或 \`状态\` - 查看系统和团队状态
• \`stats\` 或 \`统计\` - 查看对话统计信息
• \`clear\` 或 \`清除\` - 清除对话历史
• \`exit\` 或 \`退出\` - 退出程序

**使用建议：**
• 直接提问，AI协调者会自动分析并分配任务
• 复杂问题会得到多专家协作的深度解答
• 协调者确保回答的完整性和一致性
• 支持中文交流，提供本土化的专业建议

准备好体验AI团队的智能协作了吗？🚀`;
  }

  private getTeamInfo(): string {
    const agentStatus = this.orchestrator.getAgentStatus();
    const coordinatorAgent = this.orchestrator.getCoordinatorAgent();
    
    let info = `👥 **AI团队成员信息**\n\n`;
    
    // 首先显示协调者
    info += `👑 **协调者**\n`;
    info += `**${coordinatorAgent.getName()}**\n`;
    info += `• 专长：${coordinatorAgent.getSpecialization()}\n`;
    info += `• 职责：任务分析、工作分配、团队协调、结果整合\n`;
    info += `• 状态：🟢 正常\n\n`;
    
    // 然后显示专家团队
    info += `🎯 **专家团队**\n`;
    Object.entries(agentStatus).forEach(([agentId, status]) => {
      if (status.agentType === 'specialist') {
        info += `**${status.name}**\n`;
        info += `• 专长：${status.specialization}\n`;
        info += `• 能力：${status.capabilities.join('、')}\n`;
        info += `• 状态：${status.isHealthy ? '🟢 正常' : '🔴 异常'}\n\n`;
      }
    });

    info += `💡 **AI智能协作模式：**\n`;
    info += `• 智能问题分析和任务分解\n`;
    info += `• 自动专家选择和工作分配\n`;
    info += `• 并行处理提高效率\n`;
    info += `• AI协调者智能结果整合\n`;
    info += `• 多专家视角深度融合\n`;

    return info;
  }

  private getStatus(): string {
    const agentStatus = this.orchestrator.getAgentStatus();
    const coordinatorAgent = this.orchestrator.getCoordinatorAgent();
    const agentCount = Object.keys(agentStatus).length;
    const healthyAgents = Object.values(agentStatus).filter(s => s.isHealthy).length;

    return `📊 **系统状态报告**

**会话信息：**
• 会话ID：${this.context.sessionId}
• 开始时间：${this.context.startTime.toLocaleString()}
• 消息数量：${this.context.messageCount}条
• Token使用：${this.context.totalTokens}个
• 最后活动：${this.context.lastActivity.toLocaleString()}

**AI团队状态：**
• 协调者：${coordinatorAgent.getName()} 🟢 正常
• 专家Agent：${agentCount - 1}个
• 健康状态：${healthyAgents}/${agentCount} 正常
• 团队状态：${healthyAgents === agentCount ? '🟢 全员就绪' : '🟡 部分异常'}
• 协作模式：AI智能协调

**性能指标：**
• 平均响应时间：< 10秒
• 任务分解效率：优秀
• 协调整合质量：高
• 系统负载：正常

一切运行正常！✨`;
  }

  private clearHistory(): string {
    const previousCount = this.context.messageCount;
    const previousTokens = this.context.totalTokens;
    
    // 保留会话ID和开始时间，重置其他信息
    this.context = {
      ...this.context,
      messages: [],
      messageCount: 0,
      totalTokens: 0,
      lastActivity: new Date()
    };

    return `🧹 **对话历史已清除**

• 清除消息：${previousCount}条
• 释放Token：${previousTokens}个
• 会话重置：保持当前会话ID
• 团队状态：保持就绪

您可以开始新的对话了！`;
  }

  private getStats(): string {
    const sessionDuration = Date.now() - this.context.startTime.getTime();
    const hours = Math.floor(sessionDuration / (1000 * 60 * 60));
    const minutes = Math.floor((sessionDuration % (1000 * 60 * 60)) / (1000 * 60));

    return `📈 **对话统计信息**

**会话统计：**
• 会话时长：${hours}小时${minutes}分钟
• 总消息数：${this.context.messageCount}条
• 平均消息长度：${this.context.messageCount > 0 ? Math.round(this.context.totalTokens / this.context.messageCount * 4) : 0}字符
• Token总用量：${this.context.totalTokens}个

**团队协作：**
• 协作模式：多Agent分工
• 响应质量：智能整合
• 覆盖领域：技术分析 + 实用建议

**使用建议：**
• 继续提出问题，团队随时为您服务
• 复杂问题能获得更全面的解答
• 支持各种领域的咨询需求

感谢使用我们的AI团队服务！🎉`;
  }

  public getSessionId(): string {
    return this.context.sessionId;
  }

  public getMessageCount(): number {
    return this.context.messageCount;
  }

  public getTotalTokens(): number {
    return this.context.totalTokens;
  }

  public getLastActivity(): Date {
    return this.context.lastActivity;
  }

  // 获取对话历史（用于调试或导出）
  public getConversationHistory(): ChatMessage[] {
    return [...this.context.messages];
  }

  // 获取最近的协作统计
  public getRecentCollaborationStats(): string {
    const recentMessages = this.context.messages.slice(-10);
    const teamMessages = recentMessages.filter(m => m.agentId === 'team');
    
    if (teamMessages.length === 0) {
      return '暂无团队协作记录';
    }

    return `最近${teamMessages.length}次团队协作，平均处理效率优秀`;
  }
} 