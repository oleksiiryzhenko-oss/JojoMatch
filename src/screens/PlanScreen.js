import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Bell,
  Check,
  X,
  Copy,
  Trash2,
  Pencil,
  Repeat,
  CalendarPlus,
  ClipboardList,
} from 'lucide-react-native';

import colors from '../utils/colors';
import {
  WEEKDAYS_LONG,
  MONTHS,
  dayKey,
  addDays,
  startOfWeek,
  fromDayKey,
  formatShortDate,
} from '../utils/helpers';
import { getPlannedForDate, getDayConfig, isPlannedDone } from '../utils/workout';
import { useApp } from '../context/AppContext';
import useStartWorkout from '../hooks/useStartWorkout';
import useEnableNotifications from '../hooks/useEnableNotifications';
import { Screen, Header, Segmented, Card, Button, IconButton, EmptyState, SectionHeader, Badge } from '../components/ui';
import WorkoutCard from '../components/WorkoutCard';
import Sheet from '../components/Sheet';
import DateField from '../components/DateField';

const PlanScreen = ({ navigation }) => {
  const [tab, setTab] = useState('week');

  return (
    <Screen>
      <Header
        title="Plan"
        right={
          tab === 'templates' ? (
            <IconButton
              icon={Plus}
              bg={colors.primary}
              color={colors.onPrimary}
              onPress={() => navigation.navigate('WorkoutEditor')}
              label="Yeni antrenman"
            />
          ) : null
        }
      />
      <Segmented
        style={styles.segmented}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'week', label: 'Haftalık plan' },
          { value: 'templates', label: 'Antrenmanlarım' },
        ]}
      />
      {tab === 'week' ? <WeekPlan navigation={navigation} /> : <TemplatesList navigation={navigation} />}
    </Screen>
  );
};

