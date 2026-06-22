// Custom hook for accessing screenshot data and actions
// Provides convenient derived data (favorites, recent, stats, inbox, etc.)

import { useContext, useMemo } from 'react';
import { ScreenshotContext } from '../context/ScreenshotContext';
import { CATEGORIES } from '../utils/constants';

const useScreenshots = () => {
  const context = useContext(ScreenshotContext);

  if (!context) {
    throw new Error('useScreenshots must be used within a ScreenshotProvider');
  }

  const {
    screenshots,
    inboxScreenshots,
    loading,
    scanning,
    darkMode,
    storageMode,
    initialized,
    importScreenshots,
    scanGallery,
    categorizeFromInbox,
    dismissFromInbox,
    dismissAllFromInbox,
    setStorageMode,
    toggleFavorite,
    updateCategory,
    updateNotes,
    updateTitle,
    removeScreenshot,
    clearAll,
    toggleDarkMode,
  } = context;

  // Derived: favorites
  const favorites = useMemo(
    () => screenshots.filter((s) => s.isFavorite),
    [screenshots]
  );

  // Derived: recent (last 10)
  const recent = useMemo(
    () => screenshots.slice(0, 10),
    [screenshots]
  );

  // Derived: category counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    CATEGORIES.forEach((cat) => {
      counts[cat.id] = 0;
    });
    screenshots.forEach((s) => {
      if (counts[s.category] !== undefined) {
        counts[s.category]++;
      } else {
        counts['others']++;
      }
    });
    return counts;
  }, [screenshots]);

  // Derived: categories with counts
  const categoriesWithCounts = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        ...cat,
        count: categoryCounts[cat.id] || 0,
      })),
    [categoryCounts]
  );

  // Derived: used categories (with at least 1 screenshot)
  const usedCategories = useMemo(
    () => categoriesWithCounts.filter((c) => c.count > 0),
    [categoriesWithCounts]
  );

  // Derived: screenshots by category
  const getScreenshotsByCategory = useMemo(() => {
    return (categoryId) => screenshots.filter((s) => s.category === categoryId);
  }, [screenshots]);

  // Derived: stats
  const stats = useMemo(
    () => ({
      total: screenshots.length,
      favorites: favorites.length,
      categoriesUsed: usedCategories.length,
    }),
    [screenshots.length, favorites.length, usedCategories.length]
  );

  // Derived: inbox count
  const inboxCount = useMemo(
    () => inboxScreenshots.length,
    [inboxScreenshots]
  );

  return {
    // State
    screenshots,
    inboxScreenshots,
    inboxCount,
    favorites,
    recent,
    categoryCounts,
    categoriesWithCounts,
    usedCategories,
    stats,
    loading,
    scanning,
    darkMode,
    storageMode,
    initialized,

    // Actions
    importScreenshots,
    scanGallery,
    categorizeFromInbox,
    dismissFromInbox,
    dismissAllFromInbox,
    setStorageMode,
    toggleFavorite,
    updateCategory,
    updateNotes,
    updateTitle,
    removeScreenshot,
    clearAll,
    toggleDarkMode,
    getScreenshotsByCategory,
  };
};

export default useScreenshots;
