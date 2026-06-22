// GlassButton — Floating frosted glass button with spring animation
// Used for FAB, circular actions, and pill-shaped CTAs
// Theme-aware: adapts glass surfaces for Light and Dark modes

import React, { memo, useCallback, useRef } from 'react';
import { StyleSheet, Pressable, Animated, View, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { GLASS, TYPOGRAPHY, SPACING, getGlass, getShadows } from '../utils/constants';
import useScreenshots from '../hooks/useScreenshots';

const GlassButton = ({
  onPress,
  icon,
  iconSize = 24,
  label,
  circular = false,
  size = 56,
  style,
  glowColor,
  iconColor,
  backgroundColor,
  disabled = false,
}) => {
  const { darkMode } = useScreenshots();
  const glass = getGlass(darkMode);
  const shadows = getShadows(darkMode);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Default icon color based on theme
  const resolvedIconColor = iconColor || (darkMode ? '#FFFFFF' : '#000000');

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
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

  const isAndroid = Platform.OS === 'android';
  const buttonSize = circular ? size : undefined;
  const borderRadius = circular ? size / 2 : GLASS.borderRadiusPill;

  const innerContent = (
    <>
      {icon && <Ionicons name={icon} size={iconSize} color={resolvedIconColor} />}
      {label && (
        <Text style={[styles.label, { color: resolvedIconColor }]}>{label}</Text>
      )}
    </>
  );

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          borderRadius,
        },
        glowColor ? shadows.glow(glowColor) : shadows.float,
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.pressable,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius,
          },
        ]}
      >
        {isAndroid ? (
          <View
            style={[
              styles.fallback,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius,
                paddingHorizontal: label ? SPACING.xl : 0,
                borderColor: darkMode ? glass.border : 'rgba(0,0,0,0.08)',
                backgroundColor: backgroundColor || (darkMode ? 'rgba(40,40,55,0.85)' : 'rgba(255,255,255,0.82)'),
              },
            ]}
          >
            {innerContent}
          </View>
        ) : (
          <BlurView
            intensity={GLASS.blurHeavy}
            tint={darkMode ? 'dark' : 'light'}
            style={[
              styles.blur,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius,
                paddingHorizontal: label ? SPACING.xl : 0,
                borderColor: darkMode ? glass.border : 'rgba(0,0,0,0.08)',
                backgroundColor: backgroundColor || glass.backgroundHover,
              },
            ]}
          >
            {innerContent}
          </BlurView>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pressable: {
    overflow: 'hidden',
  },
  blur: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});

export default memo(GlassButton);
