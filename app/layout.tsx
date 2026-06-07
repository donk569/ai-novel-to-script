import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI 小说转剧本',
  description: '输入小说段落，一键流式生成结构化剧本',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="h-full overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  )
}
