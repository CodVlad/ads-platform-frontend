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
    <div 
      onClick={handleCardClick}
      className="card"
      style={{
        cursor: 'pointer',
        padding: 0,
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      {coverImage && (
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          overflow: 'hidden',
          backgroundColor: '#f8f9fa',
        }}>
          <img
            src={coverImage}
            alt={ad.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}
      <div style={{ padding: '16px' }}>
        <h3 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '18px',
          fontWeight: '600',
          color: '#1a1a1a',
          lineHeight: '1.3',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {ad.title}
        </h3>
        <div style={{ 
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          <div style={{ 
            fontSize: '22px', 
            fontWeight: '700',
            color: '#007bff',
          }}>
            {ad.price} {ad.currency}
          </div>
          {ad.status && (
            <div style={{
              display: 'inline-block',
              padding: '4px 10px',
              backgroundColor: ad.status === 'active' ? '#d4edda' : ad.status === 'sold' ? '#f8d7da' : '#e2e3e5',
              color: ad.status === 'active' ? '#155724' : ad.status === 'sold' ? '#721c24' : '#383d41',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
            }}>
              {ad.status}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/ads/${adId}`);
            }}
            className="btn-primary"
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            View Details
          </button>
          {showFavoriteButton && (
            <button
              onClick={handleFavoriteClick}
              disabled={busy || !canFavorite}
              className={saved ? 'btn-danger' : 'btn-secondary'}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                opacity: (busy || !canFavorite) ? 0.6 : 1,
                cursor: (busy || !canFavorite) ? 'not-allowed' : 'pointer',
              }}
            >
              {busy ? '...' : (saved ? '❤️' : '🤍')}
            </button>
          )}
        </div>
        {showFavoriteButton && !canFavorite && (
          <div style={{
            color: '#999',
            fontSize: '12px',
            marginTop: '8px',
            textAlign: 'center',
          }}>
            Activate ad to save
          </div>
        )}
        {showFavoriteButton && error && (
          <div style={{
            color: '#c53030',
            fontSize: '12px',
            marginTop: '8px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdCard;
