import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import StackNavigator from './src/navigation/StackNavigator';
import { ScreenshotProvider } from './src/context/ScreenshotContext';
import ScreenshotDetector from './src/components/ScreenshotDetector';
import { setupNotificationHandler } from './src/services/notificationService';

// Must be called outside of components (at module level)
// so notifications are handled even before the app fully renders
setupNotificationHandler();

// Import background task definitions (must be at top level)
import './src/services/backgroundScreenshotService';

export default function App() {
  return (
    <SafeAreaProvider>
      <ScreenshotProvider>
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
        <ScreenshotDetector />
      </ScreenshotProvider>
    </SafeAreaProvider>
  );
}
