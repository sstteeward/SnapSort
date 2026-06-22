// Global state management for SnapSort
// Uses React Context + useReducer for predictable state updates
// Includes gallery integration: inbox, scanning, album management, storage modes

import React, { createContext, useReducer, useEffect, useCallback } from 'react';
import * as storageService from '../services/storageService';
import * as imageService from '../services/imageService';
import * as galleryScannerService from '../services/galleryScannerService';
import * as galleryAlbumService from '../services/galleryAlbumService';
import { CATEGORIES, STORAGE_MODES } from '../utils/constants';

// --- Initial State ---
const initialState = {
  screenshots: [],
  inboxScreenshots: [], // Unprocessed gallery screenshots
  loading: true,
  scanning: false, // Gallery scan in progress
  searchQuery: '',
  darkMode: true,
  storageMode: STORAGE_MODES.COPY,
  initialized: false,
};

// --- Action Types ---
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_SCANNING: 'SET_SCANNING',
  LOAD_SCREENSHOTS: 'LOAD_SCREENSHOTS',
  ADD_SCREENSHOTS: 'ADD_SCREENSHOTS',
  UPDATE_SCREENSHOT: 'UPDATE_SCREENSHOT',
  DELETE_SCREENSHOT: 'DELETE_SCREENSHOT',
  CLEAR_ALL: 'CLEAR_ALL',
  SET_SEARCH: 'SET_SEARCH',
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE',
  SET_INITIALIZED: 'SET_INITIALIZED',
  SET_INBOX: 'SET_INBOX',
  REMOVE_FROM_INBOX: 'REMOVE_FROM_INBOX',
  SET_STORAGE_MODE: 'SET_STORAGE_MODE',
};

// --- Reducer ---
const screenshotReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_SCANNING:
      return { ...state, scanning: action.payload };

    case ACTIONS.LOAD_SCREENSHOTS:
      return { ...state, screenshots: action.payload, loading: false };

    case ACTIONS.ADD_SCREENSHOTS:
      return {
        ...state,
        screenshots: [...action.payload, ...state.screenshots],
      };

    case ACTIONS.UPDATE_SCREENSHOT:
      return {
        ...state,
        screenshots: state.screenshots.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };

    case ACTIONS.DELETE_SCREENSHOT:
      return {
        ...state,
        screenshots: state.screenshots.filter((s) => s.id !== action.payload),
      };

    case ACTIONS.CLEAR_ALL:
      return { ...state, screenshots: [], inboxScreenshots: [] };

    case ACTIONS.SET_SEARCH:
      return { ...state, searchQuery: action.payload };

    case ACTIONS.TOGGLE_DARK_MODE:
      return { ...state, darkMode: !state.darkMode };

    case ACTIONS.SET_INITIALIZED:
      return { ...state, initialized: true };

    case ACTIONS.SET_INBOX:
      return { ...state, inboxScreenshots: action.payload };

    case ACTIONS.REMOVE_FROM_INBOX:
      return {
        ...state,
        inboxScreenshots: state.inboxScreenshots.filter(
          (s) => s.assetId !== action.payload
        ),
      };

    case ACTIONS.SET_STORAGE_MODE:
      return { ...state, storageMode: action.payload };

    default:
      return state;
  }
};

// --- Context ---
export const ScreenshotContext = createContext();

