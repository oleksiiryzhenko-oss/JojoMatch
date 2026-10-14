import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Plus,
  Target,
  Ruler,
  Trophy,
  Flame,
  Clock,
  Dumbbell,
  CalendarCheck,
  ChevronRight,
  CheckCircle2,
  HeartPulse,
} from 'lucide-react-native';

import colors from '../utils/colors';
import {
  dayKey,
  addDays,
  startOfMonth,
  formatDuration,
  formatShortDate,
  fromDayKey,
  formatDate,
  fmtBig,
  fmtNum,
  parseNum,
} from '../utils/helpers';
import {
  sessionsInRange,
  totalDuration,
  summarizeSession,
  weekStreak,
  getPlannedForDate,
  isPlannedDone,
  getPersonalRecords,
  primaryMetric,
  goalProgress,
  GOAL_TYPES,
  sortedSessions,
} from '../utils/workout';
import { useApp, MEASURE_FIELDS } from '../context/AppContext';
import { Screen, Header, Segmented, Card, SectionHeader, ProgressBar, EmptyState, Button, IconButton, Stat, Field } from '../components/ui';
import MonthCalendar from '../components/MonthCalendar';
import LineChart from '../components/LineChart';
import Sheet from '../components/Sheet';

const ProgressScreen = ({ navigation }) => {
  const [tab, setTab] = useState('summary');

  const addAction = {
    goals: () => navigation.navigate('GoalEditor'),
    body: () => navigation.navigate('MeasurementEditor'),
  }[tab];

  return (
    <Screen>
      <Header
        title="İlerleme"
        right={
          addAction ? (
            <IconButton icon={Plus} bg={colors.primary} color={colors.onPrimary} onPress={addAction} label="Ekle" />
          ) : null
        }
      />
      <Segmented
        style={styles.segmented}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'summary', label: 'Özet' },
          { value: 'goals', label: 'Hedefler' },
          { value: 'body', label: 'Vücut' },
        ]}
      />
      {tab === 'summary' ? <Summary navigation={navigation} /> : null}
      {tab === 'goals' ? <Goals navigation={navigation} /> : null}
      {tab === 'body' ? <Body navigation={navigation} /> : null}
    </Screen>
  );
};

