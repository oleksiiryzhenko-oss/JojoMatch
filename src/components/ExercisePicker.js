import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Search, Plus, Check } from 'lucide-react-native';

import colors from '../utils/colors';
import { normalize } from '../utils/helpers';
import { CATEGORIES, EXERCISE_TYPES, TYPE_KEYS } from '../data/exercises';
import { useApp } from '../context/AppContext';
import { Chip, Button } from './ui';

// Full-screen exercise chooser with search, category filter and quick creation
const ExercisePicker = ({ visible, onClose, onSelect, title = 'Egzersiz seç', excludeIds = [] }) => {
  const { activeExercises, addExercise } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newCategory, setNewCategory] = useState('Diğer');
  const [newType, setNewType] = useState('weight');

  const list = useMemo(() => {
    const q = normalize(query);
    return activeExercises
      .filter((e) => !category || e.category === category)
      .filter((e) => !q || normalize(e.name).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [activeExercises, query, category]);

  const reset = () => {
    setQuery('');
    setCategory(null);
    setCreating(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const choose = (exercise) => {
    reset();
    onSelect(exercise);
  };

  const create = () => {
    const name = query.trim();
    if (!name) return;
    const exercise = { name, category: newCategory, type: newType, notes: '' };
    const id = addExercise(exercise);
    choose({ ...exercise, id });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close} statusBarTranslucent>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity style={styles.close} onPress={close} accessibilityLabel="Kapat">
            <X color={colors.text} size={22} />
          </TouchableOpacity>
        </View>

        <View style={styles.search}>
          <Search color={colors.textMuted} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Egzersiz ara veya yeni ad yaz"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsScroll}>
          <Chip label="Tümü" active={!category} onPress={() => setCategory(null)} />
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(category === c ? null : c)} />
          ))}
        </ScrollView>

        {creating ? (
          <ScrollView contentContainerStyle={styles.createBox} keyboardShouldPersistTaps="handled">
            <Text style={styles.createTitle}>“{query.trim() || '...'}” oluştur</Text>
            <Text style={styles.createLabel}>Kategori</Text>
            <View style={styles.wrap}>
              {CATEGORIES.map((c) => (
                <Chip key={c} label={c} active={newCategory === c} onPress={() => setNewCategory(c)} />
              ))}
            </View>
            <Text style={styles.createLabel}>Kayıt türü</Text>
            <View style={styles.wrap}>
              {TYPE_KEYS.map((t) => (
                <Chip key={t} label={EXERCISE_TYPES[t].label} active={newType === t} onPress={() => setNewType(t)} />
              ))}
            </View>
            <View style={styles.createActions}>
              <Button title="Vazgeç" variant="secondary" onPress={() => setCreating(false)} style={{ flex: 1 }} />
              <Button title="Oluştur ve ekle" onPress={create} disabled={!query.trim()} style={{ flex: 1.4 }} />
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(e) => e.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <TouchableOpacity style={styles.createRow} onPress={() => setCreating(true)} activeOpacity={0.85}>
                <View style={styles.createIcon}>
                  <Plus color={colors.onPrimary} size={18} strokeWidth={3} />
                </View>
                <Text style={styles.createRowText}>
                  {query.trim() ? `“${query.trim()}” adında yeni egzersiz` : 'Yeni egzersiz oluştur'}
                </Text>
              </TouchableOpacity>
            }
            ListEmptyComponent={<Text style={styles.emptyText}>Sonuç bulunamadı.</Text>}
            renderItem={({ item }) => {
              const added = excludeIds.includes(item.id);
              return (
                <TouchableOpacity style={styles.row} onPress={() => choose(item)} activeOpacity={0.85}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    <Text style={styles.rowMeta}>
                      {item.category} · {EXERCISE_TYPES[item.type]?.label}
                    </Text>
                  </View>
                  {added ? <Check color={colors.primary} size={18} /> : <Plus color={colors.textMuted} size={18} />}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    paddingBottom: 40,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    marginBottom: 10,
  },
  createIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRowText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 15,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  rowName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
  createBox: {
    padding: 16,
  },
  createTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  createLabel: {
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  createActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
});

export default ExercisePicker;
