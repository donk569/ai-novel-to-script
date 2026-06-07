'use client'

import { useEditorStore } from '@/stores/editorStore'
import type { EditorStatus } from '@/stores/editorStore'

const STATUS_MAP: Record<
  EditorStatus,
  { icon: string; label: string; color: string }
> = {
  idle: { icon: '✓', label: '就绪', color: 'var(--status-success)' },
  uploading: { icon: '↑', label: '已加载', color: 'var(--status-success)' },
  generating: { icon: '⚡', label: '生成中...', color: 'var(--status-warning)' },
  streaming: { icon: '⚡', label: '流式输出中...', color: 'var(--status-warning)' },
  success: { icon: '✓', label: '生成完成', color: 'var(--status-success)' },
  error: { icon: '✕', label: '错误', color: 'var(--status-error)' },
  stopped: { icon: '⊘', label: '已停止', color: 'var(--text-secondary)' },
}

export default function StatusBar() {
  const status = useEditorStore((s) => s.status)
  const errorMessage = useEditorStore((s) => s.errorMessage)
  const output = useEditorStore((s) => s.output)

  const info = STATUS_MAP[status]

  return (
    <footer className="flex items-center justify-between px-4 py-1.5 bg-[var(--bg-panel)] border-t border-[var(--border-color)] text-xs shrink-0 select-none">
      <div className="flex items-center gap-2">
        <span style={{ color: info.color }}>{info.icon}</span>
        <span style={{ color: info.color }}>{info.label}</span>
        {errorMessage && (
          <span className="text-[var(--status-error)] ml-2">— {errorMessage}</span>
        )}
      </div>

      <div className="flex items-center gap-4 text-[var(--text-secondary)]">
        {output && (
          <span>
            剧本字数: {output.length.toLocaleString()}
          </span>
        )}
        <span>DeepSeek Chat</span>
      </div>
    </footer>
  )
}
