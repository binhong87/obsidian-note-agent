# Obsidian Note Agent

一款为 [Obsidian](https://obsidian.md) 设计的智能体 AI 助手插件，能够读取并（在您批准后）修改笔记库中的笔记，支持多种 LLM 服务提供商。

[English](README.md)

## 功能特性

- **智能对话** — 多轮对话，支持自主工具调用循环
- **笔记库工具** — 全文搜索、读取笔记、列出文件夹、跟随反链与出链、获取当前笔记和选中文本
- **编辑模式** — 创建、编辑（全量替换或统一补丁）、删除、移动笔记；所有修改以差异对比形式展示，需您审批后方可写入
- **多服务提供商** — OpenAI、Anthropic、DeepSeek、通义千问（阿里云）、Kimi（月之暗面）、智谱（GLM）、MiniMax、OpenRouter、Ollama（本地）及任意 OpenAI 或 Anthropic 兼容的自定义端点
- **三种模式**
  - **问答模式** — 只读，适合问答和研究，不修改笔记库
  - **编辑模式** — 完整写入权限，所有修改通过差异对比界面审批后生效
  - **定时模式** — 自动后台运行（每日摘要、每周回顾），写入权限受限
- **定时任务** — 自动生成每日摘要和每周回顾，写入到可配置的文件夹
- **自动压缩** — 当对话历史接近模型上下文限制时，自动透明地进行压缩
- **分提供商配置** — 每个提供商独立保存 API Key、基础 URL 和模型名称
- **用户画像** — 可选的个人描述，注入到每次系统提示词中
- **国际化** — 支持英文和简体中文 UI，自动跟随 Obsidian 的语言设置

## 安装

### 通过 BRAT（推荐，适合预发布版本）

1. 安装社区插件 [BRAT](https://github.com/TfTHacker/obsidian42-brat)
2. 在 BRAT 设置中添加：`Bin-Home/obsidian-note-agent`
3. 在**设置 → 第三方插件**中启用该插件

### 手动安装

1. 从[最新发布页面](../../releases/latest)下载 `main.js`、`manifest.json` 和 `styles.css`
2. 创建文件夹 `<您的笔记库>/.obsidian/plugins/obsidian-note-agent/`
3. 将三个文件复制到该文件夹
4. 重启 Obsidian，在**设置 → 第三方插件**中启用该插件

## 配置

1. 打开**设置 → Obsidian Note Agent**
2. 选择 LLM 服务提供商并输入 API Key
3. 可选：设置自定义基础 URL（用于自托管或代理端点）及模型名称
4. 选择模式：**问答模式**（只读）或**编辑模式**（可写入）

## 使用方法

- 点击左侧工具栏中的**机器人图标**，或在命令面板中运行 `Open Note Agent`
- 输入消息后按 Enter 发送（Shift+Enter 换行）
- 在**编辑模式**下，智能体会以统一差异格式展示笔记修改建议，逐项审批或拒绝后方可写入磁盘
- 使用**新建对话**开始全新会话；历史对话已保存，可通过历史面板随时访问

## 支持的服务提供商

| 提供商 | 说明 |
|---|---|
| OpenAI | GPT-4o、GPT-4o-mini、o1、o3 等 |
| Anthropic | Claude 3.5 / 4 系列 |
| DeepSeek | deepseek-v3、deepseek-r1 |
| 通义千问 | 阿里云 Dashscope（qwen-plus、qwen-max 等） |
| Kimi | 月之暗面（moonshot-v1 系列） |
| 智谱 | GLM-4 系列 |
| MiniMax | MiniMax-Text 系列 |
| OpenRouter | 通过 openrouter.ai 访问任意模型 |
| Ollama | 本地模型（Llama、Mistral、Qwen 等） |
| 自定义 | 任意 OpenAI 兼容或 Anthropic 兼容端点 |

## 开发

```bash
npm install
npm run dev       # esbuild 监听模式，保存即重新构建
npm run build     # tsc 类型检查 + 生产构建
npm test          # 单元测试（Vitest）
```

本地测试时，将 `dist/` 文件夹软链接或复制到您的笔记库：

```
<笔记库>/.obsidian/plugins/obsidian-note-agent/
```

插件产物（`main.js`、`manifest.json`、`styles.css`）在每次构建后输出到 `dist/` 目录。

## 许可证

[MIT](LICENSE)