/* ================= SUMMARY ================= */
const Summary = ({ navigation }) => {
  const { sessions, weekPlan, scheduleEdits, exercisesById, templatesById } = useApp();
  const [month, setMonth] = useState(startOfMonth());
  const [selected, setSelected] = useState(dayKey());

  const monthEnd = addDays(new Date(month.getFullYear(), month.getMonth() + 1, 1), -1);
  const monthSessions = sessionsInRange(sessions, month, monthEnd);
  const monthVolume = monthSessions.reduce((acc, s) => acc + summarizeSession(s).volume, 0);
  const streak = weekStreak(sessions);

  const marks = useMemo(() => {
    const m = {};
    const todayKey = dayKey();
    const gridStart = addDays(month, -7);
    for (let i = 0; i < 49; i++) {
      const d = addDays(gridStart, i);
      const key = dayKey(d);
      const planned = getPlannedForDate(weekPlan, scheduleEdits, d).filter((id) => templatesById[id]);
      if (planned.length) {
        const allDone = planned.every((id) => isPlannedDone(sessions, d, id));
        if (!allDone) m[key] = key < todayKey ? 'missed' : 'planned';
      }
    }
    sessions.forEach((s) => {
      m[dayKey(s.startedAt)] = 'done';
    });
    return m;
  }, [month, weekPlan, scheduleEdits, sessions, templatesById]);

  const selectedSessions = sortedSessions(sessions).filter((s) => dayKey(s.startedAt) === selected);
  const selectedPlanned = getPlannedForDate(weekPlan, scheduleEdits, fromDayKey(selected)).filter(
    (id) => templatesById[id] && !isPlannedDone(sessions, fromDayKey(selected), id)
  );

  const prList = useMemo(() => {
    const ids = [...new Set(sessions.flatMap((s) => s.exercises.map((it) => it.exerciseId)))];
    return ids
      .map((id) => {
        const ex = exercisesById[id];
        if (!ex) return null;
        const metric = primaryMetric(ex.type);
        const rec = getPersonalRecords(sessions, id)[metric.key];
        return rec ? { ex, metric, rec } : null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.rec.date) - new Date(a.rec.date))
      .slice(0, 8);
  }, [sessions, exercisesById]);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.tiles}>
        <View style={styles.tile}>
          <CalendarCheck color={colors.primary} size={18} />
          <Text style={styles.tileValue}>{monthSessions.length}</Text>
          <Text style={styles.tileLabel}>Bu ay antrenman</Text>
        </View>
        <View style={styles.tile}>
          <Clock color={colors.info} size={18} />
          <Text style={styles.tileValue}>{formatDuration(totalDuration(monthSessions))}</Text>
          <Text style={styles.tileLabel}>Bu ay süre</Text>
        </View>
        <View style={styles.tile}>
          <Dumbbell color={colors.warning} size={18} />
          <Text style={styles.tileValue}>{fmtBig(monthVolume)}</Text>
          <Text style={styles.tileLabel}>Bu ay hacim (kg)</Text>
        </View>
        <View style={styles.tile}>
          <Flame color={colors.danger} size={18} />
          <Text style={styles.tileValue}>{streak} hafta</Text>
          <Text style={styles.tileLabel}>Seri</Text>
        </View>
      </View>

      <Card style={{ marginTop: 12 }}>
        <View style={styles.totalRow}>
          <Stat label="Toplam antrenman" value={`${sessions.length}`} accent />
          <Stat label="Toplam süre" value={formatDuration(totalDuration(sessions))} />
        </View>
      </Card>

      <SectionHeader title="Takvim" action="Tüm geçmiş" onAction={() => navigation.navigate('History')} />
      <Card>
        <MonthCalendar month={month} onMonthChange={setMonth} marks={marks} selected={selected} onSelect={setSelected} />
      </Card>

      <Text style={styles.dayTitle}>{formatShortDate(fromDayKey(selected))}</Text>
      {selectedSessions.map((s) => (
        <TouchableOpacity
          key={s.id}
          style={styles.sessionRow}
          onPress={() => navigation.navigate('SessionDetail', { sessionId: s.id })}
          activeOpacity={0.85}
        >
          <CheckCircle2 color={colors.primary} size={20} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionName}>{s.name}</Text>
            <Text style={styles.sessionMeta}>
              {formatDuration(s.durationSec)} · {summarizeSession(s).sets} set
            </Text>
          </View>
          <ChevronRight color={colors.textMuted} size={18} />
        </TouchableOpacity>
      ))}
      {selectedPlanned.map((id) => (
        <View key={id} style={[styles.sessionRow, { opacity: 0.7 }]}>
          <View style={styles.plannedDot} />
          <Text style={[styles.sessionName, { flex: 1 }]}>{templatesById[id].name}</Text>
          <Text style={styles.sessionMeta}>{selected < dayKey() ? 'Kaçırıldı' : 'Planlı'}</Text>
        </View>
      ))}
      {!selectedSessions.length && !selectedPlanned.length ? <Text style={styles.muted}>Bu gün kayıt yok.</Text> : null}

      <SectionHeader title="Kişisel rekorlar" />
      {prList.length ? (
        prList.map(({ ex, metric, rec }) => (
          <TouchableOpacity
            key={ex.id}
            style={styles.prRow}
            onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id })}
            activeOpacity={0.85}
          >
            <Trophy color={colors.warning} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionName}>{ex.name}</Text>
              <Text style={styles.sessionMeta}>
                {metric.label} · {formatDate(rec.date)}
              </Text>
            </View>
            <Text style={styles.prValue}>{metric.format(rec.value)}</Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.muted}>Antrenman kaydettikçe rekorların burada listelenecek.</Text>
      )}

      <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('Wellbeing')} activeOpacity={0.85}>
        <HeartPulse color={colors.primary} size={22} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sessionName}>Sağlık günlüğü</Text>
          <Text style={styles.sessionMeta}>Enerji, uyku, ruh hali ve yorgunluk geçmişi</Text>
        </View>
        <ChevronRight color={colors.textMuted} size={18} />
      </TouchableOpacity>
    </ScrollView>
  );
};

