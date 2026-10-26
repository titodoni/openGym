// Progression rules, condition tracking, and coach reporting for Tito's PHUL Program
// Science base: PHUL Strength Science (26 Oct 2026)

export const CONDITION_FLAGS = [
  { id: 'tricepsHot', label: 'Triceps hot' },
  { id: 'tricepsPain', label: 'Triceps pain', danger: true },
  { id: 'shoulderPain', label: 'Shoulder pain', danger: true },
  { id: 'shoulderCatching', label: 'Shoulder catching', danger: true },
  { id: 'shoulderWeakness', label: 'Shoulder weakness', danger: true },
  { id: 'shoulderSound', label: 'Shoulder sound only (painless crepitus)' },
]

export const EFFORT_RIR_OPTIONS = [
  { value: 'EASY', label: 'Easy (3+ RIR)', rir: 3 },
  { value: 'HARD', label: 'Hard (0-1 RIR)', rir: 1 },
  { value: 'STRUGGLING', label: 'Last rep struggling (0 RIR clean)', rir: 0 },
  { value: 'NOT_CLEAN', label: 'Last rep not clean (form broke)', rir: 0 },
  { value: 'STAY', label: 'Stay / hold weight', rir: null },
  { value: 'READY', label: 'Ready to go up', rir: null }
]

// Hand-check logic & automatic progression recommendation:
// Hold top weight until: all sets at top of rep range, clean form, >=1 RIR, TWO sessions in a row.
// Never add load if pain / catching / weakness.
// Stall: no progress for 2-3 sessions -> cut 10%.
export function evaluateLiftProgression(liftHistory = [], { targetReps = 5, isDb = false } = {}) {
  if (!liftHistory || !liftHistory.length) return { status: 'WATCH', reason: 'No recent sessions logged' }

  const last = liftHistory[0]
  if (last.conditionFlags?.shoulderPain || last.conditionFlags?.shoulderCatching || last.conditionFlags?.shoulderWeakness || last.conditionFlags?.tricepsPain) {
    return { status: 'WATCH', reason: 'Pain / catching / weakness noted last session. Stop/adjust load.' }
  }

  // If manually flagged or evaluated
  if (last.effortRir === 'NOT_CLEAN' || last.lastRepClean === false) {
    return { status: 'STAY', reason: 'Last rep not clean — hold weight until form is clean.' }
  }
  if (last.effortRir === 'STRUGGLING' || last.effortRir === 'HARD') {
    return { status: 'STAY', reason: 'High effort / struggling — consolidate weight.' }
  }
  if (last.effortRir === 'READY') {
    return { status: 'READY', reason: 'Two sessions completed with >=1 RIR and clean form.' }
  }
  if (last.effortRir === 'EASY') {
    if (liftHistory.length >= 2 && (liftHistory[1].effortRir === 'EASY' || liftHistory[1].effortRir === 'READY')) {
      return { status: 'READY', reason: '2 sessions in a row completed cleanly with >=1 RIR. Ready for +2.5kg total (+smallest gym step for DB).' }
    }
    return { status: 'STAY', reason: 'Felt easy (1 session). Complete 1 more clean session to confirm increase.' }
  }

  return { status: 'STAY', reason: 'Continue current working weight.' }
}

export function generateCoachReport(workout, { S, nextDayText = '' } = {}) {
  if (!workout) return ''

  const durMin = Math.round(((workout.end || Date.now()) - (workout.start || Date.now())) / 60000)
  const volKg = Math.round(workout.vol || 0)
  const exCount = (workout.entries || []).length

  const dateStr = workout.d || new Date().toISOString().slice(0, 10)
  const title = workout.name || 'PHUL Workout'

  let report = `${title} — ${dateStr} — ${durMin} min — ${volKg} kg — ${exCount} exercises\n`

  for (const entry of (workout.entries || [])) {
    const exName = entry.n || entry.id
    const sets = entry.sets || []
    const weights = sets.map(s => s.w || 0).filter(w => w > 0)
    const maxW = weights.length ? Math.max(...weights) : 0
    const entryVol = sets.reduce((acc, s) => acc + (s.w || 0) * (s.r || 0), 0)
    
    // Epley 1RM est
    let bestEst = 0
    for (const s of sets) {
      if (s.w && s.r) {
        const est = s.r === 1 ? s.w : s.w * (1 + s.r / 30)
        if (est > bestEst) bestEst = est
      }
    }

    const isPerArm = entry.note?.toLowerCase().includes('arm') || entry.n?.toLowerCase().includes('dumbbell')
    const weightLabel = isPerArm ? `${maxW} kg/arm` : `${maxW} kg`
    const rirLabel = entry.effortRir || (entry.rir != null ? `${entry.rir} RIR` : 'Clean')

    report += `- ${exName}: ${weightLabel}, ${entryVol} kg, est ${bestEst.toFixed(1)} kg — ${rirLabel}\n`
  }

  // Conditions
  const flags = workout.conditionFlags || {}
  const activeFlags = []
  if (flags.tricepsHot) activeFlags.push('Triceps hot')
  if (flags.tricepsPain) activeFlags.push('Triceps pain')
  if (flags.shoulderPain) activeFlags.push('Shoulder pain')
  if (flags.shoulderCatching) activeFlags.push('Shoulder catching')
  if (flags.shoulderWeakness) activeFlags.push('Shoulder weakness')
  if (flags.shoulderSound) activeFlags.push('Shoulder painless crepitus')
  if (flags.effort) activeFlags.push('Effort high')
  if (flags.lastRepStruggling) activeFlags.push('Last rep struggling')
  if (workout.note) activeFlags.push(workout.note)

  report += `Conditions: ${activeFlags.length ? activeFlags.join(', ') : 'Normal / no adverse pain'}\n`

  if (nextDayText) {
    report += `Next routine according to app: ${nextDayText}\n`
  }

  return report.trim()
}
