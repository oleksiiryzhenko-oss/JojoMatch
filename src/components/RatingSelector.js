import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import colors from '../utils/colors';
import { hapticSelect } from '../utils/haptics';

// Row of numbered buttons (1..max) with labels for the ends
const RatingSelector = ({ label, value, onChange, max = 5, lowLabel, highLabel, icon: Icon }) => (
  <View style={styles.wrap}>
    <View style={styles.labelRow}>
      {Icon ? <Icon color={colors.primary} size={18} /> : null}
      <Text style={styles.label}>{label}</Text>
      {value ? (
        <Text style={styles.value}>
          {value}/{max}
        </Text>
      ) : null}
    </View>
    <View style={styles.row}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const active = value === n;
        return (
          <TouchableOpacity
            key={n}
            style={[styles.item, active && styles.itemActive, value && n < value && styles.itemFilled]}
            onPress={() => {
              hapticSelect();
              onChange(active ? null : n);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.itemText, active && styles.itemTextActive]}>{n}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
    {lowLabel || highLabel ? (
      <View style={styles.ends}>
        <Text style={styles.endText}>{lowLabel}</Text>
        <Text style={styles.endText}>{highLabel}</Text>
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  value: {
    color: colors.primary,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  item: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemFilled: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  itemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemText: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 15,
  },
  itemTextActive: {
    color: colors.onPrimary,
  },
  ends: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  endText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default RatingSelector;
