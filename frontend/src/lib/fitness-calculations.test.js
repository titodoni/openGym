import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  calcE1RM,
  calcWorkoutSessionStats,
  calcWorkoutDelta,
  calcMuscleRecoveryState,
  calcExercisePersonalRecords
} from './fitness-calculations.js'

describe('Fitbod & Hevy Calculations', () => {
  describe('calcE1RM', () => {
    it('returns exact weight for 1 rep', () => {
      assert.equal(calcE1RM(100, 1), 100)
    })

    it('calculates Epley formula correctly', () => {
      // 60kg x 4 reps: 60 * (1 + 4/30) = 60 * 1.13333 = 68.0 kg (Tito's Hevy PR)
      assert.equal(calcE1RM(60, 4), 68.0)
      // 70kg x 6 reps: 70 * (1 + 6/30) = 70 * 1.2 = 84.0 kg (Tito's Squat PR)
      assert.equal(calcE1RM(70, 6), 84.0)
      // 70kg x 10 reps: 70 * (1 + 10/30) = 70 * 1.3333 = 93.3 kg (Tito's RDL PR)
      assert.equal(calcE1RM(70, 10), 93.3)
    })

    it('handles zero or negative inputs cleanly', () => {
      assert.equal(calcE1RM(0, 5), 0)
      assert.equal(calcE1RM(50, 0), 0)
    })
  })

  describe('calcWorkoutSessionStats', () => {
    it('computes volume, density, intensity, sets, reps accurately', () => {
      const mockWorkout = {
        start: 1000000,
        end: 1000000 + 60 * 60000, // 60 min
        entries: [
          {
            id: '0025',
            sets: [
              { w: 50, r: 10, done: true }, // 500
              { w: 50, r: 10, done: true }, // 500
              { w: 50, r: 10, done: false }, // skipped
            ]
          },
          {
            id: '0027',
            sets: [
              { w: 40, r: 10, done: true }, // 400
              { w: 20, r: 10, done: true, warmup: true }, // warmup excluded
            ]
          }
        ]
      }

      const stats = calcWorkoutSessionStats(mockWorkout)
      assert.equal(stats.volume, 1400) // 500 + 500 + 400
      assert.equal(stats.sets, 3)
      assert.equal(stats.reps, 30)
      assert.equal(stats.durationMin, 60)
      assert.equal(stats.avgIntensity, 46.7) // 1400 / 30 = 46.666... -> 46.7
      assert.equal(stats.density, 23) // 1400 / 60 = 23.33 -> 23
    })
  })

  describe('calcWorkoutDelta', () => {
    it('computes session-to-session deltas', () => {
      const current = { volume: 3815, reps: 68, durationMin: 54, avgIntensity: 56.1 }
      const previous = { volume: 3215, reps: 64, durationMin: 66, avgIntensity: 50.2 }

      const delta = calcWorkoutDelta(current, previous)
      assert.equal(delta.volDelta, 600)
      assert.equal(delta.repsDelta, 4)
      assert.equal(delta.durDelta, -12) // 12 min faster
      assert.equal(delta.intensityDelta, 5.9)
    })
  })

  describe('calcMuscleRecoveryState', () => {
    it('maps fatigue to recovery bands correctly', () => {
      // 0 fatigue -> 100% Fresh
      const fresh = calcMuscleRecoveryState(0)
      assert.equal(fresh.recoveryPct, 100)
      assert.equal(fresh.status, 'ready')

      // 0.25 fatigue -> 75% Recovering
      const rec = calcMuscleRecoveryState(0.25)
      assert.equal(rec.recoveryPct, 75)
      assert.equal(rec.status, 'recovering')

      // 0.6 fatigue -> 40% Fatigued
      const fat = calcMuscleRecoveryState(0.6)
      assert.equal(fat.recoveryPct, 40)
      assert.equal(fat.status, 'fatigued')
    })
  })

  describe('calcExercisePersonalRecords', () => {
    it('finds heaviest weight and best 1RM', () => {
      const mockWorkouts = [
        {
          id: 'w1',
          d: '2025-05-10',
          entries: [{ id: 'bench', sets: [{ w: 50, r: 8, done: true }] }] // e1rm 63.3
        },
        {
          id: 'w2',
          d: '2025-09-23',
          entries: [{ id: 'bench', sets: [{ w: 60, r: 4, done: true }] }] // e1rm 68.0
        }
      ]

      const prs = calcExercisePersonalRecords('bench', mockWorkouts)
      assert.equal(prs.heaviest.weight, 60)
      assert.equal(prs.heaviest.reps, 4)
      assert.equal(prs.bestE1RM.e1rm, 68.0)
    })
  })
})
