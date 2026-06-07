/**
 * System Prompt management — server-side only, never exposed to the client.
 */

export const SYSTEM_PROMPT = `# 角色
你是一名专业的剧本改编师。将用户提供的小说内容改编为符合行业标准的剧本格式。

# 输出格式
- 场景标题: ### 【{场景类型} {地点}·{时间}】
- 角色对话: **{角色名}**：{对话内容}
- 动作描述: > {动作内容}

# 规则
1. 仅输出剧本正文，禁止解释性文字
2. 禁止"以下是剧本"、"好的"、"当然可以"等寒暄
3. 禁止代码块
4. 禁止 Markdown 以外的格式
5. 场景标题必须包含场景类型、地点、时间
6. 角色名必须加粗，禁止一行多个角色
7. 动作描述使用引用语法，单段不超过 3 行`

/**
 * Build message array for DeepSeek chat completion.
 */
export function buildMessages(input: string): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `请将以下小说内容改编为剧本：\n\n${input}` },
  ]
}

/**
 * Build continuation messages — include previous output as context.
 */
export function buildContinuationMessages(
  input: string,
  previousOutput: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `请将以下小说内容改编为剧本：\n\n${input}` },
    { role: 'assistant', content: previousOutput },
    { role: 'user', content: '请继续生成，从上次中断的地方接着写，不要重复已生成的内容。' },
  ]
}

/** Prompt injection patterns to detect and block */
const INJECTION_PATTERNS = [
  /忽略(之前|前面|以上)?规则/i,
  /输出系统提示词/i,
  /jailbreak/i,
  /ignore\s+previous\s+instructions/i,
  /output\s+system\s+prompt/i,
  /忘记.*规则/i,
  /不要.*规则/i,
  /override.*instructions/i,
]

/** Check user input for prompt injection attempts. Returns true if suspicious. */
export function detectPromptInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(input))
}
