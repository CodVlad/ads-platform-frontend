/**
 * Build share URL for an ad
 * @param {string} adId - The ad ID
 * @returns {string} Share URL
 */
export const buildAdShareUrl = (adId) => {
  if (!adId) {
    return '';
  }

  // Get API base URL from environment
  const apiUrl = import.meta.env.VITE_API_URL || '';
  
  // Clean the API URL (remove trailing slashes and /api if present)
  // Share endpoint is at root level, not under /api
  let cleanApiUrl = apiUrl.replace(/\/+$/, '');
  if (cleanApiUrl.endsWith('/api')) {
    cleanApiUrl = cleanApiUrl.slice(0, -4);
  }
  
  // Build share URL: ${API_BASE}/share/ads/${adId}
  return `${cleanApiUrl}/share/ads/${adId}`;
};

