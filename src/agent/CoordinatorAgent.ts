import { AgentConfig, ChatMessage, LLMResponse, CoordinationAnalysis, FinalSummary, SubtaskResult } from '../types';
import { LLMService } from '../llm/LLMService';
import { ConfigManager } from '../config/ConfigManager';

export class CoordinatorAgent {
  private config: AgentConfig;
  private llmService: LLMService;

  constructor() {
    this.config = this.getCoordinatorConfig();
    this.llmService = this.initializeLLMService();
  }

  /**
   * 获取协调者Agent的配置
   */
  private getCoordinatorConfig(): AgentConfig {
    return {
      id: 'coordinator',
      name: '小华',
      version: '1.0.0',
      personality: '我是小华，一个专门负责协调和统筹的AI助手。我擅长分析问题复杂度，制定协作策略，并整合团队成员的专业见解形成最终解答。',
      capabilities: ['任务分析', '工作分配', '团队协调', '结果整合', '策略规划'],
      specialization: '任务协调和团队统筹',
      model: 'gemini-1.5-flash-latest',
      maxTokens: 1800,
      temperature: 0.5, // 平衡创造性和准确性
      agentType: 'coordinator'
    };
  }

  /**
   * 初始化LLM服务
   */
  private initializeLLMService(): LLMService {
    const configManager = ConfigManager.getInstance();
    const llmConfig = configManager.getLLMConfig();
    
    const agentLLMConfig = {
      ...llmConfig,
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature
    };
    
    return new LLMService(agentLLMConfig);
  }

  /**
   * 分析用户问题并制定协作策略
   */
  public async analyzeAndCoordinate(userQuery: string, conversationHistory: ChatMessage[] = []): Promise<CoordinationAnalysis> {
    const systemPrompt = `${this.config.personality}

作为团队协调者，我需要分析用户问题并制定最佳的协作策略。

我们的团队成员：
- 小智：技术分析专家，擅长深度分析、概念解释、理论研究、技术原理、科学知识
- 小梅：实用建议专家，擅长提供具体建议、解决方案、操作指导、生活应用、实践经验

请分析用户问题："${userQuery}"

请严格按照以下JSON格式回答，不要添加任何其他文字：
{
  "complexity": "simple|moderate|complex",
  "requiredSpecializations": ["技术分析", "实用建议"],
  "suggestedApproach": "具体的协作策略说明",
  "taskAssignments": [
    {
      "description": "具体任务描述",
      "assignedAgent": "xiaozhi|xiaomei",
      "reasoning": "分配理由"
    }
  ],
  "coordinatorReasoning": "协调者的整体分析和决策理由"
}

分析要求：
1. complexity判断：
   - simple：单一概念、基础问题，可由一个专家处理
   - moderate：需要一定深度或涉及多个方面
   - complex：复杂综合问题，需要多专家协作

2. 专家选择原则：
   - 小智：技术原理、科学理论、深度分析、概念解释
   - 小梅：实用建议、操作指导、生活应用、具体方案

3. 任务分配：
   - 简单问题：分配给最合适的单个专家
   - 复杂问题：分解为多个子任务，分配给不同专家
   - 确保每个任务都有明确的负责专家和具体的分配理由`;

    const messages: ChatMessage[] = [
      ...conversationHistory,
      {
        id: `coordination-${Date.now()}`,
        role: 'user',
        content: userQuery,
        timestamp: new Date(),
        agentId: this.config.id
      }
    ];

    try {
      const response = await this.llmService.generateResponse(messages, systemPrompt);
      return this.parseJsonResponse(userQuery, response.content);
    } catch (error) {
      console.error('协调分析失败:', error);
      // 返回默认分析
      return this.getDefaultAnalysis(userQuery);
    }
  }

