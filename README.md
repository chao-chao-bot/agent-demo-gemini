# LangChain RAG Agent

基于 LangChain.js 和 Google Gemini 的智能问答助手，支持 RAG（检索增强生成）功能。

## 功能特点

- 🤖 使用 Google Gemini 作为语言模型和 Embedding 模型
- 📚 支持文档加载、分割和向量化
- 🔍 基于相似性的文档检索
- 💾 本地文件向量存储（无需数据库）
- 🎨 美观的终端交互界面
- ⚡ TypeScript 实现，类型安全

## 安装依赖

```bash
npm install
```

## 配置

在项目根目录创建 `.env` 文件，添加 Gemini API 密钥：

```env
GEMINI_API_KEY=your_api_key_here
```

## 编译和运行

```bash
# 编译 TypeScript
npm run build

# 运行应用
npm start

# 或者直接运行开发模式
npm run dev
```

## 使用方法

启动应用后，可以使用以下命令：

### 基本命令
- `/load <文件路径>` - 加载文档到知识库
- `/add <文本内容>` - 直接添加文本到知识库
- `/status` - 查看知识库状态
- `/clear` - 清空知识库
- `/help` - 显示帮助信息
- `/quit` - 退出程序

### 示例使用

1. **加载知识库**
   ```
   > /load knowledge_base.txt
   ```

2. **添加文本**
   ```
   > /add 这是一些重要的信息，需要加入到知识库中。
   ```

3. **询问问题**
   ```
   > LangChain 是什么？
   > RAG 技术是如何工作的？
   ```

## 项目结构

```
src/
├── config.ts          # 配置文件
├── vectorStore.ts      # 向量存储实现
├── documentLoader.ts   # 文档加载器
├── ragAgent.ts         # RAG Agent 主类
├── cli.ts             # 命令行界面
└── index.ts           # 应用入口

knowledge_base.txt     # 示例知识库文件
```

## 技术架构

1. **文档处理**：使用 RecursiveCharacterTextSplitter 进行文档分割
2. **向量化**：使用 Google Gemini Embedding 模型生成向量
3. **存储**：使用 JSON 文件存储向量，支持持久化
4. **检索**：基于余弦相似度进行文档检索
5. **生成**：使用 Google Gemini Pro 模型生成回答

## 依赖说明

- `@langchain/google-genai`: Google Gemini 集成
- `@langchain/core`: LangChain 核心组件
- `langchain`: 文本分割等工具
- `chalk`: 终端颜色输出
- `readline`: 终端交互
- `typescript`: TypeScript 支持

## 注意事项

- 确保有有效的 Google Gemini API 密钥
- 向量存储文件 `vector_store.json` 会自动创建在项目根目录
- 文档分块大小默认为 1000 字符，重叠 200 字符
- 支持的文件格式：纯文本文件（.txt） 