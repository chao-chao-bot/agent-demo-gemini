import { TaskBreakdown, Subtask, ChatMessage, CoordinationAnalysis } from '../types';
import { CoordinatorAgent } from './CoordinatorAgent';
import { v4 as uuidv4 } from 'uuid';

export class TaskDecomposer {
  private coordinatorAgent: CoordinatorAgent;
  
  constructor() {
    this.coordinatorAgent = new CoordinatorAgent();
  }

  /**
   * 分析用户问题并分解为子任务（使用AI协调者）
   */
  public async decomposeTask(
    userQuery: string, 
    conversationHistory: ChatMessage[] = [],
    existingAnalysis?: CoordinationAnalysis
  ): Promise<TaskBreakdown> {
    const taskId = uuidv4();
    
    try {
      let analysis: CoordinationAnalysis;
      
      if (existingAnalysis) {
        // 如果已有分析结果，直接使用
        console.log(`📋 使用已有的协调分析结果，复杂度：${existingAnalysis.complexity}`);
        analysis = existingAnalysis;
      } else {
        // 否则进行新的分析
        console.log(`🤔 协调者${this.coordinatorAgent.getName()}正在分析问题...`);
        analysis = await this.coordinatorAgent.analyzeAndCoordinate(userQuery, conversationHistory);
        console.log(`📋 ${this.coordinatorAgent.getName()}分析完成，复杂度：${analysis.complexity}`);
      }
      
      // 基于AI分析结果生成子任务
      const subtasks = this.generateSubtasksFromAnalysis(analysis);
      
      return {
        taskId,
        originalQuery: userQuery,
        subtasks,
        timestamp: new Date(),
        coordinatorAnalysis: this.formatAnalysis(analysis)
      };
      
    } catch (error) {
      console.error('AI协调分析失败，使用备用方案:', error);
      
      // 如果AI分析失败，使用备用的简单分析
      const subtasks = this.fallbackAnalysis(userQuery);
      
      return {
        taskId,
        originalQuery: userQuery,
        subtasks,
        timestamp: new Date(),
        coordinatorAnalysis: '使用备用分析方案处理'
      };
    }
  }

  /**
   * 基于AI分析结果生成子任务
   */
  private generateSubtasksFromAnalysis(analysis: CoordinationAnalysis): Subtask[] {
    const subtasks: Subtask[] = [];
    
    // 如果有AI协调者的详细任务分配，使用它
    if (analysis.taskAssignments && analysis.taskAssignments.length > 0) {
      analysis.taskAssignments.forEach((assignment, index) => {
        subtasks.push({
          id: uuidv4(),
          description: assignment.description,
          assignedAgent: assignment.assignedAgent,
          priority: index + 1,
          completed: false,
          reasoning: `🤖 AI协调者决策：${assignment.reasoning}`
        });
      });
      
      return subtasks;
    }
    
    // 如果AI分析没有提供详细分配，使用taskBreakdown进行智能分配
    if (analysis.taskBreakdown && analysis.taskBreakdown.length > 0) {
      analysis.taskBreakdown.forEach((taskDesc, index) => {
        const priority = index + 1;
        const assignedAgent = this.smartAgentSelection(taskDesc, analysis);
        
        subtasks.push({
          id: uuidv4(),
          description: taskDesc,
          assignedAgent,
          priority,
          completed: false,
          reasoning: `📊 智能分配：${this.getAssignmentReasoning(taskDesc, assignedAgent, analysis)}`
        });
      });
      
      return subtasks;
    }
    
    // 最后的fallback：使用默认的双专家协作
    if (analysis.complexity === 'simple') {
      const assignedAgent = this.selectBestAgentFromAnalysis(analysis);
      subtasks.push({
        id: uuidv4(),
        description: analysis.originalQuery,
        assignedAgent,
        priority: 1,
        completed: false,
        reasoning: `🎯 单专家处理：根据问题特点分配给${assignedAgent === 'xiaozhi' ? '小智' : '小梅'}`
      });
    } else {
      // 复杂问题的默认分解
      subtasks.push({
        id: uuidv4(),
        description: `深度分析问题的核心要点和技术层面：${analysis.originalQuery}`,
        assignedAgent: 'xiaozhi',
        priority: 1,
        completed: false,
        reasoning: '🔬 小智负责：技术分析和理论深度挖掘'
      });
      
      subtasks.push({
        id: uuidv4(),
        description: `提供实用建议和具体解决方案：${analysis.originalQuery}`,
        assignedAgent: 'xiaomei',
        priority: 2,
        completed: false,
        reasoning: '💡 小梅负责：实用建议和具体解决方案'
      });
    }
    
    return subtasks;
  }

