// GlassCard — Reusable frosted glass surface component
// Wraps content in a translucent blurred container with subtle highlights

import React, { memo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { GLASS, SHADOWS } from '../utils/constants';

const GlassCard = ({
  children,
  style,
  intensity = GLASS.blur,
  borderRadius = GLASS.borderRadius,
  noBorder = false,
  noShadow = false,
}) => {
  // On Android, BlurView may not render well — fall back to solid dark surface
  const isAndroid = Platform.OS === 'android';

  if (isAndroid) {
    return (
      <View
        style={[
          styles.fallback,
          {
            borderRadius,
            borderWidth: noBorder ? 0 : 1,
          },
          !noShadow && SHADOWS.glass,
          style,
        ]}
      >
        {/* Inner highlight */}
        <View style={[styles.highlight, { borderRadius }]} />
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.outerWrap,
        { borderRadius },
        !noShadow && SHADOWS.glass,
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[
          styles.blurContainer,
          {
            borderRadius,
            borderWidth: noBorder ? 0 : 1,
          },
        ]}
      >
        {/* Inner highlight */}
        <View style={[styles.highlight, { borderRadius }]} />
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    overflow: 'hidden',
  },
  blurContainer: {
    overflow: 'hidden',
    borderColor: GLASS.border,
    backgroundColor: GLASS.background,
  },
  fallback: {
    overflow: 'hidden',
    borderColor: GLASS.border,
    backgroundColor: 'rgba(25,25,35,0.85)',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: GLASS.highlight,
  },
});

export default memo(GlassCard);
