// SearchBar — Glass pill search input with iOS 26 Liquid Glass styling
// Theme-aware: bright glass in Light Mode, frosted dark in Dark Mode

import React, { memo, useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, GLASS, getGlass } from '../utils/constants';
import useScreenshots from '../hooks/useScreenshots';

const SearchBar = ({ value, onChangeText, placeholder = 'Search screenshots...', autoFocus = false }) => {
  const { darkMode } = useScreenshots();
  const theme = darkMode ? COLORS.dark : COLORS.light;
  const glass = getGlass(darkMode);
  const inputRef = useRef(null);
  const [animatedValue] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value && value.length > 0 ? 1 : 0,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
  }, [value, animatedValue]);

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  const clearScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const isAndroid = Platform.OS === 'android';

  // Theme-aware styling
  const barBg = darkMode ? glass.background : 'rgba(0,0,0,0.04)';
  const barBorder = darkMode ? glass.border : 'rgba(0,0,0,0.08)';
  const clearButtonBg = darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';

  const content = (
    <>
      <Ionicons
        name="search-outline"
        size={18}
        color={theme.textMuted}
        style={styles.searchIcon}
      />
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
      />
      {value && value.length > 0 && (
        <Animated.View style={{ transform: [{ scale: clearScale }] }}>
          <Pressable
            onPress={handleClear}
            style={[styles.clearButton, { backgroundColor: clearButtonBg }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={14} color={theme.textSecondary} />
          </Pressable>
        </Animated.View>
      )}
    </>
  );

  if (isAndroid) {
    return (
      <View style={[styles.barBase, {
        borderColor: barBorder,
        backgroundColor: darkMode ? 'rgba(25,25,35,0.85)' : 'rgba(255,255,255,0.75)',
      }]}>
        {content}
      </View>
    );
  }

  return (
    <BlurView
      intensity={GLASS.blurLight}
      tint={darkMode ? 'dark' : 'light'}
      style={[styles.barBase, {
        borderColor: barBorder,
        backgroundColor: barBg,
      }]}
    >
      {content}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  barBase: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: GLASS.borderRadiusPill,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    height: 46,
    overflow: 'hidden',
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.regular,
    paddingVertical: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
});

export default memo(SearchBar);
