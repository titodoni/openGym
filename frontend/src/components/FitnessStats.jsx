import React from 'react'
import Icon from './Icon.jsx'
import { calcMuscleRecoveryState } from '../lib/fitness-calculations.js'

/**
 * StatTile — Fundamental numerical metric display tokenized for openGym.
 * Uses system tokens: --surface, --surface-2, --label, --label-2, --label-3, --r, --pad.
 */
export function StatTile({ label, value, sub, delta, icon, colorVar, compact = false }) {
  const isPositiveDelta = typeof delta === 'number' ? delta > 0 : String(delta || '').startsWith('+')
  const deltaText = typeof delta === 'number' ? (delta > 0 ? `+${delta}` : `${delta}`) : delta

  return (
    <div
      style={{
        background: 'var(--surface-2)',
        borderRadius: 'var(--r)',
        padding: compact ? '8px 12px' : '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--label-2)' }}>
          {label}
        </span>
        {icon && <Icon name={icon} style={{ width: 14, height: 14, color: colorVar || 'var(--label-3)' }} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: compact ? 18 : 22, fontWeight: 700, color: colorVar || 'var(--label)', fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </span>
        {delta != null && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 'var(--r-sm)',
              background: isPositiveDelta ? 'rgba(48, 209, 88, 0.15)' : 'rgba(235, 235, 245, 0.08)',
              color: isPositiveDelta ? 'var(--green)' : 'var(--label-2)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {deltaText}
          </span>
        )}
      </div>

      {sub && <span style={{ fontSize: 11, color: 'var(--label-3)' }}>{sub}</span>}
    </div>
  )
}

/**
 * WorkoutStatsBar — Fitbod & Hevy style workout summary strip.
 * Duration · Volume · Sets · Intensity (kg/rep) · Density (kg/min)
 */
export function WorkoutStatsBar({ stats = {}, deltas = null }) {
  const { volume = 0, durationMin = 0, sets = 0, reps = 0, avgIntensity = 0, density = 0 } = stats

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 8,
        margin: '12px 0',
      }}
    >
      <StatTile
        label="Volume"
        value={`${volume.toLocaleString()} kg`}
        delta={deltas?.volDelta ? `${deltas.volDelta > 0 ? '+' : ''}${deltas.volDelta.toLocaleString()} kg` : null}
        sub={`${sets} sets · ${reps} reps`}
        icon="dumbbell"
      />
      <StatTile
        label="Duration"
        value={`${durationMin} min`}
        delta={deltas?.durDelta ? `${deltas.durDelta > 0 ? '+' : ''}${deltas.durDelta} min` : null}
        sub="Elapsed time"
        icon="clock"
      />
      <StatTile
        label="Intensity"
        value={`${avgIntensity} kg`}
        sub="Avg weight / rep"
        icon="bolt"
      />
      <StatTile
        label="Density"
        value={`${density} kg/m`}
        sub="Pace (kg / min)"
        icon="activity"
      />
    </div>
  )
}

/**
 * MuscleRecoveryCard — Fitbod signature recovery representation.
 * Renders percentage, recovery bar, and semantic status tag.
 */
export function MuscleRecoveryCard({ muscleName, fatigueValue = 0, lastTrainedText = '' }) {
  const { recoveryPct, label, colorVar } = calcMuscleRecoveryState(fatigueValue)

  return (
    <div
      style={{
        background: 'var(--surface-2)',
        borderRadius: 'var(--r)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--label)' }}>{muscleName}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 'var(--r-sm)',
            background: colorVar,
            color: '#000000',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      </div>

      {/* Fitbod recovery progress bar */}
      <div
        style={{
          height: 6,
          background: 'var(--surface-3)',
          borderRadius: 3,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${recoveryPct}%`,
            background: colorVar,
            transition: 'width var(--med) var(--ease)',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--label-3)' }}>
        <span>{recoveryPct}% Recovered</span>
        {lastTrainedText && <span>{lastTrainedText}</span>}
      </div>
    </div>
  )
}

/**
 * PRTrophyBadge — Hevy PR indicator.
 */
export function PRTrophyBadge({ type = 'PR', value = '', subtitle = '' }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 'var(--r-sm)',
        background: 'rgba(255, 214, 10, 0.12)',
        border: 'var(--hair) solid rgba(255, 214, 10, 0.3)',
      }}
    >
      <span style={{ fontSize: 14 }}>🏆</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', textTransform: 'uppercase' }}>
          {type} {value && `· ${value}`}
        </span>
        {subtitle && <span style={{ fontSize: 10, color: 'var(--label-2)' }}>{subtitle}</span>}
      </div>
    </div>
  )
}
