// TabNavigator — iOS 26 Liquid Glass floating pill tab bar
// Detached from edges, frosted glass background, smooth transitions

import React from 'react';
import { StyleSheet, View, Pressable, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { SCREEN_NAMES, COLORS, SPACING, GLASS, SHADOWS } from '../utils/constants';
import useScreenshots from '../hooks/useScreenshots';

const Tab = createBottomTabNavigator();

const FloatingTabBar = ({ state, descriptors, navigation }) => {
  const { darkMode } = useScreenshots();
  const theme = darkMode ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';

  const tabItems = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;

    let iconName;
    switch (route.name) {
      case SCREEN_NAMES.HOME:
        iconName = isFocused ? 'home' : 'home-outline';
        break;
      case SCREEN_NAMES.CATEGORIES:
        iconName = isFocused ? 'grid' : 'grid-outline';
        break;
      case SCREEN_NAMES.FAVORITES:
        iconName = isFocused ? 'heart' : 'heart-outline';
        break;
      case SCREEN_NAMES.SETTINGS:
        iconName = isFocused ? 'settings' : 'settings-outline';
        break;
      default:
        iconName = 'ellipse-outline';
    }

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={[
          styles.tabButton,
          isFocused && styles.tabButtonActive,
          isFocused && { backgroundColor: theme.primary + '25' },
        ]}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
      >
        <Ionicons
          name={iconName}
          size={22}
          color={isFocused ? theme.primary : theme.textMuted}
        />
      </Pressable>
    );
  });

  const tabBarContent = (
    <View style={styles.tabRow}>
      {tabItems}
    </View>
  );

  return (
    <View style={[styles.floatingContainer, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.shadowWrap, SHADOWS.float]}>
        {isAndroid ? (
          <View style={styles.tabBarFallback}>
            {tabBarContent}
          </View>
        ) : (
          <BlurView
            intensity={50}
            tint="dark"
            style={styles.tabBarBlur}
          >
            {tabBarContent}
          </BlurView>
        )}
      </View>
    </View>
  );
};

const TabNavigator = () => {
  const { darkMode } = useScreenshots();
  const theme = darkMode ? COLORS.dark : COLORS.light;

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name={SCREEN_NAMES.HOME}
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.CATEGORIES}
        component={CategoriesScreen}
        options={{ tabBarLabel: 'Categories' }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.FAVORITES}
        component={FavoritesScreen}
        options={{ tabBarLabel: 'Favorites' }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.SETTINGS}
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: SPACING.xl,
    right: SPACING.xl,
    alignItems: 'center',
  },
  shadowWrap: {
    borderRadius: GLASS.borderRadiusPill,
    width: '100%',
  },
  tabBarBlur: {
    flexDirection: 'row',
    borderRadius: GLASS.borderRadiusPill,
    borderWidth: 1,
    borderColor: GLASS.border,
    backgroundColor: GLASS.backgroundSolid,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    overflow: 'hidden',
  },
  tabBarFallback: {
    flexDirection: 'row',
    borderRadius: GLASS.borderRadiusPill,
    borderWidth: 1,
    borderColor: GLASS.border,
    backgroundColor: 'rgba(25,25,35,0.92)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  tabRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: GLASS.borderRadiusPill,
    minWidth: 52,
    height: 40,
  },
  tabButtonActive: {
    borderRadius: GLASS.borderRadiusPill,
  },
});

export default TabNavigator;
