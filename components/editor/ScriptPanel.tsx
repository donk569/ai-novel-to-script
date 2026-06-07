'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import MonacoEditor from './MonacoEditor'
import type { MonacoEditorHandle } from './MonacoEditor'
import { useEditorStore } from '@/stores/editorStore'

enum AutoScrollMode {
  Auto = 'auto',
  Manual = 'manual',
}

export default function ScriptPanel() {
  const output = useEditorStore((s) => s.output)
  const setOutput = useEditorStore((s) => s.setOutput)
  const status = useEditorStore((s) => s.status)
  const isGenerating = status === 'generating' || status === 'streaming'
  const editorRef = useRef<MonacoEditorHandle>(null)

  const [scrollMode, setScrollMode] = useState<AutoScrollMode>(AutoScrollMode.Auto)
  const lastScrollTop = useRef(0)

  // Reset scroll mode when generation starts
  useEffect(() => {
    if (status === 'generating') {
      setScrollMode(AutoScrollMode.Auto)
    }
  }, [status])

  // Auto-scroll on new output
  useEffect(() => {
    if (scrollMode === AutoScrollMode.Auto && isGenerating) {
      const editor = editorRef.current?.getEditor()
      if (editor) {
        const model = editor.getModel()
        if (model) {
          const lastLine = model.getLineCount()
          editor.revealLineInCenter(lastLine)
        }
      }
    }
  }, [output, scrollMode, isGenerating])

  const handleScroll = useCallback(
    (scrollEvent: import('monaco-editor').IScrollEvent) => {
      if (!isGenerating) return

      const currentTop = scrollEvent.scrollTop
      const editor = editorRef.current?.getEditor()
      if (!editor) return

      const model = editor.getModel()
      if (!model) return

      const maxScrollTop = editor.getScrollHeight() - editor.getLayoutInfo().height

      // User scrolled up
      if (currentTop < lastScrollTop.current - 5) {
        setScrollMode(AutoScrollMode.Manual)
      }

      // User scrolled to bottom — resume auto
      if (currentTop >= maxScrollTop - 10) {
        setScrollMode(AutoScrollMode.Auto)
      }

      lastScrollTop.current = currentTop
    },
    [isGenerating]
  )

  const handleChange = useCallback(
    (value: string) => {
      setOutput(value)
    },
    [setOutput]
  )

  return (
    <div className="h-full relative">
      <MonacoEditor
        ref={editorRef}
        value={output}
        onChange={handleChange}
        language="markdown"
        readOnly={isGenerating}
        onScroll={handleScroll}
      />

      {/* Manual scroll indicator */}
      {scrollMode === AutoScrollMode.Manual && isGenerating && (
        <button
          onClick={() => setScrollMode(AutoScrollMode.Auto)}
          className="absolute bottom-3 right-3 z-10 px-3 py-1.5 text-xs rounded-full bg-[var(--accent)] text-white shadow-lg hover:bg-[var(--accent-hover)] transition-colors animate-bounce"
        >
          ↓ 跟随最新内容
        </button>
      )}
    </div>
  )
}
