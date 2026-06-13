// Root Stack Navigator for SnapSort
// Wraps TabNavigator + push screens (Details, Import, CategoryDetails)

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';
import ScreenshotDetailsScreen from '../screens/ScreenshotDetailsScreen';
import ImportScreen from '../screens/ImportScreen';
import CategoryDetailsScreen from '../screens/CategoryDetailsScreen';
import { SCREEN_NAMES, COLORS } from '../utils/constants';
import useScreenshots from '../hooks/useScreenshots';

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  const { darkMode } = useScreenshots();
  const theme = darkMode ? COLORS.dark : COLORS.light;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name={SCREEN_NAMES.MAIN_TABS}
        component={TabNavigator}
      />
      <Stack.Screen
        name={SCREEN_NAMES.SCREENSHOT_DETAILS}
        component={ScreenshotDetailsScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name={SCREEN_NAMES.IMPORT}
        component={ImportScreen}
      />
      <Stack.Screen
        name={SCREEN_NAMES.CATEGORY_DETAILS}
        component={CategoryDetailsScreen}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
