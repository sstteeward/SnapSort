// Background screenshot detection service for SnapSort
// Periodically checks the media library for new screenshots while the app is
// in the background, and sends a local notification if one is found.

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { sendScreenshotNotification } from './notificationService';

const TASK_NAME = 'SNAPSORT_SCREENSHOT_CHECK';
const STATE_FILE = `${FileSystem.documentDirectory}screenshot_detector_state.json`;

// --- Persistent state (survives app restarts) ---

const readState = async () => {
  try {
    const info = await FileSystem.getInfoAsync(STATE_FILE);
    if (!info.exists) return { lastAssetId: null };
    const content = await FileSystem.readAsStringAsync(STATE_FILE);
    return JSON.parse(content);
  } catch {
    return { lastAssetId: null };
  }
};

const writeState = async (state) => {
  try {
    await FileSystem.writeAsStringAsync(STATE_FILE, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to write detector state:', e);
  }
};

/**
 * Save the current latest asset ID so we don't re-notify for it.
 */
export const saveLastKnownAssetId = async (assetId) => {
  const state = await readState();
  state.lastAssetId = assetId;
  await writeState(state);
};

/**
 * Get the last known asset ID.
 */
export const getLastKnownAssetId = async () => {
  const state = await readState();
  return state.lastAssetId;
};

// --- Background task definition ---
// This MUST be called at module level (outside components) for TaskManager

try {
  TaskManager.defineTask(TASK_NAME, async () => {
    try {
      // Check media library permission
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      // Get the most recent photo
      const { assets } = await MediaLibrary.getAssetsAsync({
        first: 1,
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: MediaLibrary.MediaType.photo,
      });

      if (assets.length === 0) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      const latestAsset = assets[0];
      const state = await readState();

      // Is this a new photo we haven't seen?
      if (latestAsset.id !== state.lastAssetId) {
        // Check if the photo is recent (within the last 30 minutes)
        const photoAgeMs = Date.now() - latestAsset.creationTime * 1000;
        if (photoAgeMs < 30 * 60 * 1000) {
          // New screenshot found! Send notification
          await sendScreenshotNotification({
            id: latestAsset.id,
            filename: latestAsset.filename,
            width: latestAsset.width,
            height: latestAsset.height,
          });

          // Update state
          await saveLastKnownAssetId(latestAsset.id);

          return BackgroundFetch.BackgroundFetchResult.NewData;
        }
      }

      return BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (error) {
      console.error('Background screenshot check failed:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
} catch (e) {
  console.warn('Failed to define background task (expected in Expo Go):', e);
}

/**
 * Register the background fetch task with the OS.
 * The OS decides when to actually run it (minimum ~15 min on Android).
 */
export const registerBackgroundTask = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (isRegistered) {
      console.log('Background screenshot task already registered');
      return true;
    }

    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 15 * 60, // 15 minutes (OS may run it less frequently)
      stopOnTerminate: false,   // Keep running after app is closed (Android)
      startOnBoot: true,        // Start after device reboot (Android)
    });

    console.log('Background screenshot task registered successfully');
    return true;
  } catch (error) {
    // Background Fetch is not available in Expo Go — this is expected.
    // It will work in a development or production build with native modules.
    console.log('Background task not available (expected in Expo Go):', error.message);
    return false;
  }
};

/**
 * Unregister the background task.
 */
export const unregisterBackgroundTask = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
    }
  } catch (error) {
    console.error('Failed to unregister background task:', error);
  }
};

/**
 * Check if the background task is currently registered.
 */
export const isBackgroundTaskRegistered = async () => {
  return TaskManager.isTaskRegisteredAsync(TASK_NAME);
};
