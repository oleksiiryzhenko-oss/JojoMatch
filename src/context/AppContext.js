import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import DEFAULT_EXERCISES from '../data/exercises';
import DEFAULT_TEMPLATES from '../data/templates';
import { genId, dayKey } from '../utils/helpers';
import { buildSessionFromTemplate, summarizeItem } from '../utils/workout';
import { requestNotificationPermission, syncWeeklyReminders, cancelRestEnd } from '../utils/notifications';
import { setHapticsEnabled, hapticTap } from '../utils/haptics';

const AppContext = createContext();

export const BACKUP_VERSION = 1;

export const MEASURE_FIELDS = [
  { key: 'weight', label: 'Kilo', unit: 'kg' },
  { key: 'bodyFat', label: 'Yağ oranı', unit: '%' },
  { key: 'chest', label: 'Göğüs', unit: 'cm' },
  { key: 'waist', label: 'Bel', unit: 'cm' },
  { key: 'hips', label: 'Kalça', unit: 'cm' },
  { key: 'arm', label: 'Kol', unit: 'cm' },
  { key: 'thigh', label: 'Bacak', unit: 'cm' },
  { key: 'calf', label: 'Baldır', unit: 'cm' },
  { key: 'neck', label: 'Boyun', unit: 'cm' },
];

const DEFAULT_SETTINGS = {
  onboarded: false,
  name: '',
  restSeconds: 90,
  askWellbeing: true,
  measureFields: ['weight', 'waist', 'chest', 'arm'],
  weeklyTarget: 3,
  notificationsEnabled: false,
  hapticsEnabled: true,
};

const emptyDay = () => ({ templateIds: [], rest: false, reminder: null });

const DEFAULT_WEEK_PLAN = {
  days: { 0: emptyDay(), 1: emptyDay(), 2: emptyDay(), 3: emptyDay(), 4: emptyDay(), 5: emptyDay(), 6: emptyDay() },
};

const STORAGE_KEYS = {
  settings: 'settings',
  exercises: 'exercises',
  templates: 'templates',
  weekPlan: 'weekPlan',
  scheduleEdits: 'scheduleEdits',
  sessions: 'sessions',
  activeSession: 'activeSession',
  goals: 'goals',
  measurements: 'measurements',
  challenges: 'challenges',
};

const usePersist = (key, value, hydrated) => {
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(key, JSON.stringify(value)).catch((e) => console.log(`Error saving ${key}:`, e));
  }, [key, value, hydrated]);
};

const now = () => new Date().toISOString();