// --- Provider ---
export const ScreenshotProvider = ({ children }) => {
  const [state, dispatch] = useReducer(screenshotReducer, initialState);

  // Initialize database, load screenshots, load settings
  useEffect(() => {
    const init = async () => {
      try {
        await storageService.initDatabase();
        await imageService.ensureDirectories();

        const screenshots = await storageService.getScreenshots();
        dispatch({ type: ACTIONS.LOAD_SCREENSHOTS, payload: screenshots });

        // Load storage mode setting
        const mode = await storageService.getSetting('storageMode', STORAGE_MODES.COPY);
        dispatch({ type: ACTIONS.SET_STORAGE_MODE, payload: mode });

        // Load dark mode setting
        const darkModeSetting = await storageService.getSetting('darkMode', 'true');
        if (darkModeSetting === 'false') {
          dispatch({ type: ACTIONS.TOGGLE_DARK_MODE });
        }

        dispatch({ type: ACTIONS.SET_INITIALIZED });
      } catch (error) {
        console.error('Failed to initialize:', error);
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        dispatch({ type: ACTIONS.SET_INITIALIZED });
      }
    };
    init();
  }, []);

  // --- Action Creators ---

  /**
   * Import screenshots from ImagePicker and optionally create album entries.
   */
  const importScreenshots = useCallback(async (assets, category, onProgress) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });

      // Process images (save files, generate thumbnails)
      const processed = await imageService.processImages(assets, category, onProgress);

      // Save metadata to database
      const saved = await storageService.addScreenshots(processed);

      dispatch({ type: ACTIONS.ADD_SCREENSHOTS, payload: saved });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });

      // Try to create album entries for each imported screenshot
      // (best-effort — don't fail the import if album creation fails)
      for (const screenshot of saved) {
        if (screenshot.assetId) {
          try {
            const result = await galleryAlbumService.categorizeScreenshot(
              screenshot.assetId,
              category,
              state.storageMode
            );
            if (result.success) {
              await storageService.updateScreenshot(screenshot.id, {
                albumName: result.albumName,
              });
            }
          } catch (e) {
            console.warn('Album creation failed for', screenshot.id, e);
          }
        }
      }

      return saved;
    } catch (error) {
      console.error('Failed to import screenshots:', error);
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      throw error;
    }
  }, [state.storageMode]);

  /**
   * Scan the device gallery for new screenshots and populate the inbox.
   */
  const scanGallery = useCallback(async () => {
    // Don't scan before DB is initialized
    if (!state.initialized) return [];

    try {
      dispatch({ type: ACTIONS.SET_SCANNING, payload: true });

      const processedIds = await storageService.getProcessedAssetIds();
      const results = await galleryScannerService.scanForScreenshots(processedIds);

      dispatch({ type: ACTIONS.SET_INBOX, payload: results });
      dispatch({ type: ACTIONS.SET_SCANNING, payload: false });

      return results;
    } catch (error) {
      console.error('Gallery scan failed:', error);
      dispatch({ type: ACTIONS.SET_SCANNING, payload: false });
      return [];
    }
  }, [state.initialized]);

  /**
   * Categorize a screenshot from the inbox:
   * 1. Get full asset info
   * 2. Process and save locally
   * 3. Create album entry
   * 4. Mark as processed
   * 5. Remove from inbox
   */
  const categorizeFromInbox = useCallback(async (assetId, categoryId) => {
    try {
      // Get full asset info (including local URI)
      const assetInfo = await galleryScannerService.getAssetInfo(assetId);
      if (!assetInfo) {
        throw new Error('Could not retrieve asset info');
      }

      // Process the image (save copy, thumbnail, metadata)
      const processed = await imageService.processGalleryAsset(assetInfo, categoryId);

      // Save to database
      const saved = await storageService.addScreenshot(processed);
      dispatch({ type: ACTIONS.ADD_SCREENSHOTS, payload: [saved] });

      // Create album entry
      try {
        const albumResult = await galleryAlbumService.categorizeScreenshot(
          assetId,
          categoryId,
          state.storageMode
        );
        if (albumResult.success) {
          await storageService.updateScreenshot(saved.id, {
            albumName: albumResult.albumName,
          });
        }
      } catch (e) {
        console.warn('Album creation failed:', e);
      }

      // Mark as processed and remove from inbox
      await storageService.addProcessedAsset(assetId);
      dispatch({ type: ACTIONS.REMOVE_FROM_INBOX, payload: assetId });

      return saved;
    } catch (error) {
      console.error('Failed to categorize from inbox:', error);
      throw error;
    }
  }, [state.storageMode]);

  /**
   * Dismiss a screenshot from the inbox without importing.
   * Marks it as processed so it won't appear again.
   */
  const dismissFromInbox = useCallback(async (assetId) => {
    try {
      await storageService.addProcessedAsset(assetId);
      dispatch({ type: ACTIONS.REMOVE_FROM_INBOX, payload: assetId });
    } catch (error) {
      console.error('Failed to dismiss from inbox:', error);
    }
  }, []);

  /**
   * Dismiss all inbox screenshots at once.
   */
  const dismissAllFromInbox = useCallback(async () => {
    try {
      const assetIds = state.inboxScreenshots.map((s) => s.assetId);
      await storageService.addProcessedAssets(assetIds);
      dispatch({ type: ACTIONS.SET_INBOX, payload: [] });
    } catch (error) {
      console.error('Failed to dismiss all from inbox:', error);
    }
  }, [state.inboxScreenshots]);

  /**
   * Update the storage mode (copy/move).
   */
  const setStorageMode = useCallback(async (mode) => {
    try {
      await storageService.setSetting('storageMode', mode);
      dispatch({ type: ACTIONS.SET_STORAGE_MODE, payload: mode });
    } catch (error) {
      console.error('Failed to set storage mode:', error);
    }
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    try {
      const screenshot = state.screenshots.find((s) => s.id === id);
      if (!screenshot) return;

      const updated = await storageService.updateScreenshot(id, {
        isFavorite: !screenshot.isFavorite,
      });

      if (updated) {
        dispatch({ type: ACTIONS.UPDATE_SCREENSHOT, payload: updated });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [state.screenshots]);

  const updateCategory = useCallback(async (id, category) => {
    try {
      const updated = await storageService.updateScreenshot(id, { category });
      if (updated) {
        dispatch({ type: ACTIONS.UPDATE_SCREENSHOT, payload: updated });

        // Also update album if asset has an assetId
        if (updated.assetId) {
          try {
            const albumResult = await galleryAlbumService.categorizeScreenshot(
              updated.assetId,
              category,
              state.storageMode
            );
            if (albumResult.success) {
              await storageService.updateScreenshot(id, {
                albumName: albumResult.albumName,
              });
            }
          } catch (e) {
            console.warn('Album update failed:', e);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  }, [state.storageMode]);

  const updateNotes = useCallback(async (id, notes) => {
    try {
      const updated = await storageService.updateScreenshot(id, { notes });
      if (updated) {
        dispatch({ type: ACTIONS.UPDATE_SCREENSHOT, payload: updated });
      }
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  }, []);

  const updateTitle = useCallback(async (id, title) => {
    try {
      const updated = await storageService.updateScreenshot(id, { title });
      if (updated) {
        dispatch({ type: ACTIONS.UPDATE_SCREENSHOT, payload: updated });
      }
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  }, []);

  const removeScreenshot = useCallback(async (id) => {
    try {
      const screenshot = state.screenshots.find((s) => s.id === id);
      if (!screenshot) return;

      // Delete files
      await imageService.deleteScreenshotFiles(screenshot.uri, screenshot.thumbnailUri);
      // Delete from database
      await storageService.deleteScreenshot(id);

      dispatch({ type: ACTIONS.DELETE_SCREENSHOT, payload: id });
    } catch (error) {
      console.error('Failed to delete screenshot:', error);
    }
  }, [state.screenshots]);

  const clearAll = useCallback(async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      await storageService.deleteAllScreenshots();
      await imageService.deleteAllFiles();
      await storageService.clearProcessedAssets();
      dispatch({ type: ACTIONS.CLEAR_ALL });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    } catch (error) {
      console.error('Failed to clear all data:', error);
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  const setSearchQuery = useCallback((query) => {
    dispatch({ type: ACTIONS.SET_SEARCH, payload: query });
  }, []);

  const toggleDarkMode = useCallback(async () => {
    const newValue = !state.darkMode;
    dispatch({ type: ACTIONS.TOGGLE_DARK_MODE });
    try {
      await storageService.setSetting('darkMode', String(newValue));
    } catch (e) {
      console.warn('Failed to persist dark mode setting:', e);
    }
  }, [state.darkMode]);

  const value = {
    ...state,
    importScreenshots,
    scanGallery,
    categorizeFromInbox,
    dismissFromInbox,
    dismissAllFromInbox,
    setStorageMode,
    toggleFavorite,
    updateCategory,
    updateNotes,
    updateTitle,
    removeScreenshot,
    clearAll,
    setSearchQuery,
    toggleDarkMode,
  };

  return (
    <ScreenshotContext.Provider value={value}>
      {children}
    </ScreenshotContext.Provider>
  );
};
