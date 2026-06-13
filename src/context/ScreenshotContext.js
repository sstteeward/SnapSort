// Global state management for SnapSort
// Uses React Context + useReducer for predictable state updates

import React, { createContext, useReducer, useEffect, useCallback } from 'react';
import * as storageService from '../services/storageService';
import * as imageService from '../services/imageService';
import { CATEGORIES } from '../utils/constants';

// --- Initial State ---
const initialState = {
  screenshots: [],
  loading: true,
  searchQuery: '',
  darkMode: true, // Dark by default
  initialized: false,
};

// --- Action Types ---
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOAD_SCREENSHOTS: 'LOAD_SCREENSHOTS',
  ADD_SCREENSHOTS: 'ADD_SCREENSHOTS',
  UPDATE_SCREENSHOT: 'UPDATE_SCREENSHOT',
  DELETE_SCREENSHOT: 'DELETE_SCREENSHOT',
  CLEAR_ALL: 'CLEAR_ALL',
  SET_SEARCH: 'SET_SEARCH',
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE',
  SET_INITIALIZED: 'SET_INITIALIZED',
};

// --- Reducer ---
const screenshotReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

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
      return { ...state, screenshots: [] };

    case ACTIONS.SET_SEARCH:
      return { ...state, searchQuery: action.payload };

    case ACTIONS.TOGGLE_DARK_MODE:
      return { ...state, darkMode: !state.darkMode };

    case ACTIONS.SET_INITIALIZED:
      return { ...state, initialized: true };

    default:
      return state;
  }
};

// --- Context ---
export const ScreenshotContext = createContext();

// --- Provider ---
export const ScreenshotProvider = ({ children }) => {
  const [state, dispatch] = useReducer(screenshotReducer, initialState);

  // Initialize database and load screenshots on mount
  useEffect(() => {
    const init = async () => {
      try {
        await storageService.initDatabase();
        await imageService.ensureDirectories();
        const screenshots = await storageService.getScreenshots();
        dispatch({ type: ACTIONS.LOAD_SCREENSHOTS, payload: screenshots });
        dispatch({ type: ACTIONS.SET_INITIALIZED });
      } catch (error) {
        console.error('Failed to initialize:', error);
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    };
    init();
  }, []);

  // --- Action Creators ---

  const importScreenshots = useCallback(async (assets, category, onProgress) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });

      // Process images (save files, generate thumbnails)
      const processed = await imageService.processImages(assets, category, onProgress);

      // Save metadata to database
      const saved = await storageService.addScreenshots(processed);

      dispatch({ type: ACTIONS.ADD_SCREENSHOTS, payload: saved });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });

      return saved;
    } catch (error) {
      console.error('Failed to import screenshots:', error);
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      throw error;
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
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  }, []);

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

  const toggleDarkMode = useCallback(() => {
    dispatch({ type: ACTIONS.TOGGLE_DARK_MODE });
  }, []);

  const value = {
    ...state,
    importScreenshots,
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
