import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Trash2,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Moon,
  Smile,
  Flame,
  Battery,
  RotateCcw,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react-native';

import colors from '../utils/colors';
import { formatDateTime, formatDuration, fmtBig, fmtNum, formatShortDate } from '../utils/helpers';
import { summarizeSession, detectNewRecords, compareSession, formatSet } from '../utils/workout';
import { useApp } from '../context/AppContext';
import useStartWorkout from '../hooks/useStartWorkout';
import { Screen, Header, Card, Button, IconButton, SectionHeader, Stat, EmptyState } from '../components/ui';

const WellbeingRow = ({ icon: Icon, label, value, max = 5 }) => (
  <View style={styles.wbRow}>
    <Icon color={colors.primary} size={16} />
    <Text style={styles.wbLabel}>{label}</Text>
    <View style={styles.wbDots}>
      {Array.from({ length: max }, (_, i) => (
        <View key={i} style={[styles.wbDot, max > 5 && styles.wbDotSmall, value && i < value && styles.wbDotOn]} />
      ))}
    </View>
    <Text style={styles.wbValue}>{value ? `${value}/${max}` : '—'}</Text>
  </View>
);

const Diff = ({ value, format }) => {
  if (value === null || value === undefined) return <Text style={styles.first}>İlk kez</Text>;
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const color = value > 0 ? colors.primary : value < 0 ? colors.danger : colors.textMuted;
  return (
    <View style={styles.diff}>
      <Icon color={color} size={15} />
      <Text style={[styles.diffText, { color }]}>
        {value > 0 ? '+' : value < 0 ? '−' : ''}
        {format(Math.abs(value))}
      </Text>
    </View>
  );
};

