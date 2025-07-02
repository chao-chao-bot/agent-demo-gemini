# Agent项目设置指南

## 🎯 项目概述

这是一个基于LangChain.js和Chroma的RAG增强型智能Agent系统，支持知识库检索增强生成。

## 📋 系统要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- (可选) Docker - 用于运行Chroma向量数据库

## 🚀 快速开始

### 1. 安装依赖

```bash
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

### 3. (可选) 启动Chroma数据库

如果要使用完整的RAG功能，启动Chroma：

```bash
# 使用Docker启动Chroma
docker run -p 8000:8000 chromadb/chroma

# 或者使用pip安装
pip install chromadb
chroma run --host localhost --port 8000
```

### 4. 构建项目

```bash
npm run build
```

### 5. 启动应用

```bash
npm start
# 或者
npm run chat
```

## 🔧 功能特性

### RAG知识库功能

- **自动文档检索**: 根据用户问题自动检索相关知识
- **多格式支持**: 支持txt、md、json等文档格式
- **智能分块**: 自动将长文档分割为合适的块
- **向量相似度搜索**: 基于语义相似度进行精准检索

### Agent对话功能

- **多轮对话**: 保持对话上下文和记忆
- **特殊命令**: 内置多种实用命令
- **模型切换**: 支持多种LLM模型
- **友好界面**: 彩色终端界面，用户体验佳

## 📚 使用指南

### 基本对话

直接输入问题即可开始对话：

```
用户: 什么是RAG技术？
小智Plus: 基于知识库检索到的信息，RAG（Retrieval-Augmented Generation）是...
```

### 特殊命令

- `帮助` / `help` - 查看所有可用命令
- `知识库` / `rag` - 查看RAG系统状态
- `添加文档` - 了解如何添加新文档
- `历史` / `对话记录` - 查看对话历史
- `统计` / `stats` - 查看会话统计
- `配置` / `config` - 查看当前配置
- `清除` / `clear` - 清除对话历史

### 文档管理

#### 通过代码添加文档

```javascript
// 添加单个文件
await agent.addDocumentFromFile('/path/to/document.txt');

// 添加整个目录
await agent.addDocumentFromDirectory('/path/to/docs/');

// 直接添加文本
await agent.addDocumentFromText('这里是要添加的文档内容...', {
  title: '文档标题',
  category: '分类'
});
```

## 🔍 故障排除

### 常见问题

1. **RAG初始化失败**
   - 检查Chroma服务是否运行
   - 确认网络连接正常
   - 查看端口是否被占用

2. **API调用失败**
   - 检查API密钥是否正确
   - 确认网络可访问API服务
   - 检查API额度是否充足

3. **依赖安装问题**
   - 清除npm缓存：`npm cache clean --force`
   - 删除node_modules后重新安装
   - 检查Node.js版本是否符合要求

### 日志调试

启用调试模式：

```bash
DEBUG=true npm start
```

### 无RAG模式运行

如果RAG功能有问题，系统会自动降级为基础对话模式：

```
⚠️  RAG初始化失败，将在无知识库模式下运行
```

## 📈 性能优化

### 文档分块优化

- 调整 `RAG_CHUNK_SIZE` 控制文档块大小
- 调整 `RAG_CHUNK_OVERLAP` 控制块重叠度
- 合理的块大小能提高检索准确性

### 向量检索优化

- 使用高质量的embedding模型
- 定期清理无用文档
- 监控向量数据库性能

## 🛠️ 开发模式

```bash
# 开发模式 (自动重载)
npm run dev

# 监听模式 (自动编译)
npm run watch
```

## 📖 技术架构

```
智能Agent系统
├── Agent核心 (ChatAgent)
├── LLM服务 (LLMService)  
├── RAG模块 (RAGService)
├── 文档加载器 (DocumentLoader)
├── 向量数据库 (Chroma)
└── 终端界面 (TerminalUI)
```

## 🔮 未来规划

- [ ] 支持更多文档格式 (PDF, DOCX, Excel)
- [ ] Web界面支持
- [ ] 多语言支持
- [ ] 插件系统
- [ ] 云端部署方案
- [ ] 批量文档管理界面

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## �� 许可证

MIT License 