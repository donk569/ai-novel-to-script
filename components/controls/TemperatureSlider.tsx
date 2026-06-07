'use client'

import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'

const PRESETS = [
  { label: '稳定', value: 0.4, desc: '忠实还原' },
  { label: '平衡', value: 0.7, desc: '兼顾改编' },
  { label: '创意', value: 1.0, desc: '大胆重构' },
]

export default function TemperatureSlider() {
  const temperature = useEditorStore((s) => s.temperature)
  const setTemperature = useEditorStore((s) => s.setTemperature)
  const status = useEditorStore((s) => s.status)

  const isDisabled = status === 'generating' || status === 'streaming'

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTemperature(parseFloat(e.target.value))
    },
    [setTemperature]
  )

  const handlePreset = useCallback(
    (value: number) => {
      setTemperature(value)
    },
    [setTemperature]
  )

  return (
    <div className="flex items-center gap-3">
      {/* Label */}
      <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
        🌡️ 创意度
      </span>

      {/* Preset buttons */}
      <div className="flex items-center gap-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePreset(preset.value)}
            disabled={isDisabled}
            className={`px-2 py-1 text-[11px] rounded transition-all ${
              temperature === preset.value
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-panel)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={`${preset.label}模式 (${preset.value}) — ${preset.desc}`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0.1"
          max="1.5"
          step="0.1"
          value={temperature}
          onChange={handleSliderChange}
          disabled={isDisabled}
          className={`w-20 h-1.5 rounded-full appearance-none cursor-pointer ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{
            background: `linear-gradient(to right, var(--scene), var(--accent))`,
            accentColor: 'var(--accent)',
          }}
        />
        <span className="text-xs font-mono text-[var(--text-primary)] w-8 text-center tabular-nums">
          {temperature.toFixed(1)}
        </span>
      </div>
    </div>
  )
}
