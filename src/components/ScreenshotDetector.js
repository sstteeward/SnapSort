// ScreenshotDetector — Full screenshot detection system
// 1. Foreground: expo-screen-capture detects screenshots instantly
// 2. Background return: Checks for new photos when app returns to foreground
// 3. Background task: Periodic check + notification when app is closed
// 4. Notification tap: Opens category picker for the detected screenshot

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { addScreenshotListener } from 'expo-screen-capture';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';

import ScreenshotCategoryModal from './ScreenshotCategoryModal';
import useScreenshots from '../hooks/useScreenshots';
import {
  registerBackgroundTask,
  saveLastKnownAssetId,
  getLastKnownAssetId,
} from '../services/backgroundScreenshotService';
import {
  requestNotificationPermissions,
} from '../services/notificationService';

const ScreenshotDetector = () => {
  const { importScreenshots } = useScreenshots();
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
  // 1. FOREGROUND DETECTION (instant)
  // ==========================================
  const handleScreenshotDetected = useCallback(async () => {
    const now = Date.now();
    if (now - lastDetectionTime.current < 2000) return;

    await new Promise((resolve) => setTimeout(resolve, 500));

    const asset = await fetchLatestScreenshot();
    if (asset) {
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
  // 2. BACKGROUND RETURN DETECTION
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

        const asset = await fetchLatestScreenshot();
        if (asset && asset.id !== lastKnownAssetId.current) {
          const photoAgeMs = Date.now() - asset.creationTimeMs;
          if (photoAgeMs < 5 * 60 * 1000) {
            showDetection(asset);
          }
        }
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [fetchLatestScreenshot, showDetection]);

  // ==========================================
  // 3. NOTIFICATION TAP HANDLER
  // ==========================================
  useEffect(() => {
    // Handle notification taps (when user taps the notification)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data;
        if (data?.type === 'screenshot_detected' && data?.assetId) {
          // Fetch the specific asset from the notification
          const asset = await fetchAssetById(data.assetId);
          if (asset) {
            showDetection(asset);
          }
        }
      }
    );

    return () => subscription.remove();
  }, [fetchAssetById, showDetection]);

  // ==========================================
  // 4. INITIALIZE: permissions, background task, last known asset
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

      // Register the background task
      await registerBackgroundTask();
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
