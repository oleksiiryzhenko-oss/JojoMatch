import { EXERCISE_TYPES } from '../data/exercises';
import {
  genId,
  dayKey,
  fromDayKey,
  addDays,
  startOfDay,
  startOfWeek,
  daysBetween,
  fmtNum,
  formatSeconds,
} from './helpers';

// ================= SETS =================
export const typeFields = (type) => EXERCISE_TYPES[type]?.fields || EXERCISE_TYPES.weight.fields;

const num = (v) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : 0);

// Human-readable set, e.g. "40 kg × 10", "3 km · 20:00", "0:45"
export const formatSet = (set, type) => {
  if (!set) return '—';
  switch (type) {
    case 'reps':
      return `${num(set.reps)} tekrar`;
    case 'time':
      return formatSeconds(set.time);
    case 'distance': {
      const parts = [`${fmtNum(num(set.distance), 2)} km`];
      if (num(set.time)) parts.push(formatSeconds(set.time));
      return parts.join(' · ');
    }
    default:
      return `${fmtNum(num(set.weight))} kg × ${num(set.reps)}`;
  }
};

// Epley one-rep-max estimate
export const estimate1RM = (weight, reps) => {
  const w = num(weight);
  const r = num(reps);
  if (!w || !r) return 0;
  if (r === 1) return w;
  return w * (1 + r / 30);
};

// Creates a session exercise item from a template item (or a bare exercise)
export const makeSessionItem = (exerciseId, templateSets = [{}], restSeconds = 90, note = '') => ({
  id: genId(),
  exerciseId,
  restSeconds,
  note,
  sets: (templateSets.length ? templateSets : [{}]).map((s) => ({
    id: genId(),
    target: { ...s },
    weight: s.weight ?? null,
    reps: s.reps ?? null,
    time: s.time ?? null,
    distance: s.distance ?? null,
    done: false,
  })),
});

export const buildSessionFromTemplate = (template) => ({
  id: genId(),
  templateId: template?.id || null,
  name: template?.name || 'Serbest Antrenman',
  color: template?.color || null,
  startedAt: new Date().toISOString(),
  plannedDate: dayKey(),
  exercises: (template?.exercises || []).map((it) => makeSessionItem(it.exerciseId, it.sets, it.restSeconds, it.note)),
  note: '',
  wellbeingBefore: null,
  wellbeingAfter: null,
});

// ================= SUMMARIES =================
export const summarizeItem = (item) => {
  const done = (item?.sets || []).filter((s) => s.done);
  const res = {
    sets: done.length,
    totalSets: item?.sets?.length || 0,
    reps: 0,
    volume: 0,
    time: 0,
    distance: 0,
    bestWeight: 0,
    bestReps: 0,
    bestTime: 0,
    bestDistance: 0,
    best1RM: 0,
    bestSet: null,
  };
  done.forEach((s) => {
    const w = num(s.weight);
    const r = num(s.reps);
    const t = num(s.time);
    const d = num(s.distance);
    res.reps += r;
    res.volume += w * r;
    res.time += t;
    res.distance += d;
    res.bestReps = Math.max(res.bestReps, r);
    res.bestTime = Math.max(res.bestTime, t);
    res.bestDistance = Math.max(res.bestDistance, d);
    const e1 = estimate1RM(w, r);
    if (w > res.bestWeight || (w === res.bestWeight && r > num(res.bestSet?.reps))) {
      res.bestWeight = w;
      res.bestSet = s;
    }
    res.best1RM = Math.max(res.best1RM, e1);
  });
  if (!res.bestSet && done.length) res.bestSet = done[done.length - 1];
  return res;
};

export const summarizeSession = (session) => {
  const out = { sets: 0, totalSets: 0, reps: 0, volume: 0, distance: 0, exercises: 0 };
  (session?.exercises || []).forEach((it) => {
    const s = summarizeItem(it);
    out.sets += s.sets;
    out.totalSets += s.totalSets;
    out.reps += s.reps;
    out.volume += s.volume;
    out.distance += s.distance;
    if (s.sets) out.exercises += 1;
  });
  return out;
};

