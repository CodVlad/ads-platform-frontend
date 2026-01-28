import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { useFavorites } from '../hooks/useFavorites';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

const AdCard = ({ ad, showFavoriteButton = true }) => {
  const { user, token } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { success, error: showError } = useToast();
  const coverImage = ad.images && ad.images[0] ? ad.images[0] : null;
  
  const canFavorite = ad?.status === "active";
  const adId = ad._id || ad.id;
  const saved = showFavoriteButton && adId ? isFavorite(adId) : false;

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Guard: only show favorite button when enabled
    if (!showFavoriteButton) {
      return;
    }

    // Guard: check ad status before calling API - prevent 400 errors
    if (ad?.status !== "active") {
      showError('Only active ads can be added to favorites');
      return;
    }

    if (!user || !adId) {
      if (!user) {
        navigate('/login');
      }
      return;
    }

    // Check token exists before making API call
    if (!token) {
      navigate('/login');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (saved) {
        // User clicked "Saved" button - remove favorite
        const result = await removeFavorite(adId);
        success(result.message || 'Removed from favorites');
      } else {
        // User clicked "Save" button - add favorite
        const result = await addFavorite(adId);
        success(result.message || 'Added to favorites');
      }
    } catch (err) {
      const status = err?.response?.status;
      const backend = err?.response?.data;
      const msg = parseError(err);
      
      // Check for NOT_ACTIVE error type
      const isNotActive = 
        status === 400 && backend?.details?.type === "NOT_ACTIVE";
      
      if (isNotActive) {
        // Keep isFavorited false
        showError(backend?.message || msg || 'Only active ads can be added to favorites');
      } else {
        // Show backend error message
        setError(msg);
        showError(msg);
        
        if (status === 401) {
          navigate('/login');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/ads/${adId}`);
  };

  return (
    <div onClick={handleCardClick} className="p-card p-card-hover ad-card" role="button" tabIndex={0}>
      <div className="ad-card__media">
        {coverImage ? (
          <img className="ad-card__img" src={coverImage} alt={ad.title} loading="lazy" />
        ) : null}
      </div>

      <div className="ad-card__body">
        <div className="ad-card__meta">
          <div className="ad-card__title">{ad.title}</div>
          {ad.status ? <span className="p-badge">{ad.status}</span> : null}
        </div>

        <div className="ad-card__meta">
          <div className="ad-card__price">{ad.price} {ad.currency}</div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/ads/${adId}`); }}
            style={{ padding: '10px 12px' }}
          >
            Details
          </button>
        </div>

        {showFavoriteButton && (
          <div className="ad-card__meta">
            <button
              type="button"
              onClick={handleFavoriteClick}
              disabled={busy || !canFavorite}
              className={`btn ${saved ? 'btn-danger' : 'btn-secondary'}`}
              style={{ padding: '10px 12px' }}
            >
              {busy ? '...' : (saved ? 'Saved' : 'Save')}
            </button>
            {!canFavorite ? <span className="t-muted" style={{ fontSize: 13 }}>Inactive ad</span> : null}
          </div>
        )}

        {error ? <div className="t-muted" style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div> : null}
      </div>
    </div>
  );
};

export default AdCard;
