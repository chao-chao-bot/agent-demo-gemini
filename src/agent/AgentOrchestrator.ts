import { TaskBreakdown, Subtask, SubtaskResult, CollaborationResult, ChatMessage, AgentConfig } from '../types';
import { TaskDecomposer } from './TaskDecomposer';
import { IndividualAgent } from './IndividualAgent';
import { ResponseSynthesizer } from './ResponseSynthesizer';
import { CoordinatorAgent } from './CoordinatorAgent';
import { v4 as uuidv4 } from 'uuid';

export class AgentOrchestrator {
  private taskDecomposer: TaskDecomposer;
  private responseSynthesizer: ResponseSynthesizer;
  private agents: Map<string, IndividualAgent>;
  private coordinatorAgent: CoordinatorAgent;

  constructor() {
    this.taskDecomposer = new TaskDecomposer();
    this.responseSynthesizer = new ResponseSynthesizer();
    this.agents = new Map();
    this.coordinatorAgent = this.taskDecomposer.getCoordinatorAgent(); // 获取协调者实例
    this.initializeAgents();
  }

  /**
   * 初始化Agent团队
   */
  private initializeAgents(): void {
    // 小智：技术分析专家
    const xiaozhiConfig: AgentConfig = {
      id: 'xiaozhi',
      name: '小智',
      version: '1.0.0',
      personality: '我是小智，一个专注于技术分析和深度思考的AI助手。我擅长分析复杂问题的核心要点，提供理论基础和技术见解。',
      capabilities: ['技术分析', '概念解释', '理论研究', '问题分解', '逻辑推理'],
      specialization: '技术分析和理论研究',
      model: 'gemini-1.5-flash-latest',
      maxTokens: 1500,
      temperature: 0.3, // 更低温度，更准确的分析
      agentType: 'specialist'
    };

    // 小梅：实用建议专家
    const xiaomeiConfig: AgentConfig = {
      id: 'xiaomei',
      name: '小梅',
      version: '1.0.0',
      personality: '我是小梅，一个注重实用性和用户体验的AI助手。我擅长提供具体可行的建议和解决方案，关注实际应用价值。',
      capabilities: ['实用建议', '解决方案', '用户指导', '经验分享', '情感支持'],
      specialization: '实用建议和解决方案',
      model: 'gemini-1.5-flash-latest',
      maxTokens: 1500,
      temperature: 0.7, // 更高温度，更有创意的建议
      agentType: 'specialist'
    };

    this.agents.set('xiaozhi', new IndividualAgent(xiaozhiConfig));
    this.agents.set('xiaomei', new IndividualAgent(xiaomeiConfig));
  }

