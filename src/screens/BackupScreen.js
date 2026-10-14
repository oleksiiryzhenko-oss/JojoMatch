import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Share, Platform, TouchableOpacity } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { DatabaseBackup, Share2, FolderDown, ClipboardPaste, RotateCcw, Trash2, FileText, ShieldCheck, FileUp } from 'lucide-react-native';

import colors from '../utils/colors';
import { formatDateTime, formatDuration, dayKey, formatTime } from '../utils/helpers';
import { formatSet, summarizeSession, sortedSessions } from '../utils/workout';
import { useApp } from '../context/AppContext';
import { Screen, Header, Card, Button, SectionHeader, Field } from '../components/ui';
import Sheet from '../components/Sheet';

const BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;

const fileStamp = () => {
  const d = new Date();
  return `${dayKey(d)}_${formatTime(d).replace(':', '-')}`;
};

const BackupScreen = () => {
  const { exportData, importData, sessions, templates, measurements, goals, challenges, exercisesById } = useApp();
  const [backups, setBackups] = useState([]);
  const [busy, setBusy] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState('');

  const loadBackups = useCallback(async () => {
    try {
      await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
      const names = (await FileSystem.readDirectoryAsync(BACKUP_DIR)).filter((n) => n.endsWith('.json'));
      const infos = await Promise.all(
        names.map(async (name) => {
          const info = await FileSystem.getInfoAsync(BACKUP_DIR + name);
          return { name, uri: BACKUP_DIR + name, size: info.size || 0, modified: (info.modificationTime || 0) * 1000 };
        })
      );
      setBackups(infos.sort((a, b) => b.modified - a.modified));
    } catch (e) {
      console.log('Backup list error:', e);
    }
  }, []);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const json = () => JSON.stringify(exportData());

  const createLocal = async () => {
    setBusy(true);
    try {
      await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
      await FileSystem.writeAsStringAsync(`${BACKUP_DIR}jojomatch_${fileStamp()}.json`, json());
      await loadBackups();
      Alert.alert('Yedek oluşturuldu', 'Yedek cihazında saklandı.');
    } catch {
      Alert.alert('Hata', 'Yedek oluşturulamadı.');
    } finally {
      setBusy(false);
    }
  };

  // Android: let the user pick a folder (Downloads, Drive…) via the Storage Access Framework
  const saveToFolder = async () => {
    try {
      const SAF = FileSystem.StorageAccessFramework;
      const perm = await SAF.requestDirectoryPermissionsAsync();
      if (!perm.granted) return;
      const uri = await SAF.createFileAsync(perm.directoryUri, `jojomatch_${fileStamp()}`, 'application/json');
      await FileSystem.writeAsStringAsync(uri, json());
      Alert.alert('Kaydedildi', 'Yedek dosyası seçtiğin klasöre kaydedildi.');
    } catch {
      Alert.alert('Hata', 'Dosya kaydedilemedi.');
    }
  };

  const shareJson = async () => {
    try {
      await Share.share({ title: 'JojoMatch yedeği', message: json() });
    } catch {
      // user dismissed
    }
  };

  // Human-readable diary export
  const shareText = async () => {
    const lines = ['JOJOMATCH ANTRENMAN GÜNLÜĞÜ', ''];
    sortedSessions(sessions).forEach((s) => {
      const sum = summarizeSession(s);
      lines.push(`■ ${formatDateTime(s.startedAt)} — ${s.name} (${formatDuration(s.durationSec)}, ${sum.sets} set)`);
      s.exercises.forEach((it) => {
        const ex = exercisesById[it.exerciseId];
        lines.push(`  • ${ex?.name || '?'}: ${it.sets.map((st) => formatSet(st, ex?.type)).join(', ')}`);
        if (it.note) lines.push(`    Not: ${it.note}`);
      });
      const b = s.wellbeingBefore;
      const a = s.wellbeingAfter;
      if (b && !b.skipped) lines.push(`  Öncesi — enerji ${b.energy || '-'}/5, uyku ${b.sleep || '-'}/5, ruh hali ${b.mood || '-'}/5`);
      if (a && !a.skipped) lines.push(`  Sonrası — RPE ${a.load || '-'}/10, yorgunluk ${a.fatigue || '-'}/5${a.comment ? `, “${a.comment}”` : ''}`);
      if (s.note) lines.push(`  Not: ${s.note}`);
      lines.push('');
    });
    try {
      await Share.share({ title: 'Antrenman günlüğü', message: lines.join('\n') });
    } catch {
      // user dismissed
    }
  };

  const restore = (raw, label) =>
    Alert.alert(
      'Geri yüklensin mi?',
      `${label}\n\nMevcut tüm verilerin bu yedekteki verilerle değiştirilecek. Önce şu anki durumun yedeğini almanı öneririz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Geri yükle',
          style: 'destructive',
          onPress: () => {
            try {
              importData(JSON.parse(raw));
              setPasteOpen(false);
              setPasted('');
              Alert.alert('Tamam', 'Veriler geri yüklendi.');
            } catch {
              Alert.alert('Geçersiz yedek', 'Bu metin bir JojoMatch yedeği değil ya da bozuk.');
            }
          },
        },
      ]
    );

  const restoreFile = async (b) => {
    try {
      const raw = await FileSystem.readAsStringAsync(b.uri);
      restore(raw, formatDateTime(b.modified));
    } catch {
      Alert.alert('Hata', 'Dosya okunamadı.');
    }
  };

  // Any file type: cloud providers often report JSON as octet-stream; content is validated on restore
  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      const raw = await FileSystem.readAsStringAsync(asset.uri);
      FileSystem.deleteAsync(asset.uri, { idempotent: true }).catch(() => {});
      restore(raw, asset.name);
    } catch {
      Alert.alert('Hata', 'Dosya açılamadı.');
    }
  };

  const shareFile = async (b) => {
    try {
      const raw = await FileSystem.readAsStringAsync(b.uri);
      await Share.share({ title: b.name, message: raw });
    } catch {
      // ignore
    }
  };

  const deleteFile = (b) =>
    Alert.alert('Yedek silinsin mi?', formatDateTime(b.modified), [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await FileSystem.deleteAsync(b.uri, { idempotent: true });
          loadBackups();
        },
      },
    ]);

  return (
    <Screen edges={['top', 'bottom']}>
      <Header back title="Yedekleme" subtitle="Verilerin yalnızca bu cihazda saklanır" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.summary}>
          <ShieldCheck color={colors.primary} size={26} />
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>Günlüğünde</Text>
            <Text style={styles.summaryText}>
              {sessions.length} antrenman · {templates.length} şablon · {measurements.length} ölçüm · {goals.length} hedef ·{' '}
              {challenges.length} meydan okuma
            </Text>
          </View>
        </Card>

        <SectionHeader title="Yedek oluştur" />
        <View style={styles.actions}>
          <Button title="Cihaza yedekle" icon={DatabaseBackup} onPress={createLocal} loading={busy} />
          {Platform.OS === 'android' ? (
            <Button title="Klasöre kaydet (.json)" icon={FolderDown} variant="secondary" onPress={saveToFolder} />
          ) : null}
          <Button title="Yedeği paylaş" icon={Share2} variant="secondary" onPress={shareJson} />
          <Button title="Günlüğü metin olarak dışa aktar" icon={FileText} variant="secondary" onPress={shareText} />
        </View>

        <SectionHeader title="Geri yükle" />
        <View style={styles.actions}>
          <Button title="Dosyadan geri yükle (.json)" icon={FileUp} onPress={pickFile} />
          <Button title="Yedek metnini yapıştır" icon={ClipboardPaste} variant="outline" onPress={() => setPasteOpen(true)} />
        </View>

        <Text style={styles.subTitle}>Cihazdaki yedekler</Text>
        {backups.length ? (
          backups.map((b) => (
            <View key={b.name} style={styles.backup}>
              <View style={{ flex: 1 }}>
                <Text style={styles.backupName}>{formatDateTime(b.modified)}</Text>
                <Text style={styles.backupMeta}>{Math.max(1, Math.round(b.size / 1024))} KB</Text>
              </View>
              <TouchableOpacity style={styles.iconBtn} onPress={() => restoreFile(b)} accessibilityLabel="Geri yükle">
                <RotateCcw color={colors.primary} size={18} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => shareFile(b)} accessibilityLabel="Paylaş">
                <Share2 color={colors.textSecondary} size={18} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => deleteFile(b)} accessibilityLabel="Sil">
                <Trash2 color={colors.danger} size={18} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.muted}>Henüz cihazda yedek yok.</Text>
        )}

        <Text style={styles.note}>
          İpucu: Uygulamayı silersen cihazdaki yedekler de silinir. Önemli verileri “Klasöre kaydet” veya “Yedeği paylaş” ile
          güvenli bir yere (Drive, e-posta) taşı.
        </Text>
      </ScrollView>

      <Sheet
        visible={pasteOpen}
        onClose={() => setPasteOpen(false)}
        title="Yedek metnini yapıştır"
        footer={<Button title="Geri yükle" icon={RotateCcw} onPress={() => restore(pasted, 'Yapıştırılan yedek')} disabled={!pasted.trim()} />}
      >
        <Field
          value={pasted}
          onChangeText={setPasted}
          placeholder='{"app":"JojoMatch", ...}'
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          inputStyle={{ minHeight: 180, fontSize: 12 }}
        />
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  summaryText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  actions: {
    gap: 10,
  },
  subTitle: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 13,
    marginTop: 20,
    marginBottom: 8,
  },
  backup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  backupName: {
    color: colors.text,
    fontWeight: '700',
  },
  backupMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: {
    color: colors.textMuted,
    fontSize: 13,
  },
  note: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 24,
  },
});

export default BackupScreen;
