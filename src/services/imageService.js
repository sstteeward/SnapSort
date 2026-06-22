// Image service for SnapSort
// Handles image picking, thumbnail generation, and file management

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { THUMBNAIL, MAX_IMPORT_BATCH } from '../utils/constants';

// Directory for storing thumbnails
const THUMBNAIL_DIR = `${FileSystem.documentDirectory}thumbnails/`;
const IMAGES_DIR = `${FileSystem.documentDirectory}images/`;

/**
 * Ensure storage directories exist.
 */
export const ensureDirectories = async () => {
  const thumbInfo = await FileSystem.getInfoAsync(THUMBNAIL_DIR);
  if (!thumbInfo.exists) {
    await FileSystem.makeDirectoryAsync(THUMBNAIL_DIR, { intermediates: true });
  }

  const imgInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!imgInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
};

/**
 * Pick images from the device gallery.
 * @returns {object[]} Array of selected image assets
 */
export const pickImages = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Gallery permission is required to import screenshots.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 1,
    selectionLimit: MAX_IMPORT_BATCH,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets || [];
};

/**
 * Generate a UUID for a screenshot.
 * @returns {string}
 */
export const generateId = async () => {
  const uuid = await Crypto.randomUUID();
  return uuid;
};

/**
 * Copy an image to the app's local storage.
 * @param {string} sourceUri - Original image URI
 * @param {string} id - Screenshot ID
 * @returns {string} New local URI
 */
