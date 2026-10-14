import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Trash2 } from 'lucide-react-native';

import colors from '../utils/colors';
import { dayKey, fromDayKey, parseNum, fmtNum } from '../utils/helpers';
import { useApp, MEASURE_FIELDS } from '../context/AppContext';
import { Screen, Header, Field, Button, IconButton, Chip } from '../components/ui';
import DateField from '../components/DateField';

const MeasurementEditorScreen = ({ navigation, route }) => {
  const { measurementId } = route.params || {};
  const { measurements, addMeasurement, updateMeasurement, deleteMeasurement, settings, updateSettings } = useApp();
  const existing = measurementId ? measurements.find((m) => m.id === measurementId) : null;

  const [date, setDate] = useState(existing ? dayKey(existing.date) : dayKey());
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      Object.entries(existing?.values || {}).map(([k, v]) => [k, v === null || v === undefined ? '' : fmtNum(v, 2)])
    )
  );
  const [note, setNote] = useState(existing?.note || '');

  const shown = MEASURE_FIELDS.filter(
    (f) => settings.measureFields.includes(f.key) || (values[f.key] !== undefined && values[f.key] !== '')
  );

  const toggleField = (key) => {
    const has = settings.measureFields.includes(key);
    if (has && settings.measureFields.length === 1) return;
    updateSettings({
      measureFields: has ? settings.measureFields.filter((k) => k !== key) : [...settings.measureFields, key],
    });
  };

  const parsed = Object.fromEntries(
    Object.entries(values)
      .map(([k, v]) => [k, parseNum(v)])
      .filter(([, v]) => v !== null)
  );
  const canSave = Object.keys(parsed).length > 0;

  const save = () => {
    const data = { date: fromDayKey(date).toISOString(), values: parsed, note: note.trim() };
    if (existing) updateMeasurement(existing.id, data);
    else addMeasurement(data);
    navigation.goBack();
  };

  const onDelete = () =>
    Alert.alert('Ölçüm silinsin mi?', undefined, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          deleteMeasurement(existing.id);
          navigation.goBack();
        },
      },
    ]);

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        back
        title={existing ? 'Ölçümü düzenle' : 'Yeni ölçüm'}
        right={existing ? <IconButton icon={Trash2} color={colors.danger} onPress={onDelete} label="Sil" /> : null}
      />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        <DateField label="Tarih" value={date} onChange={setDate} />

        <Text style={styles.label}>Takip edilen ölçüler</Text>
        <View style={styles.wrap}>
          {MEASURE_FIELDS.map((f) => (
            <Chip key={f.key} label={f.label} active={settings.measureFields.includes(f.key)} onPress={() => toggleField(f.key)} />
          ))}
        </View>

        <View style={styles.grid}>
          {shown.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              value={values[f.key] ?? ''}
              onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
              keyboardType="decimal-pad"
              placeholder="—"
              suffix={f.unit}
              style={styles.cell}
            />
          ))}
        </View>

        <Field label="Not" value={note} onChangeText={setNote} placeholder="Sabah, aç karnına..." multiline />
      </KeyboardAwareScrollView>
      <View style={styles.footer}>
        <Button title="Kaydet" onPress={save} disabled={!canSave} />
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
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '47%',
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default MeasurementEditorScreen;
