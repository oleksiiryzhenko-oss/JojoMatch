import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, Linking } from 'react-native';
import {
  Swords,
  HeartPulse,
  DatabaseBackup,
  History,
  ShieldCheck,
  Trash2,
  ChevronRight,
  Minus,
  Plus,
  Pencil,
  Info,
  Bell,
  Vibrate,
} from 'lucide-react-native';

import colors from '../utils/colors';
import { initials, formatSeconds, formatDuration, formatDate } from '../utils/helpers';
import { totalDuration, weekStreak } from '../utils/workout';
import { PRIVACY_POLICY_URL } from '../utils/config';
import { useApp } from '../context/AppContext';
import useEnableNotifications from '../hooks/useEnableNotifications';
import { hapticTap } from '../utils/haptics';
import { Screen, Header, Card, SectionHeader, Stat, Field, Button } from '../components/ui';
import Sheet from '../components/Sheet';

const MenuRow = ({ icon: Icon, label, sub, onPress, danger }) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.menuIcon, danger && { backgroundColor: 'rgba(255,90,95,0.14)' }]}>
      <Icon color={danger ? colors.danger : colors.primary} size={18} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.menuLabel, danger && { color: colors.danger }]}>{label}</Text>
      {sub ? <Text style={styles.menuSub}>{sub}</Text> : null}
    </View>
    <ChevronRight color={colors.textMuted} size={18} />
  </TouchableOpacity>
);

