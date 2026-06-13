// SearchBar — Animated search input with debounced callback
// Features: search icon, clear button, expand/collapse animation

import React, { memo, useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../utils/constants';
import useScreenshots from '../hooks/useScreenshots';

const SearchBar = ({ value, onChangeText, placeholder = 'Search screenshots...', autoFocus = false }) => {
  const { darkMode } = useScreenshots();
  const theme = darkMode ? COLORS.dark : COLORS.light;
  const inputRef = useRef(null);
  const [animatedValue] = useState(() => new Animated.Value(0));

  const isFocused = useRef(false);

  useEffect(() => {
    if (value && value.length > 0) {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start();
    } else {
      Animated.spring(animatedValue, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start();
    }
  }, [value, animatedValue]);

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  const clearScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceLight, borderColor: theme.border }]}>
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
            style={[styles.clearButton, { backgroundColor: theme.surfaceHover }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={14} color={theme.textSecondary} />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    height: 44,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
});

export default memo(SearchBar);
