// CategoryCard — Glass card with category icon, name, and count
// iOS 26 Liquid Glass styling — theme-aware

import React, { memo, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, GLASS, getGlass, getShadows } from '../utils/constants';
import useScreenshots from '../hooks/useScreenshots';

const CategoryCard = ({ category, onPress, compact = false }) => {
  const { darkMode } = useScreenshots();
  const theme = darkMode ? COLORS.dark : COLORS.light;
  const glass = getGlass(darkMode);
  const shadows = getShadows(darkMode);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Theme-aware card styling
  const cardBg = darkMode ? glass.background : 'rgba(255,255,255,0.65)';
  const cardBorder = darkMode ? glass.border : 'rgba(0,0,0,0.08)';

  const handlePress = useCallback(() => {
    if (onPress) onPress(category);
  }, [category, onPress]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 150,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 150,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  if (compact) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.compactContainer,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
            },
          ]}
        >
          <View style={[styles.compactIcon, { backgroundColor: category.color + '25' }]}>
            <Ionicons name={category.icon} size={18} color={category.color} />
          </View>
          <Text style={[styles.compactName, { color: theme.text }]} numberOfLines={1}>
            {category.name}
          </Text>
          <Text style={[styles.compactCount, { color: theme.textMuted }]}>
            {category.count || 0}
          </Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.animWrap, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.container,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
          },
          shadows.glass,
        ]}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
          <Ionicons name={category.icon} size={26} color={category.color} />
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animWrap: {
    flex: 1,
    margin: SPACING.xs,
  },
  container: {
    borderRadius: GLASS.borderRadius,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 140,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
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
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
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
