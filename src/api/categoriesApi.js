/**
 * Categories API utilities
 */

import api from './client';

/**
 * Fetch categories from API
 * @returns {Promise<any>} Response data
 */
export async function fetchCategories() {
  try {
    const response = await api.get('/categories');
    return response;
  } catch (error) {
    // Re-throw to be handled by caller
    throw error;
  }
}
