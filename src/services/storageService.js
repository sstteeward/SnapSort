// SQLite storage service for SnapSort
// Handles all database operations for screenshot metadata

import * as SQLite from 'expo-sqlite';

let db = null;

/**
 * Initialize the SQLite database and create tables.
 */
export const initDatabase = async () => {
  db = await SQLite.openDatabaseAsync('snapsort.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS screenshots (
      id TEXT PRIMARY KEY NOT NULL,
      uri TEXT NOT NULL,
      thumbnailUri TEXT,
      title TEXT DEFAULT '',
      category TEXT DEFAULT 'others',
      notes TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      isFavorite INTEGER DEFAULT 0,
      width INTEGER DEFAULT 0,
      height INTEGER DEFAULT 0,
      fileSize INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_category ON screenshots(category);
    CREATE INDEX IF NOT EXISTS idx_favorite ON screenshots(isFavorite);
    CREATE INDEX IF NOT EXISTS idx_created ON screenshots(createdAt);
  `);

  return db;
};

/**
 * Get the database instance, initializing if needed.
 */
const getDb = async () => {
  if (!db) {
    await initDatabase();
  }
  return db;
};

/**
 * Add a new screenshot to the database.
 * @param {object} screenshot
 * @returns {object} The inserted screenshot
 */
export const addScreenshot = async (screenshot) => {
  const database = await getDb();
  const now = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO screenshots (id, uri, thumbnailUri, title, category, notes, tags, isFavorite, width, height, fileSize, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      screenshot.id,
      screenshot.uri,
      screenshot.thumbnailUri || '',
      screenshot.title || '',
      screenshot.category || 'others',
      screenshot.notes || '',
      screenshot.tags || '',
      screenshot.isFavorite ? 1 : 0,
      screenshot.width || 0,
      screenshot.height || 0,
      screenshot.fileSize || 0,
      now,
      now,
    ]
  );

  return { ...screenshot, createdAt: now, updatedAt: now };
};

/**
 * Add multiple screenshots in a single transaction.
 * @param {object[]} screenshots
 * @returns {object[]} The inserted screenshots
 */
export const addScreenshots = async (screenshots) => {
  const database = await getDb();
  const now = new Date().toISOString();
  const results = [];

  await database.withTransactionAsync(async () => {
    for (const screenshot of screenshots) {
      await database.runAsync(
        `INSERT INTO screenshots (id, uri, thumbnailUri, title, category, notes, tags, isFavorite, width, height, fileSize, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          screenshot.id,
          screenshot.uri,
          screenshot.thumbnailUri || '',
          screenshot.title || '',
          screenshot.category || 'others',
          screenshot.notes || '',
          screenshot.tags || '',
          screenshot.isFavorite ? 1 : 0,
          screenshot.width || 0,
          screenshot.height || 0,
          screenshot.fileSize || 0,
          now,
          now,
        ]
      );
      results.push({ ...screenshot, createdAt: now, updatedAt: now });
    }
  });

  return results;
};

/**
 * Get all screenshots, sorted by creation date (newest first).
 * @returns {object[]}
 */
export const getScreenshots = async () => {
  const database = await getDb();
  const rows = await database.getAllAsync(
    'SELECT * FROM screenshots ORDER BY createdAt DESC'
  );
  return rows.map(parseRow);
};

/**
 * Get a single screenshot by ID.
 * @param {string} id
 * @returns {object|null}
 */
export const getScreenshotById = async (id) => {
  const database = await getDb();
  const row = await database.getFirstAsync(
    'SELECT * FROM screenshots WHERE id = ?',
    [id]
  );
  return row ? parseRow(row) : null;
};

/**
 * Get screenshots by category.
 * @param {string} category
 * @returns {object[]}
 */
export const getByCategory = async (category) => {
  const database = await getDb();
  const rows = await database.getAllAsync(
    'SELECT * FROM screenshots WHERE category = ? ORDER BY createdAt DESC',
    [category]
  );
  return rows.map(parseRow);
};

/**
 * Get favorite screenshots.
 * @returns {object[]}
 */
export const getFavorites = async () => {
  const database = await getDb();
  const rows = await database.getAllAsync(
    'SELECT * FROM screenshots WHERE isFavorite = 1 ORDER BY createdAt DESC'
  );
  return rows.map(parseRow);
};

/**
 * Get recent screenshots (last N).
 * @param {number} limit
 * @returns {object[]}
 */
export const getRecent = async (limit = 10) => {
  const database = await getDb();
  const rows = await database.getAllAsync(
    'SELECT * FROM screenshots ORDER BY createdAt DESC LIMIT ?',
    [limit]
  );
  return rows.map(parseRow);
};

/**
 * Search screenshots by title, notes, tags, or category.
 * @param {string} query
 * @returns {object[]}
 */
export const searchScreenshots = async (query) => {
  const database = await getDb();
  const searchTerm = `%${query}%`;
  const rows = await database.getAllAsync(
    `SELECT * FROM screenshots
     WHERE title LIKE ? OR notes LIKE ? OR tags LIKE ? OR category LIKE ?
     ORDER BY createdAt DESC`,
    [searchTerm, searchTerm, searchTerm, searchTerm]
  );
  return rows.map(parseRow);
};

/**
 * Update a screenshot.
 * @param {string} id
 * @param {object} updates - Fields to update
 * @returns {object|null}
 */
export const updateScreenshot = async (id, updates) => {
  const database = await getDb();
  const now = new Date().toISOString();

  const fields = [];
  const values = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    values.push(updates.category);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }
  if (updates.tags !== undefined) {
    fields.push('tags = ?');
    values.push(updates.tags);
  }
  if (updates.isFavorite !== undefined) {
    fields.push('isFavorite = ?');
    values.push(updates.isFavorite ? 1 : 0);
  }

  if (fields.length === 0) return null;

  fields.push('updatedAt = ?');
  values.push(now);
  values.push(id);

  await database.runAsync(
    `UPDATE screenshots SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return getScreenshotById(id);
};

/**
 * Delete a screenshot by ID.
 * @param {string} id
 */
export const deleteScreenshot = async (id) => {
  const database = await getDb();
  await database.runAsync('DELETE FROM screenshots WHERE id = ?', [id]);
};

/**
 * Delete all screenshots.
 */
export const deleteAllScreenshots = async () => {
  const database = await getDb();
  await database.runAsync('DELETE FROM screenshots');
};

/**
 * Get category counts.
 * @returns {object} Map of category -> count
 */
export const getCategoryCounts = async () => {
  const database = await getDb();
  const rows = await database.getAllAsync(
    'SELECT category, COUNT(*) as count FROM screenshots GROUP BY category'
  );
  const counts = {};
  rows.forEach((row) => {
    counts[row.category] = row.count;
  });
  return counts;
};

/**
 * Get total screenshot count.
 * @returns {number}
 */
export const getTotalCount = async () => {
  const database = await getDb();
  const result = await database.getFirstAsync(
    'SELECT COUNT(*) as total FROM screenshots'
  );
  return result ? result.total : 0;
};

/**
 * Parse a database row into a screenshot object.
 * Converts isFavorite from integer to boolean.
 */
const parseRow = (row) => ({
  ...row,
  isFavorite: row.isFavorite === 1,
});
