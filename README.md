# 🎬 AI 小说转剧本

> 一款面向写作者、编剧爱好者的轻量级 Web 工具，输入小说段落，一键流式生成结构化剧本。

---

## 📺 Demo 视频

> [点击观看 Demo 视频](#) （待录制上传至 B站 / YouTube）

---

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 DeepSeek API Key

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器访问
# http://localhost:3000
```

---

## 📋 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 (https://platform.deepseek.com) | ✅ |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL（限流，可选） | ❌ |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis Token（限流，可选） | ❌ |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN（错误监控，可选） | ❌ |

---

## 🛠 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 14 |
| 语言 | TypeScript | 5 (strict) |
| 样式 | TailwindCSS | 3.4 |
| 编辑器 | Monaco Editor | 0.50 |
| AI 模型 | DeepSeek (`deepseek-chat`) | API v2 |
| AI SDK | OpenAI SDK | 4 |
| 状态管理 | Zustand | 5 |
| 限流 | 内存实现（可切换 Upstash Redis） | - |
| 部署 | Vercel | - |

---

## 📦 第三方依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| next | ^14.2 | React 全栈框架 |
| react / react-dom | ^18 | UI 框架 |
| tailwindcss | ^3.4 | 原子化 CSS 框架 |
| typescript | ^5 | 类型安全检查 |
| zustand | ^5 | 轻量状态管理 |
| openai | ^4 | AI API SDK（兼容 DeepSeek） |
| @monaco-editor/react | ^4 | Monaco Editor React 封装 |
| monaco-editor | ^0.50 | 编辑器核心 |
| vitest | ^1 | 单元测试框架 |
| @testing-library/react | ^16 | React 测试工具 |
| jsdom | ^24 | 测试 DOM 环境 |

---

## ✨ 原创功能

1. **SSE 流式生成**：基于 `fetch` + `ReadableStream` + `AbortController` 的 SSE 流式代理，实现打字机效果的剧本生成
2. **chunk 缓冲合批**：前端采用 `requestAnimationFrame` 帧同步 + chunk buffer 策略，避免 Monaco Editor 高频刷新卡顿
3. **状态机控制**：基于 Zustand 实现 7 状态的状态机（idle → uploading → generating → streaming → success/stopped/error），禁止非法状态跳转
4. **双栏 Monaco Editor**：左右双栏均集成 Monaco Editor，支持 Markdown 语法高亮、智能滚动跟随、生成中只读保护
5. **AI 输出质量检测**：生成结束后自动检测输出为空、无场景标题、内容截断等异常，提供"继续生成"续写功能
6. **Prompt 注入防御**：后端检测用户输入中的 jailbreak 关键词，保护 System Prompt 安全
7. **影视风暗色主题**：专属深色配色系统（影视红 `#e50914` + 场景蓝 `#4a9eff` + 引用金 `#ffd700`）
8. **双格式导出**：支持 Markdown（保留完整格式）和 TXT（自动去除标记）两种导出格式

---

## 🎯 核心功能

- 📝 **多方式输入**：粘贴纯文本 / 上传 .txt .md 文件 / 拖拽上传
- 🔢 **字数统计**：实时中文字数统计，3000 字超限自动拦截
- ⚡ **流式生成**：SSE 流式渲染，首字符 < 3 秒
- 🛑 **随时停止**：生成中可随时停止，已生成内容保留
- 🌡️ **Temperature 控制**：滑块 0.1~1.5 + 三档快捷预设（稳定/平衡/创意）
- 📥 **双格式导出**：Markdown (.md) + 纯文本 (.txt)
- 💾 **草稿自动保存**：localStorage 持久化输入内容
- 🔒 **安全防护**：API Key 后端代理、Prompt 注入防御、字数前后端双重校验
- 🔄 **续写功能**：输出截断时自动检测并提供"继续生成"
- 📱 **响应式布局**：桌面双栏 + 移动端上下堆叠

---

## 🎨 剧本输出格式

```markdown
### 【内景 咖啡馆·日】

**林晚**：你终于来了。

> 林晚缓缓起身，目光坚定地望向门口。

**陈默**：我等了三年。
```

---

## 📁 项目结构

```
novel-to-script/
├── app/
│   ├── layout.tsx              # 根布局（暗色主题）
│   ├── page.tsx                # 双栏编辑器主页面
│   ├── globals.css             # 影视风暗色主题
│   └── api/generate/
│       └── route.ts            # POST → SSE 流式代理
├── components/
│   ├── editor/
│   │   ├── InputPanel.tsx      # 左栏：输入区
│   │   ├── ScriptPanel.tsx     # 右栏：剧本预览/编辑
│   │   └── MonacoEditor.tsx    # 编辑器封装组件
│   ├── controls/
│   │   ├── GenerateButton.tsx  # 生成/停止/续写按钮
│   │   ├── TemperatureSlider.tsx # 温度滑块
│   │   └── ExportMenu.tsx      # 导出下拉菜单
│   └── layout/
│       ├── Header.tsx          # 顶部栏
│       └── StatusBar.tsx       # 底部状态栏
├── stores/
│   └── editorStore.ts         # Zustand 状态机
├── lib/
│   ├── ai.ts                   # DeepSeek SDK 封装
│   ├── prompt.ts               # System Prompt（后端）
│   ├── rate-limit.ts           # 限流
│   ├── exports.ts              # MD/TXT 导出
│   └── utils.ts                # 工具函数
└── .env.example                # 环境变量模板
```

---

## 🔧 运行命令

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器 |
| `npx vitest` | 运行单元测试 |
| `npm run lint` | 代码检查 |

---

## ✅ 作品有效性自检

- [x] 功能聚焦"小说转剧本"
- [x] Stream 流式生成正常，支持停止生成
- [x] 无 API Key 泄露（`.env` 已加入 `.gitignore`）
- [x] README 完整（含运行方式、依赖说明、原创声明）
- [x] 支持 Markdown 导出和 TXT 导出
- [x] 字数限制前后端一致（3000 字）
- [x] 错误提示友好
- [x] 主分支可一键运行（`npm install && npm run dev`）
- [x] TypeScript strict mode 通过
- [x] `npm run build` 零错误

---

> 🤖 本项目由 AI 编程助手驱动开发 | 2026-06-08
