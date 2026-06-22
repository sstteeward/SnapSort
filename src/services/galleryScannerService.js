// Gallery Scanner Service for SnapSort
// Scans the device media library for screenshots, filters them from regular photos,
// and returns unprocessed items for the inbox.

import * as MediaLibrary from 'expo-media-library';
import { Dimensions, Platform } from 'react-native';
import { SCREENSHOT_SCAN_LIMIT } from '../utils/constants';

// Common screenshot filename patterns
const SCREENSHOT_PATTERNS = /screenshot|screen.?shot|screen.?cap|screen.?record|snap|capture|img_\d{8}|scr_/i;

// Screen dimensions for aspect ratio matching
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('screen');
const SCREEN_RATIO = SCREEN_H / SCREEN_W;

// Common phone screen aspect ratios (portrait)
const PHONE_RATIOS = [
  16 / 9,    // 1.78 — classic 16:9
  18 / 9,    // 2.0  — 18:9
  18.5 / 9,  // 2.06 — Samsung
  19 / 9,    // 2.11
  19.5 / 9,  // 2.17 — iPhone X+
  20 / 9,    // 2.22 — tall phones
  21 / 9,    // 2.33 — ultra-tall
  SCREEN_RATIO, // Current device ratio
];

/**
 * Check if an image's aspect ratio matches common phone screen ratios.
 * @param {number} width
 * @param {number} height
 * @returns {boolean}
 */
const isScreenshotAspectRatio = (width, height) => {
  if (!width || !height) return false;

  // Ensure portrait orientation for comparison
  const w = Math.min(width, height);
  const h = Math.max(width, height);
  const ratio = h / w;

  // Check if the ratio is close to any known phone ratio (±5% tolerance)
  return PHONE_RATIOS.some((phoneRatio) => {
    return Math.abs(ratio - phoneRatio) / phoneRatio < 0.05;
  });
};

/**
 * Check if a filename looks like a screenshot.
 * @param {string} filename
 * @returns {boolean}
 */
const isScreenshotFilename = (filename) => {
  if (!filename) return false;
  return SCREENSHOT_PATTERNS.test(filename);
};

/**
 * Score how likely an asset is a screenshot (0-3).
 * Higher score = more confident.
 * @param {object} asset - MediaLibrary asset
 * @returns {number}
 */
const screenshotScore = (asset) => {
  let score = 0;
  if (isScreenshotFilename(asset.filename)) score += 2;
  if (isScreenshotAspectRatio(asset.width, asset.height)) score += 1;
  return score;
};

/**
 * Scan the device media library for screenshots.
 * First checks the "Screenshots" album, then falls back to recent photos.
 * @param {Set<string>} processedIds - Set of already-processed asset IDs
 * @param {number} limit - Max results to return
 * @returns {object[]} Array of screenshot-like assets
 */
export const scanForScreenshots = async (processedIds = new Set(), limit = SCREENSHOT_SCAN_LIMIT) => {
  try {
    // Check permission
    const { status } = await MediaLibrary.getPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Media library permission not granted');
      return [];
    }

    const candidates = [];

    // Strategy 1: Check the "Screenshots" album directly
    const screenshotsAlbum = await MediaLibrary.getAlbumAsync('Screenshots');
    if (screenshotsAlbum) {
      const albumAssets = await MediaLibrary.getAssetsAsync({
        album: screenshotsAlbum,
        first: limit * 2, // Fetch extra to account for processed ones
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: MediaLibrary.MediaType.photo,
      });

      for (const asset of albumAssets.assets) {
        if (!processedIds.has(asset.id)) {
          candidates.push({ asset, source: 'album' });
          if (candidates.length >= limit) break;
        }
      }
    }

    // Strategy 2: Scan recent photos and filter by heuristics
    if (candidates.length < limit) {
      const recentAssets = await MediaLibrary.getAssetsAsync({
        first: limit * 3, // Fetch extra to compensate for filtering
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: MediaLibrary.MediaType.photo,
      });

      for (const asset of recentAssets.assets) {
        // Skip already processed or already found
        if (processedIds.has(asset.id)) continue;
        if (candidates.some((c) => c.asset.id === asset.id)) continue;

        const score = screenshotScore(asset);
        if (score >= 1) {
          candidates.push({ asset, source: 'heuristic' });
          if (candidates.length >= limit) break;
        }
      }
    }

    // Resolve localUri for each candidate (converts ph:// to file://)
    const results = await resolveLocalUris(candidates);
    return results;
  } catch (error) {
    console.error('Gallery scan failed:', error);
    return [];
  }
};