  /**
   * 智能Agent选择（基于任务描述和AI分析）
   */
  private smartAgentSelection(taskDescription: string, analysis: CoordinationAnalysis): string {
    const lowerTask = taskDescription.toLowerCase();
    
    // 强技术指向词汇
    const strongTechKeywords = ['原理', '机制', '理论', '科学', '分析', '概念', '技术', '算法', '系统'];
    // 强实用指向词汇
    const strongPracticalKeywords = ['如何', '建议', '方法', '步骤', '实用', '具体', '操作', '指导', '方案'];
    
    const techScore = strongTechKeywords.reduce((score, keyword) => 
      score + (lowerTask.includes(keyword) ? 2 : 0), 0
    );
    
    const practicalScore = strongPracticalKeywords.reduce((score, keyword) => 
      score + (lowerTask.includes(keyword) ? 2 : 0), 0
    );
    
    // 如果分数差距明显，选择对应专家
    if (techScore > practicalScore + 1) {
      return 'xiaozhi';
    } else if (practicalScore > techScore + 1) {
      return 'xiaomei';
    }
    
    // 分数接近时，根据分析结果的专业领域需求决定
    if (analysis.requiredSpecializations.includes('技术分析') && !analysis.requiredSpecializations.includes('实用建议')) {
      return 'xiaozhi';
    } else if (analysis.requiredSpecializations.includes('实用建议') && !analysis.requiredSpecializations.includes('技术分析')) {
      return 'xiaomei';
    }
    
    // 最后根据任务在分解中的位置决定
    return 'xiaozhi'; // 默认偏向技术分析
  }

  /**
   * 根据AI分析选择最佳单个专家
   */
  private selectBestAgentFromAnalysis(analysis: CoordinationAnalysis): string {
    // 优先使用AI分析的专业领域需求
    if (analysis.requiredSpecializations.includes('技术分析') && !analysis.requiredSpecializations.includes('实用建议')) {
      return 'xiaozhi';
    } else if (analysis.requiredSpecializations.includes('实用建议') && !analysis.requiredSpecializations.includes('技术分析')) {
      return 'xiaomei';
    }
    
    // 如果都需要或都不明确，根据问题内容判断
    return this.selectBestAgent(analysis.requiredSpecializations);
  }

  /**
   * 生成分配理由说明
   */
  private getAssignmentReasoning(taskDescription: string, assignedAgent: string, analysis: CoordinationAnalysis): string {
    const agentName = assignedAgent === 'xiaozhi' ? '小智' : '小梅';
    const specialty = assignedAgent === 'xiaozhi' ? '技术分析和理论研究' : '实用建议和解决方案';
    
    return `分配给${agentName}，专长${specialty}，匹配任务特点`;
  }

  /**
   * 根据需要的专业能力选择最佳Agent
   */
  private selectBestAgent(requiredSpecializations: string[]): string {
    if (requiredSpecializations.includes('技术分析') && !requiredSpecializations.includes('实用建议')) {
      return 'xiaozhi';
    } else if (requiredSpecializations.includes('实用建议') && !requiredSpecializations.includes('技术分析')) {
      return 'xiaomei';
    } else {
      // 如果需要多种专业能力或不确定，默认选择小智
      return 'xiaozhi';
    }
  }

