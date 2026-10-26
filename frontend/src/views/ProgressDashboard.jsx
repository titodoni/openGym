import React, { useState, useMemo } from 'react'
import { useStore } from '../store/useStore.js'
import { generateCoachReport } from '../lib/phul-coach.js'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import {
  calcWorkoutSessionStats,
  calcWorkoutDelta,
} from '../lib/fitness-calculations.js'
import {
  StatTile,
  WorkoutStatsBar,
  MuscleRecoveryCard,
  PRTrophyBadge,
} from '../components/FitnessStats.jsx'
import { fatigueOf } from '../lib/recovery.js'

export default function ProgressDashboard() {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const workouts = S.workouts || []
  const [copied, setCopied] = useState(false)
  const [actionNotice, setActionNotice] = useState(null)
  const now = Date.now()

  // Week 1 Day 1 baseline (Mon 19 Oct 2026: 3,215 kg, 66 min)
  const week1Day1Stats = {
    volume: 3215,
    durationMin: 66,
    sets: 20,
    reps: 154,
    avgIntensity: 20.9,
    density: 48.7,
  }

  // Current session (Week 2 Day 1 — 26 Oct 2026: 3,815 kg, 54 min)
  const latestWorkout = useMemo(() => {
    return workouts.find(w => w.d >= '2026-10-26') || workouts[0]
  }, [workouts])

  const latestStats = useMemo(() => {
    return calcWorkoutSessionStats(latestWorkout)
  }, [latestWorkout])

  const latestDeltas = useMemo(() => {
    return calcWorkoutDelta(latestStats, week1Day1Stats)
  }, [latestStats])

  // Fitbod Muscle Recovery Calculation
  const fatigue = useMemo(() => {
    try {
      return fatigueOf(workouts, now, { bodyweightKg: 90, unit: S.unit || 'kg' })
    } catch {
      return {}
    }
  }, [workouts, now, S.unit])

  const keyMuscles = [
    { id: 'chest', name: 'Chest' },
    { id: 'upper-back', name: 'Upper Back / Lats' },
    { id: 'deltoids', name: 'Deltoids' },
    { id: 'triceps', name: 'Triceps' },
    { id: 'biceps', name: 'Biceps' },
    { id: 'quadriceps', name: 'Quadriceps' },
    { id: 'hamstring', name: 'Hamstrings' },
  ]

  // Key Verified PRs (Hevy verified records)
  const verifiedPRs = [
    { lift: 'Barbell Bench Press', weight: '60 kg × 4', est1RM: '68.0 kg', date: '23 Sep 2025' },
    { lift: 'Barbell Squat', weight: '70 kg × 6', est1RM: '84.0 kg', date: '20 Oct 2025' },
    { lift: 'Romanian Deadlift', weight: '70 kg × 10', est1RM: '93.3 kg', date: '28 Nov 2025' },
    { lift: 'Leg Press (Machine)', weight: '105 kg × 10', est1RM: '140.0 kg', date: 'Nov 2025' },
    { lift: 'Standing Military Press', weight: '35 kg × 8', est1RM: '44.3 kg', date: '18 Aug 2025' },
    { lift: 'Conventional Deadlift', weight: '50 kg × 11', est1RM: '68.3 kg', date: '24 Apr 2025' },
  ]

  // Key PHUL lifts tracking
  const lifts = [
    { id: '0025', routineId: 'phul-upper-power', name: 'Barbell Bench Press', weight: '35 kg', status: 'STAY', statusNote: 'Bench solo safety: leave ≥ 2 RIR, use rack safeties. Stay at 35 kg.' },
    { id: '0314', routineId: 'phul-upper-power', name: 'Incline DB Bench Press', weight: '10 kg/arm', status: 'STAY', statusNote: 'Triceps hot in last set, form clean. Confirm 1 more session.' },
    { id: '0027', routineId: 'phul-upper-power', name: 'Bent-Over Barbell Row', weight: '35 kg', status: 'READY', bumpKg: 2.5, statusNote: 'Volume PR + clean 4x5 with ≥ 1 RIR. Ready for +2.5 kg.' },
    { id: '2330', routineId: 'phul-upper-power', name: 'Lat Pulldown (Cable)', weight: '30 kg', status: 'STAY', statusNote: 'Backup: Machine Row if cable station busy.' },
    { id: '1162', routineId: 'phul-upper-power', name: 'Standing Military Press', weight: '20 kg', status: 'STAY', statusNote: 'Strict overhead path, no hanging stretches.' },
    { id: '0294', routineId: 'phul-upper-power', name: 'DB Bicep Curl', weight: '7.5 kg/arm', status: 'STAY', statusNote: '3x10 clean, stay until 12 reps comfortable.' },
    { id: '0241', routineId: 'phul-upper-power', name: 'Triceps Pushdown', weight: '15 kg', status: 'STAY', statusNote: 'Last rep struggling / triceps hot. Stay.' },
    { id: '3593', routineId: 'phul-lower-power', name: 'Barbell Squat', weight: '30 kg', status: 'WATCH', statusNote: 'Power day: keep reps crisp. Watch knee & quad fatigue with running.' },
    { id: '0032', routineId: 'phul-lower-power', name: 'Barbell Deadlift', weight: '45 kg', status: 'WATCH', statusNote: 'Clean hinge, no spinal flexion.' }
  ]

  // Check if Week 3 rear-delt face pull is already in Thursday Upper Hypertrophy
  const upperHyperRoutine = (S.routines || []).find(r => r.id === 'phul-upper-hyper')
  const hasFacePull = (upperHyperRoutine?.ex || []).some(e => e.id === '5658' || e.note?.toLowerCase().includes('face pull'))

  const handleAddFacePulls = () => {
    update(draft => {
      const r = (draft.routines || []).find(rt => rt.id === 'phul-upper-hyper')
      if (r) {
        if (!r.ex) r.ex = []
        r.ex.push({
          id: '5658', // cable seated face pull with rope
          sets: 3,
          reps: 15,
          weight: 15,
          note: 'Week 3 Rear-Delt addition (light 12–20 reps, 1–2 RIR)',
        })
      }
    })
    setActionNotice('Added Face Pulls (3×15) to Thursday Upper Hypertrophy routine!')
    setTimeout(() => setActionNotice(null), 4000)
  }

  const handleApplyBump = (routineId, exerciseId, bump) => {
    update(draft => {
      const r = (draft.routines || []).find(rt => rt.id === routineId)
      if (r && r.ex) {
        const item = r.ex.find(e => e.id === exerciseId)
        if (item) {
          item.weight = (Number(item.weight) || 0) + bump
        }
      }
    })
    setActionNotice(`Applied +${bump} kg progression to routine!`)
    setTimeout(() => setActionNotice(null), 4000)
  }

  // RP 2024 landmarks vs Tito direct sets
  const rpLandmarks = [
    { muscle: 'Chest', mevMrv: '4–6 / 16–24', directSets: 12, reading: 'Above MEV, well below MRV — comfortable' },
    { muscle: 'Back / Lats', mevMrv: '6–8 / 20–26', directSets: 9, reading: 'Just above MEV; good for re-entry' },
    { muscle: 'Quads', mevMrv: '4–6 / 14–18', directSets: 15, reading: 'Near top of MRV range — WATCH with running' },
    { muscle: 'Hamstrings', mevMrv: '2–4 / 8–14', directSets: 12, reading: 'Near top of MRV range — WATCH' },
    { muscle: 'Glutes', mevMrv: '6–8 / 24–30', directSets: 12, reading: 'Comfortable mid-range' },
    { muscle: 'Biceps', mevMrv: '8–10 / 20–26', directSets: '6 (10.5 eff.)', reading: 'Direct 6, clears MEV with pulling credit' },
    { muscle: 'Triceps', mevMrv: '4–6 / 16–20', directSets: '6 (13.5 eff.)', reading: 'Direct 6, comfortable with pressing credit' },
    { muscle: 'Front Delts', mevMrv: '0–2 / 8–12', directSets: 6, reading: 'Above MEV — do not add direct front-delt sets' },
    { muscle: 'Side Delts', mevMrv: '6–8 / 24–30', directSets: 3, reading: 'Below MEV direct; borderline' },
    { muscle: 'Rear Delts', mevMrv: '0–4 / 12–20', directSets: hasFacePull ? 3 : 0, gap: !hasFacePull, reading: hasFacePull ? 'Added: 3 direct sets of Face Pulls' : 'GAP: 0 direct sets (Week 3 will add Face Pulls/Reverse Flyes)' },
    { muscle: 'Calves', mevMrv: '4–6 / 16–24', directSets: 6, reading: 'At MEV, well below MRV' }
  ]

  const reportText = latestWorkout ? generateCoachReport(latestWorkout, { S, nextDayText: 'Tue 27 Oct — Lower Power' }) : ''

  const copyReport = () => {
    navigator.clipboard?.writeText(reportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const exportReport = () => {
    const blob = new Blob([reportText], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PHUL_Report_${latestWorkout?.d || 'latest'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="view" style={{ padding: 'var(--pad)', maxWidth: 840, margin: '0 auto' }}>
      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          style={{
            background: 'var(--green)',
            color: '#000000',
            padding: '10px 14px',
            borderRadius: 'var(--r)',
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="check" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--label)' }}>PHUL Progress & Stats</h1>
          <div style={{ fontSize: 13, color: 'var(--label-2)', marginTop: 2 }}>Fitbod & Hevy Analytics · Tito Doni Asmoro</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={exportReport}>Export .md</Button>
          <Button variant="primary" onClick={copyReport}>{copied ? 'Copied!' : 'Report to Coach'}</Button>
        </div>
      </div>

      {/* Week 3 Transition Banner */}
      {!hasFacePull && (
        <div
          style={{
            background: 'rgba(10, 132, 255, 0.12)',
            border: 'var(--hair) solid var(--blue)',
            borderRadius: 'var(--r-card)',
            padding: 14,
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--label)' }}>Week 3 Plan: Rear-Delt Addition</div>
            <div style={{ fontSize: 12, color: 'var(--label-2)', marginTop: 2 }}>
              Add 2–3 sets of Face Pulls (light, 12–20 reps, 1–2 RIR) to Thursday Upper Hypertrophy to close the volume gap.
            </div>
          </div>
          <Button variant="primary" onClick={handleAddFacePulls}>+ Add Face Pulls to Thursday</Button>
        </div>
      )}

      {/* Solo Bench Press Safety Reminder */}
      <div
        style={{
          background: 'rgba(255, 214, 10, 0.1)',
          border: 'var(--hair) solid var(--yellow)',
          borderRadius: 'var(--r-card)',
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>⚠️</span>
        <div style={{ fontSize: 12, color: 'var(--label)' }}>
          <strong>Solo Lifter Safety:</strong> Barbell Bench Press must leave ≥ 2 RIR when solo. Always set and test rack safeties before loading. No dead hangs or overhead hanging stretches.
        </div>
      </div>

      {/* Fitbod Workout Density & Intensity Bar (Latest Session) */}
      <div className="card" style={{ marginBottom: 16, background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: 'var(--pad)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--label)' }}>Latest Session: Upper Power (Week 2 Day 1)</h3>
          <span style={{ fontSize: 11, color: 'var(--label-2)' }}>vs Week 1 Day 1</span>
        </div>
        <WorkoutStatsBar stats={latestStats} deltas={latestDeltas} />
      </div>

      {/* Fitbod Muscle Recovery Matrix */}
      <div className="card" style={{ marginBottom: 16, background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: 'var(--pad)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--label)' }}>Fitbod Muscle Recovery State</h3>
            <div style={{ fontSize: 12, color: 'var(--label-2)', marginTop: 2 }}>Exponential recovery curve across 48–72h windows</div>
          </div>
          <Icon name="activity" style={{ color: 'var(--acc)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
          {keyMuscles.map(m => (
            <MuscleRecoveryCard
              key={m.id}
              muscleName={m.name}
              fatigueValue={fatigue[m.id] || 0}
            />
          ))}
        </div>
      </div>

      {/* Hevy Verified All-Time PRs Showcase */}
      <div className="card" style={{ marginBottom: 16, background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: 'var(--pad)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--label)' }}>Hevy Verified PRs (Epley 1RM)</h3>
            <div style={{ fontSize: 12, color: 'var(--label-2)', marginTop: 2 }}>From 187 sessions · 1,119.3 tons historical baseline</div>
          </div>
          <Icon name="trophy" style={{ color: 'var(--yellow)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
          {verifiedPRs.map((pr, i) => (
            <div
              key={i}
              style={{
                background: 'var(--surface-2)',
                borderRadius: 'var(--r)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--label)' }}>{pr.lift}</div>
                <div style={{ fontSize: 11, color: 'var(--label-2)', marginTop: 2 }}>{pr.weight} ({pr.date})</div>
              </div>
              <PRTrophyBadge type="1RM" value={pr.est1RM} />
            </div>
          ))}
        </div>
      </div>

      {/* Macro Progression & Comeback Comparison */}
      <div className="card" style={{ marginBottom: 16, background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: 'var(--pad)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600, color: 'var(--label)' }}>Mesocycle 1 Macro Volume</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <StatTile
            label="Week 1 Complete"
            value="17,260 kg"
            sub="4 sessions · 279 min (all green)"
            colorVar="var(--green)"
          />
          <StatTile
            label="Week 2 In Progress"
            value="3,815 kg"
            sub="Day 1 Mon done · 54 min"
            delta="+600 kg vs W1D1"
            colorVar="var(--acc)"
          />
          <StatTile
            label="Body Weight"
            value="90.0 kg"
            sub="Tuesday AM baseline (5 Oct 2026)"
            icon="scale"
          />
        </div>
      </div>

      {/* PHUL Progression Tracker */}
      <div className="card" style={{ marginBottom: 16, background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: 'var(--pad)' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: 15, fontWeight: 600, color: 'var(--label)' }}>PHUL Progression Tracker</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: 'var(--hair) solid var(--sep)' }}>
                <th style={{ padding: '8px 6px', color: 'var(--label-2)', fontWeight: 600 }}>Lift</th>
                <th style={{ padding: '8px 6px', color: 'var(--label-2)', fontWeight: 600 }}>Load</th>
                <th style={{ padding: '8px 6px', color: 'var(--label-2)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '8px 6px', color: 'var(--label-2)', fontWeight: 600 }}>Coach Guidance</th>
                <th style={{ padding: '8px 6px', color: 'var(--label-2)', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {lifts.map(l => (
                <tr key={l.id} style={{ borderBottom: 'var(--hair) solid var(--sep-op)' }}>
                  <td style={{ padding: '10px 6px', fontWeight: 600, color: 'var(--label)' }}>{l.name}</td>
                  <td style={{ padding: '10px 6px', color: 'var(--label)', fontVariantNumeric: 'tabular-nums' }}>{l.weight}</td>
                  <td style={{ padding: '10px 6px' }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 'var(--r-sm)',
                        fontSize: 10,
                        fontWeight: 700,
                        background: l.status === 'READY' ? 'var(--green)' : l.status === 'WATCH' ? 'var(--yellow)' : 'var(--surface-3)',
                        color: l.status === 'READY' || l.status === 'WATCH' ? '#000000' : 'var(--label)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 6px', color: 'var(--label-2)', fontSize: 12 }}>{l.statusNote}</td>
                  <td style={{ padding: '10px 6px' }}>
                    {l.status === 'READY' && l.bumpKg ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApplyBump(l.routineId, l.id, l.bumpKg)}
                      >
                        +{l.bumpKg} kg
                      </Button>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--label-3)' }}>Hold</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RP Landmarks & Muscle Sets */}
      <div className="card" style={{ marginBottom: 16, background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: 'var(--pad)' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: 15, fontWeight: 600, color: 'var(--label)' }}>Weekly Hard Sets vs RP 2024 Landmarks</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: 'var(--hair) solid var(--sep)' }}>
                <th style={{ padding: '8px 6px', color: 'var(--label-2)', fontWeight: 600 }}>Muscle</th>
                <th style={{ padding: '8px 6px', color: 'var(--label-2)', fontWeight: 600 }}>RP 2024 MEV/MRV</th>
                <th style={{ padding: '8px 6px', color: 'var(--label-2)', fontWeight: 600 }}>Direct Sets</th>
                <th style={{ padding: '8px 6px', color: 'var(--label-2)', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rpLandmarks.map((r, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: 'var(--hair) solid var(--sep-op)',
                    background: r.gap ? 'rgba(255, 69, 58, 0.08)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '8px 6px', fontWeight: r.gap ? 700 : 500, color: r.gap ? 'var(--red)' : 'var(--label)' }}>
                    {r.muscle}
                  </td>
                  <td style={{ padding: '8px 6px', color: 'var(--label)', fontVariantNumeric: 'tabular-nums' }}>{r.mevMrv}</td>
                  <td style={{ padding: '8px 6px', color: 'var(--label)', fontVariantNumeric: 'tabular-nums' }}>{r.directSets}</td>
                  <td style={{ padding: '8px 6px', fontSize: 12, color: r.gap ? 'var(--red)' : 'var(--label-2)' }}>{r.reading}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report to Coach Preview */}
      <div className="card" style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: 'var(--pad)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--label)' }}>Latest Generated Report</h3>
          <span style={{ fontSize: 11, color: 'var(--label-3)' }}>WhatsApp-ready plain text</span>
        </div>
        <pre
          style={{
            background: 'var(--surface-2)',
            padding: 12,
            borderRadius: 'var(--r)',
            fontSize: 12,
            color: 'var(--label)',
            whiteSpace: 'pre-wrap',
            overflowX: 'auto',
            fontFamily: 'monospace',
            border: 'var(--hair) solid var(--sep-op)',
          }}
        >
          {reportText}
        </pre>
      </div>
    </div>
  )
}
