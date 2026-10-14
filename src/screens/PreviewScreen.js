import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import * as Updates from 'expo-updates';
import * as Progress from 'react-native-progress';
import LinearGradient from 'react-native-linear-gradient';
import { Dumbbell } from 'lucide-react-native';

import colors from '../utils/colors';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const MIN_DURATION = 3000;

const PreviewScreen = ({ navigation }) => {
  const { hydrated, settings } = useApp();
  const [progress, setProgress] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const navigated = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          clearInterval(interval);
          return 1;
        }
        return prev + 0.1;
      });
    }, 550);

    const timer = setTimeout(() => setTimeUp(true), MIN_DURATION);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  // OTA update check (works only in release builds with expo-updates configured)
  useEffect(() => {
    const checkUpdates = async () => {
      if (__DEV__ || !Updates.isEnabled) return;
      try {
        const res = await Updates.checkForUpdateAsync();
        if (res.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.log('Update check failed:', e);
      }
    };
    checkUpdates();
  }, []);

  useEffect(() => {
    if (!timeUp || !hydrated || navigated.current) return;
    navigated.current = true;
    navigation.replace(settings.onboarded ? 'Home' : 'Welcome');
  }, [timeUp, hydrated, settings.onboarded, navigation]);

  return (
    <LinearGradient colors={[colors.splashGlow, colors.background, colors.background]} style={styles.container}>
      <View style={styles.center}>
        <View style={styles.logo}>
          <Dumbbell color={colors.onPrimary} size={56} strokeWidth={2.4} />
        </View>
        <Text style={styles.title}>
          Jojo<Text style={{ color: colors.primary }}>Match</Text>
        </Text>
        <Text style={styles.subtitle}>Antrenmanını kur · Kaydet · Gelişimini gör</Text>
      </View>
      <View style={styles.progressContainer}>
        <Progress.Bar
          progress={progress}
          width={width * 0.7}
          height={6}
          color={colors.primary}
          unfilledColor="rgba(255,255,255,0.12)"
          borderWidth={0}
          borderRadius={10}
          animated
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 112,
    height: 112,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
    marginBottom: 28,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  title: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 10,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 90,
  },
});

export default PreviewScreen;
