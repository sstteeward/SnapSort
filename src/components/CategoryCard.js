// CategoryCard — Pressable card with category icon, name, and screenshot count
// Color-coded with accent per category

import React, { memo, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import useScreenshots from '../hooks/useScreenshots';

const CategoryCard = ({ category, onPress, compact = false }) => {
  const { darkMode } = useScreenshots();
  const theme = darkMode ? COLORS.dark : COLORS.light;

  const handlePress = useCallback(() => {
    if (onPress) onPress(category);
  }, [category, onPress]);

  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.compactContainer,
          {
            backgroundColor: category.color + '15',
            borderColor: category.color + '30',
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <View style={[styles.compactIcon, { backgroundColor: category.color + '25' }]}>
          <Ionicons name={category.icon} size={18} color="black" />
        </View>
        <Text style={[styles.compactName, { color: theme.text }]} numberOfLines={1}>
          {category.name}
        </Text>
        <Text style={[styles.compactCount, { color: theme.textMuted }]}>
          {category.count || 0}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
        <Ionicons name={category.icon} size={26} color="black" />
      </View>

      {/* Name */}
      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
        {category.name}
      </Text>

      {/* Count */}
      <Text style={[styles.count, { color: theme.textMuted }]}>
        {category.count || 0} {(category.count || 0) === 1 ? 'screenshot' : 'screenshots'}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    margin: SPACING.xs,
    overflow: 'hidden',
    minHeight: 140,
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  name: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  count: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.regular,
    textAlign: 'center',
  },
  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactName: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  compactCount: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});

export default memo(CategoryCard);
