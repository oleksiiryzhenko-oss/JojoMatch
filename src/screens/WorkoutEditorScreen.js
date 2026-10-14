import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Plus, Trash2, ArrowUp, ArrowDown, RefreshCw, Copy, Play, Minus, Timer, X } from 'lucide-react-native';

import colors, { workoutColors } from '../utils/colors';
import { genId, formatSeconds, dayKey } from '../utils/helpers';
import { EXERCISE_TYPES } from '../data/exercises';
import { useApp } from '../context/AppContext';
import useStartWorkout from '../hooks/useStartWorkout';
import { Screen, Header, Field, Button, IconButton, EmptyState } from '../components/ui';
import ExercisePicker from '../components/ExercisePicker';
import SetFields from '../components/SetFields';

const defaultSet = (type) => {
  switch (type) {
    case 'reps':
      return { reps: 10 };
    case 'time':
      return { time: 30 };
    case 'distance':
      return { distance: 1, time: 360 };
    default:
      return { weight: 20, reps: 10 };
  }
};

const WorkoutEditorScreen = ({ navigation, route }) => {
  const templateId = route.params?.templateId;
  const { templatesById, exercisesById, settings, addTemplate, updateTemplate, duplicateTemplate, deleteTemplate } = useApp();
  const startWorkout = useStartWorkout();
  const existing = templateId ? templatesById[templateId] : null;

  const [name, setName] = useState(existing?.name || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [color, setColor] = useState(existing?.color || workoutColors[0]);
  const [items, setItems] = useState(() => JSON.parse(JSON.stringify(existing?.exercises || [])));
  const [picker, setPicker] = useState(null); // { mode: 'add' } | { mode: 'replace', itemId }
  const [dirty, setDirty] = useState(false);

  const touch = (fn) => (...args) => {
    setDirty(true);
    fn(...args);
  };

  const updateItem = touch((id, fields) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...fields } : it))));

  const updateSet = touch((itemId, index, fields) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, sets: it.sets.map((s, i) => (i === index ? { ...s, ...fields } : s)) } : it
      )
    )
  );

  const addSet = touch((itemId) =>
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const last = it.sets[it.sets.length - 1] || defaultSet(exercisesById[it.exerciseId]?.type);
        return { ...it, sets: [...it.sets, { ...last }] };
      })
    )
  );

  const removeSet = touch((itemId, index) =>
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, sets: it.sets.filter((_, i) => i !== index) } : it)))
  );

  const move = touch((index, delta) =>
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    })
  );

  const removeItem = touch((id) => setItems((prev) => prev.filter((it) => it.id !== id)));

  const onPick = (exercise) => {
    setDirty(true);
    if (picker?.mode === 'replace') {
      setItems((prev) =>
        prev.map((it) =>
          it.id === picker.itemId
            ? {
                ...it,
                exerciseId: exercise.id,
                sets:
                  exercisesById[it.exerciseId]?.type === exercise.type
                    ? it.sets
                    : it.sets.map(() => defaultSet(exercise.type)),
              }
            : it
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: genId(),
          exerciseId: exercise.id,
          restSeconds: settings.restSeconds || 90,
          note: '',
          sets: [defaultSet(exercise.type), defaultSet(exercise.type), defaultSet(exercise.type)],
        },
      ]);
    }
    setPicker(null);
  };

  const buildTemplate = () => ({
    name: name.trim() || 'Yeni Antrenman',
    notes: notes.trim(),
    color,
    exercises: items.map((it) => ({ ...it, sets: it.sets.length ? it.sets : [defaultSet(exercisesById[it.exerciseId]?.type)] })),
  });

  const save = () => {
    if (existing) updateTemplate(existing.id, buildTemplate());
    else addTemplate(buildTemplate());
    setDirty(false);
    navigation.goBack();
  };

  const onBack = () => {
    if (!dirty) return navigation.goBack();
    Alert.alert('Değişiklikler kaydedilsin mi?', undefined, [
      { text: 'Kaydetme', style: 'destructive', onPress: () => navigation.goBack() },
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Kaydet', onPress: save },
    ]);
  };

  const onStart = () => {
    let tpl;
    if (existing) {
      if (dirty) updateTemplate(existing.id, buildTemplate());
      tpl = { ...existing, ...buildTemplate() };
    } else {
      const id = addTemplate(buildTemplate());
      tpl = { ...buildTemplate(), id };
    }
    setDirty(false);
    navigation.goBack();
    startWorkout(tpl, dayKey());
  };

  const onDuplicate = () => {
    if (dirty) updateTemplate(existing.id, buildTemplate());
    const id = duplicateTemplate(existing.id);
    if (id) navigation.replace('WorkoutEditor', { templateId: id });
  };

  const onDelete = () =>
    Alert.alert('Antrenman silinsin mi?', 'Plandan da kaldırılacak. Geçmiş kayıtlar korunur.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          deleteTemplate(existing.id);
          navigation.goBack();
        },
      },
    ]);

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        back
        onBack={onBack}
        title={existing ? 'Antrenmanı düzenle' : 'Yeni antrenman'}
        right={
          existing ? (
            <>
              <IconButton icon={Copy} onPress={onDuplicate} label="Kopyala" />
              <IconButton icon={Trash2} color={colors.danger} onPress={onDelete} label="Sil" />
            </>
          ) : null
        }
      />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        <Field label="Antrenman adı" value={name} onChangeText={touch(setName)} placeholder="Örn. Bacak Günü" />
        <Text style={styles.label}>Renk</Text>
        <View style={styles.colors}>
          {workoutColors.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.color, { backgroundColor: c }, color === c && styles.colorActive]}
              onPress={touch(() => setColor(c))}
            />
          ))}
        </View>
        <Field
          label="Notlar"
          value={notes}
          onChangeText={touch(setNotes)}
          placeholder="Isınma, tempo, dikkat edilecekler..."
          multiline
        />

        <Text style={styles.sectionTitle}>Egzersizler ({items.length})</Text>
        {!items.length ? (
          <EmptyState title="Henüz egzersiz eklenmedi" text="Aşağıdaki butonla kütüphaneden egzersiz ekle." />
        ) : null}

        {items.map((it, index) => {
          const ex = exercisesById[it.exerciseId];
          const type = ex?.type || 'weight';
          return (
            <View key={it.id} style={styles.item}>
              <View style={styles.itemHead}>
                <View style={styles.index}>
                  <Text style={styles.indexText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {ex?.name || 'Silinmiş egzersiz'}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {ex?.category} · {EXERCISE_TYPES[type].label}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => move(index, -1)} disabled={index === 0} hitSlop={6} style={styles.miniBtn}>
                  <ArrowUp color={index === 0 ? colors.surface3 : colors.textSecondary} size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  hitSlop={6}
                  style={styles.miniBtn}
                >
                  <ArrowDown color={index === items.length - 1 ? colors.surface3 : colors.textSecondary} size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.setHeader}>
                <Text style={[styles.setHeaderText, { width: 34 }]}>Set</Text>
                <Text style={[styles.setHeaderText, { flex: 1 }]}>Hedef</Text>
              </View>
              {it.sets.map((s, i) => (
                <View key={i} style={styles.setRow}>
                  <Text style={styles.setNum}>{i + 1}</Text>
                  <SetFields type={type} set={s} onChange={(fields) => updateSet(it.id, i, fields)} />
                  <TouchableOpacity onPress={() => removeSet(it.id, i)} hitSlop={8} style={styles.removeSet}>
                    <X color={colors.textMuted} size={18} />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.itemFooter}>
                <TouchableOpacity style={styles.addSet} onPress={() => addSet(it.id)}>
                  <Plus color={colors.primary} size={16} />
                  <Text style={styles.addSetText}>Set ekle</Text>
                </TouchableOpacity>
                <View style={styles.rest}>
                  <Timer color={colors.textMuted} size={15} />
                  <TouchableOpacity
                    onPress={() => updateItem(it.id, { restSeconds: Math.max(0, (it.restSeconds || 0) - 15) })}
                    hitSlop={6}
                  >
                    <Minus color={colors.textSecondary} size={16} />
                  </TouchableOpacity>
                  <Text style={styles.restText}>{formatSeconds(it.restSeconds || 0)}</Text>
                  <TouchableOpacity onPress={() => updateItem(it.id, { restSeconds: (it.restSeconds || 0) + 15 })} hitSlop={6}>
                    <Plus color={colors.textSecondary} size={16} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.itemActions}>
                <TouchableOpacity style={styles.itemAction} onPress={() => setPicker({ mode: 'replace', itemId: it.id })}>
                  <RefreshCw color={colors.textSecondary} size={14} />
                  <Text style={styles.itemActionText}>Değiştir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.itemAction} onPress={() => removeItem(it.id)}>
                  <Trash2 color={colors.danger} size={14} />
                  <Text style={[styles.itemActionText, { color: colors.danger }]}>Kaldır</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Button title="Egzersiz ekle" icon={Plus} variant="outline" onPress={() => setPicker({ mode: 'add' })} />
      </KeyboardAwareScrollView>

      <View style={styles.footer}>
        <Button title="Başla" icon={Play} variant="secondary" onPress={onStart} disabled={!items.length} style={{ flex: 1 }} />
        <Button title="Kaydet" onPress={save} style={{ flex: 1.6 }} />
      </View>

      <ExercisePicker
        visible={!!picker}
        title={picker?.mode === 'replace' ? 'Egzersizi değiştir' : 'Egzersiz ekle'}
        onClose={() => setPicker(null)}
        onSelect={onPick}
        excludeIds={items.map((it) => it.exerciseId)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  colors: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  color: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorActive: {
    borderColor: colors.text,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 12,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  index: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    color: colors.primary,
    fontWeight: '900',
  },
  itemName: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  itemMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  miniBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setHeader: {
    flexDirection: 'row',
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
  setNum: {
    width: 34,
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 15,
    lineHeight: 42,
  },
  removeSet: {
    width: 30,
    height: 42,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  addSetText: {
    color: colors.primary,
    fontWeight: '800',
  },
  rest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  restText: {
    color: colors.text,
    fontWeight: '800',
    minWidth: 36,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  itemActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemActionText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});

export default WorkoutEditorScreen;
