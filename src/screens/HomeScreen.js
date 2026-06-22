// HomeScreen — iOS 26 Liquid Glass Dashboard
// Theme-aware: bright glass in Light Mode, dark glass in Dark Mode

import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  Animated,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SearchBar from '../components/SearchBar';
import ScreenshotCard from '../components/ScreenshotCard';
import CategoryCard from '../components/CategoryCard';
import EmptyState from '../components/EmptyState';
import useScreenshots from '../hooks/useScreenshots';
import useSearch from '../hooks/useSearch';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SCREEN_NAMES,
  GLASS,
  getGlass,
  getShadows,
} from '../utils/constants';

const StatCard = ({ icon, label, value, color, theme, darkMode }) => {
  const glass = getGlass(darkMode);
  const shadows = getShadows(darkMode);
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          borderColor: darkMode ? glass.border : 'rgba(0,0,0,0.08)',
          backgroundColor: darkMode ? glass.background : 'rgba(255,255,255,0.65)',
        },
        shadows.glass,
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </Animated.View>
  );
};

const HomeScreen = ({ navigation }) => {
  const {
    screenshots,
    recent,
    stats,
    categoriesWithCounts,
    loading,
    darkMode,
    inboxCount,
  } = useScreenshots();
  const { query, setQuery, results, isSearching } = useSearch(screenshots);
  const insets = useSafeAreaInsets();
  const theme = darkMode ? COLORS.dark : COLORS.light;

  const handleScreenshotPress = useCallback(
    (screenshot) => {
      navigation.navigate(SCREEN_NAMES.SCREENSHOT_DETAILS, { id: screenshot.id });
    },
    [navigation]
  );

  const handleCategoryPress = useCallback(
    (category) => {
      navigation.navigate(SCREEN_NAMES.CATEGORY_DETAILS, { categoryId: category.id });
    },
    [navigation]
  );

  const handleImport = useCallback(() => {
    navigation.navigate(SCREEN_NAMES.IMPORT);
  }, [navigation]);

  const renderSearchResult = useCallback(
    ({ item }) => (
      <ScreenshotCard screenshot={item} onPress={handleScreenshotPress} />
    ),
    [handleScreenshotPress]
  );

  const statusBarStyle = darkMode ? 'light-content' : 'dark-content';

  // If searching, show search results
  if (isSearching) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={theme.background} />
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Search</Text>
        </View>
        <View style={styles.searchContainer}>
          <SearchBar value={query} onChangeText={setQuery} autoFocus />
        </View>
        <Text style={[styles.searchResultCount, { color: theme.textMuted }]}>
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </Text>
        <FlatList
          data={results}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No results"
              message={`No screenshots matching "${query}"`}
            />
          }
        />
      </View>
    );
  }

  // Empty state — no screenshots at all
  if (screenshots.length === 0 && !loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={theme.background} />
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>SnapSort</Text>
        </View>
        <View style={styles.searchContainer}>
          <SearchBar value={query} onChangeText={setQuery} />
        </View>
        <EmptyState
          icon="camera-outline"
          title="Welcome to SnapSort!"
          message="Import your screenshots to get started. We'll help you organize them effortlessly."
          actionLabel="Import Screenshots"
          onAction={handleImport}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={theme.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} tintColor={theme.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerGreeting, { color: theme.textMuted }]}>
              Your Screenshots
            </Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>SnapSort</Text>
          </View>
          <Pressable
            onPress={handleImport}
            style={({ pressed }) => [styles.headerAddButton, {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            }]}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Inbox Banner */}
        {inboxCount > 0 && (
          <Pressable
            onPress={() => navigation.navigate(SCREEN_NAMES.INBOX)}
            style={({ pressed }) => [styles.inboxBanner, {
              backgroundColor: theme.primary + '18',
              borderColor: theme.primary + '30',
              opacity: pressed ? 0.85 : 1,
            }]}
          >
            <Ionicons name="mail-unread-outline" size={20} color={theme.primary} />
            <Text style={[styles.inboxBannerText, { color: theme.primary }]}>
              {inboxCount} new {inboxCount === 1 ? 'screenshot' : 'screenshots'} — Tap to categorize
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.primary} />
          </Pressable>
        )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar value={query} onChangeText={setQuery} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon="images"
            label="Total"
            value={stats.total}
            color={theme.primary}
            theme={theme}
            darkMode={darkMode}
          />
          <StatCard
            icon="grid"
            label="Categories"
            value={stats.categoriesUsed}
            color={theme.success}
            theme={theme}
            darkMode={darkMode}
          />
          <StatCard
            icon="heart"
            label="Favorites"
            value={stats.favorites}
            color={theme.accent}
            theme={theme}
            darkMode={darkMode}
          />
        </View>

        {/* Recent Screenshots */}
        {recent.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                Last imported
              </Text>
            </View>
            <FlatList
              data={recent}
              renderItem={({ item }) => (
                <ScreenshotCard screenshot={item} onPress={handleScreenshotPress} />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              ItemSeparatorComponent={() => <View style={{ width: SPACING.md }} />}
            />
          </View>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Categories</Text>
            <Pressable onPress={() => navigation.navigate(SCREEN_NAMES.CATEGORIES)}>
              <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
            </Pressable>
          </View>
          <View style={styles.categoriesGrid}>
            {categoriesWithCounts.slice(0, 4).map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onPress={handleCategoryPress}
              />
            ))}
          </View>
        </View>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  headerGreeting: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.extrabold,
    letterSpacing: -0.5,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: GLASS.borderRadius,
    borderWidth: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.regular,
  },
  seeAll: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  horizontalList: {
    paddingHorizontal: SPACING.lg,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
  },
  gridRow: {
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
  },
  gridContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  searchResultCount: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  headerAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inboxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  inboxBannerText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});

export default HomeScreen;
