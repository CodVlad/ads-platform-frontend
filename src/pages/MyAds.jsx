import { useState, useEffect, useCallback } from 'react';
import { getMyAds, updateAdStatus, updateAd, deleteAd } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

const MyAds = () => {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ads, setAds] = useState([]);
  const [loadingById, setLoadingById] = useState({});
  const [errorById, setErrorById] = useState({});
  const [editingById, setEditingById] = useState({});
  const [editFormDataById, setEditFormDataById] = useState({});
  const [validationErrorsById, setValidationErrorsById] = useState({});

  // Helper: Set loading state for a specific ad
  const setAdLoading = useCallback((adId, isLoading) => {
    setLoadingById((prev) => ({
      ...prev,
      [adId]: isLoading,
    }));
  }, []);

  // Helper: Set error for a specific ad
  const setAdError = useCallback((adId, message) => {
    setErrorById((prev) => {
      if (message === null) {
        const updated = { ...prev };
        delete updated[adId];
        return updated;
      }
      return { ...prev, [adId]: message };
    });
  }, []);


  // Fetch ads from API
  const fetchMyAds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyAds();
      
      // Extract list exactly from res.data.ads
      const adsArray = response.data?.ads || [];
      setAds(Array.isArray(adsArray) ? adsArray : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load your ads');
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyAds();
  }, [fetchMyAds]);

  const handleStatusUpdate = async (adId, newStatus) => {
    // Clear any previous error for this ad
    setAdError(adId, null);
    
    // Set loading state
    setAdLoading(adId, true);

    try {
      await updateAdStatus(adId, newStatus);
      
      // Refetch my ads from backend as source of truth
      await fetchMyAds();
      
      // Clear error on success
      setAdError(adId, null);
      const statusMessages = {
        active: 'Ad published',
        sold: 'Ad marked as sold',
        draft: 'Ad status updated',
      };
      success(statusMessages[newStatus] || 'Status updated');
    } catch (err) {
      const errorMsg = parseError(err);
      setAdError(adId, errorMsg);
      showError(errorMsg);
    } finally {
      // Set loading false
      setAdLoading(adId, false);
    }
  };

  const handleEditClick = (ad) => {
    const adId = ad._id || ad.id;
    setEditingById((prev) => ({ ...prev, [adId]: true }));
    setEditFormDataById((prev) => ({
      ...prev,
      [adId]: {
        title: ad.title || '',
        description: ad.description || '',
        price: ad.price || '',
        currency: ad.currency || 'EUR',
      },
    }));
    setValidationErrorsById((prev) => {
      const updated = { ...prev };
      delete updated[adId];
      return updated;
    });
    setAdError(adId, null);
  };

  const handleCancelEdit = (adId) => {
    setEditingById((prev) => {
      const updated = { ...prev };
      delete updated[adId];
      return updated;
    });
    setEditFormDataById((prev) => {
      const updated = { ...prev };
      delete updated[adId];
      return updated;
    });
    setValidationErrorsById((prev) => {
      const updated = { ...prev };
      delete updated[adId];
      return updated;
    });
    setAdError(adId, null);
  };

  const validateEditForm = (adId, formData) => {
    const errors = {};

    // Title: required, min 3 chars
    const titleTrimmed = formData.title?.trim() || '';
    if (!titleTrimmed) {
      errors.title = 'Title is required';
    } else if (titleTrimmed.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    // Description: required, min 20 chars
    const descriptionTrimmed = formData.description?.trim() || '';
    if (!descriptionTrimmed) {
      errors.description = 'Description is required';
    } else if (descriptionTrimmed.length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    // Price: must be a finite number > 0
    const priceNum = Number(formData.price);
    if (!formData.price || !isFinite(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be a number greater than 0';
    }

    // Currency: must be one of ["EUR","USD","MDL"]
    const validCurrencies = ['EUR', 'USD', 'MDL'];
    if (!formData.currency || !validCurrencies.includes(formData.currency)) {
      errors.currency = 'Currency must be EUR, USD, or MDL';
    }

    setValidationErrorsById((prev) => ({
      ...prev,
      [adId]: errors,
    }));

    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async (adId) => {
    const formData = editFormDataById[adId];
    if (!formData) return;

    // Clear previous errors
    setAdError(adId, null);

    // Client-side validation
    if (!validateEditForm(adId, formData)) {
      // Validation failed - show first error message
      const validationErrors = validationErrorsById[adId] || {};
      const firstError = Object.values(validationErrors)[0];
      if (firstError) {
        setAdError(adId, firstError);
      }
      return; // Do NOT call API if validation fails
    }

    // Clear errors before API call
    setAdError(adId, null);
    setAdLoading(adId, true);

    try {
      // Build payload with ONLY allowed fields
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        currency: formData.currency,
      };

      await updateAd(adId, payload);

      // Refetch my ads from backend as source of truth
      await fetchMyAds();

      // Close edit mode
      handleCancelEdit(adId);
      setAdError(adId, null);
      success('Ad updated');
    } catch (err) {
      const errorMsg = parseError(err);
      setAdError(adId, errorMsg);
      showError(errorMsg);
    } finally {
      setAdLoading(adId, false);
    }
  };

  const handleFormDataChange = (adId, field, value) => {
    setEditFormDataById((prev) => ({
      ...prev,
      [adId]: {
        ...prev[adId],
        [field]: value,
      },
    }));
    // Clear validation error for this field
    setValidationErrorsById((prev) => {
      const updated = { ...prev };
      if (updated[adId]) {
        updated[adId] = { ...updated[adId] };
        delete updated[adId][field];
      }
      return updated;
    });
  };

  const handleDelete = async (adId) => {
    // Show confirmation dialog
    if (!window.confirm('Delete this ad?')) {
      return;
    }

    // Clear any previous error for this ad
    setAdError(adId, null);
    
    // Set loading state
    setAdLoading(adId, true);

    try {
      await deleteAd(adId);
      
      // Refetch my ads from backend as source of truth
      await fetchMyAds();
      
      // Clean up any state related to this ad
      setEditingById((prev) => {
        const updated = { ...prev };
        delete updated[adId];
        return updated;
      });
      setEditFormDataById((prev) => {
        const updated = { ...prev };
        delete updated[adId];
        return updated;
      });
      setValidationErrorsById((prev) => {
        const updated = { ...prev };
        delete updated[adId];
        return updated;
      });
      setAdError(adId, null);
      success('Ad deleted');
    } catch (err) {
      const errorMsg = parseError(err);
      setAdError(adId, errorMsg);
      showError(errorMsg);
    } finally {
      // Set loading false
      setAdLoading(adId, false);
    }
  };

  // Calculate counts
  const total = ads.length;
  const draftCount = ads.filter((ad) => ad.status === 'draft').length;
  const activeCount = ads.filter((ad) => ad.status === 'active').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>My Ads</h1>
        {!loading && (
          <button
            onClick={fetchMyAds}
            disabled={loading}
            style={{
              padding: '6px 12px',
              backgroundColor: loading ? '#ccc' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Reloading...' : 'Reload'}
          </button>
        )}
      </div>

      {loading && <div>Loading...</div>}
      
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!loading && !error && (
        <>
          {ads.length === 0 ? (
            <div>You have no ads yet</div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <strong>Total:</strong> {total}
                  </div>
                  <div>
                    <strong>Draft:</strong> {draftCount}
                  </div>
                  <div>
                    <strong>Active:</strong> {activeCount}
                  </div>
                </div>
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
              }}>
                {ads.map((ad) => {
                  const adId = ad._id || ad.id;
                  const isUpdating = loadingById[adId] || false;
                  const adError = errorById[adId];
                  const isEditing = editingById[adId] || false;
                  const editFormData = editFormDataById[adId] || {};
                  const validationErrors = validationErrorsById[adId] || {};
                  const coverImage = ad.images && ad.images[0] ? ad.images[0] : null;
                  const canEdit = ad.status === 'draft' || ad.status === 'active';

                  return (
                    <div
                      key={adId}
                      style={{
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '16px',
                        margin: '8px',
                        maxWidth: '300px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      {!isEditing ? (
                        <>
                          {coverImage && (
                            <img
                              src={coverImage}
                              alt={ad.title}
                              style={{
                                width: '100%',
                                height: '200px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                marginBottom: '12px',
                              }}
                            />
                          )}
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{ad.title}</h3>
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ fontSize: '20px' }}>
                              {ad.price} {ad.currency}
                            </strong>
                          </div>
                          {ad.description && (
                            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
                              {ad.description.length > 100
                                ? `${ad.description.substring(0, 100)}...`
                                : ad.description}
                            </div>
                          )}
                          {ad.status && (
                            <div style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              backgroundColor: '#f0f0f0',
                              borderRadius: '4px',
                              fontSize: '12px',
                              marginBottom: '12px',
                            }}>
                              {ad.status}
                            </div>
                          )}
                          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {canEdit && (
                              <button
                                onClick={() => handleEditClick(ad)}
                                disabled={isUpdating}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: isUpdating ? '#ccc' : '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                                  opacity: isUpdating ? 0.6 : 1,
                                }}
                              >
                                Edit
                              </button>
                            )}
                            {ad.status === 'draft' && (
                              <button
                                onClick={() => handleStatusUpdate(adId, 'active')}
                                disabled={isUpdating}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: isUpdating ? '#ccc' : '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                                  opacity: isUpdating ? 0.6 : 1,
                                }}
                              >
                                {isUpdating ? 'Publishing...' : 'Publish'}
                              </button>
                            )}
                            {ad.status === 'active' && (
                              <button
                                onClick={() => handleStatusUpdate(adId, 'sold')}
                                disabled={isUpdating}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: isUpdating ? '#ccc' : '#ffc107',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                                  opacity: isUpdating ? 0.6 : 1,
                                }}
                              >
                                {isUpdating ? 'Updating...' : 'Mark sold'}
                              </button>
                            )}
                            {ad.status === 'sold' && (
                              <div style={{ fontSize: '14px', color: '#666' }}>
                                Ad is sold
                              </div>
                            )}
                            {(ad.status === 'draft' || ad.status === 'active' || ad.status === 'sold') && (
                              <button
                                onClick={() => handleDelete(adId)}
                                disabled={isUpdating}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: isUpdating ? '#ccc' : '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                                  opacity: isUpdating ? 0.6 : 1,
                                }}
                              >
                                {isUpdating ? 'Deleting...' : 'Delete'}
                              </button>
                            )}
                          </div>
                          {adError && (
                            <div style={{
                              color: 'red',
                              fontSize: '12px',
                              marginTop: '8px',
                              whiteSpace: 'pre-line',
                            }}>
                              {adError}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ marginTop: '12px' }}>
                          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Edit Ad</h4>
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                              Title *
                            </label>
                            <input
                              type="text"
                              value={editFormData.title || ''}
                              onChange={(e) => handleFormDataChange(adId, 'title', e.target.value)}
                              disabled={isUpdating}
                              style={{
                                width: '100%',
                                padding: '6px',
                                fontSize: '14px',
                                border: validationErrors.title ? '1px solid red' : '1px solid #ddd',
                                borderRadius: '4px',
                              }}
                            />
                            {validationErrors.title && (
                              <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                                {validationErrors.title}
                              </div>
                            )}
                          </div>
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                              Description (min 20 chars) *
                            </label>
                            <textarea
                              value={editFormData.description || ''}
                              onChange={(e) => handleFormDataChange(adId, 'description', e.target.value)}
                              disabled={isUpdating}
                              rows={4}
                              style={{
                                width: '100%',
                                padding: '6px',
                                fontSize: '14px',
                                border: validationErrors.description ? '1px solid red' : '1px solid #ddd',
                                borderRadius: '4px',
                                fontFamily: 'inherit',
                              }}
                            />
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                              {editFormData.description?.length || 0} / 20 characters
                            </div>
                            {validationErrors.description && (
                              <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                                {validationErrors.description}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                                Price *
                              </label>
                              <input
                                type="number"
                                value={editFormData.price || ''}
                                onChange={(e) => handleFormDataChange(adId, 'price', e.target.value)}
                                disabled={isUpdating}
                                min="0"
                                step="0.01"
                                style={{
                                  width: '100%',
                                  padding: '6px',
                                  fontSize: '14px',
                                  border: validationErrors.price ? '1px solid red' : '1px solid #ddd',
                                  borderRadius: '4px',
                                }}
                              />
                              {validationErrors.price && (
                                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                                  {validationErrors.price}
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                                Currency *
                              </label>
                              <select
                                value={editFormData.currency || 'EUR'}
                                onChange={(e) => handleFormDataChange(adId, 'currency', e.target.value)}
                                disabled={isUpdating}
                                style={{
                                  width: '100%',
                                  padding: '6px',
                                  fontSize: '14px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                }}
                              >
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="MDL">MDL</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button
                              onClick={() => handleSaveEdit(adId)}
                              disabled={isUpdating}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: isUpdating ? '#ccc' : '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                cursor: isUpdating ? 'not-allowed' : 'pointer',
                                opacity: isUpdating ? 0.6 : 1,
                              }}
                            >
                              {isUpdating ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => handleCancelEdit(adId)}
                              disabled={isUpdating}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: isUpdating ? '#ccc' : '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                cursor: isUpdating ? 'not-allowed' : 'pointer',
                                opacity: isUpdating ? 0.6 : 1,
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                          {adError && (
                            <div style={{
                              color: 'red',
                              fontSize: '12px',
                              marginTop: '8px',
                              whiteSpace: 'pre-line',
                            }}>
                              {adError}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MyAds;
