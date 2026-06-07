'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { exportMarkdown, exportTxt } from '@/lib/exports'

export default function ExportMenu() {
  const output = useEditorStore((s) => s.output)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const hasOutput = output.trim().length > 0
  const isDisabled = !hasOutput

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleExportMD = useCallback(() => {
    exportMarkdown(output)
    setOpen(false)
    showToast('Markdown 文件已下载', 'success')
  }, [output])

  const handleExportTXT = useCallback(() => {
    exportTxt(output)
    setOpen(false)
    showToast('TXT 文件已下载', 'success')
  }, [output])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isDisabled}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
          isDisabled
            ? 'bg-[var(--border-color)] text-[var(--text-secondary)] cursor-not-allowed'
            : 'bg-[var(--bg-panel)] text-[var(--text-primary)] hover:bg-[var(--border-color)]'
        }`}
        title={!hasOutput ? '暂无内容可导出' : '导出剧本'}
      >
        📥 导出
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1 w-48 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg shadow-xl overflow-hidden z-50">
          <button
            onClick={handleExportMD}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors text-left"
          >
            <span>📝</span>
            导出 Markdown (.md)
          </button>
          <button
            onClick={handleExportTXT}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors text-left border-t border-[var(--border-color)]"
          >
            <span>📄</span>
            导出纯文本 (.txt)
          </button>
        </div>
      )}
    </div>
  )
}

function showToast(message: string, type: 'success' | 'error' | 'warning') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('app-toast', { detail: { message, type } })
    )
  }
}
