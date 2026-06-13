// CategoriesScreen — Grid of all category cards with counts

import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CategoryCard from '../components/CategoryCard';
import useScreenshots from '../hooks/useScreenshots';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SCREEN_NAMES,
} from '../utils/constants';

const CategoriesScreen = ({ navigation }) => {
  const { categoriesWithCounts, darkMode } = useScreenshots();
  const insets = useSafeAreaInsets();
  const theme = darkMode ? COLORS.dark : COLORS.light;

  const handleCategoryPress = useCallback(
    (category) => {
      navigation.navigate(SCREEN_NAMES.CATEGORY_DETAILS, { categoryId: category.id });
    },
    [navigation]
  );

  const renderCategory = useCallback(
    ({ item }) => (
      <CategoryCard category={item} onPress={handleCategoryPress} />
    ),
    [handleCategoryPress]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Categories</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Organize your screenshots
        </Text>
      </View>

      {/* Grid */}
      <FlatList
        data={categoriesWithCounts}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.extrabold,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.regular,
  },
  grid: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
});

export default CategoriesScreen;
