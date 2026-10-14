import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Check, Clock, Layers } from 'lucide-react-native';

import colors from '../utils/colors';
import { formatDuration } from '../utils/helpers';
import { useApp } from '../context/AppContext';

// Rough estimate: 40s of work per set + its rest
export const estimateTemplateSec = (template) =>
  (template?.exercises || []).reduce(
    (acc, it) => acc + it.sets.reduce((a, s) => a + (Number(s.time) || 40) + (it.restSeconds || 0), 0),
    0
  );

const WorkoutCard = ({ template, done, onPress, onStart, onLongPress, right, subtitle, style }) => {
  const { exercisesById } = useApp();
  if (!template) return null;
  const accent = template.color || colors.primary;
  const names = template.exercises
    .map((it) => exercisesById[it.exerciseId]?.name)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');
  const setsCount = template.exercises.reduce((a, it) => a + it.sets.length, 0);

  return (
    <TouchableOpacity
      style={[styles.card, done && styles.cardDone, style]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
      disabled={!onPress && !onLongPress}
    >
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {template.name}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.exercises} numberOfLines={1}>
          {names || 'Henüz egzersiz yok'}
          {template.exercises.length > 3 ? ` +${template.exercises.length - 3}` : ''}
        </Text>
        <View style={styles.meta}>
          <Layers color={colors.textMuted} size={13} />
          <Text style={styles.metaText}>
            {template.exercises.length} egzersiz · {setsCount} set
          </Text>
          <Clock color={colors.textMuted} size={13} style={{ marginLeft: 8 }} />
          <Text style={styles.metaText}>~{formatDuration(estimateTemplateSec(template))}</Text>
        </View>
      </View>
      {right ||
        (done ? (
          <View style={styles.doneIcon}>
            <Check color={colors.onPrimary} size={20} strokeWidth={3} />
          </View>
        ) : onStart ? (
          <TouchableOpacity style={styles.play} onPress={onStart} hitSlop={8} accessibilityLabel="Başla">
            <Play color={colors.onPrimary} size={20} fill={colors.onPrimary} />
          </TouchableOpacity>
        ) : null)}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    paddingLeft: 0,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardDone: {
    opacity: 0.7,
  },
  accent: {
    width: 5,
    alignSelf: 'stretch',
    borderRadius: 3,
    marginRight: 12,
  },
  body: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  exercises: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  play: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WorkoutCard;
