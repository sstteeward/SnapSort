// Gallery Album Service for SnapSort
// Creates and manages real device gallery albums using expo-media-library.
// Each category maps to a "SnapSort - {CategoryName}" album visible in the native gallery app.

import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { CATEGORIES, ALBUM_PREFIX, STORAGE_MODES } from '../utils/constants';

// Cache album references to avoid repeated lookups
const albumCache = new Map();

/**
 * Get the album name for a category.
 * @param {string} categoryId
 * @returns {string} e.g. "SnapSort - School"
 */
export const getAlbumName = (categoryId) => {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  const name = category ? category.name : 'Others';
  return `${ALBUM_PREFIX}${name}`;
};

/**
 * Ensure a gallery album exists for the given category.
 * Creates it if it doesn't exist. Returns the album object.
 * @param {string} categoryId
 * @returns {object|null} MediaLibrary.Album
 */
export const ensureAlbum = async (categoryId) => {
  const albumName = getAlbumName(categoryId);

  // Check cache first
  if (albumCache.has(albumName)) {
    return albumCache.get(albumName);
  }

  try {
    // Try to find existing album
    let album = await MediaLibrary.getAlbumAsync(albumName);

    if (!album) {
      // We need at least one asset to create an album on iOS.
      // On Android we can create empty albums.
      // We'll create the album when the first asset is added (see addToAlbum).
      // For now, return null — album will be created on first use.
      return null;
    }

    albumCache.set(albumName, album);
    return album;
  } catch (error) {
    console.error(`Failed to ensure album "${albumName}":`, error);
    return null;
  }
};

/**
 * Add an asset to a category album (Copy Mode).
 * The original asset stays in its current location.
 * @param {string} assetId - MediaLibrary asset ID
 * @param {string} categoryId - Category to file under
 * @returns {object} { success, albumName, album }
 */
export const addToAlbum = async (assetId, categoryId) => {
  const albumName = getAlbumName(categoryId);

  try {
    const asset = await MediaLibrary.getAssetInfoAsync(assetId);
    if (!asset) {
      throw new Error(`Asset ${assetId} not found in media library`);
    }

    let album = await MediaLibrary.getAlbumAsync(albumName);

    if (!album) {
      // Create the album with this asset
      album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
      albumCache.set(albumName, album);
    } else {
      // Add asset to existing album (copy, don't move)
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }

    return { success: true, albumName, album };
  } catch (error) {
    console.error(`Failed to add asset to album "${albumName}":`, error);
    return { success: false, albumName, error: error.message };
  }
};

/**
 * Move an asset to a category album (Move Mode).
 * The original asset is removed from its current location after copying.
 * @param {string} assetId - MediaLibrary asset ID
 * @param {string} categoryId - Category to file under
 * @returns {object} { success, albumName }
 */
export const moveToAlbum = async (assetId, categoryId) => {
  const albumName = getAlbumName(categoryId);

  try {
    const asset = await MediaLibrary.getAssetInfoAsync(assetId);
    if (!asset) {
      throw new Error(`Asset ${assetId} not found in media library`);
    }

    let album = await MediaLibrary.getAlbumAsync(albumName);

    if (!album) {
      // Create album with this asset (this moves it on iOS)
      album = await MediaLibrary.createAlbumAsync(albumName, asset, true);
      albumCache.set(albumName, album);
    } else {
      // Add to album, then remove from original location
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, true);
    }

    return { success: true, albumName, album };
  } catch (error) {
    console.error(`Failed to move asset to album "${albumName}":`, error);
    // Fall back to copy mode if move fails
    console.log('Falling back to copy mode...');
    return addToAlbum(assetId, categoryId);
  }
};

/**
 * Categorize a screenshot into the appropriate album based on storage mode.
 * @param {string} assetId - MediaLibrary asset ID
 * @param {string} categoryId - Category to file under
 * @param {string} storageMode - 'copy' or 'move'
 * @returns {object} { success, albumName }
 */
export const categorizeScreenshot = async (assetId, categoryId, storageMode = STORAGE_MODES.COPY) => {
  if (storageMode === STORAGE_MODES.MOVE) {
    return moveToAlbum(assetId, categoryId);
  }
  return addToAlbum(assetId, categoryId);
};

/**
 * Get the asset count for a category album.
 * @param {string} categoryId
 * @returns {number}
 */
export const getAlbumAssetCount = async (categoryId) => {
  try {
    const albumName = getAlbumName(categoryId);
    const album = await MediaLibrary.getAlbumAsync(albumName);
    if (!album) return 0;
    return album.assetCount || 0;
  } catch (error) {
    console.warn(`Failed to get album count for ${categoryId}:`, error);
    return 0;
  }
};

/**
 * Get all SnapSort album counts.
 * @returns {object} Map of categoryId -> assetCount
 */
export const getAllAlbumCounts = async () => {
  const counts = {};
  for (const cat of CATEGORIES) {
    counts[cat.id] = await getAlbumAssetCount(cat.id);
  }
  return counts;
};

/**
 * Clear the album cache (useful after permission changes).
 */
export const clearAlbumCache = () => {
  albumCache.clear();
};

/**
 * Create an asset from a local file URI.
 * Used to create a MediaLibrary asset from app-local storage.
 * @param {string} localUri - File URI in app storage
 * @returns {object|null} MediaLibrary.Asset
 */
export const createAssetFromUri = async (localUri) => {
  try {
    const asset = await MediaLibrary.createAssetAsync(localUri);
    return asset;
  } catch (error) {
    console.error('Failed to create asset from URI:', error);
    return null;
  }
};
