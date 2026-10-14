import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { ChevronRight, Dumbbell, ClipboardCheck, TrendingUp } from 'lucide-react-native';

import colors from '../utils/colors';
import { withAlpha } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { Button, Field, Chip } from '../components/ui';

const slides = [
  {
    icon: Dumbbell,
    title: 'Antrenmanını\nSen Kur',
    description: 'Egzersizleri, set, tekrar, ağırlık, süre ve mesafeyi belirle. Şablon olarak kaydet, istediğin zaman kopyala.',
  },
  {
    icon: ClipboardCheck,
    title: 'Her Seti\nKaydet',
    description: 'Antrenman sırasında setleri işaretle, gerçek sonuçlarını gir, dinlenme sayacını başlat ve notlar al.',
  },
  {
    icon: TrendingUp,
    title: 'Gelişimini\nKarşılaştır',
    description: 'Kendini nasıl hissettiğini değerlendir, sonuçlarını önceki antrenmanla kıyasla ve rekorlarını takip et.',
  },
];

const WelcomeScreen = ({ navigation }) => {
  const { settings, updateSettings } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.name || '');
  const [weeklyTarget, setWeeklyTarget] = useState(settings.weeklyTarget || 3);
  const isSetup = step === slides.length;

  const finish = () => {
    updateSettings({ onboarded: true, name: name.trim(), weeklyTarget });
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('Home');
  };

  if (isSetup) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAwareScrollView contentContainerStyle={styles.setup} keyboardShouldPersistTaps="handled" bottomOffset={24}>
          <Text style={styles.pickerTitle}>Hadi tanışalım</Text>
          <Text style={styles.pickerSub}>Bu bilgiler sadece cihazında saklanır. Daha sonra Profil’den değiştirebilirsin.</Text>

          <Field
            label="Adın"
            value={name}
            onChangeText={setName}
            placeholder="Örn. Elif"
            autoCapitalize="words"
            style={{ marginTop: 28 }}
          />

          <Text style={styles.label}>Haftada kaç antrenman hedefliyorsun?</Text>
          <View style={styles.chips}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Chip key={n} label={`${n}`} active={weeklyTarget === n} onPress={() => setWeeklyTarget(n)} style={styles.numChip} />
            ))}
          </View>
        </KeyboardAwareScrollView>
        <View style={styles.bottom}>
          <Button title="Başlayalım" onPress={finish} icon={ChevronRight} />
        </View>
      </SafeAreaView>
    );
  }

  const current = slides[step];
  const Icon = current.icon;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topRow}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity onPress={() => setStep(slides.length)} hitSlop={10}>
          <Text style={styles.skip}>Geç</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <LinearGradient
          colors={[withAlpha(colors.primary, 0.35), withAlpha(colors.primary, 0.02)]}
          style={styles.iconCircle}
        >
          <Icon color={colors.primary} size={84} strokeWidth={1.8} />
        </LinearGradient>

        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.desc}>{current.description}</Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.nextBtn} activeOpacity={0.9} onPress={() => setStep((s) => s + 1)}>
          <Text style={styles.nextText}>{step === slides.length - 1 ? 'Devam' : 'İleri'}</Text>
          <ChevronRight color={colors.onPrimary} size={22} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  skip: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.5),
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 40,
  },
  desc: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 23,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
  },
  nextBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
  },
  nextText: {
    color: colors.onPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  setup: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  pickerTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
  },
  pickerSub: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 8,
    lineHeight: 21,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  numChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 0,
  },
});

export default WelcomeScreen;