const Stepper = ({ value, onMinus, onPlus, label }) => (
  <View style={styles.stepper}>
    <TouchableOpacity style={styles.stepBtn} onPress={onMinus} hitSlop={6}>
      <Minus color={colors.text} size={16} />
    </TouchableOpacity>
    <Text style={styles.stepValue}>{label ?? value}</Text>
    <TouchableOpacity style={styles.stepBtn} onPress={onPlus} hitSlop={6}>
      <Plus color={colors.text} size={16} />
    </TouchableOpacity>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const { settings, updateSettings, sessions, challenges, resetAll } = useApp();
  const askNotifications = useEnableNotifications();
  const [nameOpen, setNameOpen] = useState(false);
  const [name, setName] = useState(settings.name);

  const firstSession = sessions.length
    ? sessions.reduce((a, b) => (new Date(a.startedAt) < new Date(b.startedAt) ? a : b))
    : null;

  const onReset = () =>
    Alert.alert(
      'Tüm veriler silinsin mi?',
      'Antrenmanlar, planlar, ölçümler, hedefler ve meydan okumalar kalıcı olarak silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Hepsini sil', style: 'destructive', onPress: resetAll },
      ]
    );

  return (
    <Screen>
      <Header title="Profil" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(settings.name || 'J M')}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{settings.name || 'Sporcu'}</Text>
            <Text style={styles.since}>
              {firstSession ? `${formatDate(firstSession.startedAt)} tarihinden beri` : 'İlk antrenmanını bekliyoruz'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              setName(settings.name);
              setNameOpen(true);
            }}
            accessibilityLabel="Adı düzenle"
          >
            <Pencil color={colors.textSecondary} size={16} />
          </TouchableOpacity>
        </Card>

        <Card style={styles.stats}>
          <Stat label="Antrenman" value={`${sessions.length}`} accent />
          <Stat label="Toplam süre" value={formatDuration(totalDuration(sessions))} />
          <Stat label="Hafta serisi" value={`${weekStreak(sessions)}`} />
        </Card>

        <SectionHeader title="Günlük" />
        <View style={styles.menu}>
          <MenuRow
            icon={Swords}
            label="Meydan okumalar"
            sub={`${challenges.length} meydan okuma`}
            onPress={() => navigation.navigate('Challenges')}
          />
          <MenuRow icon={HeartPulse} label="Sağlık günlüğü" sub="Enerji, uyku, ruh hali, yorgunluk" onPress={() => navigation.navigate('Wellbeing')} />
          <MenuRow icon={History} label="Antrenman geçmişi" onPress={() => navigation.navigate('History')} />
          <MenuRow icon={DatabaseBackup} label="Yedekleme ve dışa aktarma" sub="Yedek al, paylaş, geri yükle" onPress={() => navigation.navigate('Backup')} />
        </View>

        <SectionHeader title="Ayarlar" />
        <Card style={styles.settings}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Haftalık hedef</Text>
              <Text style={styles.settingSub}>Bugün ekranındaki ilerleme çubuğu</Text>
            </View>
            <Stepper
              value={settings.weeklyTarget}
              label={`${settings.weeklyTarget}×`}
              onMinus={() => updateSettings({ weeklyTarget: Math.max(1, settings.weeklyTarget - 1) })}
              onPlus={() => updateSettings({ weeklyTarget: Math.min(14, settings.weeklyTarget + 1) })}
            />
          </View>
          <View style={styles.sep} />
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Varsayılan dinlenme</Text>
              <Text style={styles.settingSub}>Yeni eklenen egzersizler için</Text>
            </View>
            <Stepper
              label={formatSeconds(settings.restSeconds)}
              onMinus={() => updateSettings({ restSeconds: Math.max(0, settings.restSeconds - 15) })}
              onPlus={() => updateSettings({ restSeconds: Math.min(600, settings.restSeconds + 15) })}
            />
          </View>
          <View style={styles.sep} />
          <View style={styles.settingRow}>
            <Bell color={colors.primary} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Bildirimler</Text>
              <Text style={styles.settingSub}>Plan hatırlatıcıları ve dinlenme bitişi</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(v) => (v ? askNotifications() : updateSettings({ notificationsEnabled: false }))}
              trackColor={{ false: colors.surface3, true: colors.primaryDark }}
              thumbColor={settings.notificationsEnabled ? colors.primary : colors.textSecondary}
            />
          </View>
          <View style={styles.sep} />
          <View style={styles.settingRow}>
            <Vibrate color={colors.primary} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Titreşim</Text>
              <Text style={styles.settingSub}>Set işaretleme ve dinlenme sonu</Text>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(v) => {
                updateSettings({ hapticsEnabled: v });
                if (v) setTimeout(hapticTap, 50);
              }}
              trackColor={{ false: colors.surface3, true: colors.primaryDark }}
              thumbColor={settings.hapticsEnabled ? colors.primary : colors.textSecondary}
            />
          </View>
          <View style={styles.sep} />
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Sağlık değerlendirmesi</Text>
              <Text style={styles.settingSub}>Antrenman öncesi ve sonrası sor</Text>
            </View>
            <Switch
              value={settings.askWellbeing}
              onValueChange={(v) => updateSettings({ askWellbeing: v })}
              trackColor={{ false: colors.surface3, true: colors.primaryDark }}
              thumbColor={settings.askWellbeing ? colors.primary : colors.textSecondary}
            />
          </View>
        </Card>

        <SectionHeader title="Diğer" />
        <View style={styles.menu}>
          {PRIVACY_POLICY_URL ? (
            <MenuRow icon={ShieldCheck} label="Gizlilik politikası" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
          ) : null}
          <MenuRow
            icon={Info}
            label="Uygulama tanıtımını tekrar göster"
            onPress={() => navigation.navigate('Welcome')}
          />
          <MenuRow icon={Trash2} label="Tüm verileri sil" danger onPress={onReset} />
        </View>
        <Text style={styles.version}>JojoMatch · v1.0.0 · Tüm veriler cihazında saklanır</Text>
      </ScrollView>

      <Sheet
        visible={nameOpen}
        onClose={() => setNameOpen(false)}
        title="Adın"
        footer={
          <Button
            title="Kaydet"
            onPress={() => {
              updateSettings({ name: name.trim() });
              setNameOpen(false);
            }}
          />
        }
      >
        <Field value={name} onChangeText={setName} placeholder="Adın" autoFocus autoCapitalize="words" />
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.onPrimary,
    fontWeight: '900',
    fontSize: 22,
  },
  name: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 20,
  },
  since: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  menuSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  settings: {
    paddingVertical: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  settingLabel: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  settingSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sep: {
    height: 1,
    backgroundColor: colors.border,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    padding: 4,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    color: colors.text,
    fontWeight: '900',
    minWidth: 40,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  version: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});

export default ProfileScreen;
