// ScreenshotDetector — Full screenshot detection system
// 1. Foreground: expo-screen-capture detects screenshots instantly
// 2. Media library listener: fires instantly when a new photo is saved (works in background)
// 3. Background return: Checks for new photos when app returns to foreground
//    → iOS: Scans ALL uncategorized screenshots and shows batch banner
//    → Android: Checks latest photo (background task handles the rest)
// 4. Background task: Periodic check + notification when app process is killed
// 5. Notification tap & action buttons: Opens category picker or dismisses

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { addScreenshotListener } from 'expo-screen-capture';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';

import ScreenshotCategoryModal from './ScreenshotCategoryModal';
import useScreenshots from '../hooks/useScreenshots';
import {
  registerBackgroundTask,
  saveLastKnownAssetId,
  getLastKnownAssetId,
  getBackgroundSettings,
} from '../services/backgroundScreenshotService';
import {
  requestNotificationPermissions,
  sendScreenshotNotification,
  sendBatchScreenshotNotification,
} from '../services/notificationService';
import { getProcessedAssetIds } from '../services/storageService';

const ScreenshotDetector = () => {
  const { importScreenshots, scanGallery, backgroundMonitoringEnabled, notificationFrequency } = useScreenshots();
  const [modalVisible, setModalVisible] = useState(false);
  const [detectedAsset, setDetectedAsset] = useState(null);

  const lastDetectionTime = useRef(0);
  const lastKnownAssetId = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const permissionGranted = useRef(false);

  // --- Permissions ---
  const ensureMediaPermission = useCallback(async () => {
    if (permissionGranted.current) return true;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    permissionGranted.current = status === 'granted';
    return permissionGranted.current;
  }, []);

  // --- Fetch latest photo ---
  const fetchLatestScreenshot = useCallback(async () => {
    try {
      const hasPermission = await ensureMediaPermission();
      if (!hasPermission) return null;

      const { assets } = await MediaLibrary.getAssetsAsync({
        first: 1,
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: MediaLibrary.MediaType.photo,
      });

      if (assets.length > 0) {
        const latestAsset = assets[0];
        const assetInfo = await MediaLibrary.getAssetInfoAsync(latestAsset);

        return {
          id: latestAsset.id,
          uri: assetInfo.localUri || assetInfo.uri,
          width: latestAsset.width,
          height: latestAsset.height,
          filename: latestAsset.filename,
          creationTimeMs: latestAsset.creationTime * 1000,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch latest screenshot:', error);
      return null;
    }
  }, [ensureMediaPermission]);

  // --- Fetch a specific asset by ID (for notification taps) ---
  const fetchAssetById = useCallback(async (assetId) => {
    try {
      const hasPermission = await ensureMediaPermission();
      if (!hasPermission) return null;

      const asset = await MediaLibrary.getAssetInfoAsync(assetId);
      if (asset) {
        return {
          id: asset.id,
          uri: asset.localUri || asset.uri,
          width: asset.width,
          height: asset.height,
          filename: asset.filename,
          creationTimeMs: asset.creationTime * 1000,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch asset by ID:', error);
      // Fallback to latest screenshot
      return fetchLatestScreenshot();
    }
  }, [ensureMediaPermission, fetchLatestScreenshot]);

  // --- Show the modal ---
  const showDetection = useCallback((asset) => {
    lastDetectionTime.current = Date.now();
    lastKnownAssetId.current = asset.id;
    saveLastKnownAssetId(asset.id);
    setDetectedAsset(asset);
    setModalVisible(true);
  }, []);

  // ==========================================
  // 1. FOREGROUND DETECTION (instant via expo-screen-capture)
  // ==========================================
  const handleScreenshotDetected = useCallback(async () => {
    const now = Date.now();
    if (now - lastDetectionTime.current < 2000) return;

    await new Promise((resolve) => setTimeout(resolve, 500));

    const asset = await fetchLatestScreenshot();
    if (asset) {
      // Send visible notification banner instantly
      await sendScreenshotNotification(asset);
      showDetection(asset);
    }
  }, [fetchLatestScreenshot, showDetection]);

  useEffect(() => {
    try {
      const subscription = addScreenshotListener(handleScreenshotDetected);
      return () => subscription.remove();
    } catch (e) {
      console.warn('expo-screen-capture not available (expected in Expo Go):', e.message);
    }
  }, [handleScreenshotDetected]);

  // ==========================================
  // 2. MEDIA LIBRARY LISTENER (instant — works while app process is alive,
  //    even in the background, so users get notified without opening the app)
  // ==========================================
  useEffect(() => {
    const subscription = MediaLibrary.addListener(async (event) => {
      // Fires when photos are added/removed/modified
      if (!event.hasIncrementalChanges && !event.insertedAssets?.length) {
        // On Android, full-reload events fire too — check latest asset
      }

      const now = Date.now();
      if (now - lastDetectionTime.current < 2000) return;

      // Small delay to ensure the asset is fully written
      await new Promise((resolve) => setTimeout(resolve, 600));

      const asset = await fetchLatestScreenshot();
      if (!asset || asset.id === lastKnownAssetId.current) return;

      // Only care about very recent photos (within 60 seconds)
      const photoAgeMs = Date.now() - asset.creationTimeMs;
      if (photoAgeMs > 60 * 1000) return;

      // Always send the notification banner (visible even if app is backgrounded)
      await sendScreenshotNotification(asset);

      // Update tracking so we don't re-notify
      lastDetectionTime.current = Date.now();
      lastKnownAssetId.current = asset.id;
      await saveLastKnownAssetId(asset.id);

      // If the app is in the foreground, also show the category modal
      if (appStateRef.current === 'active') {
        setDetectedAsset(asset);
        setModalVisible(true);
      }
    });

    return () => subscription.remove();
  }, [fetchLatestScreenshot]);

  // ==========================================
  // 3. BACKGROUND RETURN DETECTION (catch-up when resuming)
  //    iOS: Full inbox scan for ALL uncategorized screenshots
  //    Android: Quick latest-photo check (background task covers the rest)
  // ==========================================
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      const wasInactive =
        appStateRef.current === 'background' || appStateRef.current === 'inactive';
      const isNowActive = nextAppState === 'active';

      if (wasInactive && isNowActive) {
        const now = Date.now();
        if (now - lastDetectionTime.current < 2000) {
          appStateRef.current = nextAppState;
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (Platform.OS === 'ios') {
          // --- iOS: Full resume scan ---
          // iOS cannot run true background tasks, so on resume we scan for
          // all uncategorized screenshots and show a batch notification.
          try {
            const processedIds = await getProcessedAssetIds();
            const screenshotsAlbum = await MediaLibrary.getAlbumAsync('Screenshots');

            let uncategorizedCount = 0;
            let latestNewAsset = null;

            // Check Screenshots album
            if (screenshotsAlbum) {
              const { assets } = await MediaLibrary.getAssetsAsync({
                album: screenshotsAlbum,
                first: 20,
                sortBy: [MediaLibrary.SortBy.creationTime],
                mediaType: MediaLibrary.MediaType.photo,
              });

              for (const asset of assets) {
                if (!processedIds.has(asset.id)) {
                  uncategorizedCount++;
                  if (!latestNewAsset) {
                    latestNewAsset = asset;
                  }
                }
              }
            }

            // Also check recent photos for screenshot-like images
            if (uncategorizedCount === 0) {
              const { assets } = await MediaLibrary.getAssetsAsync({
                first: 10,
                sortBy: [MediaLibrary.SortBy.creationTime],
                mediaType: MediaLibrary.MediaType.photo,
              });

              for (const asset of assets) {
                if (!processedIds.has(asset.id)) {
                  const ageMs = Date.now() - asset.creationTime * 1000;
                  if (ageMs < 30 * 60 * 1000) {
                    uncategorizedCount++;
                    if (!latestNewAsset) {
                      latestNewAsset = asset;
                    }
                  }
                }
              }
            }

            // Show notification for new screenshots
            if (uncategorizedCount > 0 && latestNewAsset) {
              if (uncategorizedCount === 1) {
                const info = await MediaLibrary.getAssetInfoAsync(latestNewAsset);
                const assetData = {
                  id: latestNewAsset.id,
                  uri: info.localUri || info.uri,
                  width: latestNewAsset.width,
                  height: latestNewAsset.height,
                  filename: latestNewAsset.filename,
                  creationTimeMs: latestNewAsset.creationTime * 1000,
                };
                await sendScreenshotNotification(assetData);
                showDetection(assetData);
              } else {
                await sendBatchScreenshotNotification(uncategorizedCount);
                // Also show the latest one in the modal
                const info = await MediaLibrary.getAssetInfoAsync(latestNewAsset);
                showDetection({
                  id: latestNewAsset.id,
                  uri: info.localUri || info.uri,
                  width: latestNewAsset.width,
                  height: latestNewAsset.height,
                  filename: latestNewAsset.filename,
                  creationTimeMs: latestNewAsset.creationTime * 1000,
                });
              }
            }
          } catch (e) {
            console.warn('iOS resume scan failed:', e);
          }
        } else {
          // --- Android: Quick latest-photo check ---
          const asset = await fetchLatestScreenshot();
          if (asset && asset.id !== lastKnownAssetId.current) {
            const photoAgeMs = Date.now() - asset.creationTimeMs;
            if (photoAgeMs < 5 * 60 * 1000) {
              // Send visible notification banner
              await sendScreenshotNotification(asset);
              showDetection(asset);
            }
          }
        }

        // Refresh the inbox with a gallery scan on both platforms
        try {
          scanGallery();
        } catch (e) {
          // Non-critical — inbox will update on next manual refresh
        }
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [fetchLatestScreenshot, showDetection, scanGallery]);

  // ==========================================
  // 4. NOTIFICATION TAP & ACTION BUTTON HANDLER
  // ==========================================
  useEffect(() => {
    // Handle notification taps and action button presses
    const subscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data;
        const actionId = response.actionIdentifier;

        // "Later" action — just dismiss, keep in inbox
        if (actionId === 'later') {
          return;
        }

        // "Categorize" action or default tap → open the categorization modal
        if (data?.type === 'screenshot_detected' && data?.assetId) {
          const asset = await fetchAssetById(data.assetId);
          if (asset) {
            showDetection(asset);
          }
        } else if (data?.type === 'screenshot_batch') {
          // Batch notification tap → trigger a gallery scan to populate inbox
          try {
            scanGallery();
          } catch (e) {
            // Non-critical
          }
          // Show the latest screenshot in the modal
          const asset = await fetchLatestScreenshot();
          if (asset) {
            showDetection(asset);
          }
        }
      }
    );

    return () => subscription.remove();
  }, [fetchAssetById, fetchLatestScreenshot, showDetection, scanGallery]);

  // ==========================================
  // 5. INITIALIZE: permissions, background task, last known asset
  // ==========================================
  useEffect(() => {
    const init = async () => {
      // Request permissions
      await ensureMediaPermission();
      await requestNotificationPermissions();

      // Record the current latest photo so we don't notify for old ones
      const asset = await fetchLatestScreenshot();
      if (asset) {
        lastKnownAssetId.current = asset.id;
        await saveLastKnownAssetId(asset.id);
      }

      // Register the background task (respects monitoring settings)
      try {
        const settings = await getBackgroundSettings();
        if (settings.monitoringEnabled) {
          await registerBackgroundTask(settings.frequency);
        }
      } catch (e) {
        // Fallback: register with defaults
        await registerBackgroundTask();
      }
    };

    init();
  }, [ensureMediaPermission, fetchLatestScreenshot]);

  // --- Import handler ---
  const handleImport = useCallback(
    async (asset, category) => {
      const imageAsset = {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileName: asset.filename,
      };

      await importScreenshots([imageAsset], category);
      setModalVisible(false);
      setDetectedAsset(null);
    },
    [importScreenshots]
  );

  const handleDismiss = useCallback(() => {
    setModalVisible(false);
    setDetectedAsset(null);
  }, []);

  return (
    <ScreenshotCategoryModal
      visible={modalVisible}
      screenshotAsset={detectedAsset}
      onImport={handleImport}
      onDismiss={handleDismiss}
    />
  );
};

export default ScreenshotDetector;
