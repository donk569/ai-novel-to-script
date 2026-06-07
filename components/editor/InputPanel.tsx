'use client'

import { useCallback, useRef, useState } from 'react'
import MonacoEditor from './MonacoEditor'
import { useEditorStore } from '@/stores/editorStore'

const ALLOWED_EXTENSIONS = ['.txt', '.md']
const ALLOWED_TYPES = ['text/plain', 'text/markdown', 'text/x-markdown']

function isValidFile(file: File): boolean {
  const name = file.name.toLowerCase()
  const ext = ALLOWED_EXTENSIONS.some((e) => name.endsWith(e))
  const type = ALLOWED_TYPES.includes(file.type) || file.type === ''
  return ext && type
}

export default function InputPanel() {
  const input = useEditorStore((s) => s.input)
  const setInput = useEditorStore((s) => s.setInput)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  const handleChange = useCallback(
    (value: string) => {
      setInput(value)
    },
    [setInput]
  )

  const readFile = useCallback(
    (file: File) => {
      if (!isValidFile(file)) {
        showToast('仅支持 .txt 和 .md 文件', 'warning')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        if (text) {
          setInput(text)
        }
      }
      reader.onerror = () => {
        showToast('文件读取失败，请重试', 'error')
      }
      reader.readAsText(file)
    },
    [setInput]
  )

  // Click to upload
  const handleClickUpload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.md'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) readFile(file)
    }
    input.click()
  }, [readFile])

  // Drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (dragCounter.current === 1) setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      dragCounter.current = 0

      const file = e.dataTransfer.files?.[0]
      if (file) readFile(file)
    },
    [readFile]
  )

  const handleClear = useCallback(() => {
    setInput('')
  }, [setInput])

  return (
    <div
      className={`relative h-full flex flex-col ${isDragOver ? 'drag-over' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--accent)]/10 border-2 border-dashed border-[var(--accent)] rounded pointer-events-none">
          <span className="text-lg font-bold text-[var(--accent)]">
            释放文件以上传
          </span>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          value={input}
          onChange={handleChange}
          language="plaintext"
          readOnly={false}
        />
      </div>

      {/* Bottom actions */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-surface)] border-t border-[var(--border-color)] shrink-0">
        <button
          onClick={handleClickUpload}
          className="text-xs px-2.5 py-1 rounded bg-[var(--bg-panel)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-colors"
        >
          📁 上传文件
        </button>
        {input && (
          <button
            onClick={handleClear}
            className="text-xs px-2.5 py-1 rounded bg-[var(--bg-panel)] text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--border-color)] transition-colors"
          >
            🗑 清空
          </button>
        )}
        <div className="flex-1" />
        <span className="text-[10px] text-[var(--text-secondary)]">
          支持 .txt / .md
        </span>
      </div>
    </div>
  )
}

// Simple toast helper (will be replaced by a proper toast system)
function showToast(message: string, type: 'success' | 'error' | 'warning') {
  // Use custom event for toast
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('app-toast', { detail: { message, type } })
    )
  }
}
