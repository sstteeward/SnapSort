// Notification service for SnapSort
// Handles local push notifications for screenshot detection
// Includes action buttons (Categorize / Later) and batch notifications

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Notification category identifier for action buttons
const SCREENSHOT_CATEGORY = 'screenshot_actions';

/**
 * Configure how notifications appear when the app is in the foreground.
 * Screenshot notifications are shown as visible banners so the user always
 * sees them instantly, even while using the app.
 *
 * Also registers the action button category for interactive notifications.
 */
export const setupNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });

  // Register action buttons (non-blocking — fire and forget)
  registerNotificationCategory();
};

/**
 * Register the notification category with Categorize / Later action buttons.
 */
const registerNotificationCategory = async () => {
  try {
    await Notifications.setNotificationCategoryAsync(SCREENSHOT_CATEGORY, [
      {
        identifier: 'categorize',
        buttonTitle: '📂 Categorize',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'later',
        buttonTitle: '🕐 Later',
        options: {
          opensAppToForeground: false,
          isDestructive: false,
        },
      },
    ]);
  } catch (e) {
    // Category registration may fail in Expo Go — non-critical
    console.log('Notification category registration skipped:', e.message);
  }
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
 * Send a local notification about a single detected screenshot.
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
          count: 1,
        },
        sound: true,
        categoryIdentifier: SCREENSHOT_CATEGORY,
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

/**
 * Send a local notification about multiple detected screenshots.
 * Used when a background scan discovers several new images at once.
 * @param {number} count - Number of new screenshots found
 */
export const sendBatchScreenshotNotification = async (count) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📸 ${count} New Screenshots Found`,
        body: 'Organize Now',
        data: {
          type: 'screenshot_batch',
          count,
        },
        sound: true,
        categoryIdentifier: SCREENSHOT_CATEGORY,
        ...(Platform.OS === 'android' && {
          channelId: 'screenshot-detection',
        }),
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Failed to send batch notification:', error);
  }
};
