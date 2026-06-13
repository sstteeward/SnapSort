import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import StackNavigator from './src/navigation/StackNavigator';
import { ScreenshotProvider } from './src/context/ScreenshotContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <ScreenshotProvider>
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
      </ScreenshotProvider>
    </SafeAreaProvider>
  );
}