/* ================= GOALS ================= */
const Goals = ({ navigation }) => {
  const { goals, sessions, measurements, exercisesById, addGoalEntry, updateGoal } = useApp();
  const [entryGoal, setEntryGoal] = useState(null);
  const [entryValue, setEntryValue] = useState('');

  const ctx = { sessions, measurements, exercisesById };
  const active = goals.filter((g) => !g.archived);

  const saveEntry = () => {
    const v = parseNum(entryValue);
    if (v !== null) addGoalEntry(entryGoal.id, v);
    setEntryGoal(null);
    setEntryValue('');
  };

  if (!active.length) {
    return (
      <EmptyState
        icon={Target}
        title="Henüz hedef yok"
        text="Örneğin “Bu ay 12 antrenman” ya da “Squat’ta 100 kg” gibi bir hedef belirle ve ilerlemeni izle."
        action="Hedef ekle"
        onAction={() => navigation.navigate('GoalEditor')}
        style={{ marginTop: 40 }}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {active.map((g) => {
        const p = goalProgress(g, ctx);
        const ex = g.exerciseId ? exercisesById[g.exerciseId] : null;
        return (
          <Card
            key={g.id}
            style={[styles.goal, p.reached && styles.goalDone]}
            onPress={() => navigation.navigate('GoalEditor', { goalId: g.id })}
          >
            <View style={styles.goalHead}>
              <View style={styles.goalIcon}>
                {p.reached ? <Trophy color={colors.onPrimary} size={18} /> : <Target color={colors.primary} size={18} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalTitle}>{g.title}</Text>
                <Text style={styles.goalType}>
                  {GOAL_TYPES[g.type]?.label}
                  {ex ? ` · ${ex.name}` : ''}
                </Text>
              </View>
              <Text style={styles.goalPct}>{Math.round(p.pct * 100)}%</Text>
            </View>
            <ProgressBar progress={p.pct} style={{ marginTop: 14 }} />
            <View style={styles.goalFoot}>
              <Text style={styles.goalNums}>
                <Text style={{ color: colors.text, fontWeight: '900' }}>{p.format(p.current)}</Text> / {p.format(p.target)}{' '}
                {p.unit}
              </Text>
              {p.reached ? (
                <Text style={[styles.goalDays, { color: colors.primary }]}>Hedefe ulaşıldı 🎉</Text>
              ) : p.daysLeft !== null ? (
                <Text style={[styles.goalDays, p.daysLeft < 0 && { color: colors.danger }]}>
                  {p.daysLeft < 0 ? 'Süre doldu' : `${p.daysLeft} gün kaldı`}
                </Text>
              ) : null}
            </View>
            {g.type === 'custom' ? (
              <Button
                small
                title="İlerleme ekle"
                icon={Plus}
                variant="secondary"
                onPress={() => setEntryGoal(g)}
                style={{ marginTop: 12 }}
              />
            ) : null}
            {p.reached && !g.completedAt ? (
              <Button
                small
                title="Tamamlandı olarak işaretle"
                onPress={() => updateGoal(g.id, { completedAt: new Date().toISOString(), archived: true })}
                style={{ marginTop: 12 }}
              />
            ) : null}
          </Card>
        );
      })}
      {goals.some((g) => g.archived) ? (
        <>
          <SectionHeader title="Tamamlanan hedefler" />
          {goals
            .filter((g) => g.archived)
            .map((g) => (
              <TouchableOpacity
                key={g.id}
                style={styles.prRow}
                onPress={() => navigation.navigate('GoalEditor', { goalId: g.id })}
              >
                <CheckCircle2 color={colors.primary} size={18} />
                <Text style={[styles.sessionName, { flex: 1 }]}>{g.title}</Text>
                <Text style={styles.sessionMeta}>{g.completedAt ? formatDate(g.completedAt) : ''}</Text>
              </TouchableOpacity>
            ))}
        </>
      ) : null}

      <Sheet
        visible={!!entryGoal}
        onClose={() => setEntryGoal(null)}
        title="İlerleme ekle"
        footer={<Button title="Ekle" onPress={saveEntry} disabled={parseNum(entryValue) === null} />}
      >
        <Text style={styles.muted}>{entryGoal?.title}</Text>
        <Field
          value={entryValue}
          onChangeText={setEntryValue}
          keyboardType="decimal-pad"
          placeholder="Değer"
          suffix={entryGoal?.unit}
          autoFocus
          style={{ marginTop: 12 }}
        />
      </Sheet>
    </ScrollView>
  );
};

/* ================= BODY ================= */
const Body = ({ navigation }) => {
  const { measurements, settings } = useApp();
  const fields = MEASURE_FIELDS.filter((f) => settings.measureFields.includes(f.key));
  const [field, setField] = useState(fields[0]?.key || 'weight');

  const sorted = useMemo(() => [...measurements].sort((a, b) => new Date(b.date) - new Date(a.date)), [measurements]);
  const latest = sorted[0];

  const changeFor = (key) => {
    const withVal = sorted.filter((m) => m.values?.[key] !== undefined && m.values?.[key] !== null);
    if (withVal.length < 2) return null;
    return withVal[0].values[key] - withVal[1].values[key];
  };

  const meta = MEASURE_FIELDS.find((f) => f.key === field) || MEASURE_FIELDS[0];
  const points = [...sorted]
    .reverse()
    .filter((m) => m.values?.[field] !== undefined && m.values?.[field] !== null)
    .map((m) => ({ date: m.date, value: m.values[field] }));

  if (!measurements.length) {
    return (
      <EmptyState
        icon={Ruler}
        title="Henüz ölçüm yok"
        text="Kilonu ve seçtiğin vücut ölçülerini kaydet; değişimi grafikte takip et."
        action="İlk ölçümü ekle"
        onAction={() => navigation.navigate('MeasurementEditor')}
        style={{ marginTop: 40 }}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Card>
        <Text style={styles.cardLabel}>Son ölçüm · {formatDate(latest.date)}</Text>
        <View style={styles.measureGrid}>
          {fields.map((f) => {
            const v = latest.values?.[f.key];
            const ch = changeFor(f.key);
            return (
              <TouchableOpacity key={f.key} style={[styles.measure, field === f.key && styles.measureActive]} onPress={() => setField(f.key)}>
                <Text style={styles.measureLabel}>{f.label}</Text>
                <Text style={styles.measureValue}>
                  {v !== undefined && v !== null ? fmtNum(v) : '—'}
                  <Text style={styles.measureUnit}> {f.unit}</Text>
                </Text>
                {ch !== null ? (
                  <Text style={[styles.measureChange, { color: ch === 0 ? colors.textMuted : ch > 0 ? colors.warning : colors.info }]}>
                    {ch > 0 ? '▲' : ch < 0 ? '▼' : '•'} {fmtNum(Math.abs(ch))}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <SectionHeader title={`${meta.label} grafiği`} />
      <Card>
        {points.length ? (
          <LineChart points={points} format={(v) => `${fmtNum(v)} ${meta.unit}`} color={colors.primary} />
        ) : (
          <Text style={styles.muted}>Bu ölçü için henüz veri yok.</Text>
        )}
      </Card>

      <SectionHeader title="Ölçüm geçmişi" />
      {sorted.map((m) => (
        <TouchableOpacity
          key={m.id}
          style={styles.prRow}
          onPress={() => navigation.navigate('MeasurementEditor', { measurementId: m.id })}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionName}>{formatDate(m.date)}</Text>
            <Text style={styles.sessionMeta} numberOfLines={2}>
              {MEASURE_FIELDS.filter((f) => m.values?.[f.key] !== undefined && m.values?.[f.key] !== null)
                .map((f) => `${f.label} ${fmtNum(m.values[f.key])}${f.unit === '%' ? '%' : ` ${f.unit}`}`)
                .join(' · ')}
            </Text>
          </View>
          <ChevronRight color={colors.textMuted} size={18} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  segmented: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  tileValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8,
  },
  tileLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
  },
  dayTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    marginTop: 16,
    marginBottom: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  plannedDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  sessionName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  sessionMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 13,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  prValue: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 15,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 24,
  },
  goal: {
    marginBottom: 12,
  },
  goalDone: {
    borderColor: colors.primary,
  },
  goalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  goalType: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  goalPct: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 18,
  },
  goalFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  goalNums: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  goalDays: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  cardLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  measureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  measure: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: colors.surface2,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  measureActive: {
    borderColor: colors.primary,
  },
  measureLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  measureValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  measureUnit: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  measureChange: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
});

export default ProgressScreen;
