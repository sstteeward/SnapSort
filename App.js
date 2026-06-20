import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import StackNavigator from './src/navigation/StackNavigator';
import { ScreenshotProvider } from './src/context/ScreenshotContext';
import ScreenshotDetector from './src/components/ScreenshotDetector';
import { setupNotificationHandler } from './src/services/notificationService';

// Must be called outside of components (at module level)
// so notifications are handled even before the app fully renders
try {
  setupNotificationHandler();
} catch (e) {
  console.warn('Failed to setup notification handler:', e);
}

// Import background task definitions (must be at top level)
try {
  require('./src/services/backgroundScreenshotService');
} catch (e) {
  console.warn('Failed to load background screenshot service:', e);
}

// Error Boundary to catch render crashes and show a useful message
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.emoji}>⚠️</Text>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <ScrollView style={errorStyles.scroll}>
            <Text style={errorStyles.message}>
              {this.state.error?.toString()}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  scroll: { maxHeight: 200 },
  message: { fontSize: 13, color: '#64748B', textAlign: 'center' },
});

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ScreenshotProvider>
          <NavigationContainer>
            <StackNavigator />
          </NavigationContainer>
          <ScreenshotDetector />
        </ScreenshotProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
