# 🤖 智能RAG增强Agent系统

一个基于**LangChain.js + ChromaDB**的专业级智能终端对话助手，集成RAG(检索增强生成)知识库，支持Google Gemini大语言模型。通过向量数据库实现智能文档检索，提供更准确、专业的回答。

## 🎉 LangChain.js 升级版本

**项目已升级支持两个版本：**

| 版本 | 启动命令 | 特点 | 适用场景 |
|------|---------|------|----------|
| **🦜 LangChain版** | `node dist/index-langchain.js` | 专业级RAG架构，真正的向量数据库 | 生产环境，企业应用 |
| **📚 简化版** | `node dist/index.js` | 轻量级实现，快速开始 | 学习测试，快速原型 |

### LangChain版本优势
- ✅ **真正的向量数据库**: ChromaDB持久化存储
- ✅ **标准化架构**: LangChain.js专业框架
- ✅ **智能文本处理**: RecursiveCharacterTextSplitter
- ✅ **链式工作流**: RunnableSequence可组合管道
- ✅ **企业级可扩展**: 支持更多LangChain生态系统

📖 **详细升级指南**: 请查看 [`LANGCHAIN_UPGRADE_GUIDE.md`](./LANGCHAIN_UPGRADE_GUIDE.md)

## ✨ 功能特性

### 🔍 RAG知识库功能
- **智能文档检索**：基于向量相似度的语义搜索
- **自动知识增强**：根据用户问题自动检索相关知识
- **多格式文档支持**：txt、md、json等格式
- **智能文档分块**：自动优化文档分割策略
- **实时知识更新**：支持动态添加新文档

### 🤖 AI对话功能
- **真实AI对话**：基于Google Gemini强大的大语言模型
- **上下文记忆**：保持多轮对话的连续性
- **中英文支持**：同时支持中文和英文命令
- **会话管理**：自动记录对话历史和统计信息
- **美观界面**：彩色终端输出，优化用户体验

### 🛠️ 技术特性
- **向量数据库**：集成Chroma向量数据库
- **语义嵌入**：高质量文本向量化
- **降级模式**：RAG失败时自动降级为基础对话
- **模块化设计**：可扩展的插件架构

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd agent-demo

# 安装依赖
npm install
```

### 2. 环境变量配置

创建 `.env` 文件：

```bash
# AI模型配置
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Chroma向量数据库配置 (可选)
CHROMA_URL=localhost
CHROMA_PORT=8000

# RAG配置
RAG_ENABLED=true
RAG_COLLECTION_NAME=agent_knowledge_base
```

### 3. 启动Chroma数据库（可选）

#### 方式一：Docker（推荐）
```bash
docker run -p 8000:8000 chromadb/chroma
```

#### 方式二：Python安装
```bash
pip install chromadb
chroma run --host localhost --port 8000
```

#### 方式三：自动设置脚本
```bash
npm run setup-chroma
```

### 4. 构建并运行

```bash
# 编译项目
npm run build

# 启动Agent
npm start
```

## 📚 使用指南

### 基本对话

```
用户: 什么是RAG技术？
小智Plus: 🔍 已从知识库检索到相关信息

基于知识库检索到的信息，RAG（Retrieval-Augmented Generation）是一种结合了信息检索和文本生成的AI技术...
```

### 特殊命令

| 命令 | 功能 | 示例 |
|------|------|------|
| `帮助` / `help` | 查看所有可用命令 | `help` |
| `知识库` / `rag` | 查看RAG系统状态 | `知识库` |
| `添加文档` | 了解文档管理功能 | `添加文档` |
| `历史` / `对话记录` | 查看对话历史 | `历史` |
| `统计` / `stats` | 查看会话统计 | `stats` |
| `配置` / `config` | 查看当前配置 | `config` |
| `清除` / `clear` | 清除对话历史 | `clear` |

### 知识库管理

#### 添加文档到知识库（编程方式）

```javascript
// 添加单个文件
await agent.addDocumentFromFile('/path/to/document.txt');

// 添加整个目录
await agent.addDocumentFromDirectory('/path/to/docs/');

// 直接添加文本
await agent.addDocumentFromText('文档内容...', {
  title: '文档标题',
  category: '分类'
});
```

## 🏗️ 系统架构

```
智能RAG增强Agent系统
├── 🧠 Agent核心层
│   ├── ChatAgent.ts          # 对话管理
│   └── 特殊命令处理
├── 🤖 LLM服务层  
│   ├── LLMService.ts         # 模型抽象
│   └── Gemini集成
├── 📚 RAG知识库层
│   ├── RAGService.ts         # RAG服务
│   ├── DocumentLoader.ts     # 文档加载
│   └── ChromaVectorStore.ts  # 向量存储
├── 🗄️ 向量数据库
│   └── Chroma数据库
└── 🖥️ 用户界面层
    └── TerminalUI.ts         # 终端界面
