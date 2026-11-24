import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Trash2 } from 'lucide-react-native';

import colors from '../utils/colors';
import { dayKey, addDays, fromDayKey } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { Screen, Header, Field, Chip, Button, IconButton, Segmented } from '../components/ui';
import DateField from '../components/DateField';

const DURATIONS = [7, 14, 21, 30, 60, 90];

const ChallengeEditorScreen = ({ navigation, route }) => {
  const { challengeId } = route.params || {};
  const { challenges, addChallenge, updateChallenge, deleteChallenge } = useApp();
  const existing = challengeId ? challenges.find((c) => c.id === challengeId) : null;

  const [title, setTitle] = useState(existing?.title || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [frequency, setFrequency] = useState(existing?.frequency || 'daily');
  const [timesPerWeek, setTimesPerWeek] = useState(existing?.timesPerWeek || 3);
  const [startDate, setStartDate] = useState(existing?.startDate || dayKey());
  const [endDate, setEndDate] = useState(existing?.endDate || dayKey(addDays(new Date(), 29)));

  const setDuration = (days) => setEndDate(dayKey(addDays(fromDayKey(startDate), days - 1)));
  const valid = title.trim() && endDate >= startDate;

  const save = () => {
    const data = { title: title.trim(), description: description.trim(), frequency, timesPerWeek, startDate, endDate };
    if (existing) updateChallenge(existing.id, data);
    else addChallenge(data);
    navigation.goBack();
  };

  const onDelete = () =>
    Alert.alert('Excluir desafio?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteChallenge(existing.id);
          navigation.goBack();
        },
      },
    ]);

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        back
        title={existing ? 'Editar' : 'Novo desafio'}
        right={existing ? <IconButton icon={Trash2} color={colors.danger} onPress={onDelete} label="Excluir" /> : null}
      />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        <Field label="Tarefa" value={title} onChangeText={setTitle} placeholder="Ex.: 50 flexões todo dia" />
        <Field
          label="Descrição (opcional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Regras, motivação..."
          multiline
        />

        <Text style={styles.label}>Frequência</Text>
        <Segmented
          value={frequency}
          onChange={setFrequency}
          options={[
            { value: 'daily', label: 'Todo dia' },
            { value: 'weekly', label: 'X vezes por semana' },
          ]}
          style={{ marginBottom: 12 }}
        />
        {frequency === 'weekly' ? (
          <View style={styles.wrap}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Chip key={n} label={`${n}×`} active={timesPerWeek === n} onPress={() => setTimesPerWeek(n)} />
            ))}
          </View>
        ) : null}

        <Text style={[styles.label, { marginTop: 8 }]}>Duração</Text>
        <View style={styles.wrap}>
          {DURATIONS.map((d) => (
            <Chip key={d} label={`${d} dias`} onPress={() => setDuration(d)} />
          ))}
        </View>
        <View style={styles.row}>
          <DateField label="Início" value={startDate} onChange={setStartDate} style={{ flex: 1 }} />
          <DateField label="Fim" value={endDate} onChange={setEndDate} style={{ flex: 1 }} />
        </View>
        {endDate < startDate ? <Text style={styles.error}>A data final não pode ser anterior à data inicial.</Text> : null}
      </KeyboardAwareScrollView>
      <View style={styles.footer}>
        <Button title="Salvar" onPress={save} disabled={!valid} />
      </View>
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
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default ChallengeEditorScreen;
