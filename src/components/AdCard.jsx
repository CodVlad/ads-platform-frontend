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
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        border: '1px solid #e5e7eb',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      {coverImage && (
        <div style={{
          width: '100%',
          height: '240px',
          overflow: 'hidden',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <img
            src={coverImage}
            alt={ad.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      <div style={{ 
        padding: '20px', 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '19px',
          fontWeight: '600',
          color: '#1a1a1a',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '53px',
        }}>
          {ad.title}
        </h3>
        <div style={{ 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: '700',
            color: '#007bff',
            letterSpacing: '-0.5px',
          }}>
            {ad.price} {ad.currency}
          </div>
          {ad.status && (
            <div style={{
              display: 'inline-block',
              padding: '6px 12px',
              backgroundColor: ad.status === 'active' ? '#d1fae5' : ad.status === 'sold' ? '#fee2e2' : '#f3f4f6',
              color: ad.status === 'active' ? '#065f46' : ad.status === 'sold' ? '#991b1b' : '#374151',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {ad.status}
            </div>
          )}
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginTop: 'auto',
          paddingTop: '16px',
          borderTop: '1px solid #f3f4f6',
        }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/ads/${adId}`);
            }}
            className="btn-primary"
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '8px',
              transition: 'all 0.2s',
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
                padding: '12px 16px',
                fontSize: '18px',
                borderRadius: '8px',
                opacity: (busy || !canFavorite) ? 0.6 : 1,
                cursor: (busy || !canFavorite) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                minWidth: '48px',
              }}
            >
              {busy ? '...' : (saved ? '❤️' : '🤍')}
            </button>
          )}
        </div>
        {showFavoriteButton && !canFavorite && (
          <div style={{
            color: '#9ca3af',
            fontSize: '12px',
            marginTop: '10px',
            textAlign: 'center',
            fontStyle: 'italic',
          }}>
            Activate ad to save
          </div>
        )}
        {showFavoriteButton && error && (
          <div style={{
            color: '#dc2626',
            fontSize: '12px',
            marginTop: '10px',
            textAlign: 'center',
            padding: '6px',
            backgroundColor: '#fef2f2',
            borderRadius: '6px',
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdCard;
