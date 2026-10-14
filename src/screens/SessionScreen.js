import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Check,
  Plus,
  Trash2,
  RefreshCw,
  StickyNote,
  Timer,
  SkipForward,
  Zap,
  Moon,
  Smile,
  Flame,
  Battery,
  History,
  Flag,
} from 'lucide-react-native';

import colors from '../utils/colors';
import { formatClock, formatSeconds, formatShortDate } from '../utils/helpers';
import { makeSessionItem, previousEntry, formatSet, summarizeSession, typeFields } from '../utils/workout';
import { useApp } from '../context/AppContext';
import { hapticTap, hapticSuccess, hapticWarning } from '../utils/haptics';
import { scheduleRestEnd } from '../utils/notifications';
import useNow from '../hooks/useNow';
import { Screen, Header, Button, IconButton, EmptyState, ProgressBar } from '../components/ui';
import ExercisePicker from '../components/ExercisePicker';
import SetFields from '../components/SetFields';
import Sheet from '../components/Sheet';
import RatingSelector from '../components/RatingSelector';

const hasValue = (v) => v !== null && v !== undefined && v !== '';

const SessionScreen = ({ navigation }) => {
  const { activeSession, updateActiveSession, discardSession, finishSession, sessions, exercisesById, settings } = useApp();
  const insets = useSafeAreaInsets();
  const now = useNow(1000, !!activeSession);
  const [picker, setPicker] = useState(null);
  const [noteOpen, setNoteOpen] = useState({});
  const [beforeOpen, setBeforeOpen] = useState(
    !!activeSession && settings.askWellbeing && !activeSession.wellbeingBefore
  );
  const [afterOpen, setAfterOpen] = useState(false);
  const [before, setBefore] = useState({ energy: null, sleep: null, mood: null });
  const [after, setAfter] = useState({ load: null, fatigue: null, comment: '' });
  const restNotified = useRef(null);

  const session = activeSession;
  const restLeft = session?.restEndsAt ? Math.ceil((new Date(session.restEndsAt).getTime() - now) / 1000) : 0;

  // Ask how the user feels once per workout
  useEffect(() => {
    if (session && settings.askWellbeing && !session.wellbeingBefore) setBeforeOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // Background alert for the end of rest (cancelled when rest is skipped or cleared)
  useEffect(() => {
    scheduleRestEnd(session?.restEndsAt, session?.restExerciseName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.restEndsAt]);

  // Buzz and clear the rest timer once it's over
  useEffect(() => {
    if (!session?.restEndsAt) return;
    if (restLeft <= 0 && restNotified.current !== session.restEndsAt) {
      restNotified.current = session.restEndsAt;
      hapticSuccess();
      updateActiveSession({ restEndsAt: null, restTotal: null });
    }
  }, [restLeft, session?.restEndsAt, updateActiveSession]);

  const previous = useMemo(() => {
    if (!session) return {};
    const out = {};
    session.exercises.forEach((it) => {
      out[it.exerciseId] = previousEntry(sessions, it.exerciseId, null);
    });
    return out;
  }, [session, sessions]);

  if (!session) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header back title="Antrenman" />
        <EmptyState title="Aktif antrenman yok" action="Geri dön" onAction={() => navigation.goBack()} />
      </Screen>
    );
  }

  const summary = summarizeSession(session);
  const elapsed = now - new Date(session.startedAt).getTime();

  /* ---------- mutations ---------- */
  const setItems = (fn) => updateActiveSession((prev) => ({ ...prev, exercises: fn(prev.exercises) }));

  const updateItem = (itemId, fields) => setItems((list) => list.map((it) => (it.id === itemId ? { ...it, ...fields } : it)));

  const updateSet = (itemId, setId, fields) =>
    setItems((list) =>
      list.map((it) =>
        it.id === itemId ? { ...it, sets: it.sets.map((s) => (s.id === setId ? { ...s, ...fields } : s)) } : it
      )
    );

  const startRest = (seconds, exerciseName) => {
    if (!seconds) return;
    updateActiveSession({
      restEndsAt: new Date(Date.now() + seconds * 1000).toISOString(),
      restTotal: seconds,
      restExerciseName: exerciseName || null,
    });
  };

  const toggleSet = (item, set) => {
    const ex = exercisesById[item.exerciseId];
    if (set.done) {
      updateSet(item.id, set.id, { done: false });
      return;
    }
    // Empty fields fall back to the target values
    const filled = {};
    typeFields(ex?.type).forEach((f) => {
      if (!hasValue(set[f]) && hasValue(set.target?.[f])) filled[f] = set.target[f];
    });
    updateSet(item.id, set.id, { ...filled, done: true });
    hapticTap();
    startRest(item.restSeconds, ex?.name);
  };

  const addSet = (item) =>
    updateItem(item.id, {
      sets: [
        ...item.sets,
        makeSessionItem(item.exerciseId, [item.sets[item.sets.length - 1]?.target || {}]).sets[0],
      ],
    });

  const removeSet = (item, setId) => updateItem(item.id, { sets: item.sets.filter((s) => s.id !== setId) });

  const removeItem = (item) =>
    Alert.alert('Egzersiz kaldırılsın mı?', exercisesById[item.exerciseId]?.name, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Kaldır', style: 'destructive', onPress: () => setItems((list) => list.filter((it) => it.id !== item.id)) },
    ]);

  const onPick = (exercise) => {
    if (picker?.mode === 'replace') {
      setItems((list) =>
        list.map((it) => {
          if (it.id !== picker.itemId) return it;
          const sameType = exercisesById[it.exerciseId]?.type === exercise.type;
          const fresh = makeSessionItem(
            exercise.id,
            sameType ? it.sets.map((s) => s.target || {}) : it.sets.map(() => ({})),
            it.restSeconds,
            it.note
          );
          return { ...fresh, id: it.id, replacedFrom: it.replacedFrom || it.exerciseId };
        })
      );
    } else {
      setItems((list) => [...list, makeSessionItem(exercise.id, [{}, {}, {}], settings.restSeconds || 90)]);
    }
    setPicker(null);
  };

  /* ---------- finish ---------- */
  const onFinish = () => {
    if (!summary.sets) {
      hapticWarning();
      Alert.alert('Hiç set tamamlanmadı', 'Kaydetmek için en az bir seti işaretle ya da antrenmanı sil.', [
        { text: 'Devam et', style: 'cancel' },
        { text: 'Antrenmanı sil', style: 'destructive', onPress: onDiscardConfirmed },
      ]);
      return;
    }
    const proceed = () => (settings.askWellbeing ? setAfterOpen(true) : complete({}));
    if (summary.sets < summary.totalSets) {
      Alert.alert(
        'Antrenman bitirilsin mi?',
        `${summary.totalSets - summary.sets} set tamamlanmadı. İşaretlenmeyen setler kaydedilmeyecek.`,
        [
          { text: 'Devam et', style: 'cancel' },
          { text: 'Bitir', onPress: proceed },
        ]
      );
    } else proceed();
  };

  const complete = (wellbeingAfter) => {
    setAfterOpen(false);
    const id = finishSession({ wellbeingAfter, restEndsAt: null, restTotal: null, restExerciseName: null });
    hapticSuccess();
    if (id) navigation.replace('SessionDetail', { sessionId: id, justFinished: true });
  };

  const onDiscardConfirmed = () => {
    discardSession();
    navigation.goBack();
  };

  const onDiscard = () =>
    Alert.alert('Antrenman silinsin mi?', 'Bu antrenmanda girilen tüm veriler silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: onDiscardConfirmed },
    ]);

  const saveBefore = (skip) => {
    updateActiveSession({ wellbeingBefore: skip ? { skipped: true } : before });
    setBeforeOpen(false);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        back
        title={session.name}
        subtitle={`${summary.sets}/${summary.totalSets} set tamamlandı`}
        right={<IconButton icon={Trash2} color={colors.danger} onPress={onDiscard} label="Antrenmanı sil" />}
      />

      <View style={styles.topBar}>
        <View style={styles.clockBox}>
          <Timer color={colors.primary} size={18} />
          <Text style={styles.clock}>{formatClock(elapsed)}</Text>
        </View>
        <ProgressBar progress={summary.totalSets ? summary.sets / summary.totalSets : 0} style={{ flex: 1 }} />
        <Button title="Bitir" icon={Flag} small onPress={onFinish} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: session.restEndsAt ? 140 : 40 }]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        {session.exercises.map((item) => {
          const ex = exercisesById[item.exerciseId];
          const type = ex?.type || 'weight';
          const prev = previous[item.exerciseId];
          const doneCount = item.sets.filter((s) => s.done).length;
          const allDone = doneCount === item.sets.length && item.sets.length > 0;
          return (
            <View key={item.id} style={[styles.block, allDone && styles.blockDone]}>
              <View style={styles.blockHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{ex?.name || 'Silinmiş egzersiz'}</Text>
                  {item.replacedFrom ? (
                    <Text style={styles.replaced}>
                      “{exercisesById[item.replacedFrom]?.name}” yerine
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.exCount}>
                  {doneCount}/{item.sets.length}
                </Text>
              </View>

              {prev ? (
                <View style={styles.prev}>
                  <History color={colors.textMuted} size={13} />
                  <Text style={styles.prevText} numberOfLines={2}>
                    {formatShortDate(prev.session.startedAt)}: {prev.item.sets.map((s) => formatSet(s, type)).join(' · ')}
                  </Text>
                </View>
              ) : null}

              <View style={styles.setHeader}>
                <Text style={[styles.setHeaderText, { width: 30 }]}>Set</Text>
                <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
                  {typeFields(type).map((f) => (
                    <Text key={f} style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>
                      {f === 'weight' ? 'Ağırlık' : f === 'reps' ? 'Tekrar' : f === 'time' ? 'Süre' : 'Mesafe'}
                    </Text>
                  ))}
                </View>
                <View style={{ width: 52 }} />
              </View>

              {item.sets.map((s, i) => (
                <View key={s.id} style={styles.setRow}>
                  <TouchableOpacity
                    onLongPress={() =>
                      Alert.alert(`Set ${i + 1}`, undefined, [
                        { text: 'Seti sil', style: 'destructive', onPress: () => removeSet(item, s.id) },
                        { text: 'Vazgeç', style: 'cancel' },
                      ])
                    }
                    style={styles.setNumWrap}
                  >
                    <Text style={[styles.setNum, s.done && { color: colors.primary }]}>{i + 1}</Text>
                  </TouchableOpacity>
                  <SetFields
                    type={type}
                    set={s}
                    placeholders={s.target || {}}
                    done={s.done}
                    onChange={(fields) => updateSet(item.id, s.id, fields)}
                  />
                  <TouchableOpacity
                    style={[styles.check, s.done && styles.checkOn]}
                    onPress={() => toggleSet(item, s)}
                    accessibilityLabel={`Set ${i + 1} tamamlandı`}
                  >
                    <Check color={s.done ? colors.onPrimary : colors.textMuted} size={22} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}

              {noteOpen[item.id] || item.note ? (
                <TextInput
                  value={item.note}
                  onChangeText={(t) => updateItem(item.id, { note: t })}
                  placeholder="Bu egzersiz için not..."
                  placeholderTextColor={colors.textMuted}
                  selectionColor={colors.primary}
                  multiline
                  style={styles.note}
                />
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.action} onPress={() => addSet(item)}>
                  <Plus color={colors.primary} size={15} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Set</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.action} onPress={() => startRest(item.restSeconds || settings.restSeconds, ex?.name)}>
                  <Timer color={colors.textSecondary} size={15} />
                  <Text style={styles.actionText}>{formatSeconds(item.restSeconds || settings.restSeconds)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.action} onPress={() => setNoteOpen((n) => ({ ...n, [item.id]: true }))}>
                  <StickyNote color={colors.textSecondary} size={15} />
                  <Text style={styles.actionText}>Not</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.action} onPress={() => setPicker({ mode: 'replace', itemId: item.id })}>
                  <RefreshCw color={colors.textSecondary} size={15} />
                  <Text style={styles.actionText}>Değiştir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.action} onPress={() => removeItem(item)}>
                  <Trash2 color={colors.danger} size={15} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Button title="Egzersiz ekle" icon={Plus} variant="outline" onPress={() => setPicker({ mode: 'add' })} />

        <Text style={styles.noteLabel}>Antrenman notu</Text>
        <TextInput
          value={session.note}
          onChangeText={(t) => updateActiveSession({ note: t })}
          placeholder="Genel notlar, ekipman, ortam..."
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          multiline
          style={[styles.note, { minHeight: 80 }]}
        />

        <Button title="Antrenmanı bitir" icon={Flag} onPress={onFinish} style={{ marginTop: 20 }} />
      </KeyboardAwareScrollView>

      {/* REST TIMER */}
      {session.restEndsAt && restLeft > 0 ? (
        <View style={[styles.rest, { bottom: Math.max(insets.bottom, 12) }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.restLabel}>DİNLENME</Text>
            <Text style={styles.restClock}>{formatSeconds(restLeft)}</Text>
            <ProgressBar
              progress={restLeft / (session.restTotal || restLeft)}
              color={colors.onPrimary}
              height={5}
              style={{ backgroundColor: 'rgba(0,0,0,0.2)', marginTop: 6 }}
            />
          </View>
          <TouchableOpacity
            style={styles.restBtn}
            onPress={() =>
              updateActiveSession((p) => ({
                ...p,
                restEndsAt: new Date(new Date(p.restEndsAt).getTime() - 15000).toISOString(),
              }))
            }
          >
            <Text style={styles.restBtnText}>-15</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.restBtn}
            onPress={() =>
              updateActiveSession((p) => ({
                ...p,
                restEndsAt: new Date(new Date(p.restEndsAt).getTime() + 15000).toISOString(),
                restTotal: (p.restTotal || 0) + 15,
              }))
            }
          >
            <Text style={styles.restBtnText}>+15</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.restBtn, styles.restSkip]}
            onPress={() => updateActiveSession({ restEndsAt: null, restTotal: null })}
            accessibilityLabel="Dinlenmeyi geç"
          >
            <SkipForward color={colors.primary} size={20} />
          </TouchableOpacity>
        </View>
      ) : null}

      <ExercisePicker
        visible={!!picker}
        title={picker?.mode === 'replace' ? 'Egzersizi değiştir' : 'Egzersiz ekle'}
        onClose={() => setPicker(null)}
        onSelect={onPick}
        excludeIds={session.exercises.map((it) => it.exerciseId)}
      />

      {/* WELLBEING BEFORE */}
      <Sheet
        visible={beforeOpen}
        onClose={() => saveBefore(true)}
        title="Başlamadan önce"
        footer={
          <View style={styles.sheetFooter}>
            <Button title="Atla" variant="secondary" onPress={() => saveBefore(true)} style={{ flex: 1 }} />
            <Button title="Kaydet" onPress={() => saveBefore(false)} style={{ flex: 1.5 }} />
          </View>
        }
      >
        <Text style={styles.sheetIntro}>Bugün kendini nasıl hissediyorsun? Sonra performansınla karşılaştırabilirsin.</Text>
        <RatingSelector
          label="Enerji"
          icon={Zap}
          value={before.energy}
          onChange={(v) => setBefore((b) => ({ ...b, energy: v }))}
          lowLabel="Bitkin"
          highLabel="Enerjik"
        />
        <RatingSelector
          label="Uyku"
          icon={Moon}
          value={before.sleep}
          onChange={(v) => setBefore((b) => ({ ...b, sleep: v }))}
          lowLabel="Çok kötü"
          highLabel="Mükemmel"
        />
        <RatingSelector
          label="Ruh hali"
          icon={Smile}
          value={before.mood}
          onChange={(v) => setBefore((b) => ({ ...b, mood: v }))}
          lowLabel="Kötü"
          highLabel="Harika"
        />
      </Sheet>

      {/* WELLBEING AFTER */}
      <Sheet
        visible={afterOpen}
        onClose={() => setAfterOpen(false)}
        title="Antrenman nasıl geçti?"
        footer={
          <View style={styles.sheetFooter}>
            <Button title="Atla" variant="secondary" onPress={() => complete({ skipped: true })} style={{ flex: 1 }} />
            <Button title="Kaydet ve bitir" onPress={() => complete(after)} style={{ flex: 1.6 }} />
          </View>
        }
      >
        <RatingSelector
          label="Yüklenme (RPE)"
          icon={Flame}
          max={10}
          value={after.load}
          onChange={(v) => setAfter((a) => ({ ...a, load: v }))}
          lowLabel="Çok hafif"
          highLabel="Maksimum"
        />
        <RatingSelector
          label="Yorgunluk"
          icon={Battery}
          value={after.fatigue}
          onChange={(v) => setAfter((a) => ({ ...a, fatigue: v }))}
          lowLabel="Dinç"
          highLabel="Çok yorgun"
        />
        <Text style={styles.noteLabel}>Yorum</Text>
        <TextInput
          value={after.comment}
          onChangeText={(t) => setAfter((a) => ({ ...a, comment: t }))}
          placeholder="Ağrı, motivasyon, bir dahaki sefere..."
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          multiline
          style={[styles.note, { minHeight: 80, marginBottom: 8 }]}
        />
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clock: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  content: {
    padding: 16,
  },
  block: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  blockDone: {
    borderColor: colors.primaryBorder,
  },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  replaced: {
    color: colors.warning,
    fontSize: 12,
    marginTop: 2,
  },
  exCount: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 15,
  },
  prev: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  prevText: {
    color: colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  setHeaderText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  setNumWrap: {
    width: 30,
    height: 42,
    justifyContent: 'center',
  },
  setNum: {
    color: colors.textSecondary,
    fontWeight: '900',
    fontSize: 15,
  },
  check: {
    width: 44,
    height: 42,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  note: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 8,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  actionText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  noteLabel: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
    marginTop: 20,
  },
  rest: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 22,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  restLabel: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '900',
    opacity: 0.7,
  },
  restClock: {
    color: colors.onPrimary,
    fontSize: 30,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  restBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restSkip: {
    backgroundColor: colors.onPrimary,
  },
  restBtnText: {
    color: colors.onPrimary,
    fontWeight: '900',
    fontSize: 15,
  },
  sheetIntro: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default SessionScreen;
