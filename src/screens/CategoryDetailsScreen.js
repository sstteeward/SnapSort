// CategoryDetailsScreen — Shows all screenshots in a specific category

import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  StatusBar,
} from 'react-native';
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
} from '../utils/constants';

const CategoryDetailsScreen = ({ navigation, route }) => {
  const { categoryId } = route.params;
  const { getScreenshotsByCategory, darkMode } = useScreenshots();
  const insets = useSafeAreaInsets();
  const theme = darkMode ? COLORS.dark : COLORS.light;

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

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: theme.surfaceLight, opacity: pressed ? 0.7 : 1 },
          ]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>

        <View style={styles.headerInfo}>
          <View style={styles.headerRow}>
            {category && (
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <Ionicons name={category.icon} size={20} color="black" />
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
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
