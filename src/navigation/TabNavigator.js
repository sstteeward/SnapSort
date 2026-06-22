// TabNavigator — iOS 26 Liquid Glass floating pill tab bar
// Theme-aware: bright white glass in Light Mode, dark frosted glass in Dark Mode

import React from 'react';
import { StyleSheet, View, Pressable, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import InboxScreen from '../screens/InboxScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { SCREEN_NAMES, COLORS, SPACING, GLASS, getGlass, getShadows } from '../utils/constants';
import useScreenshots from '../hooks/useScreenshots';

const Tab = createBottomTabNavigator();

const FloatingTabBar = ({ state, descriptors, navigation }) => {
  const { darkMode, inboxCount } = useScreenshots();
  const theme = darkMode ? COLORS.dark : COLORS.light;
  const glass = getGlass(darkMode);
  const shadows = getShadows(darkMode);
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';

  const tabItems = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;

    let iconName;
    let showBadge = false;
    switch (route.name) {
      case SCREEN_NAMES.HOME:
        iconName = isFocused ? 'home' : 'home-outline';
        break;
      case SCREEN_NAMES.INBOX:
        iconName = isFocused ? 'mail' : 'mail-outline';
        showBadge = inboxCount > 0;
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
        <View>
          <Ionicons
            name={iconName}
            size={22}
            color={isFocused ? theme.primary : theme.textMuted}
          />
          {showBadge && (
            <View style={[styles.badge, { backgroundColor: theme.error }]} />
          )}
        </View>
      </Pressable>
    );
  });

  const tabBarContent = (
    <View style={styles.tabRow}>
      {tabItems}
    </View>
  );

  // Theme-aware tab bar styles
  const tabBarBg = darkMode ? 'rgba(30,30,40,0.65)' : 'rgba(255,255,255,0.80)';
  const tabBarBorder = darkMode ? glass.border : 'rgba(0,0,0,0.08)';

  return (
    <View style={[styles.floatingContainer, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.shadowWrap, shadows.float]}>
        {isAndroid ? (
          <View style={[styles.tabBarBase, {
            backgroundColor: darkMode ? 'rgba(25,25,35,0.92)' : 'rgba(255,255,255,0.90)',
            borderColor: tabBarBorder,
          }]}>
            {tabBarContent}
          </View>
        ) : (
          <BlurView
            intensity={50}
            tint={darkMode ? 'dark' : 'light'}
            style={[styles.tabBarBase, {
              backgroundColor: tabBarBg,
              borderColor: tabBarBorder,
            }]}
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
        name={SCREEN_NAMES.INBOX}
        component={InboxScreen}
        options={{ tabBarLabel: 'Inbox' }}
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
  tabBarBase: {
    flexDirection: 'row',
    borderRadius: GLASS.borderRadiusPill,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    overflow: 'hidden',
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
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default TabNavigator;