  /**
   * 格式化AI分析结果
   */
  private formatAnalysis(analysis: CoordinationAnalysis): string {
    return `${this.coordinatorAgent.getName()}的智能分析：
• 问题复杂度：${analysis.complexity}
• 所需专业领域：${analysis.requiredSpecializations.join('、')}
• 建议处理方式：${analysis.suggestedApproach}
• 分配理由：${analysis.reasoning}`;
  }

  /**
   * 备用分析方案（当AI分析失败时使用）
   */
  private fallbackAnalysis(userQuery: string): Subtask[] {
    const subtasks: Subtask[] = [];
    
    // 使用原有的简单逻辑作为备用方案
    if (this.isComplexQuery(userQuery.toLowerCase())) {
      subtasks.push({
        id: uuidv4(),
        description: `分析问题的核心要点和关键概念：${userQuery}`,
        assignedAgent: 'xiaozhi',
        priority: 1,
        completed: false,
        reasoning: '基于关键词分析，由小智负责技术分析'
      });
      
      subtasks.push({
        id: uuidv4(),
        description: `提供详细解答和实用建议：${userQuery}`,
        assignedAgent: 'xiaomei',
        priority: 2,
        completed: false,
        reasoning: '基于关键词分析，由小梅负责实用建议'
      });
    } else {
      const assignedAgent = this.selectAgentForSimpleTask(userQuery.toLowerCase());
      subtasks.push({
        id: uuidv4(),
        description: userQuery,
        assignedAgent,
        priority: 1,
        completed: false,
        reasoning: '基于关键词分析的简单问题分配'
      });
    }
    
    return subtasks;
  }

  /**
   * 判断是否为复杂问题（备用方法）
   */
  private isComplexQuery(query: string): boolean {
    const complexIndicators = [
      '比较', '对比', '区别', '优缺点', '分析', '评价', '怎么办', '如何', 
      '什么是', '为什么', '原因', '影响', '意义', '方法', '步骤', '流程',
      '解决', '问题', '建议', '推荐', '选择', '如何选择'
    ];
    
    const hasMultipleConcepts = query.split(/[，。；？！,;?!]/).length > 1;
    const hasComplexIndicators = complexIndicators.some(indicator => 
      query.includes(indicator)
    );
    const isLongQuery = query.length > 20;
    
    return hasMultipleConcepts || hasComplexIndicators || isLongQuery;
  }

  /**
   * 为简单任务选择合适的agent（备用方法）
   */
  private selectAgentForSimpleTask(query: string): string {
    const xiaozhiKeywords = [
      '技术', '原理', '概念', '定义', '理论', '科学', '工程', '算法',
      '数据', '编程', '代码', '系统', '架构', '设计', '分析'
    ];
    
    const xiaomeiKeywords = [
      '建议', '推荐', '选择', '使用', '操作', '生活', '健康', '情感',
      '人际', '工作', '学习', '习惯', '技巧', '方法', '实践'
    ];
    
    const xiaozhiScore = xiaozhiKeywords.reduce((score, keyword) => 
      score + (query.includes(keyword) ? 1 : 0), 0
    );
    
    const xiaomeiScore = xiaomeiKeywords.reduce((score, keyword) => 
      score + (query.includes(keyword) ? 1 : 0), 0
    );
    
    if (xiaozhiScore === xiaomeiScore) {
      return Math.random() > 0.5 ? 'xiaozhi' : 'xiaomei';
    }
    
    return xiaozhiScore > xiaomeiScore ? 'xiaozhi' : 'xiaomei';
  }

  /**
   * 验证任务分解结果
   */
  public validateTaskBreakdown(breakdown: TaskBreakdown): boolean {
    if (!breakdown.taskId || !breakdown.originalQuery || !breakdown.subtasks) {
      return false;
    }
    
    if (breakdown.subtasks.length === 0) {
      return false;
    }
    
    return breakdown.subtasks.every(subtask => 
      subtask.id && 
      subtask.description && 
      subtask.assignedAgent && 
      subtask.priority > 0
    );
  }

  /**
   * 获取协调者Agent实例（用于外部访问）
   */
  public getCoordinatorAgent(): CoordinatorAgent {
    return this.coordinatorAgent;
  }
} 