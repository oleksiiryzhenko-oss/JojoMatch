import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Trash2, Dumbbell, ChevronRight, X } from 'lucide-react-native';

import colors from '../utils/colors';
import { dayKey, addDays, parseNum, formatDate, fmtNum } from '../utils/helpers';
import { GOAL_TYPES, getPersonalRecords, primaryMetric, goalProgress } from '../utils/workout';
import { useApp } from '../context/AppContext';
import { Screen, Header, Field, Chip, Button, IconButton, ProgressBar, Card } from '../components/ui';
import DateField from '../components/DateField';
import ExercisePicker from '../components/ExercisePicker';

const UNIT_FOR = { workouts: 'treinos', minutes: 'min', bodyweight: 'kg' };

const GoalEditorScreen = ({ navigation, route }) => {
  const { goalId } = route.params || {};
  const { goals, addGoal, updateGoal, deleteGoal, exercisesById, sessions, measurements } = useApp();
  const existing = goalId ? goals.find((g) => g.id === goalId) : null;

  const [type, setType] = useState(existing?.type || 'workouts');
  const [title, setTitle] = useState(existing?.title || '');
  const [target, setTarget] = useState(existing?.target !== undefined ? String(existing.target) : '');
  const [unit, setUnit] = useState(existing?.unit || '');
  const [exerciseId, setExerciseId] = useState(existing?.exerciseId || null);
  const [startDate, setStartDate] = useState(existing?.startDate || dayKey());
  const [deadline, setDeadline] = useState(existing?.deadline || dayKey(addDays(new Date(), 30)));
  const [pickerOpen, setPickerOpen] = useState(false);

  const exercise = exerciseId ? exercisesById[exerciseId] : null;
  const metric = primaryMetric(exercise?.type);
  const currentRecord = exerciseId ? getPersonalRecords(sessions, exerciseId)[metric.key]?.value || 0 : 0;
  const latestWeight = [...measurements]
    .filter((m) => m.values?.weight)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.values.weight;

  const suggestedTitle = () => {
    const t = parseNum(target);
    switch (type) {
      case 'workouts':
        return t ? `${t} treinos concluídos` : 'Meta de treinos';
      case 'minutes':
        return t ? `${t} minutos de treino` : 'Meta de tempo';
      case 'exercise':
        return exercise ? `${exercise.name}: ${t ? metric.format(t) : 'novo recorde'}` : 'Meta de exercício';
      case 'bodyweight':
        return t ? `Alcançar ${fmtNum(t)} kg` : 'Meta de peso';
      default:
        return 'Meta personalizada';
    }
  };

  const canSave = parseNum(target) !== null && (type !== 'exercise' || exerciseId);

  const save = () => {
    const data = {
      type,
      title: title.trim() || suggestedTitle(),
      target: parseNum(target),
      unit: type === 'custom' ? unit.trim() : UNIT_FOR[type] || '',
      exerciseId: type === 'exercise' ? exerciseId : null,
      startDate,
      deadline,
    };
    if (existing) {
      updateGoal(existing.id, data);
    } else {
      if (type === 'exercise') data.startValue = currentRecord;
      if (type === 'bodyweight') data.startValue = latestWeight ?? null;
      addGoal(data);
    }
    navigation.goBack();
  };

  const onDelete = () =>
    Alert.alert('Excluir meta?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteGoal(existing.id);
          navigation.goBack();
        },
      },
    ]);

  const progress = existing ? goalProgress(existing, { sessions, measurements, exercisesById }) : null;

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        back
        title={existing ? 'Editar meta' : 'Nova meta'}
        right={existing ? <IconButton icon={Trash2} color={colors.danger} onPress={onDelete} label="Excluir" /> : null}
      />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        {progress ? (
          <Card style={{ marginBottom: 16 }}>
            <Text style={styles.progressText}>
              Şu an: <Text style={{ color: colors.primary }}>{progress.format(progress.current)}</Text> /{' '}
              {progress.format(progress.target)} {progress.unit}
            </Text>
            <ProgressBar progress={progress.pct} style={{ marginTop: 10 }} />
          </Card>
        ) : null}

        <Text style={styles.label}>Tipo de meta</Text>
        <View style={styles.wrap}>
          {Object.values(GOAL_TYPES).map((g) => (
            <Chip key={g.key} label={g.label} active={type === g.key} onPress={() => setType(g.key)} />
          ))}
        </View>
        <Text style={styles.hint}>{GOAL_TYPES[type].hint}</Text>

        {type === 'exercise' ? (
          <>
            <Text style={styles.label}>Exercício</Text>
            <TouchableOpacity style={styles.exBox} onPress={() => setPickerOpen(true)}>
              <Dumbbell color={exercise ? colors.primary : colors.textMuted} size={18} />
              <Text style={[styles.exText, !exercise && { color: colors.textMuted }]}>
                {exercise?.name || 'Escolher exercício'}
              </Text>
              <ChevronRight color={colors.textMuted} size={18} />
            </TouchableOpacity>
            {exercise ? (
              <Text style={styles.hint}>
                Seu recorde atual: {currentRecord ? metric.format(currentRecord) : 'ainda não há'} ({metric.label.toLocaleLowerCase('pt-BR')})
              </Text>
            ) : null}
          </>
        ) : null}

        <View style={styles.row}>
          <Field
            label="Valor-alvo"
            value={target}
            onChangeText={setTarget}
            keyboardType="decimal-pad"
            placeholder={type === 'workouts' ? '12' : type === 'bodyweight' ? '75' : '0'}
            suffix={
              type === 'custom'
                ? undefined
                : type === 'exercise'
                  ? exercise?.type === 'time'
                    ? 's'
                    : exercise?.type === 'reps'
                      ? 'rep'
                      : exercise?.type === 'distance'
                        ? 'km'
                        : 'kg'
                  : UNIT_FOR[type]
            }
            style={{ flex: 1 }}
          />
          {type === 'custom' ? (
            <Field label="Unidade" value={unit} onChangeText={setUnit} placeholder="km, dias, páginas..." style={{ flex: 1 }} />
          ) : null}
        </View>

        {type === 'bodyweight' && !existing ? (
          <Text style={styles.hint}>
            {latestWeight ? `Início: sua última medida ${fmtNum(latestWeight)} kg` : 'O progresso é calculado a partir das medidas de peso na seção “Corpo”.'}
          </Text>
        ) : null}

        <Field label="Título (opcional)" value={title} onChangeText={setTitle} placeholder={suggestedTitle()} />

        <View style={styles.row}>
          <DateField label="Início" value={startDate} onChange={setStartDate} style={{ flex: 1 }} />
          <DateField label="Prazo" value={deadline} onChange={setDeadline} style={{ flex: 1 }} />
        </View>

        {existing?.type === 'custom' && existing.entries?.length ? (
          <>
            <Text style={styles.label}>Progressos registrados</Text>
            {[...existing.entries].reverse().map((e) => (
              <View key={e.id} style={styles.entry}>
                <Text style={styles.entryValue}>
                  +{fmtNum(e.value)} {existing.unit}
                </Text>
                <Text style={styles.entryDate}>{formatDate(e.date)}</Text>
                <TouchableOpacity
                  onPress={() => updateGoal(existing.id, { entries: existing.entries.filter((x) => x.id !== e.id) })}
                  hitSlop={8}
                >
                  <X color={colors.textMuted} size={18} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : null}
      </KeyboardAwareScrollView>
      <View style={styles.footer}>
        <Button title="Salvar" onPress={save} disabled={!canSave} />
      </View>

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(ex) => {
          setExerciseId(ex.id);
          setPickerOpen(false);
        }}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  progressText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 14,
  },
  exBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  exText: {
    color: colors.text,
    fontSize: 16,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
  },
  entryValue: {
    color: colors.primary,
    fontWeight: '800',
  },
  entryDate: {
    color: colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default GoalEditorScreen;
