/**
 * Export system — Markdown (.md) and Plain Text (.txt) download helpers.
 */

import { formatDate } from './utils'

/** Generic file download trigger */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Export content as a Markdown file, preserving all formatting. */
export function exportMarkdown(content: string): void {
  const filename = `novel-script-${formatDate(new Date())}.md`
  downloadFile(content, filename, 'text/markdown')
}

/** Export content as plain text, stripping Markdown syntax. */
export function exportTxt(content: string): void {
  const txt = content
    .replace(/^### /gm, '')           // Remove scene title markdown
    .replace(/\*\*/g, '')             // Remove bold markers
    .replace(/^> /gm, '（')           // Start action bracket
    .replace(/\n/g, '\n')             // Keep newlines (identity transform for clarity)

  // Close action brackets: lines that start with （ need closing ）
  const lines = txt.split('\n')
  const processed = lines.map((line) => {
    if (line.startsWith('（')) {
      return line + '）'
    }
    return line
  })

  const filename = `novel-script-${formatDate(new Date())}.txt`
  downloadFile(processed.join('\n'), filename, 'text/plain')
}
