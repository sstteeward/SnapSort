// GlassCard — Reusable frosted glass surface component
// Wraps content in a translucent blurred container with subtle highlights
// Theme-aware: adapts glass surfaces for Light and Dark modes

import React, { memo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { GLASS, GLASS_LIGHT, SHADOWS, SHADOWS_LIGHT, getGlass, getShadows } from '../utils/constants';
import useScreenshots from '../hooks/useScreenshots';

const GlassCard = ({
  children,
  style,
  intensity = GLASS.blur,
  borderRadius = GLASS.borderRadius,
  noBorder = false,
  noShadow = false,
}) => {
  const { darkMode } = useScreenshots();
  const glass = getGlass(darkMode);
  const shadows = getShadows(darkMode);
  const isAndroid = Platform.OS === 'android';

  if (isAndroid) {
    return (
      <View
        style={[
          {
            overflow: 'hidden',
            borderRadius,
            borderWidth: noBorder ? 0 : 1,
            borderColor: darkMode ? glass.border : 'rgba(0,0,0,0.06)',
            backgroundColor: darkMode ? 'rgba(25,25,35,0.85)' : 'rgba(255,255,255,0.75)',
          },
          !noShadow && shadows.glass,
          style,
        ]}
      >
        {/* Inner highlight */}
        <View style={[styles.highlight, { borderRadius, backgroundColor: glass.highlight }]} />
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.outerWrap,
        { borderRadius },
        !noShadow && shadows.glass,
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={darkMode ? 'dark' : 'light'}
        style={[
          {
            overflow: 'hidden',
            borderRadius,
            borderWidth: noBorder ? 0 : 1,
            borderColor: darkMode ? glass.border : 'rgba(0,0,0,0.06)',
            backgroundColor: glass.background,
          },
        ]}
      >
        {/* Inner highlight */}
        <View style={[styles.highlight, { borderRadius, backgroundColor: glass.highlight }]} />
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});

export default memo(GlassCard);
