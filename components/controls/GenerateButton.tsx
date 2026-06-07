'use client'

import { useCallback, useRef } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { countWords } from '@/lib/utils'

/**
 * Quality check on output after generation completes.
 */
function detectQualityIssues(output: string): {
  isEmpty: boolean
  noSceneTitle: boolean
  isTruncated: boolean
} {
  const trimmed = output.trim()
  return {
    isEmpty: trimmed.length === 0,
    noSceneTitle: !/###\s*【/.test(trimmed),
    // Truncation heuristic: last line doesn't end with punctuation or is incomplete markdown
    isTruncated: (() => {
      const lines = trimmed.split('\n')
      const last = lines[lines.length - 1]?.trim() || ''
      if (!last) return false
      // Check for unclosed bold
      const boldCount = (last.match(/\*\*/g) || []).length
      if (boldCount % 2 !== 0) return true
      // Check for incomplete sentence (no ending punctuation)
      if (
        last.length > 10 &&
        !/[。！？.!?」"”』）\)]$/.test(last) &&
        !last.endsWith('>')
      ) {
        return true
      }
      return false
    })(),
  }
}

export default function GenerateButton() {
  const input = useEditorStore((s) => s.input)
  const output = useEditorStore((s) => s.output)
  const status = useEditorStore((s) => s.status)
  const temperature = useEditorStore((s) => s.temperature)
  const appendOutput = useEditorStore((s) => s.appendOutput)
  const setStatus = useEditorStore((s) => s.setStatus)
  const setAbortController = useEditorStore((s) => s.setAbortController)
  const setErrorMessage = useEditorStore((s) => s.setErrorMessage)

  const bufferRef = useRef('')
  const rafRef = useRef<number | null>(null)

  const flushBuffer = useCallback(() => {
    const chunk = bufferRef.current
    bufferRef.current = ''
    if (chunk) {
      appendOutput(chunk)
    }
  }, [appendOutput])

  const isGenerating = status === 'generating' || status === 'streaming'
  const isDisabled = !input.trim() || countWords(input) > 3000

  const handleGenerate = useCallback(async () => {
    if (isGenerating || isDisabled) return

    // Reset state
    useEditorStore.setState({ output: '', errorMessage: null })
    setStatus('generating')

    const abortController = new AbortController()
    setAbortController(abortController)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input.trim(),
          temperature,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: '生成失败，请重试' }))
        throw new Error(err.error || '生成失败，请重试')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let firstChunkReceived = false
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        buffer += text

        // Parse SSE events from buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('event: chunk')) continue // event line, data follows

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (!firstChunkReceived) {
                firstChunkReceived = true
                setStatus('streaming')
              }

              // Queue chunk for rAF batched update
              bufferRef.current += data
              if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(() => {
                  rafRef.current = null
                  flushBuffer()
                })
              }
            } catch {
              // Not JSON — skip (could be empty data for "done" event)
            }
          }

          if (line.startsWith('event: done')) {
            // generation complete — handled after loop
          }

          if (line.startsWith('event: error')) {
            // Extract error message from the next data line
            const errorLine = lines.find((l) => l.startsWith('data: '))
            const errorMsg = errorLine
              ? JSON.parse(errorLine.slice(6))
              : '生成失败，请重试'
            throw new Error(errorMsg)
          }
        }
      }

      // Flush remaining buffer
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      flushBuffer()

      // Quality check
      const currentOutput = useEditorStore.getState().output
      const quality = detectQualityIssues(currentOutput)

      if (quality.isEmpty) {
        setStatus('error')
        setErrorMessage('生成失败，请重试')
        showToast('生成失败，请重试', 'error')
      } else {
        setStatus('success')

        if (quality.noSceneTitle) {
          showToast(
            '生成质量较低，可尝试降低 Temperature 或重新输入',
            'warning'
          )
        }

        if (quality.isTruncated) {
          showToast('内容可能被截断，可点击"继续生成"', 'warning')
        }
      }
    } catch (err: unknown) {
      // Flush buffer on error too
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      flushBuffer()

      const error = err as { name?: string; message?: string }

      if (error?.name === 'AbortError') {
        setStatus('stopped')
      } else {
        setStatus('error')
        const msg = error?.message || '生成失败，请重试'
        setErrorMessage(msg)
        showToast(msg, 'error')
      }
    } finally {
      setAbortController(null)
    }
  }, [
    input,
    temperature,
    isGenerating,
    isDisabled,
    setStatus,
    setAbortController,
    setErrorMessage,
    appendOutput,
    flushBuffer,
  ])

  const handleContinue = useCallback(async () => {
    if (isGenerating || isDisabled) return

    setStatus('generating')
    setErrorMessage(null)

    const abortController = new AbortController()
    setAbortController(abortController)

    try {
      const currentOutput = useEditorStore.getState().output
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input.trim(),
          temperature,
          previousOutput: currentOutput,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: '续写失败，请重试' }))
        throw new Error(err.error || '续写失败，请重试')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let firstChunkReceived = false
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        buffer += text
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (!firstChunkReceived) {
                firstChunkReceived = true
                setStatus('streaming')
              }
              bufferRef.current += data
              if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(() => {
                  rafRef.current = null
                  flushBuffer()
                })
              }
            } catch {}
          }
          if (line.startsWith('event: error')) {
            const errorLine = lines.find((l) => l.startsWith('data: '))
            throw new Error(
              errorLine ? JSON.parse(errorLine.slice(6)) : '续写失败'
            )
          }
        }
      }

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      flushBuffer()
      setStatus('success')
    } catch (err: unknown) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      flushBuffer()

      const error = err as { name?: string; message?: string }

      if (error?.name === 'AbortError') {
        setStatus('stopped')
      } else {
        setStatus('error')
        const msg = error?.message || '续写失败，请重试'
        setErrorMessage(msg)
        showToast(msg, 'error')
      }
    } finally {
      setAbortController(null)
    }
  }, [
    input,
    temperature,
    isGenerating,
    isDisabled,
    setStatus,
    setAbortController,
    setErrorMessage,
    appendOutput,
    flushBuffer,
  ])

  const handleStop = useCallback(() => {
    const ctrl = useEditorStore.getState().abortController
    if (ctrl) {
      ctrl.abort()
    }
    // Flush remaining buffer
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    flushBuffer()
    setStatus('stopped')
  }, [flushBuffer, setStatus])

  const quality = output ? detectQualityIssues(output) : null
  const canContinue = quality?.isTruncated && status === 'success'

  return (
    <div className="flex items-center gap-2">
      {canContinue && (
        <button
          onClick={handleContinue}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--bg-surface)] text-[var(--scene)] border border-[var(--scene)] hover:bg-[var(--scene)] hover:text-white transition-all"
        >
          继续生成
        </button>
      )}

      {isGenerating ? (
        <button
          onClick={handleStop}
          className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-white pulse-dot" />
          停止生成
        </button>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={isDisabled}
          className={`px-5 py-2 text-sm font-bold rounded-lg transition-all active:scale-95 ${
            isDisabled
              ? 'bg-[var(--border-color)] text-[var(--text-secondary)] cursor-not-allowed'
              : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
          }`}
          title={
            !input.trim()
              ? '请输入小说内容'
              : countWords(input) > 3000
                ? '单次最多 3000 字，请减少内容或分段处理'
                : '点击生成剧本'
          }
        >
          生成剧本
        </button>
      )}
    </div>
  )
}

// Toast helper
function showToast(message: string, type: 'success' | 'error' | 'warning') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('app-toast', { detail: { message, type } })
    )
  }
}