// Main metric used for charts & comparisons per exercise type
export const primaryMetric = (type) => {
  switch (type) {
    case 'reps':
      return { key: 'bestReps', label: 'En çok tekrar', format: (v) => `${Math.round(v)}` };
    case 'time':
      return { key: 'bestTime', label: 'En uzun süre', format: (v) => formatSeconds(v) };
    case 'distance':
      return { key: 'bestDistance', label: 'En uzun mesafe', format: (v) => `${fmtNum(v, 2)} km` };
    default:
      return { key: 'bestWeight', label: 'En yüksek ağırlık', format: (v) => `${fmtNum(v)} kg` };
  }
};

// ================= HISTORY =================
export const sortedSessions = (sessions) =>
  [...sessions].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

// Every completed entry of one exercise, newest first
export const getExerciseHistory = (sessions, exerciseId) => {
  const out = [];
  sortedSessions(sessions).forEach((session) => {
    (session.exercises || []).forEach((item) => {
      if (item.exerciseId !== exerciseId) return;
      const summary = summarizeItem(item);
      if (summary.sets) out.push({ session, item, summary });
    });
  });
  return out;
};

export const getPersonalRecords = (sessions, exerciseId) => {
  const rec = {
    bestWeight: null,
    bestReps: null,
    bestTime: null,
    bestDistance: null,
    best1RM: null,
    volume: null,
  };
  getExerciseHistory(sessions, exerciseId).forEach(({ session, summary }) => {
    const check = (key, value) => {
      if (value > 0 && (!rec[key] || value > rec[key].value)) rec[key] = { value, date: session.startedAt };
    };
    check('bestWeight', summary.bestWeight);
    check('bestReps', summary.bestReps);
    check('bestTime', summary.bestTime);
    check('bestDistance', summary.bestDistance);
    check('best1RM', summary.best1RM);
    check('volume', summary.volume);
  });
  return rec;
};

// Records set in `session` compared to everything that happened before it
export const detectNewRecords = (session, sessions, exercisesById) => {
  const before = sessions.filter(
    (s) => s.id !== session.id && new Date(s.startedAt) < new Date(session.startedAt)
  );
  const out = [];
  (session.exercises || []).forEach((item) => {
    const ex = exercisesById[item.exerciseId];
    if (!ex) return;
    const cur = summarizeItem(item);
    if (!cur.sets) return;
    const prev = getPersonalRecords(before, item.exerciseId);
    const hadHistory = Object.values(prev).some(Boolean);
    if (!hadHistory) return;
    const metric = primaryMetric(ex.type);
    const prevVal = prev[metric.key]?.value || 0;
    if (cur[metric.key] > prevVal) {
      out.push({ exerciseId: ex.id, name: ex.name, label: metric.label, value: metric.format(cur[metric.key]) });
    } else if (ex.type === 'weight' && cur.volume > (prev.volume?.value || 0)) {
      out.push({ exerciseId: ex.id, name: ex.name, label: 'En yüksek hacim', value: `${fmtNum(cur.volume, 0)} kg` });
    }
  });
  return out;
};

// Previous completed entry of the same exercise before `session`
export const previousEntry = (sessions, exerciseId, beforeSession) => {
  const limit = beforeSession ? new Date(beforeSession.startedAt) : new Date();
  return getExerciseHistory(sessions, exerciseId).find(
    ({ session }) => session.id !== beforeSession?.id && new Date(session.startedAt) < limit
  );
};

// Per-exercise comparison of a session against the previous time each exercise was done
export const compareSession = (session, sessions, exercisesById) =>
  (session.exercises || [])
    .map((item) => {
      const ex = exercisesById[item.exerciseId];
      const cur = summarizeItem(item);
      const prev = previousEntry(sessions, item.exerciseId, session);
      const metric = primaryMetric(ex?.type);
      return {
        item,
        exercise: ex,
        current: cur,
        previous: prev?.summary || null,
        previousDate: prev?.session.startedAt || null,
        metric,
        diff: prev ? cur[metric.key] - prev.summary[metric.key] : null,
        volumeDiff: prev && ex?.type === 'weight' ? cur.volume - prev.summary.volume : null,
      };
    })
    .filter((c) => c.current.sets);

