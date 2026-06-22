// InboxCard — Glass card for unprocessed screenshots in the inbox
// Shows thumbnail, filename, date, and action buttons (Categorize, Ignore)
// Theme-aware: iOS 26 Liquid Glass

import React, { memo, useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  GLASS,
  getGlass,
  getShadows,
} from '../utils/constants';
import useScreenshots from '../hooks/useScreenshots';

const InboxCard = ({ screenshot, onCategorize, onDismiss }) => {
  const { darkMode } = useScreenshots();
  const theme = darkMode ? COLORS.dark : COLORS.light;
  const glass = getGlass(darkMode);
  const shadows = getShadows(darkMode);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [imageLoaded, setImageLoaded] = useState(false);

  const cardBg = darkMode ? glass.background : 'rgba(255,255,255,0.65)';
  const cardBorder = darkMode ? glass.border : 'rgba(0,0,0,0.08)';
  const imageBg = darkMode ? '#0F0F14' : '#E5E5EA';
  const dismissBg = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onCategorize(screenshot)}
        style={[
          styles.container,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
          },
          shadows.glass,
        ]}
      >
        {/* Thumbnail */}
        <View style={[styles.thumbnailWrap, { backgroundColor: imageBg }]}>
          <Image
            source={{ uri: screenshot.uri }}
            style={styles.thumbnail}
            resizeMode="cover"
            onLoad={() => setImageLoaded(true)}
          />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.filename, { color: theme.text }]} numberOfLines={1}>
            {screenshot.filename || 'Screenshot'}
          </Text>
          <Text style={[styles.date, { color: theme.textMuted }]}>
            {formatDate(screenshot.createdAt)}
          </Text>
          <Text style={[styles.dimensions, { color: theme.textMuted }]}>
            {screenshot.width && screenshot.height
              ? `${screenshot.width} × ${screenshot.height}`
              : 'Image'}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => onCategorize(screenshot)}
            style={({ pressed }) => [
              styles.actionButton,
              styles.categorizeButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            hitSlop={4}
          >
            <Ionicons name="folder-outline" size={16} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={() => onDismiss(screenshot.assetId)}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: dismissBg,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            hitSlop={4}
          >
            <Ionicons name="close" size={16} color={theme.textMuted} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.md,
    overflow: 'hidden',
  },
  thumbnailWrap: {
    width: 60,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  filename: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: 2,
  },
  date: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.regular,
    marginBottom: 1,
  },
  dimensions: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.regular,
  },
  actions: {
    flexDirection: 'column',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorizeButton: {
    // Primary color set inline
  },
});

export default memo(InboxCard);
