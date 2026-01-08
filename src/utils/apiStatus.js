// Shared module for API loading state
let setLoadingCallback = null;

export const registerLoadingCallback = (callback) => {
  setLoadingCallback = callback;
};

export const setApiLoading = (isLoading) => {
  if (setLoadingCallback) {
    setLoadingCallback(isLoading);
  }
};