  /**
   * 处理用户查询的主要入口点（增强版，支持AI协调）
   */
  public async processQuery(
    userQuery: string, 
    conversationHistory: ChatMessage[] = []
  ): Promise<CollaborationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`\n🔄 开始处理问题: "${userQuery}"`);
      
      // 1. 使用AI协调者进行智能任务分解
      const taskBreakdown = await this.taskDecomposer.decomposeTask(userQuery, conversationHistory);
      console.log(`📋 任务分解完成，共${taskBreakdown.subtasks.length}个子任务`);
      
      // 显示协调者的分析结果
      if (taskBreakdown.coordinatorAnalysis) {
        console.log(`🧠 ${taskBreakdown.coordinatorAnalysis}`);
      }
      
      // 2. 执行子任务
      const subtaskResults: SubtaskResult[] = [];
      
      for (const subtask of taskBreakdown.subtasks) {
        console.log(`\n⚡ ${this.getAgentName(subtask.assignedAgent)}正在处理: ${subtask.description}`);
        if (subtask.reasoning) {
          console.log(`💭 分配理由: ${subtask.reasoning}`);
        }
        
        const result = await this.executeSubtask(subtask, conversationHistory);
        subtaskResults.push(result);
        
        // 标记子任务为完成
        subtask.completed = true;
        subtask.result = result.result;
        
        console.log(`✅ ${this.getAgentName(subtask.assignedAgent)}完成任务`);
      }
      
      // 3. 使用协调者生成最终总结
      console.log(`\n🤔 协调者${this.coordinatorAgent.getName()}正在整合结果...`);
      let finalResponse: string;
      let coordinatorSummary: string | undefined;
      
      try {
        const summary = await this.coordinatorAgent.generateFinalSummary(
          userQuery, 
          subtaskResults, 
          conversationHistory
        );
        
        finalResponse = this.formatFinalResponse(summary, subtaskResults);
        coordinatorSummary = this.formatCoordinatorSummary(summary);
        
        console.log(`✨ ${this.coordinatorAgent.getName()}完成最终总结`);
        
      } catch (error) {
        console.error('协调者总结失败，使用备用方案:', error);
        // 如果协调者总结失败，使用原有的合成器
        finalResponse = await this.responseSynthesizer.synthesizeResponse(
          taskBreakdown,
          subtaskResults,
          userQuery
        );
      }
      
      const processingTime = Date.now() - startTime;
      const totalTokens = subtaskResults.reduce((sum, result) => sum + result.tokens, 0);
      
      console.log(`🎉 AI团队协作完成！总用时${processingTime}ms，使用${totalTokens}个tokens`);
      
      return {
        taskId: taskBreakdown.taskId,
        subtaskResults,
        finalResponse,
        participatingAgents: this.getParticipatingAgents(subtaskResults),
        totalTokens,
        processingTime,
        coordinatorSummary
      };
      
    } catch (error) {
      console.error('多Agent协作处理失败:', error);
      throw error;
    }
  }

  /**
   * 格式化最终回复
   */
  private formatFinalResponse(summary: any, subtaskResults: SubtaskResult[]): string {
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

    // 添加后续步骤（如果有）
    if (summary.nextSteps && summary.nextSteps.length > 0) {
      response += `## 🚀 建议步骤\n\n`;
      summary.nextSteps.forEach((step: string, index: number) => {
        response += `**${index + 1}.** ${step}\n\n`;
      });
    }

    // 分隔线
    response += `---\n\n`;

    // 🔍 背景信息：专家详细回答（弱化显示，使用纯Markdown）
    response += `### 📚 专家分析过程（背景参考）\n\n`;
    response += `*以下是各专家的详细分析内容，作为上述总结的背景参考：*\n\n`;
    
    subtaskResults.forEach((result, index) => {
      const agentName = this.getAgentName(result.agentId);
      const agentRole = result.agentId === 'xiaozhi' ? '技术分析专家' : '实用建议专家';
      
      response += `#### 🔬 ${agentName}（${agentRole}）\n\n`;
      response += `${result.result}\n\n`;
      
      // 如果不是最后一个，添加分隔线
      if (index < subtaskResults.length - 1) {
        response += `---\n\n`;
      }
    });

    // 添加协作信息（简化版）
    response += `\n${this.buildSimplifiedCollaborationInfo(subtaskResults)}`;

    return response;
  }

  /**
   * 格式化协调者总结
   */
  private formatCoordinatorSummary(summary: any): string {
    return `协调者${this.coordinatorAgent.getName()}的总结：整合了${summary.keyInsights?.length || 0}个关键洞察和${summary.actionableAdvice?.length || 0}条可行建议`;
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

    return `---

**🤝 AI团队协作信息**  
参与成员：${participatingAgents.join('、')}、${this.coordinatorAgent.getName()}（协调者） | 处理时间：${totalTime}ms | Token使用：${totalTokens}个

*这个回答由AI协调者小华统筹分析，${participatingAgents.join('、')}提供专业支持，最终整合形成的智能化解答。*`;
  }

  /**
   * 获取参与的Agent名称列表
   */
  private getParticipatingAgents(results: SubtaskResult[]): string[] {
    return [...new Set(results.map(r => this.getAgentName(r.agentId)))];
  }

  /**
   * 执行单个子任务
   */
  private async executeSubtask(
    subtask: Subtask,
    conversationHistory: ChatMessage[]
  ): Promise<SubtaskResult> {
    const startTime = Date.now();
    
    const agent = this.agents.get(subtask.assignedAgent);
    if (!agent) {
      throw new Error(`找不到Agent: ${subtask.assignedAgent}`);
    }
    
    const response = await agent.processTask(subtask.description, conversationHistory);
    
    return {
      subtaskId: subtask.id,
      agentId: subtask.assignedAgent,
      result: response.content,
      tokens: response.usage.totalTokens,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * 获取Agent的友好名称
   */
  private getAgentName(agentId: string): string {
    if (agentId === 'coordinator') {
      return this.coordinatorAgent.getName();
    }
    
    const agent = this.agents.get(agentId);
    return agent ? agent.getName() : agentId;
  }

  /**
   * 获取所有Agent的状态信息（包括协调者）
   */
  public getAgentStatus(): { [agentId: string]: any } {
    const status: { [agentId: string]: any } = {};
    
    // 添加协调者状态
    status['coordinator'] = {
      name: this.coordinatorAgent.getName(),
      specialization: this.coordinatorAgent.getSpecialization(),
      capabilities: ['任务分析', '工作分配', '团队协调', '结果整合', '策略规划'],
      isHealthy: true,
      agentType: 'coordinator'
    };
    
    // 添加专家Agent状态
    this.agents.forEach((agent, agentId) => {
      status[agentId] = {
        name: agent.getName(),
        specialization: agent.getSpecialization(),
        capabilities: agent.getCapabilities(),
        isHealthy: true,
        agentType: 'specialist'
      };
    });
    
    return status;
  }

  /**
   * 添加新的Agent到团队
   */
  public addAgent(config: AgentConfig): void {
    if (config.agentType === 'coordinator') {
      console.log(`⚠️ 协调者已存在，无法添加新的协调者Agent`);
      return;
    }
    
    const agent = new IndividualAgent(config);
    this.agents.set(config.id, agent);
    console.log(`📎 新专家Agent加入团队: ${config.name} (${config.specialization})`);
  }

  /**
   * 移除Agent
   */
  public removeAgent(agentId: string): boolean {
    if (agentId === 'coordinator') {
      console.log(`⚠️ 无法移除协调者Agent`);
      return false;
    }
    
    const removed = this.agents.delete(agentId);
    if (removed) {
      console.log(`📤 Agent已移除: ${agentId}`);
    }
    return removed;
  }

  /**
   * 获取协调者Agent实例
   */
  public getCoordinatorAgent(): CoordinatorAgent {
    return this.coordinatorAgent;
  }
}