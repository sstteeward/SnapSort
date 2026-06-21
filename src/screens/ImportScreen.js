// ImportScreen — iOS 26 Liquid Glass multi-image picker
// Glass surfaces, dark theme, frosted bottom bar

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as imageService from '../services/imageService';
import useScreenshots from '../hooks/useScreenshots';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  CATEGORIES,
  GLASS,
  SHADOWS,
} from '../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md * 2) / 3;

const ImportScreen = ({ navigation }) => {
  const { importScreenshots, darkMode } = useScreenshots();
  const insets = useSafeAreaInsets();
  const theme = darkMode ? COLORS.dark : COLORS.light;

  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('others');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handlePickImages = useCallback(async () => {
    try {
      const assets = await imageService.pickImages();
      if (assets.length > 0) {
        setSelectedImages((prev) => {
          const newAssets = assets.filter(
            (a) => !prev.some((p) => p.uri === a.uri)
          );
          return [...prev, ...newAssets];
        });
      }
    } catch (error) {
      alert(error.message || 'Failed to pick images');
    }
  }, []);

  const handleRemoveImage = useCallback((indexToRemove) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  }, []);

  const handleImport = useCallback(async () => {
    if (selectedImages.length === 0) return;

    setIsImporting(true);
    setProgress({ current: 0, total: selectedImages.length });

    try {
      await importScreenshots(selectedImages, selectedCategory, (current, total) => {
        setProgress({ current, total });
      });
      navigation.goBack();
    } catch (error) {
      setIsImporting(false);
      alert('Failed to import some screenshots. Please try again.');
    }
  }, [selectedImages, selectedCategory, importScreenshots, navigation]);

  const renderPreviewItem = useCallback(
    ({ item, index }) => (
      <View style={styles.previewContainer}>
        <Image source={{ uri: item.uri }} style={styles.previewImage} />
        <Pressable
          style={styles.removeButton}
          onPress={() => handleRemoveImage(index)}
        >
          <Ionicons name="close" size={14} color="#FFFFFF" />
        </Pressable>
      </View>
    ),
    [handleRemoveImage]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => !isImporting && navigation.goBack()}
          style={styles.headerButton}
        >
          {!isImporting && <Ionicons name="close" size={24} color={theme.text} />}
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Import</Text>
        <View style={styles.headerButton} />
      </View>

      {isImporting ? (
        // Importing State
        <View style={styles.importingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.importingTitle, { color: theme.text }]}>
            Importing Screenshots...
          </Text>
          <Text style={[styles.importingProgress, { color: theme.textMuted }]}>
            {progress.current} of {progress.total}
          </Text>
          <View style={[styles.progressBarBg, { backgroundColor: GLASS.background }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: theme.primary,
                  width: `${(progress.current / Math.max(1, progress.total)) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      ) : (
        // Selection State
        <>
          <FlatList
            data={selectedImages}
            renderItem={renderPreviewItem}
            keyExtractor={(item, index) => item.uri + index}
            numColumns={3}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.listRow}
            ListHeaderComponent={
              <View style={styles.section}>
                <Pressable
                  onPress={handlePickImages}
                  style={({ pressed }) => [
                    styles.pickButton,
                    {
                      borderColor: theme.primary + '60',
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Ionicons name="images-outline" size={32} color={theme.primary} />
                  <Text style={[styles.pickButtonText, { color: theme.primary }]}>
                    Select from Gallery
                  </Text>
                </Pressable>

                {selectedImages.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Assign Category
                    </Text>
                    <View style={styles.categoryChips}>
                      {CATEGORIES.map((cat) => (
                        <Pressable
                          key={cat.id}
                          onPress={() => setSelectedCategory(cat.id)}
                          style={[
                            styles.categoryChip,
                            {
                              backgroundColor: selectedCategory === cat.id ? cat.color : GLASS.background,
                              borderColor: selectedCategory === cat.id ? cat.color : GLASS.border,
                            },
                          ]}
                        >
                          <Ionicons
                            name={cat.icon}
                            size={16}
                            color={selectedCategory === cat.id ? '#FFFFFF' : theme.textSecondary}
                          />
                          <Text
                            style={[
                              styles.categoryChipText,
                              { color: selectedCategory === cat.id ? '#FFFFFF' : theme.textSecondary },
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginTop: SPACING.lg }]}>
                      Selected ({selectedImages.length})
                    </Text>
                  </>
                )}
              </View>
            }
          />

          {/* Bottom Action Bar */}
          {selectedImages.length > 0 && (
            <View style={[styles.bottomBar, { backgroundColor: GLASS.backgroundSolid, borderTopColor: GLASS.border }]}>
              <Pressable
                onPress={handleImport}
                style={({ pressed }) => [
                  styles.importActionButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={styles.importActionText}>
                  Import {selectedImages.length} {selectedImages.length === 1 ? 'Screenshot' : 'Screenshots'}
                </Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    height: 56,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  listContent: {
    paddingBottom: 100,
  },
  section: {
    padding: SPACING.lg,
  },
  pickButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: GLASS.borderRadius,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    backgroundColor: GLASS.backgroundLight,
  },
  pickButtonText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.md,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: GLASS.borderRadiusPill,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  categoryChipText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  listRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  previewContainer: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE * 1.5,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#0F0F14',
    borderWidth: 1,
    borderColor: GLASS.borderLight,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: GLASS.borderLight,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    borderTopWidth: 1,
    paddingBottom: SPACING.xxl,
  },
  importActionButton: {
    paddingVertical: SPACING.md,
    borderRadius: GLASS.borderRadiusPill,
    alignItems: 'center',
    ...SHADOWS.glow('#0A84FF'),
  },
  importActionText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  importingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  importingTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  importingProgress: {
    fontSize: TYPOGRAPHY.sizes.md,
    marginBottom: SPACING.xl,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.borderLight,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default ImportScreen;
