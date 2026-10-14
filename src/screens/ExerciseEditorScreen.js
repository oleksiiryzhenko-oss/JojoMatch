import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Trash2 } from 'lucide-react-native';

import colors from '../utils/colors';
import { CATEGORIES, EXERCISE_TYPES, TYPE_KEYS } from '../data/exercises';
import { useApp } from '../context/AppContext';
import { Screen, Header, Field, Chip, Button, IconButton } from '../components/ui';

const ExerciseEditorScreen = ({ navigation, route }) => {
  const { exerciseId, name: initialName } = route.params || {};
  const { exercisesById, addExercise, updateExercise, archiveExercise } = useApp();
  const existing = exerciseId ? exercisesById[exerciseId] : null;

  const [name, setName] = useState(existing?.name || initialName || '');
  const [category, setCategory] = useState(existing?.category || 'Diğer');
  const [type, setType] = useState(existing?.type || 'weight');
  const [notes, setNotes] = useState(existing?.notes || '');

  const save = () => {
    const data = { name: name.trim(), category, type, notes: notes.trim() };
    if (existing) {
      updateExercise(existing.id, data);
      navigation.goBack();
    } else {
      const id = addExercise(data);
      navigation.replace('ExerciseDetail', { exerciseId: id });
    }
  };

  const onDelete = () =>
    Alert.alert('Egzersiz silinsin mi?', 'Kütüphaneden kaldırılır; geçmiş kayıtlar korunur.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          archiveExercise(existing.id);
          navigation.pop(2);
        },
      },
    ]);

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        back
        title={existing ? 'Egzersizi düzenle' : 'Yeni egzersiz'}
        right={existing ? <IconButton icon={Trash2} color={colors.danger} onPress={onDelete} label="Sil" /> : null}
      />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        <Field label="Ad" value={name} onChangeText={setName} placeholder="Örn. Bulgarian Split Squat" autoFocus={!existing} />

        <Text style={styles.label}>Kategori</Text>
        <View style={styles.wrap}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>

        <Text style={styles.label}>Neyi kaydedeceksin?</Text>
        <View style={styles.types}>
          {TYPE_KEYS.map((t) => (
            <Chip
              key={t}
              label={EXERCISE_TYPES[t].label}
              active={type === t}
              onPress={() => setType(t)}
              style={styles.typeChip}
            />
          ))}
        </View>
        {existing && existing.type !== type ? (
          <Text style={styles.warn}>Kayıt türünü değiştirmek eski kayıtların grafiklerde farklı görünmesine neden olabilir.</Text>
        ) : null}

        <Field
          label="Teknik notlar"
          value={notes}
          onChangeText={setNotes}
          placeholder="Duruş, nefes, ekipman ayarları..."
          multiline
          style={{ marginTop: 16 }}
        />
      </KeyboardAwareScrollView>
      <View style={styles.footer}>
        <Button title="Kaydet" onPress={save} disabled={!name.trim()} />
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
    marginTop: 4,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  types: {
    gap: 8,
  },
  typeChip: {
    alignItems: 'flex-start',
    height: 44,
    borderRadius: 14,
  },
  warn: {
    color: colors.warning,
    fontSize: 12,
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default ExerciseEditorScreen;
