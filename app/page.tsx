'use client'

import Header from '@/components/layout/Header'
import StatusBar from '@/components/layout/StatusBar'
import InputPanel from '@/components/editor/InputPanel'
import ScriptPanel from '@/components/editor/ScriptPanel'
import GenerateButton from '@/components/controls/GenerateButton'
import TemperatureSlider from '@/components/controls/TemperatureSlider'
import ExportMenu from '@/components/controls/ExportMenu'
import { useEditorStore } from '@/stores/editorStore'

export default function Home() {
  const wordCount = useEditorStore((s) => s.wordCount)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Header />

      {/* Main dual-pane area */}
      <main className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Left pane — Input */}
        <section className="flex-1 flex flex-col min-h-0 border-r border-[var(--border-color)]">
          <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-surface)] border-b border-[var(--border-color)] shrink-0">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              📄 小说输入
            </span>
            <span
              className={`text-xs tabular-nums ${
                wordCount > 3000 ? 'text-red-500 font-bold' : 'text-[var(--text-secondary)]'
              }`}
            >
              {wordCount.toLocaleString()} / 3,000
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <InputPanel />
          </div>
        </section>

        {/* Right pane — Output */}
        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-surface)] border-b border-[var(--border-color)] shrink-0">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              🎬 剧本输出
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <ScriptPanel />
          </div>
          {/* Controls bar */}
          <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-surface)] border-t border-[var(--border-color)] shrink-0">
            <TemperatureSlider />
            <div className="flex-1" />
            <ExportMenu />
            <GenerateButton />
          </div>
        </section>
      </main>

      {/* Status bar */}
      <StatusBar />
    </div>
  )
}
