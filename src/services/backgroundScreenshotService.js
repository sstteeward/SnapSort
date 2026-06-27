// Background screenshot detection service for SnapSort
// Periodically checks the media library for new screenshots while the app is
// in the background, and sends a local notification if one is found.
//
// State is persisted in a JSON file (not SQLite) because background tasks
// run in a headless JS context where opening a DB may fail.

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { sendScreenshotNotification, sendBatchScreenshotNotification } from './notificationService';
import { NOTIFICATION_FREQUENCIES } from '../utils/constants';

const TASK_NAME = 'SNAPSORT_SCREENSHOT_CHECK';
const STATE_FILE = `${FileSystem.documentDirectory}screenshot_detector_state.json`;

// Default state shape
const DEFAULT_STATE = {
  lastAssetId: null,
  notifiedAssetIds: [],   // Track recently-notified IDs to prevent duplicates
  monitoringEnabled: true,
  frequency: NOTIFICATION_FREQUENCIES.FIFTEEN_MIN,
};

// Maximum notified IDs to keep (rolling window — prevents unbounded growth)
const MAX_NOTIFIED_IDS = 200;

// --- Persistent state (survives app restarts) ---

const readState = async () => {
  try {
    const info = await FileSystem.getInfoAsync(STATE_FILE);
    if (!info.exists) return { ...DEFAULT_STATE };
    const content = await FileSystem.readAsStringAsync(STATE_FILE);
    return { ...DEFAULT_STATE, ...JSON.parse(content) };
  } catch {
    return { ...DEFAULT_STATE };
  }
};

const writeState = async (state) => {
  try {
    // Trim notified list to prevent unbounded file growth
    const trimmed = {
      ...state,
      notifiedAssetIds: (state.notifiedAssetIds || []).slice(-MAX_NOTIFIED_IDS),
    };
    await FileSystem.writeAsStringAsync(STATE_FILE, JSON.stringify(trimmed));
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
  // Also add to notified set
  if (!state.notifiedAssetIds.includes(assetId)) {
    state.notifiedAssetIds.push(assetId);
  }
  await writeState(state);
};

/**
 * Get the last known asset ID.
 */
export const getLastKnownAssetId = async () => {
  const state = await readState();
  return state.lastAssetId;
};

/**
 * Update background monitoring settings and re-register the task.
 * Called from the Settings screen when the user changes preferences.
 */
export const updateBackgroundSettings = async ({ monitoringEnabled, frequency }) => {
  const state = await readState();

  if (monitoringEnabled !== undefined) {
    state.monitoringEnabled = monitoringEnabled;
  }
  if (frequency !== undefined) {
    state.frequency = frequency;
  }

  await writeState(state);

  // Re-register or unregister based on new settings
  if (state.monitoringEnabled) {
    // Unregister first, then re-register with new interval
    await unregisterBackgroundTask();
    await registerBackgroundTask(state.frequency);
  } else {
    await unregisterBackgroundTask();
  }
};

/**
 * Get current background settings (for UI display).
 */
export const getBackgroundSettings = async () => {
  const state = await readState();
  return {
    monitoringEnabled: state.monitoringEnabled,
    frequency: state.frequency,
  };
};

/**
 * Map frequency setting to a minimum interval in seconds.
 */
const frequencyToSeconds = (frequency) => {
  switch (frequency) {
    case NOTIFICATION_FREQUENCIES.THIRTY_MIN:
      return 30 * 60;
    case NOTIFICATION_FREQUENCIES.FIFTEEN_MIN:
      return 15 * 60;
    case NOTIFICATION_FREQUENCIES.IMMEDIATE:
    default:
      return 15 * 60; // OS enforces ≥15 min
  }
};

// --- Background task definition ---
// This MUST be called at module level (outside components) for TaskManager

try {
  TaskManager.defineTask(TASK_NAME, async () => {
    try {
      // Read settings — bail early if monitoring is disabled
      const state = await readState();
      if (!state.monitoringEnabled) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      // Check media library permission
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      // Determine the recency window based on frequency setting
      const recencyMs = frequencyToSeconds(state.frequency) * 1000 * 2; // 2× the interval

      // Build a Set of already-notified asset IDs for fast lookup
      const notifiedSet = new Set(state.notifiedAssetIds || []);

      const newAssets = [];

      // Strategy 1: Check the Screenshots album
      try {
        const screenshotsAlbum = await MediaLibrary.getAlbumAsync('Screenshots');
        if (screenshotsAlbum) {
          const { assets } = await MediaLibrary.getAssetsAsync({
            album: screenshotsAlbum,
            first: 10,
            sortBy: [MediaLibrary.SortBy.creationTime],
            mediaType: MediaLibrary.MediaType.photo,
          });

          for (const asset of assets) {
            if (notifiedSet.has(asset.id)) continue;
            const ageMs = Date.now() - asset.creationTime * 1000;
            if (ageMs < recencyMs) {
              newAssets.push(asset);
            }
          }
        }
      } catch (e) {
        // Screenshots album may not exist — fall through to recent photos
      }

      // Strategy 2: Check recent photos (catches screenshots not in an album)
      if (newAssets.length === 0) {
        const { assets } = await MediaLibrary.getAssetsAsync({
          first: 5,
          sortBy: [MediaLibrary.SortBy.creationTime],
          mediaType: MediaLibrary.MediaType.photo,
        });

        for (const asset of assets) {
          if (notifiedSet.has(asset.id)) continue;
          const ageMs = Date.now() - asset.creationTime * 1000;
          if (ageMs < recencyMs) {
            newAssets.push(asset);
          }
        }
      }

      if (newAssets.length === 0) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      // Send appropriate notification
      if (newAssets.length === 1) {
        const asset = newAssets[0];
        await sendScreenshotNotification({
          id: asset.id,
          filename: asset.filename,
          width: asset.width,
          height: asset.height,
        });
      } else {
        await sendBatchScreenshotNotification(newAssets.length);
      }

      // Update state — mark all new assets as notified
      const updatedNotifiedIds = [...(state.notifiedAssetIds || [])];
      for (const asset of newAssets) {
        if (!updatedNotifiedIds.includes(asset.id)) {
          updatedNotifiedIds.push(asset.id);
        }
      }
      state.notifiedAssetIds = updatedNotifiedIds;
      state.lastAssetId = newAssets[0].id;
      await writeState(state);

      return BackgroundFetch.BackgroundFetchResult.NewData;
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
 * @param {string} frequency — one of NOTIFICATION_FREQUENCIES values
 */
export const registerBackgroundTask = async (frequency) => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (isRegistered) {
      console.log('Background screenshot task already registered');
      return true;
    }

    const intervalSec = frequencyToSeconds(frequency || NOTIFICATION_FREQUENCIES.FIFTEEN_MIN);

    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: intervalSec,
      stopOnTerminate: false,   // Keep running after app is closed (Android)
      startOnBoot: true,        // Start after device reboot (Android)
    });

    console.log(`Background screenshot task registered (interval: ${intervalSec}s)`);
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