// ================= PLAN =================
// weekPlan: { days: { [weekday]: { templateIds: [], rest: bool, reminder: 'HH:MM' | null } } }
// scheduleEdits: { [YYYY-MM-DD]: { added: [templateId], removed: [templateId] } }
export const getDayConfig = (weekPlan, date) => {
  const dow = new Date(date).getDay();
  return weekPlan?.days?.[dow] || { templateIds: [], rest: false, reminder: null };
};

export const getPlannedForDate = (weekPlan, scheduleEdits, date) => {
  const key = dayKey(date);
  const edit = scheduleEdits?.[key] || { added: [], removed: [] };
  const base = getDayConfig(weekPlan, date).templateIds || [];
  const list = base.filter((id) => !(edit.removed || []).includes(id));
  (edit.added || []).forEach((id) => {
    if (!list.includes(id)) list.push(id);
  });
  return list;
};

export const sessionsOnDate = (sessions, date) => {
  const key = dayKey(date);
  return sessions.filter((s) => (s.plannedDate || dayKey(s.startedAt)) === key || dayKey(s.startedAt) === key);
};

export const isPlannedDone = (sessions, date, templateId) =>
  sessionsOnDate(sessions, date).some((s) => s.templateId === templateId);

// Planned workouts in the last `daysBack` days that were neither done, skipped nor moved
export const getMissedWorkouts = (weekPlan, scheduleEdits, sessions, templatesById, daysBack = 7) => {
  const out = [];
  const today = startOfDay();
  for (let i = daysBack; i >= 1; i--) {
    const date = addDays(today, -i);
    getPlannedForDate(weekPlan, scheduleEdits, date).forEach((templateId) => {
      if (!templatesById[templateId]) return;
      if (isPlannedDone(sessions, date, templateId)) return;
      out.push({ date: dayKey(date), templateId });
    });
  }
  return out;
};

// ================= STATS =================
export const workoutDays = (sessions) => new Set(sessions.map((s) => dayKey(s.startedAt)));

// Consecutive weeks (ending this or last week) with at least one workout
export const weekStreak = (sessions) => {
  if (!sessions.length) return 0;
  const weeks = new Set(sessions.map((s) => dayKey(startOfWeek(s.startedAt))));
  let cursor = startOfWeek();
  if (!weeks.has(dayKey(cursor))) cursor = addDays(cursor, -7);
  let streak = 0;
  while (weeks.has(dayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -7);
  }
  return streak;
};

export const sessionsInRange = (sessions, from, to) => {
  const a = startOfDay(from).getTime();
  const b = startOfDay(addDays(to, 1)).getTime();
  return sessions.filter((s) => {
    const t = new Date(s.startedAt).getTime();
    return t >= a && t < b;
  });
};

export const totalDuration = (sessions) => sessions.reduce((acc, s) => acc + (s.durationSec || 0), 0);

// ================= GOALS =================
export const GOAL_TYPES = {
  workouts: { key: 'workouts', label: 'Antrenman sayısı', unit: 'antrenman', hint: 'Örn. ayda 12 antrenman' },
  exercise: { key: 'exercise', label: 'Egzersiz rekoru', unit: '', hint: 'Örn. Squat 100 kg' },
  minutes: { key: 'minutes', label: 'Toplam süre', unit: 'dk', hint: 'Örn. bu ay 600 dakika' },
  bodyweight: { key: 'bodyweight', label: 'Vücut ağırlığı', unit: 'kg', hint: 'Örn. 75 kg’a ulaşmak' },
  custom: { key: 'custom', label: 'Kişisel hedef', unit: '', hint: 'Kendi ölçünü belirle' },
};

