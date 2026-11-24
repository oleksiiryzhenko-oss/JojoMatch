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
      Alert.alert('Backup criado', 'Backup salvo no dispositivo.');
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o backup.');
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
      Alert.alert('Salvo', 'Arquivo de backup salvo na pasta escolhida.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o arquivo.');
    }
  };

  const shareJson = async () => {
    try {
      await Share.share({ title: 'Backup JojoMatch', message: json() });
    } catch {
      // user dismissed
    }
  };

  // Human-readable diary export
  const shareText = async () => {
    const lines = ['DIÁRIO DE TREINOS JOJOMATCH', ''];
    sortedSessions(sessions).forEach((s) => {
      const sum = summarizeSession(s);
      lines.push(`■ ${formatDateTime(s.startedAt)} — ${s.name} (${formatDuration(s.durationSec)}, ${sum.sets} set)`);
      s.exercises.forEach((it) => {
        const ex = exercisesById[it.exerciseId];
        lines.push(`  • ${ex?.name || '?'}: ${it.sets.map((st) => formatSet(st, ex?.type)).join(', ')}`);
        if (it.note) lines.push(`    Nota: ${it.note}`);
      });
      const b = s.wellbeingBefore;
      const a = s.wellbeingAfter;
      if (b && !b.skipped) lines.push(`  Antes — energia ${b.energy || '-'}/5, sono ${b.sleep || '-'}/5, humor ${b.mood || '-'}/5`);
      if (a && !a.skipped) lines.push(`  Depois — RPE ${a.load || '-'}/10, fadiga ${a.fatigue || '-'}/5${a.comment ? `, “${a.comment}”` : ''}`);
      if (s.note) lines.push(`  Nota: ${s.note}`);
      lines.push('');
    });
    try {
      await Share.share({ title: 'Diário de treinos', message: lines.join('\n') });
    } catch {
      // user dismissed
    }
  };

  const restore = (raw, label) =>
    Alert.alert(
      'Restaurar?',
      `${label}\n\nTodos os seus dados atuais serão substituídos pelos dados deste backup. Recomendamos fazer um backup do estado atual antes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: () => {
            try {
              importData(JSON.parse(raw));
              setPasteOpen(false);
              setPasted('');
              Alert.alert('OK', 'Dados restaurados.');
            } catch {
              Alert.alert('Backup inválido', 'Este texto não é um backup JojoMatch ou está corrompido.');
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
      Alert.alert('Erro', 'Não foi possível ler o arquivo.');
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
      Alert.alert('Erro', 'Não foi possível abrir o arquivo.');
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
    Alert.alert('Excluir backup?', formatDateTime(b.modified), [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await FileSystem.deleteAsync(b.uri, { idempotent: true });
          loadBackups();
        },
      },
    ]);

  return (
    <Screen edges={['top', 'bottom']}>
      <Header back title="Backup" subtitle="Seus dados ficam armazenados apenas neste dispositivo" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.summary}>
          <ShieldCheck color={colors.primary} size={26} />
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>No seu diário</Text>
            <Text style={styles.summaryText}>
              {sessions.length} treinos · {templates.length} modelos · {measurements.length} medidas · {goals.length} metas ·{' '}
              {challenges.length} desafios
            </Text>
          </View>
        </Card>

        <SectionHeader title="Criar backup" />
        <View style={styles.actions}>
          <Button title="Backup no dispositivo" icon={DatabaseBackup} onPress={createLocal} loading={busy} />
          {Platform.OS === 'android' ? (
            <Button title="Salvar em pasta (.json)" icon={FolderDown} variant="secondary" onPress={saveToFolder} />
          ) : null}
          <Button title="Compartilhar backup" icon={Share2} variant="secondary" onPress={shareJson} />
          <Button title="Exportar diário como texto" icon={FileText} variant="secondary" onPress={shareText} />
        </View>

        <SectionHeader title="Restaurar" />
        <View style={styles.actions}>
          <Button title="Restaurar de arquivo (.json)" icon={FileUp} onPress={pickFile} />
          <Button title="Colar texto do backup" icon={ClipboardPaste} variant="outline" onPress={() => setPasteOpen(true)} />
        </View>

        <Text style={styles.subTitle}>Backups no dispositivo</Text>
        {backups.length ? (
          backups.map((b) => (
            <View key={b.name} style={styles.backup}>
              <View style={{ flex: 1 }}>
                <Text style={styles.backupName}>{formatDateTime(b.modified)}</Text>
                <Text style={styles.backupMeta}>{Math.max(1, Math.round(b.size / 1024))} KB</Text>
              </View>
              <TouchableOpacity style={styles.iconBtn} onPress={() => restoreFile(b)} accessibilityLabel="Restaurar">
                <RotateCcw color={colors.primary} size={18} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => shareFile(b)} accessibilityLabel="Compartilhar">
                <Share2 color={colors.textSecondary} size={18} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => deleteFile(b)} accessibilityLabel="Excluir">
                <Trash2 color={colors.danger} size={18} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.muted}>Nenhum backup no dispositivo ainda.</Text>
        )}

        <Text style={styles.note}>
          Dica: Se você desinstalar o app, os backups no dispositivo também serão excluídos. Mova dados importantes para um local seguro (Drive, e-mail) com “Salvar em pasta” ou “Compartilhar backup”.
        </Text>
      </ScrollView>

      <Sheet
        visible={pasteOpen}
        onClose={() => setPasteOpen(false)}
        title="Colar texto do backup"
        footer={<Button title="Restaurar" icon={RotateCcw} onPress={() => restore(pasted, 'Backup colado')} disabled={!pasted.trim()} />}
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
