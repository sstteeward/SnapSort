// Category suggestion utilities
// Future-ready structure for AI-based categorization

import { CATEGORIES } from './constants';

// Keyword-based category suggestions (simple heuristic)
const CATEGORY_KEYWORDS = {
  school: [
    'homework', 'assignment', 'class', 'lecture', 'exam', 'quiz',
    'study', 'student', 'grade', 'school', 'university', 'college',
    'professor', 'syllabus', 'textbook', 'course',
  ],
  work: [
    'meeting', 'email', 'slack', 'office', 'project', 'deadline',
    'report', 'presentation', 'client', 'work', 'task', 'memo',
    'schedule', 'calendar', 'teams', 'zoom',
  ],
  shopping: [
    'cart', 'buy', 'price', 'sale', 'discount', 'order',
    'shipping', 'delivery', 'shop', 'store', 'amazon', 'product',
    'wishlist', 'deal',
  ],
  receipts: [
    'receipt', 'payment', 'invoice', 'total', 'subtotal', 'tax',
    'transaction', 'paid', 'amount', 'billing', 'purchase',
  ],
  notes: [
    'note', 'memo', 'reminder', 'todo', 'list', 'idea',
    'thought', 'plan', 'draft',
  ],
  social_media: [
    'instagram', 'twitter', 'facebook', 'tiktok', 'snapchat',
    'reddit', 'youtube', 'post', 'story', 'reel', 'tweet',
    'chat', 'message', 'dm',
  ],
  personal: [
    'photo', 'selfie', 'family', 'friend', 'home', 'travel',
    'vacation', 'food', 'recipe', 'health', 'fitness',
  ],
};

/**
 * Suggests a category based on text content (title, notes, OCR text).
 * Returns the category id with the highest keyword match count.
 * Falls back to 'others' if no matches found.
 *
 * @param {string} text - The text to analyze
 * @returns {string} - Category ID
 */
export const suggestCategory = (text) => {
  if (!text || typeof text !== 'string') return 'others';

  const lowerText = text.toLowerCase();
  let bestMatch = { id: 'others', count: 0 };

  for (const [categoryId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matchCount = keywords.reduce((count, keyword) => {
      return count + (lowerText.includes(keyword) ? 1 : 0);
    }, 0);

    if (matchCount > bestMatch.count) {
      bestMatch = { id: categoryId, count: matchCount };
    }
  }

  return bestMatch.id;
};

/**
 * Gets the full category object by ID.
 * @param {string} categoryId
 * @returns {object|undefined}
 */
export const getCategoryById = (categoryId) => {
  return CATEGORIES.find((cat) => cat.id === categoryId);
};

/**
 * Gets all category IDs.
 * @returns {string[]}
 */
export const getAllCategoryIds = () => {
  return CATEGORIES.map((cat) => cat.id);
};
