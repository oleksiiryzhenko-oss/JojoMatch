import { View, StyleSheet, StatusBar } from 'react-native';
import React, { useEffect, useRef } from 'react';

import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Flame, CalendarDays, Dumbbell, TrendingUp, UserRound } from 'lucide-react-native';

import { navigationRef } from './navigationRef';
import { AppProvider } from './src/context/AppContext';
import { initSdks, trackScreen } from './src/utils/sdkInit';
import colors from './src/utils/colors';

import PreviewScreen from './src/screens/PreviewScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import TodayScreen from './src/screens/TodayScreen';
import PlanScreen from './src/screens/PlanScreen';
import ExercisesScreen from './src/screens/ExercisesScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WorkoutEditorScreen from './src/screens/WorkoutEditorScreen';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';
import ExerciseEditorScreen from './src/screens/ExerciseEditorScreen';
import SessionScreen from './src/screens/SessionScreen';
import SessionDetailScreen from './src/screens/SessionDetailScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import GoalEditorScreen from './src/screens/GoalEditorScreen';
import MeasurementEditorScreen from './src/screens/MeasurementEditorScreen';
import ChallengesScreen from './src/screens/ChallengesScreen';
import ChallengeEditorScreen from './src/screens/ChallengeEditorScreen';
import WellbeingScreen from './src/screens/WellbeingScreen';
import BackupScreen from './src/screens/BackupScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  TodayTab: Flame,
  PlanTab: CalendarDays,
  ExercisesTab: Dumbbell,
  ProgressTab: TrendingUp,
  ProfileTab: UserRound,
};

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

const TabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const Icon = TAB_ICONS[route.name];
          const iconColor = focused ? colors.onPrimary : colors.textMuted;
          return (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Icon color={iconColor} size={20} strokeWidth={focused ? 2.6 : 2} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [styles.tabBar, { height: 66 + insets.bottom, paddingBottom: Math.max(insets.bottom, 8) }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
      })}
    >
      <Tab.Screen name="TodayTab" component={TodayScreen} options={{ tabBarLabel: 'Bugün' }} />
      <Tab.Screen name="PlanTab" component={PlanScreen} options={{ tabBarLabel: 'Plan' }} />
      <Tab.Screen name="ExercisesTab" component={ExercisesScreen} options={{ tabBarLabel: 'Egzersizler' }} />
      <Tab.Screen name="ProgressTab" component={ProgressScreen} options={{ tabBarLabel: 'İlerleme' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
};

export default function App() {
  const routeNameRef = useRef(null);

  useEffect(() => {
    initSdks();
  }, []);

  const onNavigationStateChange = () => {
    const current = navigationRef.getCurrentRoute()?.name;
    if (current && current !== routeNameRef.current) {
      routeNameRef.current = current;
      trackScreen(current);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <AppProvider>
            <NavigationContainer ref={navigationRef} theme={navTheme} onStateChange={onNavigationStateChange}>
              <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
              <Stack.Navigator
                initialRouteName="Preview"
                screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}
              >
                <Stack.Screen name="Preview" component={PreviewScreen} />
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Home" component={TabNavigator} />
                <Stack.Screen name="WorkoutEditor" component={WorkoutEditorScreen} />
                <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
                <Stack.Screen name="ExerciseEditor" component={ExerciseEditorScreen} />
                <Stack.Screen name="Session" component={SessionScreen} options={{ gestureEnabled: false }} />
                <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
                <Stack.Screen name="History" component={HistoryScreen} />
                <Stack.Screen name="GoalEditor" component={GoalEditorScreen} />
                <Stack.Screen name="MeasurementEditor" component={MeasurementEditorScreen} />
                <Stack.Screen name="Challenges" component={ChallengesScreen} />
                <Stack.Screen name="ChallengeEditor" component={ChallengeEditorScreen} />
                <Stack.Screen name="Wellbeing" component={WellbeingScreen} />
                <Stack.Screen name="Backup" component={BackupScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </AppProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 30,
    borderRadius: 12,
  },
  iconWrapperActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 4,
  },
});
