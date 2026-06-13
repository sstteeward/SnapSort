// Notification service for SnapSort
// Handles local push notifications for screenshot detection

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure how notifications appear when the app is in the foreground.
 * We suppress foreground notifications since we show the modal directly.
 */
export const setupNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // If the app is in the foreground and this is a screenshot notification,
      // don't show it (we show the modal instead)
      const data = notification.request.content.data;
      if (data?.type === 'screenshot_detected') {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        };
      }
      // For other notifications, show them normally
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });
};

/**
 * Request notification permissions.
 * @returns {boolean} Whether permissions were granted
 */
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Notification permissions not granted');
    return false;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('screenshot-detection', {
      name: 'Screenshot Detection',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
      description: 'Notifications when a new screenshot is detected',
    });
  }

  return true;
};

/**
 * Send a local notification about a detected screenshot.
 * @param {object} assetInfo - { id, filename, width, height }
 */
export const sendScreenshotNotification = async (assetInfo) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📸 New Screenshot Detected!',
        body: 'Tap to categorize and organize it in SnapSort',
        data: {
          type: 'screenshot_detected',
          assetId: assetInfo.id,
          filename: assetInfo.filename,
        },
        sound: true,
        ...(Platform.OS === 'android' && {
          channelId: 'screenshot-detection',
        }),
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};