export const saveImage = async (sourceUri, id) => {
  await ensureDirectories();
  const extension = getFileExtension(sourceUri) || 'jpg';
  const destUri = `${IMAGES_DIR}${id}.${extension}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destUri,
  });

  return destUri;
};

/**
 * Generate a compressed thumbnail for a screenshot.
 * @param {string} sourceUri - Original image URI
 * @param {string} id - Screenshot ID
 * @returns {string} Thumbnail URI
 */
export const generateThumbnail = async (sourceUri, id) => {
  await ensureDirectories();

  const manipulated = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: THUMBNAIL.WIDTH } }],
    {
      compress: THUMBNAIL.QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  const thumbUri = `${THUMBNAIL_DIR}${id}_thumb.jpg`;

  await FileSystem.moveAsync({
    from: manipulated.uri,
    to: thumbUri,
  });

  return thumbUri;
};

/**
 * Process a picked image: save copy, generate thumbnail, create metadata.
 * @param {object} asset - Image picker asset
 * @param {string} category - Category to assign
 * @returns {object} Screenshot metadata object
 */
export const processImage = async (asset, category = 'others') => {
  try {
    const id = await generateId();

    // Save a local copy of the image
    const localUri = await saveImage(asset.uri, id);

    // Generate thumbnail
    let thumbnailUri = '';
    try {
      thumbnailUri = await generateThumbnail(asset.uri, id);
    } catch (thumbError) {
      console.warn('Thumbnail generation failed, using original:', thumbError);
      thumbnailUri = localUri;
    }

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(localUri);

    // Generate a title from filename or date
    const title = generateTitle(asset.fileName || asset.uri);

    return {
      id,
      uri: localUri,
      thumbnailUri,
      title,
      category,
      notes: '',
      tags: '',
      isFavorite: false,
      width: asset.width || 0,
      height: asset.height || 0,
      fileSize: fileInfo.size || 0,
      assetId: asset.assetId || '',
      albumName: '',
    };
  } catch (error) {
    console.error('processImage failed:', error);
    throw error;
  }
};

/**
 * Process a gallery asset (from MediaLibrary scan, not ImagePicker).
 * Uses the asset's localUri from MediaLibrary.getAssetInfoAsync().
 * @param {object} assetInfo - { assetId, uri, width, height, filename, fileSize }
 * @param {string} category - Category to assign
 * @returns {object} Screenshot metadata object
 */
export const processGalleryAsset = async (assetInfo, category = 'others') => {
  try {
    const id = await generateId();
    const sourceUri = assetInfo.uri;

    // Save a local copy of the image
    const localUri = await saveImage(sourceUri, id);

    // Generate thumbnail
    let thumbnailUri = '';
    try {
      thumbnailUri = await generateThumbnail(sourceUri, id);
    } catch (thumbError) {
      console.warn('Thumbnail generation failed, using original:', thumbError);
      thumbnailUri = localUri;
    }

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(localUri);

    // Generate a title from filename or date
    const title = generateTitle(assetInfo.filename || sourceUri);

    return {
      id,
      uri: localUri,
      thumbnailUri,
      title,
      category,
      notes: '',
      tags: '',
      isFavorite: false,
      width: assetInfo.width || 0,
      height: assetInfo.height || 0,
      fileSize: fileInfo.size || assetInfo.fileSize || 0,
      assetId: assetInfo.assetId || '',
      albumName: '',
    };
  } catch (error) {
    console.error('processGalleryAsset failed:', error);
    throw error;
  }
};

/**
 * Process multiple images.
 * @param {object[]} assets - Image picker assets
 * @param {string} category - Category to assign
 * @param {function} onProgress - Progress callback (current, total)
 * @returns {object[]} Array of screenshot metadata objects
 */
export const processImages = async (assets, category = 'others', onProgress) => {
  const results = [];

  for (let i = 0; i < assets.length; i++) {
    const screenshot = await processImage(assets[i], category);
    results.push(screenshot);

    if (onProgress) {
      onProgress(i + 1, assets.length);
    }
  }

  return results;
};

/**
 * Delete a screenshot's files (image + thumbnail).
 * @param {string} id - Screenshot ID
 * @param {string} uri - Image URI
 * @param {string} thumbnailUri - Thumbnail URI
 */
export const deleteScreenshotFiles = async (uri, thumbnailUri) => {
  try {
    if (uri) {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri);
      }
    }
  } catch (e) {
    console.warn('Failed to delete image file:', e);
  }

  try {
    if (thumbnailUri) {
      const info = await FileSystem.getInfoAsync(thumbnailUri);
      if (info.exists) {
        await FileSystem.deleteAsync(thumbnailUri);
      }
    }
  } catch (e) {
    console.warn('Failed to delete thumbnail file:', e);
  }
};

/**
 * Delete all stored files (images + thumbnails).
 */
export const deleteAllFiles = async () => {
  try {
    const thumbInfo = await FileSystem.getInfoAsync(THUMBNAIL_DIR);
    if (thumbInfo.exists) {
      await FileSystem.deleteAsync(THUMBNAIL_DIR, { idempotent: true });
    }
    const imgInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (imgInfo.exists) {
      await FileSystem.deleteAsync(IMAGES_DIR, { idempotent: true });
    }
    // Recreate empty directories
    await ensureDirectories();
  } catch (e) {
    console.warn('Failed to delete all files:', e);
  }
};

/**
 * Get total storage used by the app.
 * @returns {number} Size in bytes
 */
export const getStorageUsage = async () => {
  let total = 0;

  try {
    const thumbInfo = await FileSystem.getInfoAsync(THUMBNAIL_DIR);
    if (thumbInfo.exists) {
      total += thumbInfo.size || 0;
    }

    const imgInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (imgInfo.exists) {
      total += imgInfo.size || 0;
    }
  } catch (e) {
    console.warn('Failed to get storage usage:', e);
  }

  return total;
};

/**
 * Format bytes into human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// --- Helpers ---

const getFileExtension = (uri) => {
  if (!uri) return 'jpg';
  const parts = uri.split('.');
  const ext = parts[parts.length - 1].toLowerCase().split('?')[0];
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
};

const generateTitle = (filenameOrUri) => {
  if (!filenameOrUri) {
    return `Screenshot ${new Date().toLocaleDateString()}`;
  }

  // Extract filename
  let name = filenameOrUri.split('/').pop().split('\\').pop();
  // Remove extension
  name = name.replace(/\.[^/.]+$/, '');
  // Clean up common patterns
  name = name.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();

  return name || `Screenshot ${new Date().toLocaleDateString()}`;
};
