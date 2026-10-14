import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet } from 'react-native';
import { Search, Plus, ChevronRight, Trophy } from 'lucide-react-native';

import colors from '../utils/colors';
import { normalize } from '../utils/helpers';
import { CATEGORIES, EXERCISE_TYPES } from '../data/exercises';
import { useApp } from '../context/AppContext';
import { Screen, Header, Chip, IconButton, EmptyState } from '../components/ui';

const ExercisesScreen = ({ navigation }) => {
  const { activeExercises, sessions } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null);
  const [onlyMine, setOnlyMine] = useState(false);

  // How many times each exercise has been done
  const usage = useMemo(() => {
    const map = {};
    sessions.forEach((s) =>
      s.exercises.forEach((it) => {
        map[it.exerciseId] = (map[it.exerciseId] || 0) + 1;
      })
    );
    return map;
  }, [sessions]);

  const list = useMemo(() => {
    const q = normalize(query);
    return activeExercises
      .filter((e) => !category || e.category === category)
      .filter((e) => !onlyMine || !e.builtIn)
      .filter((e) => !q || normalize(e.name).includes(q))
      .sort((a, b) => (usage[b.id] || 0) - (usage[a.id] || 0) || a.name.localeCompare(b.name, 'tr'));
  }, [activeExercises, query, category, onlyMine, usage]);

  return (
    <Screen>
      <Header
        title="Egzersizler"
        subtitle={`${activeExercises.length} egzersiz`}
        right={
          <IconButton
            icon={Plus}
            bg={colors.primary}
            color={colors.onPrimary}
            onPress={() => navigation.navigate('ExerciseEditor')}
            label="Yeni egzersiz"
          />
        }
      />
      <View style={styles.search}>
        <Search color={colors.textMuted} size={18} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Egzersiz ara"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          style={styles.searchInput}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
        <Chip label="Tümü" active={!category && !onlyMine} onPress={() => { setCategory(null); setOnlyMine(false); }} />
        <Chip label="Benim" active={onlyMine} onPress={() => setOnlyMine((v) => !v)} />
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} active={category === c} onPress={() => setCategory(category === c ? null : c)} />
        ))}
      </ScrollView>
      <FlatList
        data={list}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            title="Egzersiz bulunamadı"
            text="Aradığın egzersizi kendin oluşturabilirsin."
            action="Yeni egzersiz"
            onAction={() => navigation.navigate('ExerciseEditor', { name: query.trim() })}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
            activeOpacity={0.85}
          >
            <View style={styles.letter}>
              <Text style={styles.letterText}>{item.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.category} · {EXERCISE_TYPES[item.type]?.label}
                {!item.builtIn ? ' · Kişisel' : ''}
              </Text>
            </View>
            {usage[item.id] ? (
              <View style={styles.usage}>
                <Trophy color={colors.primary} size={12} />
                <Text style={styles.usageText}>{usage[item.id]}</Text>
              </View>
            ) : null}
            <ChevronRight color={colors.textMuted} size={18} />
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    height: 48,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
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
  letter: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 18,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  usage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  usageText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
});

export default ExercisesScreen;
