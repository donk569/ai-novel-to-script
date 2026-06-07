'use client'

import { create } from 'zustand'
import { countWords } from '@/lib/utils'

// ============================================================
//  Types
// ============================================================

export type EditorStatus =
  | 'idle'
  | 'uploading'
  | 'generating'
  | 'streaming'
  | 'success'
  | 'error'
  | 'stopped'

export interface EditorState {
  // --- state ---
  input: string
  output: string
  status: EditorStatus
  temperature: number
  wordCount: number
  abortController: AbortController | null
  errorMessage: string | null

  // --- actions ---
  setInput: (text: string) => void
  setOutput: (text: string) => void
  appendOutput: (chunk: string) => void
  setStatus: (status: EditorStatus) => void
  setTemperature: (t: number) => void
  setErrorMessage: (msg: string | null) => void
  setAbortController: (ctrl: AbortController | null) => void
  reset: () => void
}

// ============================================================
//  Allowed state transitions (state machine)
// ============================================================

const ALLOWED_TRANSITIONS: Record<EditorStatus, EditorStatus[]> = {
  idle: ['uploading'],
  uploading: ['generating', 'idle'],
  generating: ['streaming', 'error', 'stopped'],
  streaming: ['success', 'error', 'stopped'],
  success: ['generating', 'idle', 'uploading'],
  error: ['idle', 'uploading'],
  stopped: ['generating', 'idle', 'uploading'],
}

// ============================================================
//  Draft persistence
// ============================================================

const DRAFT_KEY = 'novel2script_draft_input'

function loadDraft(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(DRAFT_KEY) || ''
  } catch {
    return ''
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function saveDraft(text: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DRAFT_KEY, text)
  } catch { /* quota exceeded — silent */ }
}

function clearDraft() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch { /* ignore */ }
}

// ============================================================
//  Store
// ============================================================

const initialInput = loadDraft()

export const useEditorStore = create<EditorState>((set, get) => ({
  input: initialInput,
  output: '',
  status: 'idle',
  temperature: 0.7,
  wordCount: countWords(initialInput),
  abortController: null,
  errorMessage: null,

  setInput(text: string) {
    const wc = countWords(text)
    set({ input: text, wordCount: wc, status: 'uploading' })

    // Debounced draft save
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveDraft(text), 500)
  },

  setOutput(text: string) {
    set({ output: text })
  },

  appendOutput(chunk: string) {
    set((s) => ({ output: s.output + chunk }))
  },

  setStatus(status: EditorStatus) {
    const current = get().status
    const allowed = ALLOWED_TRANSITIONS[current]
    if (!allowed.includes(status)) {
      console.warn(`[editorStore] Invalid transition: ${current} -> ${status}`)
      return
    }
    set({ status })
  },

  setTemperature(t: number) {
    const clamped = Math.max(0.1, Math.min(1.5, Math.round(t * 10) / 10))
    set({ temperature: clamped })
  },

  setErrorMessage(msg: string | null) {
    set({ errorMessage: msg })
  },

  setAbortController(ctrl: AbortController | null) {
    // Abort previous if exists
    const prev = get().abortController
    if (prev && ctrl !== prev) {
      prev.abort()
    }
    set({ abortController: ctrl })
  },

  reset() {
    const prev = get().abortController
    if (prev) prev.abort()
    clearDraft()
    set({
      input: '',
      output: '',
      status: 'idle',
      temperature: 0.7,
      wordCount: 0,
      abortController: null,
      errorMessage: null,
    })
  },
}))
