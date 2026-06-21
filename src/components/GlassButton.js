// GlassButton — Floating frosted glass button with spring animation
// Used for FAB, circular actions, and pill-shaped CTAs

import React, { memo, useCallback, useRef } from 'react';
import { StyleSheet, Pressable, Animated, View, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { GLASS, SHADOWS, TYPOGRAPHY, SPACING } from '../utils/constants';

const GlassButton = ({
  onPress,
  icon,
  iconSize = 24,
  label,
  circular = false,
  size = 56,
  style,
  glowColor,
  iconColor = '#FFFFFF',
  disabled = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
      {icon && <Ionicons name={icon} size={iconSize} color={iconColor} />}
      {label && (
        <Text style={styles.label}>{label}</Text>
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
        glowColor ? SHADOWS.glow(glowColor) : SHADOWS.float,
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
              },
            ]}
          >
            {innerContent}
          </View>
        ) : (
          <BlurView
            intensity={GLASS.blurHeavy}
            tint="dark"
            style={[
              styles.blur,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius,
                paddingHorizontal: label ? SPACING.xl : 0,
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
    borderColor: GLASS.border,
    backgroundColor: GLASS.backgroundHover,
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: GLASS.border,
    backgroundColor: 'rgba(40,40,55,0.85)',
    overflow: 'hidden',
  },
  label: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});

export default memo(GlassButton);
