import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';

import colors from '../utils/colors';

export const Screen = ({ children, style, edges = ['top'] }) => (
  <SafeAreaView style={[styles.screen, style]} edges={edges}>
    {children}
  </SafeAreaView>
);

export const Header = ({ title, subtitle, back = false, right = null, onBack }) => {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      {back ? (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack || (() => navigation.goBack())}
          hitSlop={10}
          accessibilityLabel="Geri"
        >
          <ChevronLeft color={colors.text} size={26} />
        </TouchableOpacity>
      ) : null}
      <View style={styles.headerText}>
        <Text style={[styles.headerTitle, back && styles.headerTitleSmall]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.headerSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
};

export const Card = ({ children, style, onPress, onLongPress }) => {
  if (onPress || onLongPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled,
  loading,
  style,
  small,
}) => {
  const v = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
  return (
    <TouchableOpacity
      style={[styles.btn, small && styles.btnSmall, { backgroundColor: v.bg, borderColor: v.border }, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {Icon ? <Icon color={v.fg} size={small ? 16 : 20} strokeWidth={2.4} /> : null}
          <Text style={[styles.btnText, small && styles.btnTextSmall, { color: v.fg }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const BUTTON_VARIANTS = {
  primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
  secondary: { bg: colors.surface2, fg: colors.text, border: colors.border },
  outline: { bg: 'transparent', fg: colors.primary, border: colors.primary },
  danger: { bg: 'rgba(255, 90, 95, 0.14)', fg: colors.danger, border: 'rgba(255, 90, 95, 0.4)' },
  ghost: { bg: 'transparent', fg: colors.textSecondary, border: 'transparent' },
};

export const IconButton = ({ icon: Icon, onPress, color = colors.text, bg = colors.surface2, size = 20, style, label }) => (
  <TouchableOpacity
    style={[styles.iconBtn, { backgroundColor: bg }, style]}
    onPress={onPress}
    hitSlop={6}
    activeOpacity={0.8}
    accessibilityLabel={label}
  >
    <Icon color={color} size={size} />
  </TouchableOpacity>
);

export const Chip = ({ label, active, onPress, color = colors.primary, style }) => (
  <TouchableOpacity
    style={[styles.chip, active && { backgroundColor: color, borderColor: color }, style]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Text style={[styles.chipText, active && { color: colors.onPrimary }]}>{label}</Text>
  </TouchableOpacity>
);

export const Segmented = ({ options, value, onChange, style }) => (
  <View style={[styles.segmented, style]}>
    {options.map((o) => {
      const active = o.value === value;
      return (
        <TouchableOpacity
          key={o.value}
          style={[styles.segment, active && styles.segmentActive]}
          onPress={() => onChange(o.value)}
          activeOpacity={0.85}
        >
          <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
            {o.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export const SectionHeader = ({ title, action, onAction, style }) => (
  <View style={[styles.sectionHeader, style]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action ? (
      <TouchableOpacity onPress={onAction} hitSlop={8}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

export const EmptyState = ({ icon: Icon, title, text, action, onAction, style }) => (
  <View style={[styles.empty, style]}>
    {Icon ? (
      <View style={styles.emptyIcon}>
        <Icon color={colors.primary} size={30} />
      </View>
    ) : null}
    <Text style={styles.emptyTitle}>{title}</Text>
    {text ? <Text style={styles.emptyText}>{text}</Text> : null}
    {action ? <Button title={action} onPress={onAction} small style={{ marginTop: 16 }} /> : null}
  </View>
);

export const ProgressBar = ({ progress = 0, color = colors.primary, height = 8, style }) => (
  <View style={[styles.progressTrack, { height, borderRadius: height / 2 }, style]}>
    <View
      style={{
        width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`,
        height,
        borderRadius: height / 2,
        backgroundColor: color,
      }}
    />
  </View>
);

export const Field = ({ label, hint, style, inputStyle, suffix, ...props }) => (
  <View style={[styles.field, style]}>
    {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
    <View style={styles.inputWrap}>
      <TextInput
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        style={[styles.input, props.multiline && styles.inputMultiline, inputStyle]}
        {...props}
      />
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
    </View>
    {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
  </View>
);

export const Stat = ({ label, value, accent, style }) => (
  <View style={[styles.stat, style]}>
    <Text style={[styles.statValue, accent && { color: colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </Text>
    <Text style={styles.statLabel} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

export const Badge = ({ label, color = colors.primary, style }) => (
  <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}55` }, style]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    minHeight: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerTitleSmall: {
    fontSize: 20,
  },
  headerSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  btnSmall: {
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  btnTextSmall: {
    fontSize: 14,
  },
  disabled: {
    opacity: 0.4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  segmentTextActive: {
    color: colors.onPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionAction: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  progressTrack: {
    backgroundColor: colors.surface3,
    overflow: 'hidden',
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 50,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  suffix: {
    color: colors.textMuted,
    fontWeight: '700',
    paddingRight: 14,
  },
  fieldHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  stat: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
});
