// CategoryDetailsScreen — iOS 26 Liquid Glass category view
// Theme-aware: glass back button and tinted header adapt to Light/Dark mode

import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  StatusBar,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ScreenshotCard from '../components/ScreenshotCard';
import EmptyState from '../components/EmptyState';
import useScreenshots from '../hooks/useScreenshots';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  CATEGORIES,
  SCREEN_NAMES,
  GLASS,
  getGlass,
} from '../utils/constants';

const CategoryDetailsScreen = ({ navigation, route }) => {
  const { categoryId } = route.params;
  const { getScreenshotsByCategory, darkMode } = useScreenshots();
  const insets = useSafeAreaInsets();
  const theme = darkMode ? COLORS.dark : COLORS.light;
  const glass = getGlass(darkMode);

  const category = CATEGORIES.find((c) => c.id === categoryId);
  const screenshots = useMemo(
    () => getScreenshotsByCategory(categoryId),
    [getScreenshotsByCategory, categoryId]
  );

  const handleScreenshotPress = useCallback(
    (screenshot) => {
      navigation.navigate(SCREEN_NAMES.SCREENSHOT_DETAILS, { id: screenshot.id });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <ScreenshotCard screenshot={item} onPress={handleScreenshotPress} />
    ),
    [handleScreenshotPress]
  );

  const isAndroid = Platform.OS === 'android';
  const statusBarStyle = darkMode ? 'light-content' : 'dark-content';

  // Theme-aware back button styling
  const backButtonBg = darkMode ? glass.background : 'rgba(0,0,0,0.04)';
  const backButtonBorder = darkMode ? glass.border : 'rgba(0,0,0,0.08)';
  const backIconColor = darkMode ? '#FFFFFF' : '#000000';

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButtonWrap,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          hitSlop={8}
        >
          {isAndroid ? (
            <View style={[styles.backButtonInner, {
              backgroundColor: darkMode ? 'rgba(30,30,40,0.85)' : 'rgba(0,0,0,0.04)',
              borderColor: backButtonBorder,
            }]}>
              <Ionicons name="chevron-back" size={20} color={backIconColor} />
            </View>
          ) : (
            <BlurView intensity={30} tint={darkMode ? 'dark' : 'light'} style={[styles.backButtonInner, {
              backgroundColor: backButtonBg,
              borderColor: backButtonBorder,
            }]}>
              <Ionicons name="chevron-back" size={20} color={backIconColor} />
            </BlurView>
          )}
        </Pressable>

        <View style={styles.headerInfo}>
          <View style={styles.headerRow}>
            {category && (
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <Ionicons name={category.icon} size={20} color={category.color} />
              </View>
            )}
            <Text style={[styles.title, { color: theme.text }]}>
              {category ? category.name : 'Category'}
            </Text>
          </View>
          <Text style={[styles.count, { color: theme.textMuted }]}>
            {screenshots.length} {screenshots.length === 1 ? 'screenshot' : 'screenshots'}
          </Text>
        </View>
      </View>

      {/* Screenshot Grid */}
      <FlatList
        data={screenshots}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={category ? category.icon : 'folder-outline'}
            title={`No ${category ? category.name : ''} screenshots`}
            message="Screenshots assigned to this category will appear here."
            iconColor={category ? category.color : undefined}
            actionLabel="Import Screenshots"
            onAction={() => navigation.navigate(SCREEN_NAMES.IMPORT)}
          />
        }
      />
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  backButtonWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  categoryIcon: {
    width: 30,
    height: 30,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  count: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.regular,
    marginLeft: 42,
  },
  gridRow: {
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
  },
  gridContent: {
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
  },
});

export default CategoryDetailsScreen;