export const AppProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [weekPlan, setWeekPlan] = useState(DEFAULT_WEEK_PLAN);
  const [scheduleEdits, setScheduleEdits] = useState({});
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [goals, setGoals] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [challenges, setChallenges] = useState([]);

  const [hydrated, setHydrated] = useState(false);

  const applyData = useCallback((data) => {
    setSettings({ ...DEFAULT_SETTINGS, ...(data.settings || {}) });
    setExercises(data.exercises || DEFAULT_EXERCISES);
    setTemplates(data.templates || DEFAULT_TEMPLATES);
    setWeekPlan({ days: { ...DEFAULT_WEEK_PLAN.days, ...(data.weekPlan?.days || {}) } });
    setScheduleEdits(data.scheduleEdits || {});
    setSessions(data.sessions || []);
    setActiveSession(data.activeSession || null);
    setGoals(data.goals || []);
    setMeasurements(data.measurements || []);
    setChallenges(data.challenges || []);
  }, []);

  // LOAD
  useEffect(() => {
    const loadData = async () => {
      try {
        const entries = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
        const data = Object.fromEntries(entries.map(([k, v]) => [k, v ? JSON.parse(v) : null]));
        applyData(data);
      } catch (e) {
        console.log('Error loading data:', e);
      } finally {
        setHydrated(true);
      }
    };

    loadData();
  }, [applyData]);

  // SAVE — one effect per key so a fast sequence of updates never gets dropped
  usePersist(STORAGE_KEYS.settings, settings, hydrated);
  usePersist(STORAGE_KEYS.exercises, exercises, hydrated);
  usePersist(STORAGE_KEYS.templates, templates, hydrated);
  usePersist(STORAGE_KEYS.weekPlan, weekPlan, hydrated);
  usePersist(STORAGE_KEYS.scheduleEdits, scheduleEdits, hydrated);
  usePersist(STORAGE_KEYS.sessions, sessions, hydrated);
  usePersist(STORAGE_KEYS.activeSession, activeSession, hydrated);
  usePersist(STORAGE_KEYS.goals, goals, hydrated);
  usePersist(STORAGE_KEYS.measurements, measurements, hydrated);
  usePersist(STORAGE_KEYS.challenges, challenges, hydrated);

  /* ================= LOOKUPS ================= */
  const exercisesById = useMemo(() => Object.fromEntries(exercises.map((e) => [e.id, e])), [exercises]);
  const templatesById = useMemo(() => Object.fromEntries(templates.map((t) => [t.id, t])), [templates]);

  /* ================= DEVICE SYNC ================= */
  useEffect(() => {
    setHapticsEnabled(settings.hapticsEnabled);
  }, [settings.hapticsEnabled]);

  // Keep scheduled weekly reminders in line with the plan
  useEffect(() => {
    if (!hydrated) return;
    syncWeeklyReminders({ enabled: settings.notificationsEnabled, weekPlan, templatesById });
  }, [hydrated, settings.notificationsEnabled, weekPlan, templatesById]);
  const activeExercises = useMemo(() => exercises.filter((e) => !e.archived), [exercises]);

  /* ================= SETTINGS ================= */
  const updateSettings = (fields) => setSettings((prev) => ({ ...prev, ...fields }));

  // Asks for permission and turns reminders on; returns 'granted' | 'denied' | 'blocked'
  const enableNotifications = async () => {
    const status = await requestNotificationPermission();
    updateSettings({ notificationsEnabled: status === 'granted' });
    return status;
  };

  /* ================= EXERCISES ================= */
  const addExercise = (exercise) => {
    const id = genId();
    setExercises((prev) => [...prev, { notes: '', ...exercise, id, builtIn: false, createdAt: now() }]);
    return id;
  };

  const updateExercise = (id, fields) =>
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, ...fields } : e)));

  // Soft delete keeps names readable in history
  const archiveExercise = (id) => updateExercise(id, { archived: true });

  /* ================= TEMPLATES ================= */
  const addTemplate = (template) => {
    const id = genId();
    setTemplates((prev) => [...prev, { notes: '', exercises: [], ...template, id, createdAt: now() }]);
    return id;
  };

  const updateTemplate = (id, fields) =>
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields, updatedAt: now() } : t)));

  const duplicateTemplate = (id) => {
    const src = templatesById[id];
    if (!src) return null;
    const newId = genId();
    const copy = {
      ...JSON.parse(JSON.stringify(src)),
      id: newId,
      name: `${src.name} (kopya)`,
      createdAt: now(),
    };
    copy.exercises = copy.exercises.map((it) => ({ ...it, id: genId() }));
    setTemplates((prev) => [...prev, copy]);
    return newId;
  };

  const deleteTemplate = (id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setWeekPlan((prev) => ({
      days: Object.fromEntries(
        Object.entries(prev.days).map(([k, d]) => [k, { ...d, templateIds: d.templateIds.filter((t) => t !== id) }])
      ),
    }));
  };

  // Copies a session's actual results back into its template ("adjust my plan")
  const updateTemplateFromSession = (sessionId) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return null;
    const pick = (s) => {
      const out = {};
      ['weight', 'reps', 'time', 'distance'].forEach((k) => {
        if (s[k] !== null && s[k] !== undefined && s[k] !== '') out[k] = Number(s[k]);
      });
      return out;
    };
    const exercisesFromSession = session.exercises.map((it) => ({
      id: genId(),
      exerciseId: it.exerciseId,
      restSeconds: it.restSeconds,
      note: it.note || '',
      sets: it.sets.map(pick),
    }));
    if (session.templateId && templatesById[session.templateId]) {
      updateTemplate(session.templateId, { exercises: exercisesFromSession });
      return session.templateId;
    }
    return addTemplate({ name: session.name, color: session.color, exercises: exercisesFromSession });
  };

  /* ================= WEEK PLAN ================= */
  const updateDay = (dow, fields) =>
    setWeekPlan((prev) => ({ days: { ...prev.days, [dow]: { ...emptyDay(), ...prev.days[dow], ...fields } } }));

  const editDate = (date, updater) => {
    const key = dayKey(date);
    setScheduleEdits((prev) => {
      const cur = prev[key] || { added: [], removed: [] };
      return { ...prev, [key]: updater({ added: [...(cur.added || [])], removed: [...(cur.removed || [])] }) };
    });
  };

  const addToDate = (date, templateId) =>
    editDate(date, (e) => ({
      added: e.added.includes(templateId) ? e.added : [...e.added, templateId],
      removed: e.removed.filter((id) => id !== templateId),
    }));

  const removeFromDate = (date, templateId) =>
    editDate(date, (e) => ({
      added: e.added.filter((id) => id !== templateId),
      removed: e.removed.includes(templateId) ? e.removed : [...e.removed, templateId],
    }));

  const moveWorkout = (fromDate, toDate, templateId) => {
    removeFromDate(fromDate, templateId);
    addToDate(toDate, templateId);
  };

  /* ================= SESSIONS ================= */
  const startSession = (template = null, plannedDate = null) => {
    const session = buildSessionFromTemplate(template);
    if (plannedDate) session.plannedDate = plannedDate;
    setActiveSession(session);
    return session;
  };

  const updateActiveSession = (updater) =>
    setActiveSession((prev) => (prev ? (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }) : prev));

  const discardSession = () => {
    cancelRestEnd();
    setActiveSession(null);
  };

  const finishSession = (fields = {}) => {
    if (!activeSession) return null;
    cancelRestEnd();
    const endedAt = now();
    const durationSec = Math.round((new Date(endedAt) - new Date(activeSession.startedAt)) / 1000);
    // Drop exercises without any completed set
    const exercisesDone = activeSession.exercises
      .map((it) => ({ ...it, sets: it.sets.filter((s) => s.done) }))
      .filter((it) => summarizeItem(it).sets > 0);
    const finished = { ...activeSession, ...fields, exercises: exercisesDone, endedAt, durationSec };
    setSessions((prev) => [finished, ...prev]);
    setActiveSession(null);
    return finished.id;
  };

  const updateSession = (id, fields) =>
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...fields } : s)));

  const deleteSession = (id) => setSessions((prev) => prev.filter((s) => s.id !== id));

  /* ================= GOALS ================= */
  const addGoal = (goal) => {
    const id = genId();
    setGoals((prev) => [{ entries: [], ...goal, id, createdAt: now() }, ...prev]);
    return id;
  };
  const updateGoal = (id, fields) => setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...fields } : g)));
  const deleteGoal = (id) => setGoals((prev) => prev.filter((g) => g.id !== id));
  const addGoalEntry = (id, value, note = '') =>
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, entries: [...(g.entries || []), { id: genId(), value, note, date: now() }] } : g
      )
    );

  /* ================= MEASUREMENTS ================= */
  const addMeasurement = (m) => {
    const id = genId();
    setMeasurements((prev) => [{ ...m, id, createdAt: now() }, ...prev]);
    return id;
  };
  const updateMeasurement = (id, fields) =>
    setMeasurements((prev) => prev.map((m) => (m.id === id ? { ...m, ...fields } : m)));
  const deleteMeasurement = (id) => setMeasurements((prev) => prev.filter((m) => m.id !== id));

  /* ================= CHALLENGES ================= */
  const addChallenge = (ch) => {
    const id = genId();
    setChallenges((prev) => [{ checkins: [], ...ch, id, createdAt: now() }, ...prev]);
    return id;
  };
  const updateChallenge = (id, fields) =>
    setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, ...fields } : c)));
  const deleteChallenge = (id) => setChallenges((prev) => prev.filter((c) => c.id !== id));
  const toggleCheckin = (id, key = dayKey()) => {
    hapticTap();
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const has = (c.checkins || []).includes(key);
        return { ...c, checkins: has ? c.checkins.filter((k) => k !== key) : [...(c.checkins || []), key] };
      })
    );
  };

  /* ================= BACKUP ================= */
  const exportData = () => ({
    app: 'JojoMatch',
    version: BACKUP_VERSION,
    exportedAt: now(),
    data: {
      settings,
      exercises,
      templates,
      weekPlan,
      scheduleEdits,
      sessions,
      activeSession,
      goals,
      measurements,
      challenges,
    },
  });

  // Throws on invalid input so the caller can show an error
  const importData = (payload) => {
    const data = payload?.data;
    if (payload?.app !== 'JojoMatch' || !data || !Array.isArray(data.sessions)) {
      throw new Error('Geçersiz yedek dosyası');
    }
    applyData({ ...data, settings: { ...(data.settings || {}), onboarded: true } });
  };

  const resetAll = () => applyData({ settings: { onboarded: true, name: settings.name } });

  return (
    <AppContext.Provider
      value={{
        hydrated,

        settings,
        updateSettings,
        enableNotifications,

        exercises,
        activeExercises,
        exercisesById,
        addExercise,
        updateExercise,
        archiveExercise,

        templates,
        templatesById,
        addTemplate,
        updateTemplate,
        duplicateTemplate,
        deleteTemplate,
        updateTemplateFromSession,

        weekPlan,
        scheduleEdits,
        updateDay,
        addToDate,
        removeFromDate,
        moveWorkout,

        sessions,
        activeSession,
        startSession,
        updateActiveSession,
        discardSession,
        finishSession,
        updateSession,
        deleteSession,

        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        addGoalEntry,

        measurements,
        addMeasurement,
        updateMeasurement,
        deleteMeasurement,

        challenges,
        addChallenge,
        updateChallenge,
        deleteChallenge,
        toggleCheckin,

        exportData,
        importData,
        resetAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
