import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useFavorites } from '../auth/FavoritesContext';
import { addFavorite, removeFavorite } from '../api/endpoints';

const AdCard = ({ ad, showFavoriteButton = true }) => {
  const { user } = useAuth();
  const { favoriteIds, addToFavorites, removeFromFavorites } = useFavorites();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const coverImage = ad.images && ad.images[0] ? ad.images[0] : null;
  
  const canFavorite = ad?.status === "active";
  const isFavorited = showFavoriteButton ? favoriteIds.includes(ad._id) : false;
  const adId = ad._id || ad.id;

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Guard: only show favorite button when enabled
    if (!showFavoriteButton) {
      return;
    }

    // Guard: only active ads can be favorited
    if (!canFavorite) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    // Check token exists before making API call
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Prevent duplicate calls based on current state
    if (isFavorited) {
      // User clicked "Saved" button - unsave
      setBusy(true);
      setError(null);
      try {
        await removeFavorite(adId);
        removeFromFavorites(adId);
      } catch (err) {
        const status = err?.response?.status;
        const backend = err?.response?.data;
        const msg = backend?.message || err.message || 'Failed to remove favorite';
        
        console.error('FAVORITE_ERROR', { adId: ad?._id, status, backend, msg });
        setError(msg);
        
        if (status === 401) {
          navigate('/login');
        }
      } finally {
        setBusy(false);
      }
    } else {
      // User clicked "Save" button - save
      setBusy(true);
      setError(null);
      try {
        await addFavorite(adId);
        addToFavorites(ad);
      } catch (err) {
        const status = err?.response?.status;
        const backend = err?.response?.data;
        const msg = backend?.message || err.message || '';
        
        // Handle known 400 case gracefully
        if (status === 400 && msg.toLowerCase().includes('already in favorites')) {
          // Treat as success
          addToFavorites(ad);
          // No error shown, no console.error
        } else {
          // Log error for debugging
          console.error('FAVORITE_ERROR', { adId: ad?._id, status, backend, msg });
          setError(msg || 'Failed to save favorite');
          
          if (status === 401) {
            navigate('/login');
          }
        }
      } finally {
        setBusy(false);
      }
    }
  };

  const handleCardClick = () => {
    navigate(`/ads/${adId}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        margin: '8px',
        maxWidth: '300px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
      }}
    >
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
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/ads/${adId}`);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              flex: 1,
              cursor: 'pointer',
            }}
          >
            View Details
          </button>
          {showFavoriteButton && (
            <button
              onClick={handleFavoriteClick}
              disabled={busy || !canFavorite}
              style={{
                padding: '8px 16px',
                backgroundColor: isFavorited ? '#dc3545' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: (busy || !canFavorite) ? 'not-allowed' : 'pointer',
                opacity: (busy || !canFavorite) ? 0.6 : 1,
              }}
            >
              {busy ? '...' : (isFavorited ? '❤️ Saved' : '❤️ Save')}
            </button>
          )}
        </div>
        {showFavoriteButton && !canFavorite && (
          <div style={{
            color: '#666',
            fontSize: '12px',
            marginTop: '4px',
          }}>
            Only active ads can be saved
          </div>
        )}
        {showFavoriteButton && error && (
          <div style={{
            color: 'red',
            fontSize: '12px',
            marginTop: '4px',
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdCard;
