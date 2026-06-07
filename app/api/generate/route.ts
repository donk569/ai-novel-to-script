/**
 * POST /api/generate — SSE streaming proxy to DeepSeek.
 */

import { NextRequest } from 'next/server'
import { generateScriptStream, generateContinuationStream } from '@/lib/ai'
import { detectPromptInjection } from '@/lib/prompt'
import { countWords } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_INPUT_LENGTH = 3000
const TIMEOUT_MS = 30_000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)

    if (!body || typeof body.input !== 'string') {
      return new Response(JSON.stringify({ error: '输入内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { input, temperature = 0.7, previousOutput } = body as {
      input: string
      temperature?: number
      previousOutput?: string
    }

    // --- Validation ---
    const trimmed = input.trim()
    if (!trimmed) {
      return new Response(JSON.stringify({ error: '输入内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (countWords(trimmed) > MAX_INPUT_LENGTH) {
      return new Response(
        JSON.stringify({ error: '单次最多 3000 字，请减少内容或分段处理' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Prompt injection detection
    if (detectPromptInjection(trimmed)) {
      return new Response(
        JSON.stringify({ error: '输入内容包含不合规的指令，请修改后重试' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Clamp temperature
    const clampedTemp = Math.max(0.1, Math.min(1.5, Number(temperature) || 0.7))

    // --- SSE Setup ---
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const abortController = new AbortController()

        // Timeout guard
        const timeout = setTimeout(() => {
          abortController.abort()
          const data = `event: error\ndata: ${JSON.stringify('生成超时，请稍后重试')}\n\n`
          controller.enqueue(encoder.encode(data))
          controller.close()
        }, TIMEOUT_MS)

        // Listen for client disconnect (AbortSignal from request)
        request.signal.addEventListener('abort', () => {
          abortController.abort()
          clearTimeout(timeout)
        })

        try {
          // Choose stream type based on whether this is a continuation
          const aiStream = previousOutput
            ? await generateContinuationStream({
                input: trimmed,
                temperature: clampedTemp,
                signal: abortController.signal,
                previousOutput,
              })
            : await generateScriptStream({
                input: trimmed,
                temperature: clampedTemp,
                signal: abortController.signal,
              })

          for await (const chunk of aiStream) {
            // Check if client disconnected
            if (request.signal.aborted) break

            const delta = chunk.choices?.[0]?.delta?.content
            if (delta) {
              const data = `event: chunk\ndata: ${JSON.stringify(delta)}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          }

          clearTimeout(timeout)

          // Send done event if not aborted
          if (!request.signal.aborted && !abortController.signal.aborted) {
            const doneData = `event: done\ndata: ""\n\n`
            controller.enqueue(encoder.encode(doneData))
          }
        } catch (err: unknown) {
          clearTimeout(timeout)

          const error = err as { name?: string; message?: string }

          // Don't send error if intentionally aborted
          if (error?.name === 'AbortError' || abortController.signal.aborted) {
            // Graceful close
          } else {
            const errorMsg = error?.message?.includes('API key')
              ? '服务配置错误，请联系管理员'
              : error?.message?.includes('rate')
                ? '请求过于频繁，请稍后重试'
                : '生成失败，请重试'

            const data = `event: error\ndata: ${JSON.stringify(errorMsg)}\n\n`
            controller.enqueue(encoder.encode(data))
          }

          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err: unknown) {
    console.error('[API /generate] Unexpected error:', err)
    return new Response(JSON.stringify({ error: '服务器内部错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
