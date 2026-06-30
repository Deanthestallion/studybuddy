/**
 * SuperMemo-2 spaced repetition. Given the current scheduling state of a card
 * and a recall grade (0–5), returns the next state. Grades below 3 lapse the
 * card (repetitions reset, review again tomorrow).
 *
 * Reference: https://super-memory.com/english/ol/sm2.htm
 */
export interface Sm2State {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface Sm2Result extends Sm2State {
  dueAt: Date;
}

export function sm2(state: Sm2State, grade: number, now = new Date()): Sm2Result {
  let { easeFactor, intervalDays, repetitions } = state;

  if (grade >= 3) {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const dueAt = new Date(now.getTime() + intervalDays * 86_400_000);
  return { easeFactor, intervalDays, repetitions, dueAt };
}
