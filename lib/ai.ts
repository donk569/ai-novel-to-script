/**
 * DeepSeek AI SDK wrapper — server-side only.
 * Uses OpenAI-compatible SDK pointed at api.deepseek.com.
 */

import OpenAI from 'openai'

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com'

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured')
    }
    client = new OpenAI({
      apiKey,
      baseURL: DEEPSEEK_BASE_URL,
    })
  }
  return client
}

export interface GenerateOptions {
  input: string
  temperature?: number
  signal?: AbortSignal
  /** If provided, continues from previous output */
  previousOutput?: string
}

/**
 * Generate a streaming chat completion from DeepSeek.
 * Returns the raw OpenAI stream — the caller is responsible for SSE encoding.
 */
export async function generateScriptStream(options: GenerateOptions) {
  const { input, temperature = 0.7, signal } = options
  const openai = getClient()

  // We import buildMessages dynamically to keep this file server-only friendly
  const { buildMessages } = await import('./prompt')

  const messages = buildMessages(input)

  return openai.chat.completions.create(
    {
      model: 'deepseek-chat',
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature,
      max_tokens: 2000,
      stream: true,
    },
    {
      signal,
    }
  )
}

/** Generate continuation from previous truncated output */
export async function generateContinuationStream(options: GenerateOptions) {
  const { input, temperature = 0.7, signal, previousOutput = '' } = options
  const openai = getClient()

  const { buildContinuationMessages } = await import('./prompt')
  const messages = buildContinuationMessages(input, previousOutput)

  return openai.chat.completions.create(
    {
      model: 'deepseek-chat',
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature,
      max_tokens: 2000,
      stream: true,
    },
    {
      signal,
    }
  )
}
