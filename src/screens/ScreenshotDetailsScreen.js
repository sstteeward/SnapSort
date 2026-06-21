// ScreenshotDetailsScreen — iOS 26 Liquid Glass full image preview
// Glass header buttons, metadata cards, and category picker

import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useScreenshots from '../hooks/useScreenshots';
import { formatFileSize } from '../services/imageService';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  CATEGORIES,
  GLASS,
} from '../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GlassHeaderButton = ({ onPress, iconName, iconColor, children }) => {
  const isAndroid = Platform.OS === 'android';
  const content = children || <Ionicons name={iconName} size={20} color={iconColor || '#FFFFFF'} />;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.headerButtonWrap,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      hitSlop={8}
    >
      {isAndroid ? (
        <View style={styles.headerButtonFallback}>{content}</View>
      ) : (
        <BlurView intensity={30} tint="dark" style={styles.headerButtonBlur}>
          {content}
        </BlurView>
      )}
    </Pressable>
  );
};

const ScreenshotDetailsScreen = ({ navigation, route }) => {
  const { id } = route.params;
  const {
    screenshots,
    toggleFavorite,
    updateCategory,
    updateNotes,
    updateTitle,
    removeScreenshot,
    darkMode,
  } = useScreenshots();

  const insets = useSafeAreaInsets();
  const theme = darkMode ? COLORS.dark : COLORS.light;

  const screenshot = useMemo(
    () => screenshots.find((s) => s.id === id),
    [screenshots, id]
  );

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(screenshot?.notes || '');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === screenshot?.category),
    [screenshot?.category]
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Screenshot',
      'Are you sure you want to delete this screenshot? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeScreenshot(id);
            navigation.goBack();
          },
        },
      ]
    );
  }, [id, removeScreenshot, navigation]);

  const handleSaveNotes = useCallback(async () => {
    await updateNotes(id, notesValue);
    setEditingNotes(false);
  }, [id, notesValue, updateNotes]);

  const handleCategoryChange = useCallback(
    async (categoryId) => {
      await updateCategory(id, categoryId);
      setShowCategoryPicker(false);
    },
    [id, updateCategory]
  );

  if (!screenshot) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <GlassHeaderButton onPress={() => navigation.goBack()} iconName="chevron-back" />
        </View>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.textMuted} />
          <Text style={[styles.notFoundText, { color: theme.textMuted }]}>
            Screenshot not found
          </Text>
        </View>
      </View>
    );
  }

  const imageHeight = screenshot.height && screenshot.width
    ? (SCREEN_WIDTH * screenshot.height) / screenshot.width
    : SCREEN_WIDTH * 0.75;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header bar */}
      <View style={styles.header}>
        <GlassHeaderButton onPress={() => navigation.goBack()} iconName="chevron-back" />

        <View style={styles.headerActions}>
          <GlassHeaderButton
            onPress={() => toggleFavorite(id)}
            iconName={screenshot.isFavorite ? 'heart' : 'heart-outline'}
            iconColor={screenshot.isFavorite ? '#FF453A' : '#FFFFFF'}
          />
          <GlassHeaderButton
            onPress={handleDelete}
            iconName="trash-outline"
            iconColor="#FF453A"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Image Preview */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: screenshot.uri }}
            style={[styles.image, { height: Math.min(imageHeight, SCREEN_WIDTH * 1.5) }]}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.screenshotTitle, { color: theme.text }]}>
            {screenshot.title || 'Untitled Screenshot'}
          </Text>
          <Text style={[styles.dateText, { color: theme.textMuted }]}>
            Imported {formatDateFull(screenshot.createdAt)}
          </Text>
        </View>

        {/* Metadata cards */}
        <View style={styles.metadataRow}>
          {/* Category */}
          <Pressable
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            style={[styles.metadataCard, { backgroundColor: GLASS.background, borderColor: GLASS.border }]}
          >
            <View style={[styles.metaIcon, { backgroundColor: (category?.color || theme.primary) + '20' }]}>
              <Ionicons name={category?.icon || 'folder-outline'} size={16} color={category?.color || theme.primary} />
            </View>
            <View style={styles.metaContent}>
              <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Category</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>{category?.name || 'Others'}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>

          {/* File Size */}
          <View style={[styles.metadataCard, { backgroundColor: GLASS.background, borderColor: GLASS.border }]}>
            <View style={[styles.metaIcon, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="document-outline" size={16} color={theme.primary} />
            </View>
            <View style={styles.metaContent}>
              <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Size</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {formatFileSize(screenshot.fileSize || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Category Picker */}
        {showCategoryPicker && (
          <View style={[styles.categoryPicker, { backgroundColor: GLASS.background, borderColor: GLASS.border }]}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => handleCategoryChange(cat.id)}
                style={({ pressed }) => [
                  styles.categoryOption,
                  {
                    backgroundColor: cat.id === screenshot.category ? cat.color + '20' : 'transparent',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name={cat.icon} size={18} color={cat.color} />
                <Text style={[styles.categoryOptionText, { color: theme.text }]}>
                  {cat.name}
                </Text>
                {cat.id === screenshot.category && (
                  <Ionicons name="checkmark-circle" size={18} color={cat.color} />
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes</Text>
            <Pressable
              onPress={() => {
                if (editingNotes) {
                  handleSaveNotes();
                } else {
                  setEditingNotes(true);
                }
              }}
              hitSlop={8}
            >
              <Ionicons
                name={editingNotes ? 'checkmark-circle' : 'create-outline'}
                size={20}
                color={editingNotes ? theme.success : theme.textMuted}
              />
            </Pressable>
          </View>

          {editingNotes ? (
            <TextInput
              style={[
                styles.notesInput,
                {
                  color: theme.text,
                  backgroundColor: GLASS.background,
                  borderColor: theme.primary,
                },
              ]}
              value={notesValue}
              onChangeText={setNotesValue}
              placeholder="Add notes about this screenshot..."
              placeholderTextColor={theme.textMuted}
              multiline
              autoFocus
              textAlignVertical="top"
              onBlur={handleSaveNotes}
            />
          ) : (
            <Pressable onPress={() => setEditingNotes(true)}>
              <Text
                style={[
                  styles.notesText,
                  { color: screenshot.notes ? theme.textSecondary : theme.textMuted },
                ]}
              >
                {screenshot.notes || 'Tap to add notes...'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Dimensions info */}
        {(screenshot.width > 0 || screenshot.height > 0) && (
          <View style={[styles.dimensionsCard, { backgroundColor: GLASS.background, borderColor: GLASS.border }]}>
            <Ionicons name="resize-outline" size={16} color={theme.textMuted} />
            <Text style={[styles.dimensionsText, { color: theme.textMuted }]}>
              {screenshot.width} × {screenshot.height} px
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const formatDateFull = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  headerButtonWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
    backgroundColor: GLASS.background,
    overflow: 'hidden',
  },
  headerButtonFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,30,40,0.85)',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  scrollContent: {
    paddingBottom: SPACING.huge,
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    backgroundColor: '#0F0F14',
    marginBottom: SPACING.lg,
  },
  image: {
    width: SCREEN_WIDTH,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  screenshotTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
  },
  dateText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.regular,
  },
  metadataRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  metadataCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
    ...SHADOWS.subtle,
  },
  metaIcon: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaContent: {
    flex: 1,
  },
  metaLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: 1,
  },
  metaValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  categoryPicker: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: GLASS.borderRadius,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.glass,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  categoryOptionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  notesInput: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    minHeight: 100,
    lineHeight: 22,
  },
  notesText: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 22,
  },
  dimensionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  dimensionsText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  notFoundText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});

export default ScreenshotDetailsScreen;
