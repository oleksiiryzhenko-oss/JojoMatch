import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Swords, Check, Pencil } from 'lucide-react-native';

import colors from '../utils/colors';
import { dayKey, addDays, WEEKDAYS, fromDayKey, formatDate } from '../utils/helpers';
import { challengeProgress } from '../utils/workout';
import { useApp } from '../context/AppContext';
import { Screen, Header, Card, IconButton, EmptyState, ProgressBar, Badge, SectionHeader } from '../components/ui';

const STATUS = {
  active: { label: 'Aktif', color: colors.primary },
  upcoming: { label: 'Yakında', color: colors.info },
  ended: { label: 'Bitti', color: colors.textMuted },
};

const ChallengesScreen = ({ navigation }) => {
  const { challenges, toggleCheckin } = useApp();
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  const groups = ['active', 'upcoming', 'ended']
    .map((status) => ({ status, items: challenges.filter((c) => challengeProgress(c).status === status) }))
    .filter((g) => g.items.length);

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        back
        title="Meydan okumalar"
        right={
          <IconButton
            icon={Plus}
            bg={colors.primary}
            color={colors.onPrimary}
            onPress={() => navigation.navigate('ChallengeEditor')}
            label="Yeni meydan okuma"
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!challenges.length ? (
          <EmptyState
            icon={Swords}
            title="Kendine meydan oku"
            text="Örneğin “30 gün boyunca her gün 50 şınav” veya “haftada 3 kez 5 km koşu”. Görevi, süreyi ve sıklığı sen belirle."
            action="Meydan okuma oluştur"
            onAction={() => navigation.navigate('ChallengeEditor')}
            style={{ marginTop: 40 }}
          />
        ) : null}

        {groups.map((g) => (
          <View key={g.status}>
            <SectionHeader title={STATUS[g.status].label} style={{ marginTop: 8 }} />
            {g.items.map((c) => {
              const p = challengeProgress(c);
              return (
                <Card key={c.id} style={styles.card}>
                  <View style={styles.head}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{c.title}</Text>
                      {c.description ? <Text style={styles.desc}>{c.description}</Text> : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ChallengeEditor', { challengeId: c.id })}
                      hitSlop={8}
                      style={styles.edit}
                    >
                      <Pencil color={colors.textMuted} size={16} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.metaRow}>
                    <Badge label={c.frequency === 'weekly' ? `Haftada ${c.timesPerWeek}×` : 'Her gün'} />
                    <Text style={styles.meta}>
                      {formatDate(fromDayKey(c.startDate))} – {formatDate(fromDayKey(c.endDate))}
                    </Text>
                  </View>
                  <ProgressBar progress={p.pct} style={{ marginTop: 12 }} />
                  <View style={styles.foot}>
                    <Text style={styles.count}>
                      <Text style={{ color: colors.primary }}>{p.done}</Text>/{p.required} tamamlandı
                    </Text>
                    <Text style={styles.meta}>
                      {p.completed ? 'Başarıldı 🏆' : p.status === 'active' ? `${p.daysLeft} gün kaldı` : ''}
                    </Text>
                  </View>

                  {p.status === 'active' ? (
                    <View style={styles.days}>
                      {last7.map((d) => {
                        const key = dayKey(d);
                        const inRange = key >= c.startDate && key <= c.endDate;
                        const on = (c.checkins || []).includes(key);
                        return (
                          <TouchableOpacity
                            key={key}
                            style={styles.dayWrap}
                            disabled={!inRange}
                            onPress={() => toggleCheckin(c.id, key)}
                          >
                            <Text style={styles.dayName}>{WEEKDAYS[d.getDay()]}</Text>
                            <View style={[styles.day, on && styles.dayOn, !inRange && styles.dayOff]}>
                              {on ? (
                                <Check color={colors.onPrimary} size={16} strokeWidth={3} />
                              ) : (
                                <Text style={styles.dayNum}>{d.getDate()}</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 17,
  },
  desc: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  edit: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  foot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  count: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 13,
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  dayWrap: {
    alignItems: 'center',
    gap: 4,
  },
  dayName: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  day: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayOff: {
    opacity: 0.3,
  },
  dayNum: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 13,
  },
});

export default ChallengesScreen;
