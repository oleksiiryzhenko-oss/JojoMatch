import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Pencil, Trophy, LineChart as ChartIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

import colors from '../utils/colors';
import { formatDate, formatShortDate, fmtNum, fmtBig, formatSeconds } from '../utils/helpers';
import { EXERCISE_TYPES } from '../data/exercises';
import { getExerciseHistory, getPersonalRecords, primaryMetric, formatSet } from '../utils/workout';
import { useApp } from '../context/AppContext';
import { Screen, Header, Card, IconButton, SectionHeader, Segmented, EmptyState, Badge } from '../components/ui';
import LineChart from '../components/LineChart';

const ExerciseDetailScreen = ({ navigation, route }) => {
  const { exerciseId } = route.params || {};
  const { exercisesById, sessions } = useApp();
  const exercise = exercisesById[exerciseId];
  const [chartKey, setChartKey] = useState(null);

  const history = useMemo(() => getExerciseHistory(sessions, exerciseId), [sessions, exerciseId]);
  const records = useMemo(() => getPersonalRecords(sessions, exerciseId), [sessions, exerciseId]);

  if (!exercise) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header back title="Egzersiz" />
        <EmptyState title="Egzersiz bulunamadı" />
      </Screen>
    );
  }

  const metric = primaryMetric(exercise.type);
  const chartOptions =
    exercise.type === 'weight'
      ? [
          { value: 'bestWeight', label: 'Ağırlık', format: (v) => `${fmtNum(v)} kg` },
          { value: 'best1RM', label: 'Tahmini 1RM', format: (v) => `${fmtNum(v)} kg` },
          { value: 'volume', label: 'Hacim', format: (v) => `${fmtBig(v)} kg` },
        ]
      : exercise.type === 'distance'
        ? [
            { value: 'bestDistance', label: 'Mesafe', format: (v) => `${fmtNum(v, 2)} km` },
            { value: 'time', label: 'Süre', format: (v) => formatSeconds(v) },
          ]
        : exercise.type === 'time'
          ? [
              { value: 'bestTime', label: 'En uzun', format: (v) => formatSeconds(v) },
              { value: 'time', label: 'Toplam', format: (v) => formatSeconds(v) },
            ]
          : [
              { value: 'bestReps', label: 'En çok', format: (v) => `${Math.round(v)}` },
              { value: 'reps', label: 'Toplam', format: (v) => `${Math.round(v)}` },
            ];
  const activeChart = chartOptions.find((o) => o.value === chartKey) || chartOptions[0];

  const points = [...history]
    .reverse()
    .slice(-20)
    .map(({ session, summary }) => ({ date: session.startedAt, value: summary[activeChart.value] || 0 }));

  const recordCards = [
    exercise.type === 'weight' && records.bestWeight && { label: 'En yüksek ağırlık', value: `${fmtNum(records.bestWeight.value)} kg`, date: records.bestWeight.date },
    exercise.type === 'weight' && records.best1RM && { label: 'Tahmini 1RM', value: `${fmtNum(records.best1RM.value)} kg`, date: records.best1RM.date },
    exercise.type === 'weight' && records.volume && { label: 'En yüksek hacim', value: `${fmtBig(records.volume.value)} kg`, date: records.volume.date },
    (exercise.type === 'reps' || exercise.type === 'weight') && records.bestReps && { label: 'En çok tekrar', value: `${records.bestReps.value}`, date: records.bestReps.date },
    (exercise.type === 'time' || exercise.type === 'distance') && records.bestTime && { label: 'En uzun süre', value: formatSeconds(records.bestTime.value), date: records.bestTime.date },
    exercise.type === 'distance' && records.bestDistance && { label: 'En uzun mesafe', value: `${fmtNum(records.bestDistance.value, 2)} km`, date: records.bestDistance.date },
  ].filter(Boolean);

  // Compare last two entries
  const [latest, prev] = history;
  const diff = latest && prev ? latest.summary[metric.key] - prev.summary[metric.key] : null;

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        back
        title={exercise.name}
        subtitle={`${exercise.category} · ${EXERCISE_TYPES[exercise.type]?.label}`}
        right={<IconButton icon={Pencil} onPress={() => navigation.navigate('ExerciseEditor', { exerciseId })} label="Düzenle" />}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {exercise.notes ? (
          <Card style={{ marginBottom: 12 }}>
            <Text style={styles.notes}>{exercise.notes}</Text>
          </Card>
        ) : null}

        {!history.length ? (
          <Card>
            <EmptyState
              icon={ChartIcon}
              title="Henüz kayıt yok"
              text="Bu egzersizi bir antrenmanda yaptığında rekorların ve grafiğin burada görünecek."
            />
          </Card>
        ) : (
          <>
            {latest && prev ? (
              <Card style={styles.compare}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.compareLabel}>Son antrenman · {formatShortDate(latest.session.startedAt)}</Text>
                  <Text style={styles.compareValue}>{metric.format(latest.summary[metric.key])}</Text>
                  <Text style={styles.compareSub}>
                    Önceki: {metric.format(prev.summary[metric.key])} ({formatShortDate(prev.session.startedAt)})
                  </Text>
                </View>
                <View
                  style={[
                    styles.diffBox,
                    { backgroundColor: diff > 0 ? colors.primarySoft : diff < 0 ? 'rgba(255,90,95,0.14)' : colors.surface2 },
                  ]}
                >
                  {diff > 0 ? (
                    <TrendingUp color={colors.primary} size={20} />
                  ) : diff < 0 ? (
                    <TrendingDown color={colors.danger} size={20} />
                  ) : (
                    <Minus color={colors.textMuted} size={20} />
                  )}
                  <Text
                    style={[
                      styles.diffText,
                      { color: diff > 0 ? colors.primary : diff < 0 ? colors.danger : colors.textMuted },
                    ]}
                  >
                    {diff > 0 ? '+' : diff < 0 ? '−' : ''}
                    {metric.format(Math.abs(diff))}
                  </Text>
                </View>
              </Card>
            ) : null}

            <SectionHeader title="Kişisel rekorlar" />
            <View style={styles.records}>
              {recordCards.map((r) => (
                <View key={r.label} style={styles.record}>
                  <Trophy color={colors.warning} size={16} />
                  <Text style={styles.recordValue}>{r.value}</Text>
                  <Text style={styles.recordLabel}>{r.label}</Text>
                  <Text style={styles.recordDate}>{formatDate(r.date)}</Text>
                </View>
              ))}
            </View>

            <SectionHeader title="Gelişim grafiği" />
            <Card>
              <Segmented
                options={chartOptions.map((o) => ({ value: o.value, label: o.label }))}
                value={activeChart.value}
                onChange={setChartKey}
                style={{ marginBottom: 14 }}
              />
              <LineChart points={points} format={activeChart.format} />
            </Card>

            <SectionHeader title={`Geçmiş (${history.length})`} />
            {history.map(({ session, item, summary }, idx) => {
              const isBest =
                records[metric.key] && summary[metric.key] === records[metric.key].value && records[metric.key].date === session.startedAt;
              return (
                <TouchableOpacity
                  key={`${session.id}-${item.id}`}
                  style={styles.histRow}
                  onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
                  activeOpacity={0.85}
                >
                  <View style={styles.histHead}>
                    <Text style={styles.histDate}>{formatShortDate(session.startedAt)}</Text>
                    <Text style={styles.histName} numberOfLines={1}>
                      {session.name}
                    </Text>
                    {isBest ? <Badge label="REKOR" color={colors.warning} /> : null}
                    {idx === 0 && !isBest ? <Badge label="SON" /> : null}
                  </View>
                  <Text style={styles.histSets}>{item.sets.map((s) => formatSet(s, exercise.type)).join('  ·  ')}</Text>
                  {item.note ? <Text style={styles.histNote}>📝 {item.note}</Text> : null}
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  notes: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  compare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compareLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  compareValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  compareSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  diffBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 76,
  },
  diffText: {
    fontWeight: '900',
    fontSize: 14,
    marginTop: 4,
  },
  records: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  record: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  recordValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8,
  },
  recordLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  recordDate: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  histRow: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  histHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  histDate: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  histName: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  histSets: {
    color: colors.text,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  histNote: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
});

export default ExerciseDetailScreen;
