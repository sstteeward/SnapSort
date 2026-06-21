// ScreenshotCategoryModal — Glass bottom sheet for categorizing a detected screenshot
// iOS 26 Liquid Glass styling with frosted sheet, glass chips, and blur backdrop

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import useScreenshots from '../hooks/useScreenshots';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  CATEGORIES,
  GLASS,
} from '../utils/constants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.55;

const ScreenshotCategoryModal = ({ visible, screenshotAsset, onImport, onDismiss }) => {
  const { darkMode } = useScreenshots();
  const theme = darkMode ? COLORS.dark : COLORS.light;

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [selectedCategory, setSelectedCategory] = useState('others');
  const [isImporting, setIsImporting] = useState(false);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      setSelectedCategory('others');
      setIsImporting(false);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

  const handleImport = useCallback(async () => {
    if (!screenshotAsset || isImporting) return;
    setIsImporting(true);
    try {
      await onImport(screenshotAsset, selectedCategory);
    } catch (e) {
      console.error('Import failed:', e);
    } finally {
      setIsImporting(false);
    }
  }, [screenshotAsset, selectedCategory, onImport, isImporting]);

  if (!visible && !screenshotAsset) return null;

  const isAndroid = Platform.OS === 'android';

  const sheetContent = (
    <>
      {/* Handle */}
      <View style={styles.handleRow}>
        <View style={styles.handle} />
      </View>

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <Ionicons name="camera-outline" size={20} color={theme.primary} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Screenshot Detected!
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            Choose a category to organize it
          </Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={12} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={theme.textMuted} />
        </Pressable>
      </View>

      {/* Preview */}
      {screenshotAsset?.uri && (
        <View style={[styles.previewRow, { borderColor: GLASS.border }]}>
          <Image
            source={{ uri: screenshotAsset.uri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
          <View style={styles.previewInfo}>
            <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>
              New Screenshot
            </Text>
            <Text style={[styles.previewDimensions, { color: theme.textMuted }]}>
              {screenshotAsset.width && screenshotAsset.height
                ? `${screenshotAsset.width} × ${screenshotAsset.height}`
                : 'Image ready'}
            </Text>
          </View>
        </View>
      )}

      {/* Category Chips */}
      <View style={styles.categorySection}>
        <Text style={[styles.categoryLabel, { color: theme.text }]}>Category</Text>
        <View style={styles.categoryChips}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    selectedCategory === cat.id ? cat.color : GLASS.background,
                  borderColor:
                    selectedCategory === cat.id ? cat.color : GLASS.border,
                },
              ]}
            >
              <Ionicons
                name={cat.icon}
                size={14}
                color={selectedCategory === cat.id ? '#FFFFFF' : theme.textSecondary}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: selectedCategory === cat.id ? '#FFFFFF' : theme.textSecondary,
                  },
                ]}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleImport}
          disabled={isImporting}
          style={({ pressed }) => [
            styles.importButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed || isImporting ? 0.8 : 1,
            },
          ]}
        >
          {isImporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="#FFFFFF" />
              <Text style={styles.importButtonText}>Import & Categorize</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={onDismiss}
          disabled={isImporting}
          style={({ pressed }) => [
            styles.dismissButton,
            {
              backgroundColor: GLASS.background,
              borderColor: GLASS.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.dismissButtonText, { color: theme.textSecondary }]}>
            Dismiss
          </Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdropAnim },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {isAndroid ? (
          <View style={styles.sheetFallback}>
            {sheetContent}
          </View>
        ) : (
          <BlurView
            intensity={GLASS.blurHeavy}
            tint="dark"
            style={styles.sheetBlur}
          >
            {sheetContent}
          </BlurView>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: SHEET_HEIGHT,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.float,
  },
  sheetBlur: {
    paddingBottom: SPACING.xxxl,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: GLASS.border,
    backgroundColor: 'rgba(20,20,30,0.7)',
    overflow: 'hidden',
  },
  sheetFallback: {
    paddingBottom: SPACING.xxxl,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: GLASS.border,
    backgroundColor: 'rgba(20,20,30,0.95)',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(10,132,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.regular,
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xl,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: GLASS.backgroundLight,
  },
  previewImage: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#0F0F14',
  },
  previewInfo: {
    flex: 1,
  },
  previewLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  previewDimensions: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.regular,
    marginTop: 2,
  },
  categorySection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  categoryLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.sm,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: GLASS.borderRadiusPill,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  chipText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  actions: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: GLASS.borderRadiusPill,
    gap: SPACING.sm,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  dismissButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: GLASS.borderRadiusPill,
    borderWidth: 1,
  },
  dismissButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});

export default ScreenshotCategoryModal;
