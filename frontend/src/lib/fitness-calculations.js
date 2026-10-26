/**
 * Statistical and progression calculations adapted from Fitbod and Hevy standards.
 * Pure functions, zero framework dependencies, test-covered.
 */

import { isWarmupRow } from './workout-model.js'

/**
 * 1RM calculation formulas
 * Epley is the industry default (Hevy / openGym).
 * Brzycki is optional for low reps (<= 10).
 */
export function calcE1RM(weight, reps, formula = 'epley') {
  if (!weight || weight <= 0 || !reps || reps <= 0) return 0
  if (reps === 1) return Math.round(weight * 10) / 10

  if (formula === 'brzycki' && reps < 37) {
    return Math.round((weight * (36 / (37 - reps))) * 10) / 10
  }

  // Default Epley: weight * (1 + reps / 30)
  return Math.round((weight * (1 + reps / 30)) * 10) / 10
}

/**
 * Fitbod workout intensity & density metrics for a single workout session.
 * @param {Object} workout - The workout object from store.
 * @returns {Object} Comprehensive session statistics.
 */
export function calcWorkoutSessionStats(workout) {
  if (!workout) return { volume: 0, sets: 0, reps: 0, durationMin: 0, intensity: 0, density: 0 }

  const start = workout.start || Date.now()
  const end = workout.end || start
  const durationMin = Math.max(1, Math.round((end - start) / 60000))

  let totalVolume = 0
  let totalSets = 0
  let totalReps = 0

  for (const entry of workout.entries || []) {
    for (const set of entry.sets || []) {
      if (set && set.done === true && !isWarmupRow(set)) {
        const w = Number(set.w) || 0
        const r = Number(set.r) || 0
        totalSets += 1
        totalReps += r
        totalVolume += w * r
      }
    }
  }

  // If workout has a pre-calculated vol, use it if our manual sum is 0
  if (totalVolume === 0 && workout.vol > 0) {
    totalVolume = workout.vol
  }

  // Intensity = Average weight lifted per rep (kg/rep) - Hevy metric
  const avgIntensity = totalReps > 0 ? Math.round((totalVolume / totalReps) * 10) / 10 : 0

  // Density = Volume moved per minute (kg/min) - Fitbod metric
  const density = durationMin > 0 ? Math.round(totalVolume / durationMin) : 0

  return {
    volume: Math.round(totalVolume),
    sets: totalSets,
    reps: totalReps,
    durationMin,
    avgIntensity,
    density,
  }
}

/**
 * Fitbod session-to-session Delta comparisons (e.g. Current vs Previous Upper Power).
 */
export function calcWorkoutDelta(currentStats, previousStats) {
  if (!currentStats || !previousStats) return null

  return {
    volDelta: (currentStats.volume || 0) - (previousStats.volume || 0),
    repsDelta: (currentStats.reps || 0) - (previousStats.reps || 0),
    setsDelta: (currentStats.sets || 0) - (previousStats.sets || 0),
    durDelta: (currentStats.durationMin || 0) - (previousStats.durationMin || 0),
    intensityDelta: Math.round(((currentStats.avgIntensity || 0) - (previousStats.avgIntensity || 0)) * 10) / 10,
  }
}

/**
 * Fitbod Muscle Recovery Percentage & State.
 * Maps raw fatigue (0.0 to 1.0+) to an intuitive 0–100% recovery score.
 */
export function calcMuscleRecoveryState(fatigueValue = 0) {
  const f = Math.max(0, Number(fatigueValue) || 0)
  // Higher fatigue means lower recovery
  const recoveryPct = Math.max(0, Math.min(100, Math.round((1 - f) * 100)))

  let status = 'ready'
  let label = 'Fresh'
  let colorVar = 'var(--green)'

  if (recoveryPct < 50) {
    status = 'fatigued'
    label = 'Fatigued'
    colorVar = 'var(--red)'
  } else if (recoveryPct < 85) {
    status = 'recovering'
    label = 'Recovering'
    colorVar = 'var(--yellow)'
  }

  return {
    recoveryPct,
    status,
    label,
    colorVar,
  }
}

/**
 * Hevy Personal Records (PR) scanner for an exercise.
 * Scans historical workouts for all-time bests.
 */
export function calcExercisePersonalRecords(exerciseId, workouts = []) {
  let heaviest = { weight: 0, reps: 0, date: null, workoutId: null }
  let bestE1RM = { e1rm: 0, weight: 0, reps: 0, date: null, workoutId: null }
  let maxSetVolume = { volume: 0, weight: 0, reps: 0, date: null, workoutId: null }

  for (const w of workouts) {
    const d = w.d || ''
    for (const entry of w.entries || []) {
      if (entry.id === exerciseId || entry.exercise?.id === exerciseId) {
        for (const set of entry.sets || []) {
          if (set && set.done === true && !isWarmupRow(set)) {
            const weight = Number(set.w) || 0
            const reps = Number(set.r) || 0
            if (weight <= 0 || reps <= 0) continue

            // Heaviest Weight PR
            if (weight > heaviest.weight || (weight === heaviest.weight && reps > heaviest.reps)) {
              heaviest = { weight, reps, date: d, workoutId: w.id }
            }

            // Best Estimated 1RM
            const e1rm = calcE1RM(weight, reps)
            if (e1rm > bestE1RM.e1rm) {
              bestE1RM = { e1rm, weight, reps, date: d, workoutId: w.id }
            }

            // Max Set Volume
            const setVol = weight * reps
            if (setVol > maxSetVolume.volume) {
              maxSetVolume = { volume: setVol, weight, reps, date: d, workoutId: w.id }
            }
          }
        }
      }
    }
  }

  return {
    heaviest,
    bestE1RM,
    maxSetVolume,
  }
}
