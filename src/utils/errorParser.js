/**
 * Parse error from API response
 * @param {Error} err - Axios error object
 * @returns {string} - User-friendly error message
 */
export const parseError = (err) => {
  const backend = err?.response?.data;
  
  // If backend returns {details.errors[]} show first error message or join them
  if (backend?.details?.errors && Array.isArray(backend.details.errors) && backend.details.errors.length > 0) {
    if (backend.details.errors.length === 1) {
      return backend.details.errors[0].message || backend.details.errors[0].field + ': ' + (backend.details.errors[0].message || 'Validation error');
    }
    return backend.details.errors
      .map((e) => `${e.field}: ${e.message || 'Validation error'}`)
      .join('\n');
  }
  
  // If backend returns {message} show it
  if (backend?.message) {
    return backend.message;
  }
  
  // Fallback
  return err.message || 'Something went wrong';
};

