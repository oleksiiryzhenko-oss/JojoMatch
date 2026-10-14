import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays, Clock } from 'lucide-react-native';

import colors from '../utils/colors';
import { formatDate, dayKey, fromDayKey } from '../utils/helpers';

const pad = (n) => String(n).padStart(2, '0');

// mode 'date': value is 'YYYY-MM-DD'; mode 'time': value is 'HH:MM'
const DateField = ({ label, value, onChange, mode = 'date', placeholder = 'Seç', minimumDate, style, onClear }) => {
  const [show, setShow] = useState(false);

  const toDate = () => {
    if (mode === 'time') {
      const d = new Date();
      const [h, m] = (value || '18:00').split(':').map(Number);
      d.setHours(h, m, 0, 0);
      return d;
    }
    return value ? fromDayKey(value) : new Date();
  };

  const display = value ? (mode === 'time' ? value : formatDate(fromDayKey(value))) : placeholder;
  const Icon = mode === 'time' ? Clock : CalendarDays;

  const handleChange = (event, selected) => {
    if (Platform.OS !== 'ios') setShow(false);
    if (event.type !== 'set' || !selected) return;
    onChange(mode === 'time' ? `${pad(selected.getHours())}:${pad(selected.getMinutes())}` : dayKey(selected));
  };

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.box} onPress={() => setShow((s) => !s)} activeOpacity={0.85}>
        <Icon color={value ? colors.primary : colors.textMuted} size={18} />
        <Text style={[styles.value, !value && styles.placeholder]}>{display}</Text>
        {value && onClear ? (
          <TouchableOpacity onPress={onClear} hitSlop={10}>
            <Text style={styles.clear}>Temizle</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
      {show ? (
        <DateTimePicker
          value={toDate()}
          mode={mode}
          is24Hour
          locale="tr-TR"
          minimumDate={minimumDate}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant="dark"
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  box: {
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
  value: {
    color: colors.text,
    fontSize: 16,
    flex: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  clear: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default DateField;
