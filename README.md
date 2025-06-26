# 终端对话Agent

一个基于TypeScript开发的智能终端对话助手，支持多种大语言模型（**Google Gemini**、OpenAI、Claude等）和在命令行界面进行自然语言交互。

## 功能特性

- 🤖 **真实AI对话**：支持Google Gemini、OpenAI GPT和Anthropic Claude等主流大语言模型
- 💰 **免费优先**：默认使用Google Gemini，提供慷慨的免费额度
- 💬 **中英文支持**：同时支持中文和英文命令
- 📊 **会话管理**：自动记录对话历史和统计信息
- 🎨 **美观界面**：彩色终端输出，优化用户体验
- ⚡ **实时响应**：真实的AI思考和响应过程
- 🛠️ **丰富命令**：内置多种实用命令
- 🔧 **灵活配置**：支持多种LLM提供商切换
- 🔒 **安全可靠**：本地运行，保护隐私

## 快速开始

### 1. 安装依赖
```bash
cd agent-demo
npm install
```

### 2. 配置API密钥（推荐使用Gemini）

#### 推荐：使用Google Gemini（免费额度充足）
```bash
# 复制示例配置文件
cp .env.example .env

# 编辑 .env 文件，填入您的Google API密钥
GOOGLE_API_KEY=your-google-api-key-here
GEMINI_MODEL=gemini-pro
```

#### 其他选择：OpenAI 或 Claude
```bash
# OpenAI 配置
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# 或者 Claude 配置
ANTHROPIC_API_KEY=your-anthropic-api-key-here
CLAUDE_MODEL=claude-3-sonnet-20240229
```

**如何获取Google API密钥：**
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建新的API密钥
3. 复制密钥到 `.env` 文件中

**注意**：如果不配置API密钥，系统将自动使用模拟模式，仍然可以正常对话。

### 3. 编译并运行
```bash
# 编译TypeScript
npm run build

# 启动程序
npm start
```

### 开发模式
```bash
npm run dev
```

## 支持的LLM提供商

| 提供商 | 模型示例 | 环境变量 | 免费额度 |
|--------|----------|----------|----------|
| **Google Gemini** ⭐ | gemini-pro, gemini-pro-vision | GOOGLE_API_KEY | **慷慨免费额度** |
| OpenAI | gpt-3.5-turbo, gpt-4 | OPENAI_API_KEY | 有限免费试用 |
| Anthropic | claude-3-sonnet, claude-3-haiku | ANTHROPIC_API_KEY | 有限免费试用 |
| Mock | 模拟模式（无需API密钥） | 无需配置 | 完全免费 |

⭐ **推荐使用Gemini**：Google提供的慷慨免费额度，性能优秀，成本最低！

## 可用命令

- `你好/hello` - 打招呼
- `你是谁/介绍` - 了解助手信息
- `时间/现在几点` - 获取当前时间
- `帮助/help` - 显示帮助信息
- `历史/对话记录` - 查看对话历史
- `清除/clear` - 清除对话历史
- `统计/stats` - 查看会话统计
- `配置/config` - 查看当前配置
- `exit/quit/再见` - 退出程序

## 项目结构

```
agent-demo/
├── src/
│   ├── agent/
│   │   └── ChatAgent.ts      # 核心对话逻辑
│   ├── llm/
│   │   └── LLMService.ts     # LLM服务抽象层
│   ├── config/
│   │   └── ConfigManager.ts  # 配置管理
│   ├── ui/
│   │   └── TerminalUI.ts     # 终端用户界面
│   ├── types/
│   │   └── index.ts          # 类型定义
│   └── index.ts              # 程序入口
├── dist/                     # 编译输出目录
├── .env.example              # 环境变量示例
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript配置
└── README.md                 # 项目说明
```

## 技术栈

- **TypeScript** - 类型安全的JavaScript超集
- **Node.js** - JavaScript运行时环境
- **Google Generative AI** - Google Gemini官方SDK
- **OpenAI SDK** - OpenAI官方SDK
- **Anthropic SDK** - Anthropic Claude官方SDK
- **Chalk** - 终端颜色样式库
- **Ora** - 终端加载动画
- **Figlet** - ASCII艺术字生成
- **Readline** - 终端输入处理
- **Dotenv** - 环境变量管理

## 开发说明

本项目采用面向对象设计，主要包含以下核心组件：

- **ChatAgent**: 负责对话逻辑处理和响应生成
- **LLMService**: LLM服务抽象层，支持多种AI提供商
- **ConfigManager**: 配置管理，处理环境变量和API密钥
- **TerminalUI**: 处理终端界面交互和用户输入
- **Types**: 定义项目中使用的数据类型

## 使用场景

- 🎓 **学习助手**：编程问题解答、技术概念解释
- 💼 **工作辅助**：代码审查、文档撰写、问题分析
- 🤔 **思考伙伴**：头脑风暴、创意讨论、决策支持
- 🛠️ **开发工具**：作为其他应用的AI对话模块

## 成本说明

### Google Gemini（推荐）
- ✅ **免费额度充足**：每月免费API调用次数很多
- ✅ **性能优秀**：与GPT-3.5相当的性能
- ✅ **响应快速**：延迟较低

### 其他提供商
- OpenAI：有免费试用，后续按使用量付费
- Claude：有免费试用，后续按使用量付费

## 注意事项

1. **API费用**：Gemini提供慷慨免费额度，其他模型可能产生费用
2. **网络连接**：需要稳定的网络连接来访问AI服务
3. **隐私保护**：对话内容会发送到相应的AI服务提供商
4. **API限制**：注意各提供商的API调用频率限制

## 扩展建议

- 实现对话内容的本地存储和搜索
- 添加语音输入输出功能
- 支持文件上传和处理
- 添加插件系统和自定义命令
- 实现多会话管理功能
- 添加Web界面版本

## 许可证

MIT License 