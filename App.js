import React, { useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { ScreenshotProvider } from './src/context/ScreenshotContext';
import StackNavigator from './src/navigation/StackNavigator';
import SplashScreen from './src/screens/SplashScreen';
import ScreenshotDetector from './src/components/ScreenshotDetector';
import { setupNotificationHandler } from './src/services/notificationService';

// Must be called at module level for expo-notifications to handle
// foreground notifications as visible banners
setupNotificationHandler();

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <ScreenshotProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <StackNavigator />
        <ScreenshotDetector />
        {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
      </NavigationContainer>
    </ScreenshotProvider>
  );
}
