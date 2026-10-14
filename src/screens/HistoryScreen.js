import React, { useMemo } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight, History } from 'lucide-react-native';

import colors from '../utils/colors';
import { MONTHS_LONG, formatShortDate, formatTime, formatDuration, fmtBig } from '../utils/helpers';
import { sortedSessions, summarizeSession, totalDuration } from '../utils/workout';
import { useApp } from '../context/AppContext';
import { Screen, Header, EmptyState } from '../components/ui';

const HistoryScreen = ({ navigation }) => {
  const { sessions } = useApp();

  const sections = useMemo(() => {
    const groups = {};
    sortedSessions(sessions).forEach((s) => {
      const d = new Date(s.startedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!groups[key]) groups[key] = { title: `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`, data: [] };
      groups[key].data.push(s);
    });
    return Object.values(groups);
  }, [sessions]);

  return (
    <Screen edges={['top', 'bottom']}>
      <Header back title="Geçmiş" subtitle={`${sessions.length} antrenman · ${formatDuration(totalDuration(sessions))}`} />
      <SectionList
        sections={sections}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={<EmptyState icon={History} title="Henüz kayıt yok" text="Tamamladığın antrenmanlar burada listelenir." />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionMeta}>
              {section.data.length} antrenman · {formatDuration(totalDuration(section.data))}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const sum = summarizeSession(item);
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
              activeOpacity={0.85}
            >
              <View style={[styles.bar, { backgroundColor: item.color || colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {formatShortDate(item.startedAt)} · {formatTime(item.startedAt)} · {formatDuration(item.durationSec)}
                </Text>
                <Text style={styles.meta}>
                  {sum.exercises} egzersiz · {sum.sets} set{sum.volume ? ` · ${fmtBig(sum.volume)} kg` : ''}
                  {item.wellbeingAfter?.load ? ` · RPE ${item.wellbeingAfter.load}` : ''}
                </Text>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </TouchableOpacity>
          );
        }}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  bar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  name: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});

export default HistoryScreen;
