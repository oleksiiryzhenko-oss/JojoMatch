import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import {
  Play,
  Plus,
  Bell,
  Coffee,
  AlertTriangle,
  ArrowRight,
  Check,
  Trophy,
  Timer,
  ChevronRight,
  Zap,
} from 'lucide-react-native';

import colors from '../utils/colors';
import {
  greeting,
  formatDate,
  WEEKDAYS,
  WEEKDAYS_LONG,
  dayKey,
  addDays,
  startOfWeek,
  fromDayKey,
  formatShortDate,
  formatClock,
  formatDuration,
  fmtBig,
} from '../utils/helpers';
import {
  getPlannedForDate,
  getDayConfig,
  isPlannedDone,
  getMissedWorkouts,
  sessionsInRange,
  sortedSessions,
  summarizeSession,
  challengeProgress,
} from '../utils/workout';
import { useApp } from '../context/AppContext';
import useNow from '../hooks/useNow';
import useStartWorkout from '../hooks/useStartWorkout';
import { Screen, Card, Button, SectionHeader, ProgressBar, EmptyState } from '../components/ui';
import WorkoutCard from '../components/WorkoutCard';
import Sheet from '../components/Sheet';

const TodayScreen = ({ navigation }) => {
  const {
    settings,
    templates,
    templatesById,
    weekPlan,
    scheduleEdits,
    sessions,
    activeSession,
    challenges,
    toggleCheckin,
    moveWorkout,
    removeFromDate,
  } = useApp();
  const startWorkout = useStartWorkout();
  const isFocused = useIsFocused();
  const now = useNow(1000, isFocused && !!activeSession);
  const [pickerOpen, setPickerOpen] = useState(false);

  const today = new Date();
  const todayKey = dayKey(today);
  const dayConfig = getDayConfig(weekPlan, today);
  const plannedIds = getPlannedForDate(weekPlan, scheduleEdits, today).filter((id) => templatesById[id]);

  const missed = useMemo(
    () => getMissedWorkouts(weekPlan, scheduleEdits, sessions, templatesById),
    [weekPlan, scheduleEdits, sessions, templatesById]
  );

  const weekStart = startOfWeek(today);
  const weekSessions = sessionsInRange(sessions, weekStart, addDays(weekStart, 6));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const lastSession = sortedSessions(sessions)[0];
  const lastSummary = lastSession ? summarizeSession(lastSession) : null;
  const activeChallenges = challenges.filter((c) => challengeProgress(c).status === 'active');

  const dayState = (d) => {
    const key = dayKey(d);
    if (sessions.some((s) => dayKey(s.startedAt) === key)) return 'done';
    if (getDayConfig(weekPlan, d).rest && !getPlannedForDate(weekPlan, scheduleEdits, d).length) return 'rest';
    if (getPlannedForDate(weekPlan, scheduleEdits, d).length) return key < todayKey ? 'missed' : 'planned';
    return 'none';
  };

  const firstName = (settings.name || '').split(' ')[0];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>
              {greeting()}
              {firstName ? `, ${firstName}` : ''} 👋
            </Text>
            <Text style={styles.date}>
              {WEEKDAYS_LONG[today.getDay()]}, {formatDate(today)}
            </Text>
          </View>
        </View>

        {activeSession ? (
          <TouchableOpacity style={styles.activeCard} onPress={() => navigation.navigate('Session')} activeOpacity={0.9}>
            <View style={styles.activeIcon}>
              <Timer color={colors.primary} size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeLabel}>DEVAM EDEN ANTRENMAN</Text>
              <Text style={styles.activeName} numberOfLines={1}>
                {activeSession.name}
              </Text>
            </View>
            <Text style={styles.activeClock}>{formatClock(now - new Date(activeSession.startedAt).getTime())}</Text>
            <ChevronRight color={colors.onPrimary} size={22} />
          </TouchableOpacity>
        ) : null}

        {/* WEEK STRIP */}
        <Card style={styles.weekCard}>
          <View style={styles.weekTop}>
            <Text style={styles.weekTitle}>Bu hafta</Text>
            <Text style={styles.weekCount}>
              <Text style={{ color: colors.primary }}>{weekSessions.length}</Text>/{settings.weeklyTarget} antrenman
            </Text>
          </View>
          <ProgressBar progress={weekSessions.length / (settings.weeklyTarget || 1)} style={{ marginBottom: 14 }} />
          <View style={styles.weekRow}>
            {weekDays.map((d) => {
              const state = dayState(d);
              const isToday = dayKey(d) === todayKey;
              return (
                <View key={dayKey(d)} style={styles.weekDay}>
                  <Text style={[styles.weekDayName, isToday && { color: colors.primary }]}>{WEEKDAYS[d.getDay()]}</Text>
                  <View
                    style={[
                      styles.weekDot,
                      state === 'done' && styles.weekDotDone,
                      state === 'planned' && styles.weekDotPlanned,
                      state === 'missed' && styles.weekDotMissed,
                      isToday && styles.weekDotToday,
                    ]}
                  >
                    {state === 'done' ? (
                      <Check color={colors.onPrimary} size={14} strokeWidth={3} />
                    ) : state === 'rest' ? (
                      <Coffee color={colors.textMuted} size={13} />
                    ) : (
                      <Text style={styles.weekDayNum}>{d.getDate()}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* REMINDER */}
        {dayConfig.reminder && plannedIds.some((id) => !isPlannedDone(sessions, today, id)) ? (
          <View style={styles.reminder}>
            <Bell color={colors.warning} size={18} />
            <Text style={styles.reminderText}>
              Hatırlatıcı: bugün saat <Text style={{ fontWeight: '900' }}>{dayConfig.reminder}</Text>’de antrenmanın var.
            </Text>
          </View>
        ) : null}

        {/* TODAY PLAN */}
        <SectionHeader title="Bugünün planı" action="Planı düzenle" onAction={() => navigation.navigate('PlanTab')} />
        {plannedIds.length ? (
          plannedIds.map((id) => {
            const done = isPlannedDone(sessions, today, id);
            const doneSession = done
              ? sessions.find((s) => s.templateId === id && (s.plannedDate || dayKey(s.startedAt)) === todayKey)
              : null;
            return (
              <WorkoutCard
                key={id}
                template={templatesById[id]}
                done={done}
                onPress={() =>
                  doneSession
                    ? navigation.navigate('SessionDetail', { sessionId: doneSession.id })
                    : navigation.navigate('WorkoutEditor', { templateId: id })
                }
                onStart={() => startWorkout(templatesById[id], todayKey)}
              />
            );
          })
        ) : dayConfig.rest ? (
          <Card style={styles.restCard}>
            <Coffee color={colors.primary} size={28} />
            <View style={{ flex: 1 }}>
              <Text style={styles.restTitle}>Bugün dinlenme günü</Text>
              <Text style={styles.restText}>Kaslar dinlenirken güçlenir. Hafif esneme iyi gelebilir.</Text>
            </View>
          </Card>
        ) : (
          <Card>
            <EmptyState
              title="Bugün için plan yok"
              text="Hazır bir antrenman seç ya da boş bir antrenmanla hemen başla."
              style={{ paddingVertical: 8 }}
            />
          </Card>
        )}

        <View style={styles.quickRow}>
          <Button
            title="Şablondan başla"
            icon={Play}
            onPress={() => setPickerOpen(true)}
            style={{ flex: 1 }}
            disabled={!templates.length}
          />
          <Button title="Boş antrenman" icon={Plus} variant="secondary" onPress={() => startWorkout(null)} style={{ flex: 1 }} />
        </View>

        {/* MISSED */}
        {missed.length ? (
          <>
            <SectionHeader title="Kaçırılan antrenmanlar" />
            {missed.map((m) => (
              <Card key={`${m.date}-${m.templateId}`} style={styles.missedCard}>
                <View style={styles.missedTop}>
                  <AlertTriangle color={colors.danger} size={18} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.missedName}>{templatesById[m.templateId]?.name}</Text>
                    <Text style={styles.missedDate}>{formatShortDate(fromDayKey(m.date))} planlanmıştı</Text>
                  </View>
                </View>
                <View style={styles.missedActions}>
                  <Button
                    small
                    title="Bugüne taşı"
                    icon={ArrowRight}
                    onPress={() => moveWorkout(m.date, todayKey, m.templateId)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    small
                    title="Yarına"
                    variant="secondary"
                    onPress={() => moveWorkout(m.date, dayKey(addDays(today, 1)), m.templateId)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    small
                    title="Atla"
                    variant="ghost"
                    onPress={() => removeFromDate(m.date, m.templateId)}
                  />
                </View>
              </Card>
            ))}
          </>
        ) : null}

        {/* CHALLENGES */}
        {activeChallenges.length ? (
          <>
            <SectionHeader title="Meydan okumalar" action="Tümü" onAction={() => navigation.navigate('Challenges')} />
            {activeChallenges.map((c) => {
              const p = challengeProgress(c);
              return (
                <Card key={c.id} style={styles.challenge}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.challengeTitle}>{c.title}</Text>
                    <Text style={styles.challengeMeta}>
                      {p.done}/{p.required} · {p.daysLeft} gün kaldı
                    </Text>
                    <ProgressBar progress={p.pct} height={6} style={{ marginTop: 8 }} />
                  </View>
                  <TouchableOpacity
                    style={[styles.checkBtn, p.checkedToday && styles.checkBtnOn]}
                    onPress={() => toggleCheckin(c.id)}
                    accessibilityLabel="Bugün tamamlandı"
                  >
                    <Check color={p.checkedToday ? colors.onPrimary : colors.textMuted} size={22} strokeWidth={3} />
                  </TouchableOpacity>
                </Card>
              );
            })}
          </>
        ) : null}

        {/* LAST WORKOUT */}
        {lastSession ? (
          <>
            <SectionHeader title="Son antrenman" action="Geçmiş" onAction={() => navigation.navigate('History')} />
            <Card onPress={() => navigation.navigate('SessionDetail', { sessionId: lastSession.id })}>
              <View style={styles.lastTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lastName}>{lastSession.name}</Text>
                  <Text style={styles.lastDate}>{formatShortDate(lastSession.startedAt)}</Text>
                </View>
                <Trophy color={colors.primary} size={22} />
              </View>
              <View style={styles.lastStats}>
                <View style={styles.lastStat}>
                  <Text style={styles.lastValue}>{formatDuration(lastSession.durationSec)}</Text>
                  <Text style={styles.lastLabel}>Süre</Text>
                </View>
                <View style={styles.lastStat}>
                  <Text style={styles.lastValue}>{lastSummary.sets}</Text>
                  <Text style={styles.lastLabel}>Set</Text>
                </View>
                <View style={styles.lastStat}>
                  <Text style={styles.lastValue}>{fmtBig(lastSummary.volume)}</Text>
                  <Text style={styles.lastLabel}>Hacim (kg)</Text>
                </View>
              </View>
            </Card>
          </>
        ) : (
          <Card style={[styles.restCard, { marginTop: 24 }]}>
            <Zap color={colors.primary} size={26} />
            <View style={{ flex: 1 }}>
              <Text style={styles.restTitle}>İlk antrenmanını kaydet</Text>
              <Text style={styles.restText}>
                Antrenman bitince nasıl hissettiğini değerlendir ve bir sonraki seferde sonuçlarını kıyasla.
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Antrenman seç">
        {templates.map((t) => (
          <WorkoutCard
            key={t.id}
            template={t}
            onPress={() => {
              setPickerOpen(false);
              startWorkout(t, todayKey);
            }}
            right={<Play color={colors.primary} size={22} />}
          />
        ))}
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  hello: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
  },
  activeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLabel: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '800',
    opacity: 0.7,
  },
  activeName: {
    color: colors.onPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  activeClock: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  weekCard: {
    paddingBottom: 14,
  },
  weekTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  weekTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  weekCount: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
    gap: 6,
  },
  weekDayName: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  weekDot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotDone: {
    backgroundColor: colors.primary,
  },
  weekDotPlanned: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  weekDotMissed: {
    backgroundColor: 'rgba(255, 90, 95, 0.2)',
  },
  weekDotToday: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  weekDayNum: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 13,
  },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
  },
  reminderText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
  },
  restCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  restTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  restText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  missedCard: {
    marginBottom: 10,
    borderColor: 'rgba(255, 90, 95, 0.35)',
  },
  missedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  missedName: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  missedDate: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  missedActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  challenge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  challengeTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  challengeMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  checkBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  lastTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastName: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 17,
  },
  lastDate: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  lastStats: {
    flexDirection: 'row',
    marginTop: 14,
  },
  lastStat: {
    flex: 1,
  },
  lastValue: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
  lastLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});

export default TodayScreen;
