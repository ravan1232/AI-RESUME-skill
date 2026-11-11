/**
 * Extract a clear, user-friendly error message from an Axios error.
 * Distinguishes network/server-down errors from actual HTTP 4xx validation errors.
 */
export function getApiErrorMessage(err, fallbackMessage = 'Request failed. Please try again.') {
  if (!err) return fallbackMessage;

  if (err.response?.data?.detail) {
    return typeof err.response.data.detail === 'string'
      ? err.response.data.detail
      : JSON.stringify(err.response.data.detail);
  }

  if (!err.response) {
    return 'Cannot connect to the backend server. Please verify the backend is running (or wait ~45s if Render free tier is waking up).';
  }

  if (err.response.status >= 500) {
    return `Server error (${err.response.status}). Please try again in a few seconds.`;
  }

  return fallbackMessage;
}
