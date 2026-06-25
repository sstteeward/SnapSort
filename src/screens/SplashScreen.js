// SnapSort — Custom Animated Splash Screen
// Shows monochrome logo with fade-in + scale animation
// Automatically adapts to system dark/light theme

import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Animated,
  StyleSheet,
  useColorScheme,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOGO_SIZE = Math.min(SCREEN_WIDTH * 0.5, 220);

// Duration constants
const FADE_IN_DURATION = 800;
const HOLD_DURATION = 1700; // time logo stays fully visible
const FADE_OUT_DURATION = 400;

const SplashScreen = ({ onFinish }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light'; // default to dark

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Phase 1: Fade in + scale up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: FADE_IN_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: FADE_IN_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: Hold
      setTimeout(() => {
        // Phase 3: Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: FADE_OUT_DURATION,
          useNativeDriver: true,
        }).start(() => {
          if (onFinish) onFinish();
        });
      }, HOLD_DURATION);
    });
  }, []);

  const backgroundColor = isDark ? '#000000' : '#FFFFFF';

  // Select the correct monochrome logo based on theme
  const logoSource = isDark
    ? require('../../assets/splash-logo-dark.png')
    : require('../../assets/splash-logo-light.png');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={logoSource}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});

export default SplashScreen;
