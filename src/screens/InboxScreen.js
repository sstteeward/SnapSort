// InboxScreen — Uncategorized screenshot inbox
// Shows newly detected screenshots from the device gallery for quick categorization
// Tap a screenshot to preview full-screen and choose a category
// iOS 26 Liquid Glass — theme-aware

import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,

  StatusBar,
  Alert,
  Modal,
  Image,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';

import InboxCard from '../components/InboxCard';
import EmptyState from '../components/EmptyState';
import LogoSpinner from '../components/LogoSpinner';
import useScreenshots from '../hooks/useScreenshots';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  CATEGORIES,
  GLASS,
  getGlass,
  getShadows,
} from '../utils/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const InboxScreen = () => {
  const {
    inboxScreenshots,
    inboxCount,
    scanning,
    darkMode,
    scanGallery,
    categorizeFromInbox,
    dismissFromInbox,
    dismissAllFromInbox,
  } = useScreenshots();

  const insets = useSafeAreaInsets();
  const theme = darkMode ? COLORS.dark : COLORS.light;
  const glass = getGlass(darkMode);
  const shadows = getShadows(darkMode);

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [categorizing, setCategorizing] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Preview modal state
  const [previewAsset, setPreviewAsset] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;

  const statusBarStyle = darkMode ? 'light-content' : 'dark-content';
  const cardBg = darkMode ? glass.background : 'rgba(255,255,255,0.65)';
  const cardBorder = darkMode ? glass.border : 'rgba(0,0,0,0.08)';
  const chipInactiveBg = darkMode ? glass.background : 'rgba(0,0,0,0.04)';
  const chipInactiveBorder = darkMode ? glass.border : 'rgba(0,0,0,0.08)';

  // Request permission and scan on mount
  useEffect(() => {
    const init = async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');
      if (status === 'granted') {
        await scanGallery();
      }
    };
    init();
  }, [scanGallery]);

  const handleRefresh = useCallback(async () => {
    if (permissionGranted) {
      await scanGallery();
    }
  }, [permissionGranted, scanGallery]);

  // --- Preview Modal ---
  const openPreview = useCallback((screenshot) => {
    setPreviewAsset(screenshot);
    setSelectedCategory(null);
    setPreviewVisible(true);
    fadeAnim.setValue(0);
    slideAnim.setValue(60);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const closePreview = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 60,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPreviewVisible(false);
      setPreviewAsset(null);
      setSelectedCategory(null);
    });
  }, [fadeAnim, slideAnim]);

  const handleConfirmCategorize = useCallback(async () => {
    if (!previewAsset || !selectedCategory) return;

    setCategorizing(previewAsset.assetId);
    closePreview();

    try {
      await categorizeFromInbox(previewAsset.assetId, selectedCategory);
    } catch (error) {
      Alert.alert('Error', 'Failed to categorize screenshot. Please try again.');
    } finally {
      setCategorizing(null);
    }
  }, [previewAsset, selectedCategory, categorizeFromInbox, closePreview]);

  const handleDismissFromPreview = useCallback(async () => {
    if (!previewAsset) return;
    const assetId = previewAsset.assetId;
    closePreview();
    await dismissFromInbox(assetId);
  }, [previewAsset, dismissFromInbox, closePreview]);

  const handleDismiss = useCallback(async (assetId) => {
    await dismissFromInbox(assetId);
  }, [dismissFromInbox]);

  const handleDismissAll = useCallback(() => {
    Alert.alert(
      'Dismiss All',
      `Dismiss all ${inboxCount} screenshots? They won't appear in the inbox again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss All',
          style: 'destructive',
          onPress: () => dismissAllFromInbox(),
        },
      ]
    );
  }, [inboxCount, dismissAllFromInbox]);

  const renderItem = useCallback(
    ({ item }) => (
      <InboxCard
        screenshot={item}
        onCategorize={openPreview}
        onDismiss={handleDismiss}
      />
    ),
    [openPreview, handleDismiss]
  );

  const keyExtractor = useCallback((item) => item.assetId, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Permission not granted
  if (!permissionGranted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={statusBarStyle} />
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Inbox</Text>
        </View>
        <EmptyState
          icon="lock-closed-outline"
          title="Gallery Access Required"
          message="SnapSort needs access to your photos to detect and organize your screenshots."
          actionLabel="Grant Access"
          onAction={async () => {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            setPermissionGranted(status === 'granted');
            if (status === 'granted') scanGallery();
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Inbox</Text>
          {inboxCount > 0 && (
            <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
              {inboxCount} new {inboxCount === 1 ? 'screenshot' : 'screenshots'}
            </Text>
          )}
        </View>
        {inboxCount > 0 && (
          <Pressable
            onPress={handleDismissAll}
            style={({ pressed }) => [
              styles.dismissAllButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.dismissAllText, { color: theme.error }]}>
              Dismiss All
            </Text>
          </Pressable>
        )}
      </View>

      {/* Inbox List */}
      <FlatList
        data={inboxScreenshots}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={scanning}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          scanning ? (
            <View style={styles.loadingContainer}>
              <LogoSpinner size="large" />
              <Text style={[styles.loadingText, { color: theme.textMuted }]}>
                Scanning your gallery...
              </Text>
            </View>
          ) : (
            <EmptyState
              icon="checkmark-circle-outline"
              title="All Caught Up!"
              message="No new screenshots detected. Pull down to scan again."
              iconColor={theme.success}
            />
          )
        }
      />

      {/* ==================== FULL-SCREEN PREVIEW MODAL ==================== */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closePreview}
      >
        <View style={styles.modalRoot}>
          {/* Dark backdrop */}
          <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closePreview} />
          </Animated.View>

          {/* Image area — centered, fills available space above the sheet */}
          <Animated.View style={[styles.imageArea, {
            opacity: fadeAnim,
            paddingTop: insets.top + 50,
          }]}>
            {previewAsset && (
              <Image
                source={{ uri: previewAsset.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
          </Animated.View>

          {/* Top bar — close + dismiss */}
          <Animated.View style={[styles.topBar, {
            opacity: fadeAnim,
            paddingTop: insets.top + SPACING.sm,
          }]}>
            <Pressable
              onPress={closePreview}
              style={({ pressed }) => [styles.topBarButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>

            {previewAsset && (
              <View style={styles.topBarInfo}>
                <Text style={styles.topBarFilename} numberOfLines={1}>
                  {previewAsset.filename || 'Screenshot'}
                </Text>
                <Text style={styles.topBarDate}>
                  {previewAsset.width && previewAsset.height
                    ? `${previewAsset.width} × ${previewAsset.height}`
                    : ''}
                  {previewAsset.createdAt ? `  •  ${formatDate(previewAsset.createdAt)}` : ''}
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleDismissFromPreview}
              style={({ pressed }) => [styles.topBarButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="eye-off-outline" size={22} color="#FFFFFF" />
            </Pressable>
          </Animated.View>

          {/* Bottom sheet — category picker */}
          <Animated.View style={[styles.bottomSheet, {
            transform: [{ translateY: slideAnim }],
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          }]}>
            <View style={[styles.sheetInner, {
              backgroundColor: darkMode ? 'rgba(25,25,35,0.95)' : 'rgba(255,255,255,0.96)',
              borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }]}>
              <SheetContent
                theme={theme}
                darkMode={darkMode}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                chipInactiveBg={chipInactiveBg}
                chipInactiveBorder={chipInactiveBorder}
                onConfirm={handleConfirmCategorize}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

// --- Sheet content (reused across BlurView / plain View) ---
const SheetContent = ({
  theme,
  darkMode,
  selectedCategory,
  setSelectedCategory,
  chipInactiveBg,
  chipInactiveBorder,
  onConfirm,
}) => (
  <View style={styles.sheetContentInner}>
    <View style={styles.sheetHandle} />
    <Text style={[styles.sheetTitle, { color: theme.text }]}>
      Choose a Category
    </Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
    >
      {CATEGORIES.map((cat) => (
        <Pressable
          key={cat.id}
          onPress={() => setSelectedCategory(cat.id)}
          style={[
            styles.chip,
            {
              backgroundColor: selectedCategory === cat.id ? cat.color : chipInactiveBg,
              borderColor: selectedCategory === cat.id ? cat.color : chipInactiveBorder,
            },
          ]}
        >
          <Ionicons
            name={cat.icon}
            size={15}
            color={selectedCategory === cat.id ? '#FFFFFF' : theme.textSecondary}
          />
          <Text
            style={[
              styles.chipText,
              { color: selectedCategory === cat.id ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            {cat.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
    <Pressable
      onPress={onConfirm}
      disabled={!selectedCategory}
      style={({ pressed }) => [
        styles.confirmButton,
        {
          backgroundColor: selectedCategory ? theme.primary : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
          opacity: pressed && selectedCategory ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons
        name={selectedCategory ? 'checkmark' : 'arrow-up-outline'}
        size={18}
        color={selectedCategory ? '#FFFFFF' : theme.textMuted}
      />
      <Text style={[styles.confirmButtonText, {
        color: selectedCategory ? '#FFFFFF' : theme.textMuted,
      }]}>
        {selectedCategory ? 'Categorize' : 'Select a Category'}
      </Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.extrabold,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.regular,
    marginTop: 2,
  },
  dismissAllButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  dismissAllText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  listContent: {
    paddingTop: SPACING.sm,
    paddingBottom: 120,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.huge * 2,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.md,
    marginTop: SPACING.lg,
  },

  // ===== Preview Modal =====
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  imageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: 200, // leave space for the bottom sheet
  },
  previewImage: {
    width: SCREEN_WIDTH - SPACING.md * 2,
    height: '100%',
    borderRadius: BORDER_RADIUS.lg,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarInfo: {
    flex: 1,
    alignItems: 'center',
  },
  topBarFilename: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  topBarDate: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 1,
  },

  // Bottom sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetInner: {
    marginHorizontal: SPACING.md,
    borderRadius: GLASS.borderRadius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetContentInner: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.4)',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  sheetTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.md,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: GLASS.borderRadiusPill,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  chipText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: GLASS.borderRadiusPill,
    gap: SPACING.sm,
  },
  confirmButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});

export default InboxScreen;