/* ================= WEEK ================= */
const WeekPlan = ({ navigation }) => {
  const { templates, templatesById, weekPlan, scheduleEdits, sessions } = useApp();
  const startWorkout = useStartWorkout();
  const [offset, setOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  const weekStart = addDays(startOfWeek(), offset * 7);
  const weekEnd = addDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayKey = dayKey();

  const rangeLabel =
    offset === 0
      ? 'Bu hafta'
      : offset === 1
        ? 'Gelecek hafta'
        : offset === -1
          ? 'Geçen hafta'
          : `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]}`;

  const plannedCount = days.reduce((acc, d) => acc + getPlannedForDate(weekPlan, scheduleEdits, d).length, 0);

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.weekNav}>
          <IconButton icon={ChevronLeft} onPress={() => setOffset((o) => o - 1)} label="Önceki hafta" />
          <TouchableOpacity onPress={() => setOffset(0)} style={{ alignItems: 'center' }}>
            <Text style={styles.weekLabel}>{rangeLabel}</Text>
            <Text style={styles.weekSub}>{plannedCount} antrenman planlandı</Text>
          </TouchableOpacity>
          <IconButton icon={ChevronRight} onPress={() => setOffset((o) => o + 1)} label="Sonraki hafta" />
        </View>

        {!templates.length ? (
          <Card>
            <EmptyState
              icon={ClipboardList}
              title="Önce bir antrenman oluştur"
              text="Planına ekleyebilmek için “Antrenmanlarım” sekmesinden bir şablon oluştur."
            />
          </Card>
        ) : null}

        {days.map((d) => {
          const key = dayKey(d);
          const cfg = getDayConfig(weekPlan, d);
          const planned = getPlannedForDate(weekPlan, scheduleEdits, d).filter((id) => templatesById[id]);
          const isToday = key === todayKey;
          const isPast = key < todayKey;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.day, isToday && styles.dayToday]}
              onPress={() => setSelectedDay(key)}
              activeOpacity={0.85}
            >
              <View style={styles.dayHead}>
                <View style={[styles.dateBox, isToday && styles.dateBoxToday]}>
                  <Text style={[styles.dateNum, isToday && { color: colors.onPrimary }]}>{d.getDate()}</Text>
                  <Text style={[styles.dateMon, isToday && { color: colors.onPrimary }]}>{MONTHS[d.getMonth()]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayName}>
                    {WEEKDAYS_LONG[d.getDay()]}
                    {isToday ? <Text style={{ color: colors.primary }}> · Bugün</Text> : null}
                  </Text>
                  <View style={styles.badges}>
                    {cfg.rest && !planned.length ? <Badge label="Dinlenme" color={colors.textSecondary} /> : null}
                    {cfg.reminder ? <Badge label={`⏰ ${cfg.reminder}`} color={colors.warning} /> : null}
                    {!planned.length && !cfg.rest ? <Text style={styles.free}>Boş gün · eklemek için dokun</Text> : null}
                  </View>
                </View>
                <Pencil color={colors.textMuted} size={16} />
              </View>

              {planned.map((id) => {
                const t = templatesById[id];
                const done = isPlannedDone(sessions, d, id);
                const missed = !done && isPast;
                return (
                  <View key={id} style={styles.item}>
                    <View style={[styles.itemDot, { backgroundColor: t.color || colors.primary }]} />
                    <Text style={[styles.itemName, done && styles.itemDone]} numberOfLines={1}>
                      {t.name}
                    </Text>
                    {done ? (
                      <Badge label="Yapıldı" />
                    ) : missed ? (
                      <Badge label="Kaçırıldı" color={colors.danger} />
                    ) : isToday ? (
                      <TouchableOpacity style={styles.startBtn} onPress={() => startWorkout(t, key)}>
                        <Text style={styles.startText}>Başla</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedDay ? <DaySheet dateKey={selectedDay} onClose={() => setSelectedDay(null)} navigation={navigation} /> : null}
    </>
  );
};

const DaySheet = ({ dateKey, onClose }) => {
  const { templates, templatesById, weekPlan, scheduleEdits, updateDay, addToDate, removeFromDate, settings } = useApp();
  const askNotifications = useEnableNotifications();
  const date = fromDayKey(dateKey);
  const dow = date.getDay();
  const cfg = getDayConfig(weekPlan, date);
  const planned = getPlannedForDate(weekPlan, scheduleEdits, date).filter((id) => templatesById[id]);
  const notPlanned = templates.filter((t) => !planned.includes(t.id));

  const toggleRecurring = (id) => {
    const has = cfg.templateIds.includes(id);
    updateDay(dow, {
      templateIds: has ? cfg.templateIds.filter((x) => x !== id) : [...cfg.templateIds, id],
      rest: has ? cfg.rest : false,
    });
  };

  return (
    <Sheet visible onClose={onClose} title={`${WEEKDAYS_LONG[dow]}, ${formatShortDate(date)}`}>
      <SectionHeader title={`Bu tarihte (${date.getDate()} ${MONTHS[date.getMonth()]})`} style={styles.sheetSection} />
      {planned.length ? (
        planned.map((id) => (
          <View key={id} style={styles.sheetRow}>
            <View style={[styles.itemDot, { backgroundColor: templatesById[id].color || colors.primary }]} />
            <Text style={styles.sheetRowText}>{templatesById[id].name}</Text>
            <TouchableOpacity onPress={() => removeFromDate(dateKey, id)} hitSlop={8} accessibilityLabel="Bu tarihten kaldır">
              <X color={colors.danger} size={20} />
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={styles.sheetHint}>Bu tarihte antrenman yok.</Text>
      )}
      {notPlanned.length ? (
        <>
          <View style={styles.subRow}>
            <CalendarPlus color={colors.textMuted} size={14} />
            <Text style={styles.sheetSub}>Sadece bu tarihe ekle</Text>
          </View>
          <View style={styles.wrap}>
            {notPlanned.map((t) => (
              <TouchableOpacity key={t.id} style={styles.addChip} onPress={() => addToDate(dateKey, t.id)}>
                <Plus color={colors.primary} size={14} />
                <Text style={styles.addChipText}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title={`Her ${WEEKDAYS_LONG[dow]}`} style={styles.sheetSection} />
      <View style={styles.subRow}>
        <Repeat color={colors.textMuted} size={13} />
        <Text style={[styles.sheetHint, styles.flex]}>Seçtiğin antrenmanlar her hafta bu güne otomatik eklenir.</Text>
      </View>
      {templates.map((t) => {
        const on = cfg.templateIds.includes(t.id);
        return (
          <TouchableOpacity key={t.id} style={styles.sheetRow} onPress={() => toggleRecurring(t.id)} activeOpacity={0.8}>
            <View style={[styles.checkbox, on && styles.checkboxOn]}>
              {on ? <Check color={colors.onPrimary} size={14} strokeWidth={3} /> : null}
            </View>
            <Text style={styles.sheetRowText}>{t.name}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={[styles.sheetRow, { marginTop: 12 }]}>
        <Coffee color={colors.textSecondary} size={18} />
        <Text style={styles.sheetRowText}>Dinlenme günü</Text>
        <Switch
          value={!!cfg.rest}
          onValueChange={(v) => updateDay(dow, { rest: v, templateIds: v ? [] : cfg.templateIds })}
          trackColor={{ false: colors.surface3, true: colors.primaryDark }}
          thumbColor={cfg.rest ? colors.primary : colors.textSecondary}
        />
      </View>

      <View style={{ marginTop: 12 }}>
        <View style={styles.subRow}>
          <Bell color={colors.textMuted} size={14} />
          <Text style={styles.sheetSub}>Hatırlatıcı saati (her {WEEKDAYS_LONG[dow]})</Text>
        </View>
        <DateField
          mode="time"
          value={cfg.reminder}
          placeholder="Hatırlatıcı yok"
          onChange={(v) => {
            updateDay(dow, { reminder: v });
            if (!settings.notificationsEnabled) askNotifications();
          }}
          onClear={() => updateDay(dow, { reminder: null })}
        />
      </View>
      {cfg.reminder && !settings.notificationsEnabled ? (
        <TouchableOpacity style={styles.notifWarn} onPress={askNotifications} activeOpacity={0.85}>
          <Bell color={colors.warning} size={16} />
          <Text style={styles.notifWarnText}>Bildirimler kapalı — açmak için dokun</Text>
        </TouchableOpacity>
      ) : null}
      <Button title="Tamam" onPress={onClose} style={{ marginTop: 4, marginBottom: 8 }} />
    </Sheet>
  );
};

/* ================= TEMPLATES ================= */
const TemplatesList = ({ navigation }) => {
  const { templates, duplicateTemplate, deleteTemplate } = useApp();
  const startWorkout = useStartWorkout();

  const openActions = (t) =>
    Alert.alert(t.name, undefined, [
      { text: 'Düzenle', onPress: () => navigation.navigate('WorkoutEditor', { templateId: t.id }) },
      { text: 'Kopyala', onPress: () => duplicateTemplate(t.id) },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Antrenman silinsin mi?', 'Plandan da kaldırılacak. Geçmiş kayıtlar korunur.', [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Sil', style: 'destructive', onPress: () => deleteTemplate(t.id) },
          ]),
      },
      { text: 'Kapat', style: 'cancel' },
    ]);

  if (!templates.length) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Henüz antrenman yok"
        text="Egzersizleri, setleri ve hedef değerleri belirleyerek ilk şablonunu oluştur."
        action="Antrenman oluştur"
        onAction={() => navigation.navigate('WorkoutEditor')}
        style={{ marginTop: 40 }}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.tip}>Dokun: düzenle · Basılı tut: kopyala / sil</Text>
      {templates.map((t) => (
        <WorkoutCard
          key={t.id}
          template={t}
          onPress={() => navigation.navigate('WorkoutEditor', { templateId: t.id })}
          onLongPress={() => openActions(t)}
          onStart={() => startWorkout(t, dayKey())}
        />
      ))}
      <View style={styles.tplActions}>
        <Button title="Yeni antrenman" icon={Plus} onPress={() => navigation.navigate('WorkoutEditor')} style={{ flex: 1 }} />
      </View>
      <View style={styles.tplHelp}>
        <Copy color={colors.textMuted} size={14} />
        <Text style={styles.tplHelpText}>Benzer bir program için şablonu kopyalayıp düzenleyebilirsin.</Text>
      </View>
      <View style={styles.tplHelp}>
        <Trash2 color={colors.textMuted} size={14} />
        <Text style={styles.tplHelpText}>Silinen şablonların geçmiş antrenman kayıtları kaybolmaz.</Text>
      </View>
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
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  weekLabel: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 17,
  },
  weekSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  day: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  dayToday: {
    borderColor: colors.primary,
  },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBoxToday: {
    backgroundColor: colors.primary,
  },
  dateNum: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 17,
  },
  dateMon: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
  },
  dayName: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  free: {
    color: colors.textMuted,
    fontSize: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  itemDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemName: {
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  itemDone: {
    color: colors.textSecondary,
  },
  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  startText: {
    color: colors.onPrimary,
    fontWeight: '800',
    fontSize: 13,
  },
  sheetSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  sheetRowText: {
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  sheetHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 10,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flex: {
    flex: 1,
  },
  sheetSub: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 8,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addChipText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  notifWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warningSoft,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  notifWarnText: {
    color: colors.warning,
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
  },
  tip: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 10,
  },
  tplActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tplHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  tplHelpText: {
    color: colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
});

export default PlanScreen;
