import { TaskBreakdown, SubtaskResult } from '../types';

export class ResponseSynthesizer {

  /**
   * 整合多个Agent的结果生成最终回复
   */
  public async synthesizeResponse(
    taskBreakdown: TaskBreakdown,
    subtaskResults: SubtaskResult[],
    originalQuery: string
  ): Promise<string> {
    
    if (subtaskResults.length === 0) {
      return '抱歉，没有获得任何有效的回复结果。';
    }

    // 如果只有一个结果，直接返回（可能是简单问题）
    if (subtaskResults.length === 1) {
      const firstResult = subtaskResults[0];
      return firstResult ? this.formatSingleResponse(firstResult, originalQuery) : '无有效结果';
    }

    // 多个结果需要整合
    return this.synthesizeMultipleResponses(taskBreakdown, subtaskResults, originalQuery);
  }

  /**
   * 格式化单个Agent的回复
   */
  private formatSingleResponse(result: SubtaskResult, originalQuery: string): string {
    const agentName = this.getAgentDisplayName(result.agentId);
    
    return `**${agentName}的回答：**

${result.result}

---
*由${agentName}独立完成，用时${result.processingTime}ms*`;
  }

  /**
   * 整合多个Agent的回复
   */
  private synthesizeMultipleResponses(
    taskBreakdown: TaskBreakdown,
    subtaskResults: SubtaskResult[],
    originalQuery: string
  ): Promise<string> {
    // 按优先级排序结果
    const sortedResults = this.sortResultsByPriority(taskBreakdown, subtaskResults);
    
    // 找出分析和建议类型的回复
    const analysisResult = sortedResults.find(r => 
      this.getAgentDisplayName(r.agentId).includes('小智') || 
      r.result.includes('分析') || 
      r.result.includes('概念') ||
      r.result.includes('原理')
    );
    
    const adviceResult = sortedResults.find(r => 
      this.getAgentDisplayName(r.agentId).includes('小梅') || 
      r.result.includes('建议') || 
      r.result.includes('推荐') ||
      r.result.includes('方法')
    );

    return Promise.resolve(this.buildIntegratedResponse(
      originalQuery,
      analysisResult,
      adviceResult,
      sortedResults
    ));
  }

  /**
   * 构建整合后的回复
   */
  private buildIntegratedResponse(
    originalQuery: string,
    analysisResult?: SubtaskResult,
    adviceResult?: SubtaskResult,
    allResults?: SubtaskResult[]
  ): string {
    let response = `关于"${originalQuery}"，我们的AI团队为您提供以下完整解答：\n\n`;

    // 添加分析部分
    if (analysisResult) {
      response += `## 📊 深度分析 - ${this.getAgentDisplayName(analysisResult.agentId)}\n\n`;
      response += `${analysisResult.result}\n\n`;
    }

    // 添加建议部分
    if (adviceResult && adviceResult !== analysisResult) {
      response += `## 💡 实用建议 - ${this.getAgentDisplayName(adviceResult.agentId)}\n\n`;
      response += `${adviceResult.result}\n\n`;
    }

    // 如果有其他结果，也包含进来
    if (allResults) {
      const otherResults = allResults.filter(r => 
        r !== analysisResult && r !== adviceResult
      );
      
      otherResults.forEach(result => {
        response += `## 📝 补充信息 - ${this.getAgentDisplayName(result.agentId)}\n\n`;
        response += `${result.result}\n\n`;
      });
    }

    // 添加协作总结
    response += this.buildCollaborationSummary(allResults || []);

    return response;
  }

  /**
   * 按优先级排序结果
   */
  private sortResultsByPriority(
    taskBreakdown: TaskBreakdown,
    results: SubtaskResult[]
  ): SubtaskResult[] {
    return results.sort((a, b) => {
      const taskA = taskBreakdown.subtasks.find(t => t.id === a.subtaskId);
      const taskB = taskBreakdown.subtasks.find(t => t.id === b.subtaskId);
      
      const priorityA = taskA?.priority || 999;
      const priorityB = taskB?.priority || 999;
      
      return priorityA - priorityB;
    });
  }

  /**
   * 构建协作总结
   */
  private buildCollaborationSummary(results: SubtaskResult[]): string {
    if (results.length <= 1) {
      return '';
    }

    const participatingAgents = [...new Set(results.map(r => this.getAgentDisplayName(r.agentId)))];
    const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0);
    const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);

    return `---

## 🤝 团队协作信息

**参与Agent：** ${participatingAgents.join('、')}  
**处理时间：** ${totalTime}ms  
**Token使用：** ${totalTokens}个  
**协作模式：** 多专家分工合作

*这个回答由我们的AI团队协作完成，结合了不同专业领域的见解，为您提供更全面、更实用的解答。*`;
  }

  /**
   * 获取Agent的显示名称
   */
  private getAgentDisplayName(agentId: string): string {
    const agentNames: { [key: string]: string } = {
      'xiaozhi': '小智',
      'xiaomei': '小梅'
    };
    
    return agentNames[agentId] || agentId;
  }

  /**
   * 检测回复内容的主要类型
   */
  private detectResponseType(content: string): 'analysis' | 'advice' | 'explanation' | 'other' {
    const analysisKeywords = ['分析', '研究', '原理', '概念', '理论', '数据', '统计'];
    const adviceKeywords = ['建议', '推荐', '应该', '可以', '方法', '步骤', '技巧'];
    const explanationKeywords = ['什么是', '定义', '解释', '说明', '介绍'];

    const lowerContent = content.toLowerCase();

    if (analysisKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'analysis';
    }
    if (adviceKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'advice';
    }
    if (explanationKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'explanation';
    }
    
    return 'other';
  }

  /**
   * 生成简短的协作摘要
   */
  public generateCollaborationSummary(results: SubtaskResult[]): string {
    if (results.length === 0) return '无协作记录';
    if (results.length === 1 && results[0]) return `由${this.getAgentDisplayName(results[0].agentId)}独立完成`;
    
    const agents = [...new Set(results.map(r => this.getAgentDisplayName(r.agentId)))];
    return `${agents.join('、')}协作完成`;
  }
} 