/**
 * Batch-resolve ph:// URIs to file:// localUris for display.
 * Falls back to the original URI if resolution fails.
 */
const resolveLocalUris = async (candidates) => {
  const results = [];
  for (const { asset, source } of candidates) {
    try {
      const info = await MediaLibrary.getAssetInfoAsync(asset);
      results.push({
        assetId: asset.id,
        uri: info.localUri || info.uri || asset.uri,
        width: asset.width,
        height: asset.height,
        filename: asset.filename,
        createdAt: new Date(asset.creationTime * 1000).toISOString(),
        source,
      });
    } catch (e) {
      // Fallback — use original URI even if it's ph://
      results.push(formatAssetSync(asset, source));
    }
  }
  return results;
};

/**
 * Get unprocessed screenshots with pagination support.
 * @param {Set<string>} processedIds - Set of already-processed asset IDs
 * @param {number} limit - Page size
 * @param {string} after - Cursor for pagination (endCursor from previous page)
 * @returns {object} { screenshots, hasNextPage, endCursor }
 */
export const getUnprocessedScreenshots = async (processedIds = new Set(), limit = 20, after = undefined) => {
  try {
    const { status } = await MediaLibrary.getPermissionsAsync();
    if (status !== 'granted') {
      return { screenshots: [], hasNextPage: false, endCursor: null };
    }

    // Start with Screenshots album
    const screenshotsAlbum = await MediaLibrary.getAlbumAsync('Screenshots');
    const fetchOptions = {
      first: limit * 2,
      sortBy: [MediaLibrary.SortBy.creationTime],
      mediaType: MediaLibrary.MediaType.photo,
      ...(after ? { after } : {}),
      ...(screenshotsAlbum ? { album: screenshotsAlbum } : {}),
    };

    const result = await MediaLibrary.getAssetsAsync(fetchOptions);
    const candidates = [];

    for (const asset of result.assets) {
      if (processedIds.has(asset.id)) continue;

      // If from Screenshots album, include directly; otherwise score it
      if (screenshotsAlbum || screenshotScore(asset) >= 1) {
        candidates.push({ asset, source: screenshotsAlbum ? 'album' : 'heuristic' });
        if (candidates.length >= limit) break;
      }
    }

    const screenshots = await resolveLocalUris(candidates);

    return {
      screenshots,
      hasNextPage: result.hasNextPage,
      endCursor: result.endCursor,
    };
  } catch (error) {
    console.error('Failed to get unprocessed screenshots:', error);
    return { screenshots: [], hasNextPage: false, endCursor: null };
  }
};

/**
 * Get full asset info (including local URI) for a media library asset.
 * @param {string} assetId
 * @returns {object|null}
 */
export const getAssetInfo = async (assetId) => {
  try {
    const asset = await MediaLibrary.getAssetInfoAsync(assetId);
    if (!asset) return null;

    return {
      assetId: asset.id,
      uri: asset.localUri || asset.uri,
      width: asset.width,
      height: asset.height,
      filename: asset.filename,
      createdAt: new Date(asset.creationTime * 1000).toISOString(),
      fileSize: asset.fileSize || 0,
    };
  } catch (error) {
    console.error('Failed to get asset info:', error);
    return null;
  }
};

/**
 * Format a MediaLibrary asset into a consistent shape (sync fallback).
 * @param {object} asset
 * @param {string} source - 'album' or 'heuristic'
 * @returns {object}
 */
const formatAssetSync = (asset, source = 'unknown') => ({
  assetId: asset.id,
  uri: asset.uri,
  width: asset.width,
  height: asset.height,
  filename: asset.filename,
  createdAt: new Date(asset.creationTime * 1000).toISOString(),
  source,
});

