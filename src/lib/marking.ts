// VL1 Marking Scheme calculator
// All times are "HH:MM" 24h strings. Empty/null treated as 0 marks.

const toMin = (t?: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (m || 0);
};

export function sleepMarks(time?: string | null): number {
  const m = toMin(time);
  if (m === null) return 0;
  const adj = m < 12 * 60 ? m + 24 * 60 : m;
  if (adj <= 22 * 60 + 15) return 25;
  if (adj <= 22 * 60 + 30) return 20;
  if (adj <= 22 * 60 + 45) return 15;
  if (adj <= 23 * 60) return 10;
  if (adj <= 23 * 60 + 15) return 5;
  return 0;
}

export function wakeMarks(time?: string | null): number {
  const m = toMin(time);
  if (m === null) return 0;
  if (m <= 4 * 60 + 45) return 25;
  if (m <= 5 * 60) return 20;
  if (m <= 5 * 60 + 15) return 15;
  if (m <= 5 * 60 + 30) return 10;
  if (m <= 5 * 60 + 45) return 5;
  return 0;
}

export function chantingCompletionMarks(time?: string | null): number {
  const m = toMin(time);
  if (m === null) return 0;
  if (m <= 7 * 60 + 15) return 25;
  if (m <= 9 * 60 + 30) return 20;
  if (m <= 13 * 60) return 15;
  if (m <= 19 * 60) return 10;
  if (m <= 21 * 60) return 5;
  if (m <= 23 * 60) return 0;
  return -5;
}

export function chantingRoundsMarks(rounds: number, target: number, sameDay: boolean): number {
  return rounds >= target && sameDay ? 10 : 0;
}

export function dayRestMarks(min: number): number {
  if (!min || min <= 60) return 25;
  if (min <= 75) return 20;
  if (min <= 90) return 15;
  if (min <= 105) return 10;
  if (min <= 120) return 5;
  if (min <= 135) return 0;
  return -5;
}

export function hearingMarks(min: number): number {
  if (!min) return 0;
  if (min < 5) return 0;
  if (min < 10) return 5;
  if (min < 20) return 10;
  if (min < 25) return 15;
  if (min === 25) return 20;
  return 25;
}

export function readingMarks(min: number): number {
  return hearingMarks(min);
}

// New: Study/Job duration in HOURS
export function studyMarks(hours: number): number {
  if (!hours || hours <= 0) return 0;
  if (hours <= 2) return 5;
  if (hours <= 4) return 10;
  if (hours <= 6) return 15;
  if (hours <= 8) return 20;
  return 25;
}

// New: Exercise duration in MINUTES
export function exerciseMarks(min: number): number {
  if (!min || min <= 0) return 0;
  if (min < 10) return 5;
  if (min < 20) return 10;
  if (min < 30) return 15;
  if (min === 30) return 20;
  return 25;
}

// New: Morning Japa attendance + duration
// Full marks (20) for 100–120 mins. Required to qualify for leaderboard rank.
export function morningJapaMarks(attended: boolean, duration: number): { attendance: number; duration: number } {
  const attendance = attended ? 10 : 0;
  let dur = 0;
  if (duration >= 100) dur = 20;        // 100–120 mins → full marks
  else if (duration >= 75) dur = 15;
  else if (duration >= 45) dur = 10;
  else if (duration >= 20) dur = 5;
  return { attendance, duration: dur };
}

// Bhakti Vriksha Level → target rounds
export function targetRoundsForLevel(level?: number | string | null): number {
  const n = typeof level === "string" ? parseInt(level, 10) : level || 0;
  if (n === 1) return 2;
  if (n === 2) return 4;
  if (n === 3) return 8;
  if (n === 4) return 16;
  return 16;
}

export type MarksBreakdown = {
  sleep: number;
  wake: number;
  chanting_completion: number;
  chanting_rounds: number;
  day_rest: number;
  hearing: number;
  reading: number;
  study: number;
  exercise: number;
  morning_japa_attendance: number;
  morning_japa_duration: number;
  weekly_bonus: number;
  total: number;
  max: number;
  percentage: number;
};

export function calculateMarks(input: {
  sleep_time?: string | null;
  wake_up_time?: string | null;
  chanting_completion_time?: string | null;
  japa_rounds?: number | null;
  target_rounds?: number | null;
  day_rest_minutes?: number | null;
  hearing_minutes?: number | null;
  reading_minutes?: number | null;
  study_hours?: number | null;
  exercise_minutes?: number | null;
  morning_japa_attended?: boolean;
  morning_japa_duration?: number | null;
  weekly_bonus?: number | null;
  same_day?: boolean;
}): MarksBreakdown {
  const sleep = sleepMarks(input.sleep_time);
  const wake = wakeMarks(input.wake_up_time);
  const cc = chantingCompletionMarks(input.chanting_completion_time);
  const cr = chantingRoundsMarks(
    input.japa_rounds || 0,
    input.target_rounds || 16,
    input.same_day ?? true
  );
  const dr = dayRestMarks(input.day_rest_minutes || 0);
  const hm = hearingMarks(input.hearing_minutes || 0);
  const rm = readingMarks(input.reading_minutes || 0);
  const st = studyMarks(input.study_hours || 0);
  const ex = exerciseMarks(input.exercise_minutes || 0);
  const mj = morningJapaMarks(!!input.morning_japa_attended, input.morning_japa_duration || 0);
  const bonus = input.weekly_bonus || 0;
  const total = sleep + wake + cc + cr + dr + hm + rm + st + ex + mj.attendance + mj.duration + bonus;
  // Max marks (without bonus): 25+25+25+10+25+25+25+25+25+10+20 = 240
  const max = 240;
  const percentage = Math.round((total / max) * 100);
  return {
    sleep, wake, chanting_completion: cc, chanting_rounds: cr,
    day_rest: dr, hearing: hm, reading: rm,
    study: st, exercise: ex,
    morning_japa_attendance: mj.attendance, morning_japa_duration: mj.duration,
    weekly_bonus: bonus,
    total, max, percentage,
  };
}

export const POSITIVE_CHETNA = [
  "Appreciative", "Compassionate", "Detached", "Determined",
  "Disciplined", "Enthusiastic", "Humble", "Spiritually Absorbed", "Valued Association",
];

export const NEGATIVE_CHETNA = [
  "Angry", "Egoistic", "Envious", "Greedy", "Lazy",
  "Lusty", "Offensive", "Over Eating", "Time Wasting",
];