const SessionDetailScreen = ({ navigation, route }) => {
  const { sessionId, justFinished } = route.params || {};
  const { sessions, exercisesById, templatesById, deleteSession, updateTemplateFromSession } = useApp();
  const startWorkout = useStartWorkout();
  const session = sessions.find((s) => s.id === sessionId);

  const data = useMemo(() => {
    if (!session) return null;
    return {
      summary: summarizeSession(session),
      records: detectNewRecords(session, sessions, exercisesById),
      comparison: compareSession(session, sessions, exercisesById),
    };
  }, [session, sessions, exercisesById]);

  if (!session || !data) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header back title="Antrenman" />
        <EmptyState title="Kayıt bulunamadı" />
      </Screen>
    );
  }

  const { summary, records, comparison } = data;
  const before = session.wellbeingBefore;
  const after = session.wellbeingAfter;
  const template = session.templateId ? templatesById[session.templateId] : null;

  const onDelete = () =>
    Alert.alert('Kayıt silinsin mi?', 'Bu antrenman geçmişten ve istatistiklerden kaldırılacak.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          navigation.goBack();
          deleteSession(session.id);
        },
      },
    ]);

  const onUpdatePlan = () =>
    Alert.alert(
      template ? 'Şablon güncellensin mi?' : 'Şablon olarak kaydedilsin mi?',
      template
        ? `“${template.name}” hedefleri bu antrenmandaki gerçek sonuçlarınla değiştirilecek.`
        : 'Bu antrenman yeni bir şablon olarak kaydedilecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: template ? 'Güncelle' : 'Kaydet',
          onPress: () => {
            updateTemplateFromSession(session.id);
            Alert.alert('Hazır', 'Planın güncellendi.');
          },
        },
      ]
    );

  // Repeat this exact workout (uses its actual results as new targets)
  const onRepeat = () =>
    startWorkout({
      id: session.templateId,
      name: session.name,
      color: session.color,
      exercises: session.exercises.map((it) => ({
        exerciseId: it.exerciseId,
        restSeconds: it.restSeconds,
        note: '',
        sets: it.sets.map((s) => ({ weight: s.weight, reps: s.reps, time: s.time, distance: s.distance })),
      })),
    });

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        back
        title={justFinished ? 'Antrenman tamamlandı' : session.name}
        subtitle={formatDateTime(session.startedAt)}
        right={<IconButton icon={Trash2} color={colors.danger} onPress={onDelete} label="Sil" />}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {justFinished ? (
          <View style={styles.hero}>
            <Sparkles color={colors.onPrimary} size={28} />
            <Text style={styles.heroTitle}>Tebrikler! 🎉</Text>
            <Text style={styles.heroText}>“{session.name}” kaydedildi. İşte bugünkü sonuçların.</Text>
          </View>
        ) : null}

        <Card style={styles.stats}>
          <Stat label="Süre" value={formatDuration(session.durationSec)} />
          <Stat label="Set" value={`${summary.sets}`} />
          <Stat label="Hacim (kg)" value={fmtBig(summary.volume)} accent />
          {summary.distance ? <Stat label="Mesafe" value={`${fmtNum(summary.distance, 2)} km`} /> : null}
        </Card>

        {records.length ? (
          <>
            <SectionHeader title="Yeni rekorlar 🏆" />
            {records.map((r) => (
              <View key={r.exerciseId} style={styles.record}>
                <Trophy color={colors.warning} size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recordName}>{r.name}</Text>
                  <Text style={styles.recordLabel}>{r.label}</Text>
                </View>
                <Text style={styles.recordValue}>{r.value}</Text>
              </View>
            ))}
          </>
        ) : null}

        <SectionHeader title="Önceki antrenmanla karşılaştırma" />
        {comparison.length ? (
          comparison.map((c) => (
            <Card
              key={c.item.id}
              style={styles.compare}
              onPress={() => c.exercise && navigation.navigate('ExerciseDetail', { exerciseId: c.exercise.id })}
            >
              <View style={styles.compareHead}>
                <Text style={styles.compareName} numberOfLines={1}>
                  {c.exercise?.name || 'Silinmiş egzersiz'}
                </Text>
                <Diff value={c.diff} format={c.metric.format} />
              </View>
              <View style={styles.compareRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.compareLabel}>Bugün</Text>
                  <Text style={styles.compareValue}>{c.metric.format(c.current[c.metric.key])}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.compareLabel}>
                    {c.previousDate ? formatShortDate(c.previousDate) : 'Önceki'}
                  </Text>
                  <Text style={[styles.compareValue, { color: colors.textSecondary }]}>
                    {c.previous ? c.metric.format(c.previous[c.metric.key]) : '—'}
                  </Text>
                </View>
                {c.exercise?.type === 'weight' ? (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.compareLabel}>Hacim farkı</Text>
                    {c.volumeDiff === null ? (
                      <Text style={styles.compareValue}>{fmtBig(c.current.volume)}</Text>
                    ) : (
                      <Diff value={c.volumeDiff} format={(v) => `${fmtBig(v)} kg`} />
                    )}
                  </View>
                ) : null}
              </View>
              <Text style={styles.sets}>{c.item.sets.map((s) => formatSet(s, c.exercise?.type)).join('  ·  ')}</Text>
              {c.item.note ? <Text style={styles.itemNote}>📝 {c.item.note}</Text> : null}
            </Card>
          ))
        ) : (
          <Text style={styles.muted}>Tamamlanan egzersiz yok.</Text>
        )}

        <SectionHeader title="Kendini nasıl hissettin?" />
        <Card>
          <Text style={styles.wbTitle}>Öncesi</Text>
          {before && !before.skipped ? (
            <>
              <WellbeingRow icon={Zap} label="Enerji" value={before.energy} />
              <WellbeingRow icon={Moon} label="Uyku" value={before.sleep} />
              <WellbeingRow icon={Smile} label="Ruh hali" value={before.mood} />
            </>
          ) : (
            <Text style={styles.muted}>Değerlendirilmedi</Text>
          )}
          <View style={styles.sep} />
          <Text style={styles.wbTitle}>Sonrası</Text>
          {after && !after.skipped ? (
            <>
              <WellbeingRow icon={Flame} label="Yüklenme" value={after.load} max={10} />
              <WellbeingRow icon={Battery} label="Yorgunluk" value={after.fatigue} />
              {after.comment ? <Text style={styles.comment}>“{after.comment}”</Text> : null}
            </>
          ) : (
            <Text style={styles.muted}>Değerlendirilmedi</Text>
          )}
        </Card>

        {session.note ? (
          <>
            <SectionHeader title="Not" />
            <Card>
              <Text style={styles.comment}>{session.note}</Text>
            </Card>
          </>
        ) : null}

        <View style={styles.actions}>
          <Button
            title={template ? 'Planı bu sonuçlarla güncelle' : 'Şablon olarak kaydet'}
            icon={ClipboardCheck}
            variant="outline"
            onPress={onUpdatePlan}
          />
          <Button title="Bu antrenmanı tekrarla" icon={RotateCcw} variant="secondary" onPress={onRepeat} />
          {justFinished ? <Button title="Tamam" onPress={() => navigation.goBack()} /> : null}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
  },
  heroTitle: {
    color: colors.onPrimary,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 8,
  },
  heroText: {
    color: colors.onPrimary,
    fontSize: 15,
    marginTop: 4,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  record: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  recordName: {
    color: colors.text,
    fontWeight: '800',
  },
  recordLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  recordValue: {
    color: colors.warning,
    fontWeight: '900',
    fontSize: 16,
  },
  compare: {
    marginBottom: 10,
  },
  compareHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  compareName: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
    flex: 1,
  },
  compareRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  compareLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  compareValue: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  diff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  diffText: {
    fontWeight: '900',
    fontSize: 14,
  },
  first: {
    color: colors.info,
    fontWeight: '800',
    fontSize: 12,
  },
  sets: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 18,
  },
  itemNote: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  wbTitle: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  wbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  wbLabel: {
    color: colors.text,
    fontWeight: '700',
    width: 80,
  },
  wbDots: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  wbDot: {
    width: 14,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface3,
  },
  wbDotSmall: {
    width: 9,
  },
  wbDotOn: {
    backgroundColor: colors.primary,
  },
  wbValue: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 13,
  },
  sep: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  comment: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  muted: {
    color: colors.textMuted,
    fontSize: 13,
  },
  actions: {
    gap: 10,
    marginTop: 24,
  },
});

export default SessionDetailScreen;