```

## 🔧 技术栈

### 核心框架
- **[LangChain.js](https://github.com/langchain-ai/langchainjs)** - AI应用开发框架
- **[Chroma](https://www.trychroma.com/)** - 向量数据库
- **TypeScript** - 类型安全开发
- **Node.js** - 运行时环境

### AI服务
- **Google Gemini** - 大语言模型
- **Google Generative AI SDK** - 官方SDK

### 支持库
- **Chalk** - 终端颜色
- **Figlet** - ASCII艺术字
- **Dotenv** - 环境变量
- **UUID** - 唯一标识符生成

## 🎯 应用场景

### 📖 知识问答
- **技术文档查询**：快速检索技术文档内容
- **产品手册问答**：基于产品手册的智能客服
- **学术研究助手**：科研文献检索和分析

### 💼 企业应用
- **内部知识库**：员工培训和知识管理
- **客户支持**：基于知识库的智能客服
- **文档助手**：政策、流程、规范查询

### 🎓 教育培训
- **学习助手**：个性化学习内容推荐
- **答疑系统**：基于教材的智能答疑
- **研究工具**：学术资料检索和整理

## ⚙️ 配置选项

### RAG配置

```javascript
const ragConfig = {
  chromaUrl: 'localhost',      // Chroma数据库地址
  chromaPort: 8000,            // Chroma端口
  collectionName: 'kb',        // 集合名称
  chunkSize: 1000,             // 文档分块大小
  chunkOverlap: 200,           // 分块重叠度
  retrievalCount: 3,           // 检索文档数量
  embeddingModel: 'default'    // 嵌入模型
};
```

### Agent配置

```javascript
const agentConfig = {
  name: '小智Plus',
  version: '2.0.0',
  llmProvider: 'gemini',
  model: 'gemini-1.5-flash-latest',
  maxTokens: 2000,
  temperature: 0.7
};
```

## 🔍 故障排除

### 常见问题

1. **RAG初始化失败**
   ```bash
   # 检查Chroma服务
   curl http://localhost:8000/api/v1/heartbeat
   
   # 重启Chroma
   docker restart chroma-db
   ```

2. **依赖安装问题**
   ```bash
   # 清理并重装
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **API调用失败**
   ```bash
   # 检查环境变量
   echo $GOOGLE_GEMINI_API_KEY
   
   # 测试网络连接
   curl -I https://generativelanguage.googleapis.com
   ```

### 调试模式

```bash
# 启用详细日志
DEBUG=true npm start

# 检查Chroma状态
npm run setup-chroma -- --check
```

## 📈 性能优化

### 文档优化
- **合理分块**：控制文档块大小在500-1500字符
- **质量过滤**：移除低质量或重复内容
- **格式规范**：统一文档格式和结构

### 检索优化
- **相似度阈值**：调整检索结果过滤阈值
- **检索数量**：平衡检索数量和响应速度
- **缓存策略**：缓存常用查询结果

### 系统优化
- **向量维度**：选择合适的embedding维度
- **数据库索引**：优化Chroma索引配置
- **内存管理**：控制向量数据内存使用

## 🔮 发展规划

### v2.1 计划
- [ ] Web界面支持
- [ ] 批量文档上传功能
- [ ] 更多文档格式支持（PDF、DOCX）
- [ ] 多语言embedding支持

### v2.2 计划
- [ ] 插件系统
- [ ] 自定义embedding模型
- [ ] 分布式向量存储
- [ ] 实时学习功能

### v3.0 愿景
- [ ] 多模态RAG（图像、音频）
- [ ] 云端部署方案
- [ ] 企业级权限管理
- [ ] API服务化

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程
1. Fork项目
2. 创建功能分支
3. 编写测试
4. 提交代码
5. 创建Pull Request

### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint规则
- 添加适当的注释
- 编写单元测试

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [LangChain.js 文档](https://js.langchain.com/)
- [Chroma 文档](https://docs.trychroma.com/)
- [Google AI Studio](https://makersuite.google.com/)
- [项目详细设置指南](docs/SETUP.md)

---

⭐ 如果这个项目对你有帮助，请给我们一个star！ 