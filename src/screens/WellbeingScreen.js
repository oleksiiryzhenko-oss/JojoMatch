import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { HeartPulse, Zap, Moon, Smile, Flame, Battery, ChevronRight } from 'lucide-react-native';

import colors from '../utils/colors';
import { formatShortDate, fmtNum } from '../utils/helpers';
import { sortedSessions } from '../utils/workout';
import { useApp } from '../context/AppContext';
import { Screen, Header, Card, Segmented, EmptyState, SectionHeader } from '../components/ui';
import LineChart from '../components/LineChart';

const METRICS = [
  { key: 'energy', src: 'wellbeingBefore', label: 'Enerji', icon: Zap, max: 5 },
  { key: 'sleep', src: 'wellbeingBefore', label: 'Uyku', icon: Moon, max: 5 },
  { key: 'mood', src: 'wellbeingBefore', label: 'Ruh hali', icon: Smile, max: 5 },
  { key: 'load', src: 'wellbeingAfter', label: 'Yüklenme', icon: Flame, max: 10 },
  { key: 'fatigue', src: 'wellbeingAfter', label: 'Yorgunluk', icon: Battery, max: 5 },
];

const valueOf = (s, m) => s[m.src]?.[m.key] || null;

const WellbeingScreen = ({ navigation }) => {
  const { sessions } = useApp();
  const [metricKey, setMetricKey] = useState('energy');
  const metric = METRICS.find((m) => m.key === metricKey);

  const rated = useMemo(
    () => sortedSessions(sessions).filter((s) => METRICS.some((m) => valueOf(s, m))),
    [sessions]
  );

  const averages = METRICS.map((m) => {
    const vals = rated.slice(0, 10).map((s) => valueOf(s, m)).filter(Boolean);
    return { ...m, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
  });

  const points = [...rated]
    .reverse()
    .filter((s) => valueOf(s, metric))
    .slice(-20)
    .map((s) => ({ date: s.startedAt, value: valueOf(s, metric) }));

  return (
    <Screen edges={['top', 'bottom']}>
      <Header back title="Sağlık günlüğü" subtitle="Antrenman öncesi ve sonrası değerlendirmeler" />
      {!rated.length ? (
        <EmptyState
          icon={HeartPulse}
          title="Henüz değerlendirme yok"
          text="Antrenmana başlarken enerji, uyku ve ruh halini; bitirirken yüklenme ve yorgunluğunu değerlendir."
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.caption}>Son 10 antrenman ortalaması</Text>
          <View style={styles.avgRow}>
            {averages.map((m) => {
              const Icon = m.icon;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.avg, metricKey === m.key && styles.avgActive]}
                  onPress={() => setMetricKey(m.key)}
                >
                  <Icon color={colors.primary} size={16} />
                  <Text style={styles.avgValue}>{m.avg ? fmtNum(m.avg) : '—'}</Text>
                  <Text style={styles.avgLabel}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <SectionHeader title={`${metric.label} trendi`} />
          <Card>
            <Segmented
              value={metricKey}
              onChange={setMetricKey}
              options={METRICS.map((m) => ({ value: m.key, label: m.label.slice(0, 6) }))}
              style={{ marginBottom: 14 }}
            />
            {points.length ? (
              <LineChart points={points} format={(v) => `${fmtNum(v)}/${metric.max}`} />
            ) : (
              <Text style={styles.muted}>Bu ölçüt için veri yok.</Text>
            )}
          </Card>

          <SectionHeader title="Kayıtlar" />
          {rated.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.row}
              onPress={() => navigation.navigate('SessionDetail', { sessionId: s.id })}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {formatShortDate(s.startedAt)} · {s.name}
                </Text>
                <View style={styles.chips}>
                  {METRICS.map((m) =>
                    valueOf(s, m) ? (
                      <Text key={m.key} style={styles.chip}>
                        {m.label} {valueOf(s, m)}/{m.max}
                      </Text>
                    ) : null
                  )}
                </View>
                {s.wellbeingAfter?.comment ? <Text style={styles.comment}>“{s.wellbeingAfter.comment}”</Text> : null}
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  caption: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  avgRow: {
    flexDirection: 'row',
    gap: 6,
  },
  avg: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    alignItems: 'center',
  },
  avgActive: {
    borderColor: colors.primary,
  },
  avgValue: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 17,
    marginTop: 4,
  },
  avgLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  rowTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  comment: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 6,
  },
});

export default WellbeingScreen;
