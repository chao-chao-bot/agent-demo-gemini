import { 
  AgentConfig, 
  TaskBreakdown, 
  CollaborationResult, 
  SubtaskResult,
  EnhancedCollaborationResult,
  CollaborationMode,
  AgentInteraction,
  AgentMessage,
  FinalSummary
} from '../types';
import { CommunicatingAgent } from './CommunicatingAgent';
import { CoordinatorAgent } from './CoordinatorAgent';
import { TaskDecomposer } from './TaskDecomposer';
import { AgentEnvironment } from '../communication/AgentEnvironment';

/**
 * 增强版Agent编排器 - 支持消息传递和真实通信的协作
 */
export class EnhancedAgentOrchestrator {
  private agents: Map<string, CommunicatingAgent> = new Map();
  private coordinatorAgent: CoordinatorAgent;
  private taskDecomposer: TaskDecomposer;
  private environment: AgentEnvironment;

  constructor() {
    // 初始化环境
    this.environment = new AgentEnvironment();
    
    // 初始化协调者
    this.coordinatorAgent = new CoordinatorAgent();
    
    // 初始化任务分解器
    this.taskDecomposer = new TaskDecomposer();
    
    // 初始化默认Agent
    this.initializeAgents();
    
    console.log('🚀 增强版Agent编排器初始化完成（支持消息通信）');
  }

  /**
   * 初始化默认的专家Agent
   */
  private initializeAgents(): void {
    const agentConfigs: AgentConfig[] = [
      {
        id: 'xiaozhi',
        name: '小智',
        version: '1.0.0',
        personality: '我是小智，一个充满求知欲的理论研究专家。我善于深入分析问题的本质，提供科学严谨的解释。',
        capabilities: ['深度分析', '理论研究', '科学解释', '逻辑推理', '知识整合'],
        specialization: '理论分析与科学研究',
        model: 'deepseek-chat',
        maxTokens: 1000,
        temperature: 0.3,
        agentType: 'specialist'
      },
      {
        id: 'xiaomei',
        name: '小梅',
        version: '1.0.0',
        personality: '我是小梅，一个实用主义的解决方案专家。我专注于提供可行的建议和具体的实施步骤。',
        capabilities: ['实用建议', '方案设计', '步骤规划', '问题解决', '执行指导'],
        specialization: '实用方案与具体实施',
        model: 'deepseek-chat',
        maxTokens: 1000,
        temperature: 0.7,
        agentType: 'specialist'
      }
    ];

    agentConfigs.forEach(config => {
      const agent = new CommunicatingAgent(config, this.environment);
      this.agents.set(config.id, agent);
      console.log(`👤 专家Agent已加载: ${config.name} (${config.specialization})`);
    });
  }

  /**
   * 处理用户问题 - 增强版协作流程
   */
  async processQuestion(
    userQuestion: string, 
    mode: CollaborationMode = CollaborationMode.REACTIVE
  ): Promise<EnhancedCollaborationResult> {
    console.log(`\n🎯 开始处理用户问题: ${userQuestion}`);
    console.log(`🤝 协作模式: ${mode}`);
    
    const startTime = Date.now();
    let interactions: AgentInteraction[] = [];

    try {
      // 1. 协调者分析
      console.log('\n🧠 协调者分析阶段...');
      const analysis = await this.coordinatorAgent.analyzeAndCoordinate(userQuestion);
      
      // 2. 任务分解（使用已有的分析结果）
      console.log('\n📋 任务分解阶段...');
      const taskBreakdown = await this.taskDecomposer.decomposeTask(userQuestion, [], analysis);
      
      // 3. 根据协作模式执行
      let subtaskResults: SubtaskResult[];
      let messageHistory: AgentMessage[] = [];

      switch (mode) {
        case CollaborationMode.REACTIVE:
          const reactiveResult = await this.executeReactiveCollaboration(taskBreakdown, userQuestion);
          subtaskResults = reactiveResult.subtaskResults;
          messageHistory = reactiveResult.messageHistory;
          interactions = reactiveResult.interactions;
          break;
        case CollaborationMode.PARALLEL:
          subtaskResults = await this.executeParallelCollaboration(taskBreakdown);
          break;
        case CollaborationMode.SEQUENTIAL:
        default:
          subtaskResults = await this.executeSequentialCollaboration(taskBreakdown);
          break;
      }

      // 4. 协调者总结
      console.log('\n📝 协调者总结阶段...');
      const summary = await this.coordinatorAgent.generateFinalSummary(
        userQuestion, 
        subtaskResults
      );

      // 5. 格式化最终回复
      const finalResponse = this.formatFinalResponse(summary, subtaskResults);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const totalTokens = subtaskResults.reduce((sum, result) => sum + result.tokens, 0);

      return {
        taskId: taskBreakdown.taskId,
        subtaskResults,
        finalResponse,
        participatingAgents: Array.from(this.agents.keys()),
        totalTokens,
        processingTime: totalTime,
        coordinatorSummary: summary.synthesizedConclusion,
        messageHistory,
        collaborationMode: mode,
        agentInteractions: interactions
      };

    } catch (error) {
      console.error('❌ 处理问题时发生错误:', error);
      throw error;
    }
  }

