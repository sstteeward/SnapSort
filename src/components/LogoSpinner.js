// LogoSpinner — Branded loading indicator using the SnapSort logo
// Replaces generic ActivityIndicator with a pulsing + rotating logo animation
// Supports size variants: 'small' (32), 'medium' (56), 'large' (80)

import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Easing, useColorScheme } from 'react-native';

const SIZES = {
  small: 32,
  medium: 56,
  large: 80,
};

const LogoSpinner = ({ size = 'large', style }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Gentle pulse: scale 1 → 1.12 → 1
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Slow continuous rotation
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Opacity glow: 0.3 → 1 → 0.3
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    rotate.start();
    glow.start();

    return () => {
      pulse.stop();
      rotate.stop();
      glow.stop();
    };
  }, []);

  const logoSource = isDark
    ? require('../../assets/splash-logo-dark.png')
    : require('../../assets/splash-logo-light.png');

  const dimension = SIZES[size] || SIZES.large;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Glow ring behind the logo */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: dimension + 20,
            height: dimension + 20,
            borderRadius: (dimension + 20) / 2,
            borderColor: isDark ? 'rgba(10,132,255,0.4)' : 'rgba(0,122,255,0.3)',
            opacity: glowAnim,
            transform: [{ rotate: spin }],
          },
        ]}
      />
      {/* Logo image with pulse */}
      <Animated.Image
        source={logoSource}
        resizeMode="contain"
        style={[
          {
            width: dimension,
            height: dimension,
          },
          {
            transform: [{ scale: pulseAnim }],
            opacity: glowAnim.interpolate({
              inputRange: [0.3, 1],
              outputRange: [0.7, 1],
            }),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
});

export default LogoSpinner;
