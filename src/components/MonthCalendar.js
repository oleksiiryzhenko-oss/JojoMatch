import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import colors from '../utils/colors';
import { MONTHS_LONG, WEEKDAYS, WEEK_ORDER, dayKey, addDays, startOfMonth, startOfWeek } from '../utils/helpers';

// marks: { [YYYY-MM-DD]: 'done' | 'planned' | 'missed' }
const MonthCalendar = ({ month, onMonthChange, marks = {}, selected, onSelect }) => {
  const first = startOfMonth(month);
  const gridStart = startOfWeek(first);
  const today = dayKey();
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  // Drop the trailing week if it's fully in the next month
  const rows = cells[35].getMonth() !== first.getMonth() ? 5 : 6;

  const shift = (delta) => {
    const d = new Date(first);
    d.setMonth(d.getMonth() + delta);
    onMonthChange(d);
  };

  return (
    <View>
      <View style={styles.top}>
        <TouchableOpacity style={styles.nav} onPress={() => shift(-1)} hitSlop={8}>
          <ChevronLeft color={colors.text} size={20} />
        </TouchableOpacity>
        <Text style={styles.month}>
          {MONTHS_LONG[first.getMonth()]} {first.getFullYear()}
        </Text>
        <TouchableOpacity style={styles.nav} onPress={() => shift(1)} hitSlop={8}>
          <ChevronRight color={colors.text} size={20} />
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        {WEEK_ORDER.map((d) => (
          <Text key={d} style={styles.weekday}>
            {WEEKDAYS[d]}
          </Text>
        ))}
      </View>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={styles.row}>
          {cells.slice(r * 7, r * 7 + 7).map((d) => {
            const key = dayKey(d);
            const inMonth = d.getMonth() === first.getMonth();
            const mark = marks[key];
            const isSel = selected === key;
            return (
              <TouchableOpacity key={key} style={styles.cellWrap} onPress={() => onSelect?.(key)} activeOpacity={0.8}>
                <View
                  style={[
                    styles.cell,
                    mark === 'done' && styles.cellDone,
                    mark === 'planned' && styles.cellPlanned,
                    mark === 'missed' && styles.cellMissed,
                    key === today && styles.cellToday,
                    isSel && styles.cellSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.day,
                      !inMonth && styles.dayOut,
                      mark === 'done' && styles.dayDone,
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        <Text style={styles.legendText}>Yapıldı</Text>
        <View style={[styles.dot, styles.dotPlanned]} />
        <Text style={styles.legendText}>Planlı</Text>
        <View style={[styles.dot, { backgroundColor: 'rgba(255, 90, 95, 0.5)' }]} />
        <Text style={styles.legendText}>Kaçırıldı</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nav: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  cellWrap: {
    flex: 1,
    aspectRatio: 1,
    padding: 3,
  },
  cell: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDone: {
    backgroundColor: colors.primary,
  },
  cellPlanned: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  cellMissed: {
    backgroundColor: 'rgba(255, 90, 95, 0.18)',
  },
  cellToday: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  cellSelected: {
    transform: [{ scale: 1.08 }],
    borderWidth: 2,
    borderColor: colors.info,
  },
  day: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  dayOut: {
    color: colors.textMuted,
    opacity: 0.5,
  },
  dayDone: {
    color: colors.onPrimary,
    fontWeight: '900',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 6,
  },
  dotPlanned: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MonthCalendar;
