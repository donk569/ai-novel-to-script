'use client'

import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import dynamic from 'next/dynamic'

// Lazy-load Monaco to avoid blocking first paint
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[var(--bg-primary)] text-[var(--text-secondary)] text-sm">
      编辑器加载中...
    </div>
  ),
})

export interface MonacoEditorHandle {
  getEditor: () => import('monaco-editor').editor.IStandaloneCodeEditor | null
}

export interface MonacoEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  readOnly?: boolean
  theme?: string
  onScroll?: (e: import('monaco-editor').IScrollEvent) => void
}

const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  function MonacoEditor(
    { value, onChange, language = 'plaintext', readOnly = false, theme = 'vs-dark', onScroll },
    ref
  ) {
    const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null)

    const handleMount = useCallback(
      (editorInstance: import('monaco-editor').editor.IStandaloneCodeEditor) => {
        editorRef.current = editorInstance

        // Apply custom settings
        editorInstance.updateOptions({
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderLineHighlight: 'none',
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          overviewRulerLanes: 0,
          padding: { top: 12, bottom: 12 },
        })

        if (onScroll) {
          editorInstance.onDidScrollChange(onScroll)
        }
      },
      [onScroll]
    )

    const handleChange = useCallback(
      (val: string | undefined) => {
        if (onChange && val !== undefined) {
          onChange(val)
        }
      },
      [onChange]
    )

    useImperativeHandle(ref, () => ({
      getEditor: () => editorRef.current,
    }))

    return (
      <Editor
        height="100%"
        language={language}
        value={value}
        theme={theme}
        onChange={handleChange}
        onMount={handleMount}
        loading={
          <div className="flex items-center justify-center h-full bg-[var(--bg-primary)] text-[var(--text-secondary)] text-sm">
            编辑器加载中...
          </div>
        }
        options={{
          readOnly,
        }}
      />
    )
  }
)

export default MonacoEditor
