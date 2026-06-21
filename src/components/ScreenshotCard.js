// ScreenshotCard — Glass thumbnail card with frosted overlays
// Memoized for FlatList performance

import React, { memo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, CATEGORIES, GLASS } from '../utils/constants';
import useScreenshots from '../hooks/useScreenshots';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

const ScreenshotCard = ({ screenshot, onPress, onLongPress }) => {
  const { darkMode, toggleFavorite } = useScreenshots();
  const theme = darkMode ? COLORS.dark : COLORS.light;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const category = CATEGORIES.find((c) => c.id === screenshot.category);

  const handleFavorite = useCallback(
    (e) => {
      e.stopPropagation?.();
      toggleFavorite(screenshot.id);
    },
    [screenshot.id, toggleFavorite]
  );

  const handlePress = useCallback(() => {
    if (onPress) onPress(screenshot);
  }, [screenshot, onPress]);

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

  const isAndroid = Platform.OS === 'android';

  const favButton = (
    <Pressable
      onPress={handleFavorite}
      style={styles.favoriteButton}
      hitSlop={8}
    >
      {isAndroid ? (
        <View style={styles.favFallback}>
          <Ionicons
            name={screenshot.isFavorite ? 'heart' : 'heart-outline'}
            size={16}
            color={screenshot.isFavorite ? '#FF453A' : '#FFFFFF'}
          />
        </View>
      ) : (
        <BlurView intensity={40} tint="dark" style={styles.favBlur}>
          <Ionicons
            name={screenshot.isFavorite ? 'heart' : 'heart-outline'}
            size={16}
            color={screenshot.isFavorite ? '#FF453A' : '#FFFFFF'}
          />
        </BlurView>
      )}
    </Pressable>
  );

  const categoryBadge = category && (
    <View style={styles.categoryBadgeWrap}>
      {isAndroid ? (
        <View style={[styles.badgeFallback, { backgroundColor: category.color + 'CC' }]}>
          <Ionicons name={category.icon} size={10} color="#FFFFFF" />
          <Text style={styles.categoryText} numberOfLines={1}>
            {category.name}
          </Text>
        </View>
      ) : (
        <BlurView intensity={30} tint="dark" style={[styles.badgeBlur, { backgroundColor: category.color + '55' }]}>
          <Ionicons name={category.icon} size={10} color="#FFFFFF" />
          <Text style={styles.categoryText} numberOfLines={1}>
            {category.name}
          </Text>
        </BlurView>
      )}
    </View>
  );

  return (
    <Animated.View style={[styles.animWrap, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress ? () => onLongPress(screenshot) : undefined}
        style={styles.container}
      >
        {/* Thumbnail */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: screenshot.thumbnailUri || screenshot.uri }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Gradient overlay at bottom */}
          <View style={styles.imageGradient} />

          {favButton}
          {categoryBadge}
        </View>

        {/* Info — glass footer */}
        <View style={styles.info}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {screenshot.title || 'Untitled'}
          </Text>
          <Text style={[styles.date, { color: theme.textMuted }]} numberOfLines={1}>
            {formatDate(screenshot.createdAt)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const styles = StyleSheet.create({
  animWrap: {
    width: CARD_WIDTH,
    marginBottom: SPACING.md,
  },
  container: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
    backgroundColor: GLASS.background,
    ...SHADOWS.glass,
  },
  imageContainer: {
    width: '100%',
    height: CARD_HEIGHT * 0.72,
    backgroundColor: '#0F0F14',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'transparent',
  },
  favoriteButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    borderRadius: 16,
    overflow: 'hidden',
  },
  favBlur: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GLASS.borderLight,
    backgroundColor: 'rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  favFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  categoryBadgeWrap: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    borderRadius: GLASS.borderRadiusPill,
    overflow: 'hidden',
  },
  badgeBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: GLASS.borderRadiusPill,
    gap: 4,
    overflow: 'hidden',
  },
  badgeFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: GLASS.borderRadiusPill,
    gap: 4,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  info: {
    padding: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: 2,
  },
  date: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.regular,
  },
});

export default memo(ScreenshotCard);
