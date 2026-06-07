'use client'

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[var(--bg-panel)] border-b border-[var(--border-color)] shrink-0 select-none">
      <div className="flex items-center gap-3">
        <span className="text-xl" role="img" aria-label="film">
          🎬
        </span>
        <h1 className="text-lg font-bold tracking-wide text-[var(--text-primary)]">
          小说转剧本
        </h1>
        <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full">
          AI 编剧助手
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <span>Powered by DeepSeek</span>
      </div>
    </header>
  )
}