const inGoalRange = (goal, date) => {
  const t = startOfDay(date).getTime();
  if (goal.startDate && t < fromDayKey(goal.startDate).getTime()) return false;
  if (goal.deadline && t > fromDayKey(goal.deadline).getTime()) return false;
  return true;
};

export const goalProgress = (goal, { sessions, measurements, exercisesById }) => {
  const target = Number(goal.target) || 0;
  let current = 0;
  let start = 0;
  let unit = goal.unit || GOAL_TYPES[goal.type]?.unit || '';
  let format = (v) => fmtNum(v);

  switch (goal.type) {
    case 'workouts':
      current = sessions.filter((s) => inGoalRange(goal, s.startedAt)).length;
      format = (v) => `${Math.round(v)}`;
      break;
    case 'minutes':
      current = Math.round(totalDuration(sessions.filter((s) => inGoalRange(goal, s.startedAt))) / 60);
      format = (v) => `${Math.round(v)}`;
      break;
    case 'exercise': {
      const ex = exercisesById[goal.exerciseId];
      const metric = primaryMetric(ex?.type);
      const recs = getPersonalRecords(sessions, goal.exerciseId);
      current = recs[metric.key]?.value || 0;
      start = Number(goal.startValue) || 0;
      if (ex?.type === 'time') {
        unit = '';
        format = (v) => formatSeconds(v);
      } else unit = ex?.type === 'reps' ? 'tekrar' : ex?.type === 'distance' ? 'km' : 'kg';
      break;
    }
    case 'bodyweight': {
      const withWeight = [...measurements]
        .filter((m) => m.values?.weight)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      current = withWeight[0]?.values.weight ?? Number(goal.startValue) ?? 0;
      start = Number(goal.startValue) || current;
      break;
    }
    default:
      current = (goal.entries || []).reduce((acc, e) => acc + (Number(e.value) || 0), 0);
  }

  let pct;
  if (goal.type === 'bodyweight' || goal.type === 'exercise') {
    const span = target - start;
    pct = span === 0 ? (current === target ? 1 : 0) : (current - start) / span;
  } else {
    pct = target ? current / target : 0;
  }
  pct = Math.max(0, Math.min(1, pct || 0));

  const daysLeft = goal.deadline ? daysBetween(new Date(), fromDayKey(goal.deadline)) : null;
  return { current, target, pct, unit, format, daysLeft, reached: pct >= 1 };
};

// ================= CHALLENGES =================
// challenge: { startDate, endDate, frequency: 'daily' | 'weekly', timesPerWeek, checkins: [YYYY-MM-DD] }
export const challengeProgress = (ch) => {
  const start = fromDayKey(ch.startDate);
  const end = fromDayKey(ch.endDate);
  const totalDays = Math.max(1, daysBetween(start, end) + 1);
  const checkins = (ch.checkins || []).filter((k) => k >= ch.startDate && k <= ch.endDate);

  let required;
  let done;
  if (ch.frequency === 'weekly') {
    const perWeek = Math.max(1, Number(ch.timesPerWeek) || 1);
    const weeks = Math.ceil(totalDays / 7);
    required = weeks * perWeek;
    const byWeek = {};
    checkins.forEach((k) => {
      const w = Math.floor(daysBetween(start, fromDayKey(k)) / 7);
      byWeek[w] = (byWeek[w] || 0) + 1;
    });
    done = Object.values(byWeek).reduce((acc, n) => acc + Math.min(n, perWeek), 0);
  } else {
    required = totalDays;
    done = checkins.length;
  }

  const today = dayKey();
  const status = today < ch.startDate ? 'upcoming' : today > ch.endDate ? 'ended' : 'active';
  const elapsedDays = Math.min(totalDays, Math.max(0, daysBetween(start, new Date()) + 1));
  return {
    required,
    done,
    pct: Math.min(1, done / required),
    totalDays,
    elapsedDays,
    daysLeft: Math.max(0, daysBetween(new Date(), end)),
    status,
    checkedToday: checkins.includes(today),
    completed: done >= required,
  };
};