  /**
   * 执行反应式协作 - Agent间真实通信
   */
  private async executeReactiveCollaboration(
    taskBreakdown: TaskBreakdown, 
    userQuestion: string
  ): Promise<{
    subtaskResults: SubtaskResult[],
    messageHistory: AgentMessage[],
    interactions: AgentInteraction[]
  }> {
    console.log('🔄 开始反应式协作模式...');
    
    const subtaskResults: SubtaskResult[] = [];
    const interactions: AgentInteraction[] = [];
    const maxRounds = 3; // 最大轮次

    // 初始消息：向所有Agent广播任务
    const initialMessage = this.environment.createMessage(
      `用户问题: ${userQuestion}\n\n请根据你的专长提供分析和建议。如果需要其他专家的输入，可以直接与他们交流。`,
      'coordinator',
      Array.from(this.agents.keys()),
      'TaskAssignment'
    );
    this.environment.publishMessage(initialMessage);

    for (let round = 1; round <= maxRounds; round++) {
      console.log(`\n🔄 第${round}轮协作...`);
      
      let roundActive = false;
      
      // 让每个Agent观察和响应
      for (const [agentId, agent] of this.agents) {
        const startTime = Date.now();
        
        try {
          const newsCount = await agent.observe();
          
          if (newsCount > 0) {
            console.log(`💭 ${agent.getName()} 开始分析和响应...`);
            const response = await agent.react();
            
            // 记录交互
            const interaction: AgentInteraction = {
              from: agentId,
              to: Array.from(response.send_to).join(','),
              message: response,
              responseTime: Date.now() - startTime,
              success: true
            };
            interactions.push(interaction);
            
            // 发布响应
            agent.publishMessage(response);
            
            // 记录为子任务结果
            const subtaskResult: SubtaskResult = {
              subtaskId: `${agentId}-round${round}`,
              agentId,
              result: response.content,
              tokens: response.metadata.tokens || 0,
              processingTime: interaction.responseTime
            };
            subtaskResults.push(subtaskResult);
            
            roundActive = true;
          }
        } catch (error) {
          console.error(`❌ ${agent.getName()} 处理失败:`, error);
          
          const interaction: AgentInteraction = {
            from: agentId,
            to: 'error',
            message: {
              id: `error-${Date.now()}`,
              content: `处理失败: ${(error as Error).message || '未知错误'}`,
              role: 'assistant',
              cause_by: 'Error',
              sent_from: agentId,
              send_to: new Set(['coordinator']),
              metadata: { error: true },
              timestamp: Date.now()
            },
            responseTime: Date.now() - startTime,
            success: false
          };
          interactions.push(interaction);
        }
      }
      
      // 如果没有Agent活跃，结束协作
      if (!roundActive) {
        console.log('💤 所有Agent都已完成，结束协作');
        break;
      }
      
      // 短暂等待消息传递
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const messageHistory = this.environment.getMessageHistory();
    
    console.log(`✅ 反应式协作完成，共进行${Math.min(maxRounds, subtaskResults.length)}轮，生成${subtaskResults.length}个回复`);
    
    return { subtaskResults, messageHistory, interactions };
  }

  /**
   * 执行并行协作（传统模式）
   */
  private async executeParallelCollaboration(taskBreakdown: TaskBreakdown): Promise<SubtaskResult[]> {
    console.log('⚡ 开始并行协作模式...');
    
    const promises = taskBreakdown.subtasks.map(async (subtask) => {
      const agent = this.agents.get(subtask.assignedAgent);
      if (!agent) {
        throw new Error(`Agent ${subtask.assignedAgent} 不存在`);
      }

      const startTime = Date.now();
      console.log(`🔄 ${agent.getName()} 开始处理: ${subtask.description}`);
      
      try {
        const response = await agent.processTask(subtask.description);
        const endTime = Date.now();
        
        const result: SubtaskResult = {
          subtaskId: subtask.id,
          agentId: subtask.assignedAgent,
          result: response.content,
          tokens: response.usage?.totalTokens || 0,
          processingTime: endTime - startTime
        };
        
        console.log(`✅ ${agent.getName()} 完成任务`);
        return result;
        
      } catch (error) {
        console.error(`❌ ${agent.getName()} 处理失败:`, error);
        throw error;
      }
    });

    return Promise.all(promises);
  }

  /**
   * 执行顺序协作（传统模式）
   */
  private async executeSequentialCollaboration(taskBreakdown: TaskBreakdown): Promise<SubtaskResult[]> {
    console.log('📊 开始顺序协作模式...');
    
    const results: SubtaskResult[] = [];
    
    for (const subtask of taskBreakdown.subtasks) {
      const agent = this.agents.get(subtask.assignedAgent);
      if (!agent) {
        throw new Error(`Agent ${subtask.assignedAgent} 不存在`);
      }

      const startTime = Date.now();
      console.log(`🔄 ${agent.getName()} 开始处理: ${subtask.description}`);
      
      try {
        const response = await agent.processTask(subtask.description);
        const endTime = Date.now();
        
        const result: SubtaskResult = {
          subtaskId: subtask.id,
          agentId: subtask.assignedAgent,
          result: response.content,
          tokens: response.usage?.totalTokens || 0,
          processingTime: endTime - startTime
        };
        
        results.push(result);
        console.log(`✅ ${agent.getName()} 完成任务`);
        
      } catch (error) {
        console.error(`❌ ${agent.getName()} 处理失败:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * 格式化最终回复
   */
  private formatFinalResponse(summary: FinalSummary, subtaskResults: SubtaskResult[]): string {
    let response = ``;

    // 🌟 重点显示：协调者小华的综合总结
    response += `# 🤖 AI协调者小华的综合分析\n\n`;
    
    // 添加关键洞察（突出显示）
    if (summary.keyInsights && summary.keyInsights.length > 0) {
      response += `## ✨ 核心洞察\n\n`;
      summary.keyInsights.forEach((insight: string, index: number) => {
        response += `**${index + 1}.** ${insight}\n\n`;
      });
    }

    // 添加可行建议（突出显示）
    if (summary.actionableAdvice && summary.actionableAdvice.length > 0) {
      response += `## 🎯 实用建议\n\n`;
      summary.actionableAdvice.forEach((advice: string, index: number) => {
        response += `**${index + 1}.** ${advice}\n\n`;
      });
    }

    // 添加综合结论（最突出显示）
    if (summary.synthesizedConclusion) {
      response += `## 🏆 综合结论\n\n`;
      response += `> **${summary.synthesizedConclusion}**\n\n`;
    }

    // 添加建议步骤
    if (summary.nextSteps && summary.nextSteps.length > 0) {
      response += `## 🚀 建议步骤\n\n`;
      summary.nextSteps.forEach((step: string, index: number) => {
        response += `${index + 1}. ${step}\n`;
      });
      response += `\n`;
    }

    // 背景参考信息（弱化显示）
    response += `---\n\n### 📚 背景参考\n\n`;
    response += `#### 专家详细分析过程\n\n`;
    
    subtaskResults.forEach((result, index) => {
      const agent = this.agents.get(result.agentId);
      const agentName = agent ? agent.getName() : result.agentId;
      
      response += `**${agentName}的分析：**\n\n`;
      response += `${result.result}\n\n`;
    });

    // 协作信息
    response += this.buildSimplifiedCollaborationInfo(subtaskResults);

    return response;
  }

  /**
   * 构建简化的协作信息
   */
  private buildSimplifiedCollaborationInfo(results: SubtaskResult[]): string {
    if (results.length <= 1) {
      return '';
    }

    const participatingAgents = this.getParticipatingAgents(results);
    const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0);
    const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);

    return `---\n\n**🤝 AI团队协作信息**  \n参与成员：${participatingAgents.join('、')}、${this.coordinatorAgent.getName()}（协调者） | 处理时间：${totalTime}ms | Token使用：${totalTokens}个\n\n*这个回答由AI协调者小华统筹分析，${participatingAgents.join('、')}提供专业支持，最终整合形成的智能化解答。*`;
  }

  /**
   * 获取参与的Agent名称
   */
  private getParticipatingAgents(results: SubtaskResult[]): string[] {
    const agentIds = [...new Set(results.map(r => r.agentId))];
    return agentIds.map(id => {
      const agent = this.agents.get(id);
      return agent ? agent.getName() : id;
    });
  }

  /**
   * 获取环境状态
   */
  public getEnvironmentStatus() {
    return this.environment.getStatus();
  }

  /**
   * 获取Agent状态
   */
  public getAgentStatuses() {
    const statuses: any = {};
    for (const [id, agent] of this.agents) {
      statuses[id] = agent.getStatus();
    }
    return statuses;
  }

  /**
   * 清理环境
   */
  public cleanup(): void {
    this.environment.clear();
    for (const agent of this.agents.values()) {
      agent.cleanup();
    }
  }
} 