import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

import colors from '../utils/colors';
import { parseNum, formatSeconds, fmtNum } from '../utils/helpers';
import { FIELD_META } from '../data/exercises';
import { typeFields } from '../utils/workout';

// "1:30" -> 90, "45" -> 45
const parseTime = (text) => {
  const t = String(text).trim();
  if (!t) return null;
  if (t.includes(':')) {
    const parts = t.split(':').map((p) => parseInt(p, 10) || 0);
    return parts.reduce((acc, p) => acc * 60 + p, 0);
  }
  return parseNum(t);
};

const display = (field, value) => {
  if (value === null || value === undefined || value === '') return '';
  if (field === 'time') return formatSeconds(value);
  return fmtNum(value, 2);
};

export const NumInput = ({ field, value, onChange, placeholder, style, editable = true, done }) => {
  const [text, setText] = useState(display(field, value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(display(field, value));
  }, [value, field, focused]);

  const commit = (t) => {
    const parsed = field === 'time' ? parseTime(t) : parseNum(t);
    onChange(parsed);
  };

  return (
    <TextInput
      value={text}
      onChangeText={(t) => {
        setText(t);
        if (field !== 'time') commit(t);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit(text);
      }}
      editable={editable}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.primary}
      keyboardType={field === 'time' ? 'numbers-and-punctuation' : FIELD_META[field]?.keyboard || 'decimal-pad'}
      selectTextOnFocus
      style={[styles.input, done && styles.inputDone, style]}
    />
  );
};

const hasValue = (v) => v !== undefined && v !== null && v !== '';

// One input per field of the exercise type. `placeholders` shows targets/previous values as hints.
const SetFields = ({ type, set, onChange, placeholders = {}, done, editable = true }) => (
  <View style={styles.row}>
    {typeFields(type).map((field) => (
      <View key={field} style={styles.cell}>
        <NumInput
          field={field}
          value={set[field]}
          onChange={(v) => onChange({ [field]: v })}
          placeholder={hasValue(placeholders[field]) ? display(field, placeholders[field]) : field === 'time' ? '0:00' : '0'}
          done={done}
          editable={editable}
        />
        <Text style={styles.unit}>{field === 'time' ? 'dk:sn' : FIELD_META[field].unit}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 0,
    fontVariant: ['tabular-nums'],
  },
  inputDone: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
    color: colors.primary,
  },
  unit: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
});

export default SetFields;
