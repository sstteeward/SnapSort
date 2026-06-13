// ScreenshotCard — Pressable thumbnail card with category badge and favorite icon
// Memoized for FlatList performance

import React, { memo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, CATEGORIES } from '../utils/constants';
import useScreenshots from '../hooks/useScreenshots';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

const ScreenshotCard = ({ screenshot, onPress, onLongPress }) => {
  const { darkMode, toggleFavorite } = useScreenshots();
  const theme = darkMode ? COLORS.dark : COLORS.light;

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

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress ? () => onLongPress(screenshot) : undefined}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      {/* Thumbnail */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: screenshot.thumbnailUri || screenshot.uri }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Favorite button */}
        <Pressable
          onPress={handleFavorite}
          style={[styles.favoriteButton, { backgroundColor: theme.overlay }]}
          hitSlop={8}
        >
          <Ionicons
            name={screenshot.isFavorite ? 'heart' : 'heart-outline'}
            size={16}
            color={screenshot.isFavorite ? COLORS.dark.accent : '#FFFFFF'}
          />
        </Pressable>

        {/* Category badge */}
        {category && (
          <View style={[styles.categoryBadge, { backgroundColor: category.color + 'DD' }]}>
            <Ionicons name={category.icon} size={10} color="#FFFFFF" />
            <Text style={styles.categoryText} numberOfLines={1}>
              {category.name}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {screenshot.title || 'Untitled'}
        </Text>
        <Text style={[styles.date, { color: theme.textMuted }]} numberOfLines={1}>
          {formatDate(screenshot.createdAt)}
        </Text>
      </View>
    </Pressable>
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
  container: {
    width: CARD_WIDTH,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  imageContainer: {
    width: '100%',
    height: CARD_HEIGHT * 0.72,
    backgroundColor: '#1A1A2E',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
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