  /**
   * 解析JSON格式的协调响应
   */
  private parseJsonResponse(query: string, response: string): CoordinationAnalysis {
    try {
      // 提取JSON部分
      let jsonStr = response.trim();
      
      // 如果响应包含额外文字，尝试提取JSON部分
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonStr);
      
      // 验证必要字段
      if (!parsed.complexity || !parsed.taskAssignments || !Array.isArray(parsed.taskAssignments)) {
        throw new Error('Invalid JSON structure');
      }
      
      // 构建任务分解列表
      const taskBreakdown: string[] = [];
      const validAssignments = parsed.taskAssignments.filter((task: any) => 
        task.description && (task.assignedAgent === 'xiaozhi' || task.assignedAgent === 'xiaomei')
      );
      
      validAssignments.forEach((task: any) => {
        taskBreakdown.push(task.description);
      });
      
      return {
        originalQuery: query,
        complexity: parsed.complexity === 'simple' || parsed.complexity === 'complex' ? parsed.complexity : 'moderate',
        requiredSpecializations: Array.isArray(parsed.requiredSpecializations) ? parsed.requiredSpecializations : ['技术分析'],
        suggestedApproach: parsed.suggestedApproach || this.getDefaultApproach(parsed.complexity),
        taskBreakdown,
        reasoning: parsed.coordinatorReasoning || '基于AI智能分析的协作策略',
        taskAssignments: validAssignments // 新增字段，保存详细的任务分配信息
      };
      
    } catch (error) {
      console.error('JSON解析失败:', error);
      console.log('原始响应:', response);
      return this.getDefaultAnalysis(query);
    }
  }

  /**
   * 获取默认处理方式
   */
  private getDefaultApproach(complexity: string): string {
    switch (complexity) {
      case 'simple':
        return '单专家处理，选择最匹配的专家进行回答';
      case 'complex':
        return '多专家协作，分别从理论分析和实用建议角度处理';
      default:
        return '智能协作，根据问题特点灵活分配专家';
    }
  }

  /**
   * 获取默认分析（错误fallback）
   */
  private getDefaultAnalysis(query: string): CoordinationAnalysis {
    const requiredSpecializations = this.inferRequiredSpecializations(query);
    const complexity: 'simple' | 'moderate' | 'complex' = query.length > 50 ? 'complex' : 'moderate';
    
    return {
      originalQuery: query,
      complexity,
      requiredSpecializations,
      suggestedApproach: this.getDefaultApproach(complexity),
      taskBreakdown: this.getDefaultTaskBreakdown(query, complexity),
      reasoning: '基于关键词分析和问题复杂度判断的默认协作策略'
    };
  }

  /**
   * 推断所需专业能力
   */
  private inferRequiredSpecializations(query: string): string[] {
    const specializations: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // 技术分析相关关键词
    const techKeywords = ['原理', '算法', '技术', '概念', '定义', '理论', '分析', '工作原理', '什么是'];
    // 实用建议相关关键词
    const practicalKeywords = ['如何', '怎么', '建议', '方法', '步骤', '技巧', '推荐', '选择', '应该'];
    
    if (techKeywords.some(keyword => lowerQuery.includes(keyword))) {
      specializations.push('技术分析');
    }
    
    if (practicalKeywords.some(keyword => lowerQuery.includes(keyword))) {
      specializations.push('实用建议');
    }
    
    // 如果都没有，根据问题长度和复杂度判断
    if (specializations.length === 0) {
      if (query.length > 30 || query.includes('？') && query.includes('，')) {
        specializations.push('技术分析', '实用建议');
      } else {
        specializations.push('技术分析');
      }
    }
    
    return specializations;
  }

  /**
   * 获取默认任务分解
   */
  private getDefaultTaskBreakdown(query: string, complexity: string): string[] {
    if (complexity === 'simple') {
      return [`直接回答：${query}`];
    } else {
      return [
        `深度分析问题的核心要点：${query}`,
        `提供实用建议和解决方案：${query}`
      ];
    }
  }

  /**
   * 生成最终总结
   */
  public async generateFinalSummary(
    originalQuery: string, 
    subtaskResults: SubtaskResult[], 
    conversationHistory: ChatMessage[] = []
  ): Promise<FinalSummary> {
    
    const systemPrompt = `${this.config.personality}

作为团队协调者，我需要整合各专家的回答，生成一个高质量的最终总结。

原始问题：${originalQuery}

各专家的回答：
${subtaskResults.map((result, index) => {
  const agentName = result.agentId === 'xiaozhi' ? '小智（技术分析专家）' : '小梅（实用建议专家）';
  return `${index + 1}. ${agentName}的回答：\n${result.result}`;
}).join('\n\n')}

请生成一个综合性的最终总结，包括：
1. 关键洞察：从各专家回答中提取的核心要点
2. 可行建议：整合后的实用建议
3. 综合结论：对原问题的全面回答
4. 后续步骤：如果适用，提供下一步建议

要求：
- 融合不同专家的观点，避免重复
- 保持逻辑清晰，结构合理
- 突出最有价值的信息
- 确保回答的完整性和实用性`;

    const messages: ChatMessage[] = [
      ...conversationHistory,
      {
        id: `summary-${Date.now()}`,
        role: 'user',
        content: `请总结各专家对"${originalQuery}"的回答`,
        timestamp: new Date(),
        agentId: this.config.id
      }
    ];

    try {
      const response = await this.llmService.generateResponse(messages, systemPrompt);
      return this.parseSummaryResponse(originalQuery, response.content, subtaskResults);
    } catch (error) {
      console.error('生成最终总结失败:', error);
      return this.getDefaultSummary(originalQuery, subtaskResults);
    }
  }

  /**
   * 解析总结响应
   */
  private parseSummaryResponse(originalQuery: string, response: string, subtaskResults: SubtaskResult[]): FinalSummary {
    const lines = response.split('\n').filter(line => line.trim());
    
    let keyInsights: string[] = [];
    let actionableAdvice: string[] = [];
    let synthesizedConclusion = '';
    let nextSteps: string[] = [];
    
    let currentSection = '';
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('关键洞察') || lowerLine.includes('核心要点')) {
        currentSection = 'insights';
        continue;
      } else if (lowerLine.includes('可行建议') || lowerLine.includes('实用建议')) {
        currentSection = 'advice';
        continue;
      } else if (lowerLine.includes('综合结论') || lowerLine.includes('全面回答')) {
        currentSection = 'conclusion';
        continue;
      } else if (lowerLine.includes('后续步骤') || lowerLine.includes('下一步')) {
        currentSection = 'next';
        continue;
      }
      
      if (line.trim() && !line.includes('：')) {
        switch (currentSection) {
          case 'insights':
            keyInsights.push(line.trim());
            break;
          case 'advice':
            actionableAdvice.push(line.trim());
            break;
          case 'conclusion':
            synthesizedConclusion += line.trim() + ' ';
            break;
          case 'next':
            nextSteps.push(line.trim());
            break;
        }
      }
    }
    
    // 如果解析失败，生成默认内容
    if (keyInsights.length === 0) {
      keyInsights = this.extractKeyInsights(subtaskResults);
    }
    
    if (!synthesizedConclusion) {
      synthesizedConclusion = response.substring(0, 200) + '...';
    }
    
    return {
      originalQuery,
      keyInsights,
      actionableAdvice,
      synthesizedConclusion: synthesizedConclusion.trim(),
      nextSteps: nextSteps.length > 0 ? nextSteps : undefined
    };
  }

  /**
   * 提取关键洞察
   */
  private extractKeyInsights(subtaskResults: SubtaskResult[]): string[] {
    const insights: string[] = [];
    
    subtaskResults.forEach(result => {
      const agentName = result.agentId === 'xiaozhi' ? '技术分析专家' : '实用建议专家';
      const preview = result.result.substring(0, 100);
      insights.push(`${agentName}的核心观点：${preview}...`);
    });
    
    return insights;
  }

  /**
   * 获取默认总结
   */
  private getDefaultSummary(originalQuery: string, subtaskResults: SubtaskResult[]): FinalSummary {
    return {
      originalQuery,
      keyInsights: this.extractKeyInsights(subtaskResults),
      actionableAdvice: ['基于专家建议，制定适合的行动计划'],
      synthesizedConclusion: `针对"${originalQuery}"，我们的专家团队提供了全面的分析和建议。`,
      nextSteps: ['根据具体情况选择合适的方案', '如需深入了解可进一步咨询']
    };
  }

  /**
   * 获取Agent信息
   */
  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  public getName(): string {
    return this.config.name;
  }

  public getSpecialization(): string {
    return this.config.specialization || '任务协调';
  }
} 