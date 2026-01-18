import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdById } from '../api/endpoints';
import { startChat } from '../api/chat';
import { useAuth } from '../auth/useAuth.js';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

const AdDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ad, setAd] = useState(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAdById(id);
        
        // Handle different response structures
        const adData = response.data?.ad || response.data?.data || response.data;
        setAd(adData);
      } catch (err) {
        const status = err?.response?.status;
        const message = err?.response?.data?.message || err.message || '';
        
        // Check for 404 or "not found" message
        if (status === 404 || message.toLowerCase().includes('not found')) {
          setError('Ad not found');
        } else {
          setError(message || 'Failed to load ad');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAd();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const sellerUserId = ad?.user?._id || ad?.owner?._id;
    if (!sellerUserId || !id) {
      showError('Unable to contact seller. Missing information.');
      return;
    }

    setContacting(true);
    try {
      const response = await startChat(id, sellerUserId);
      const conversationId = response.data?.chat?._id || response.data?.data?._id || response.data?._id;
      if (conversationId) {
        navigate(`/chats/${conversationId}`);
      } else {
        showError('Failed to start conversation');
      }
    } catch (err) {
      const errorMessage = parseError(err);
      showError(errorMessage);
    } finally {
      setContacting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ color: 'red', fontSize: '18px' }}>{error}</div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <div>Ad not found</div>
      </div>
    );
  }

  const images = ad.images && Array.isArray(ad.images) ? ad.images : [];
  const mainImage = images[mainImageIndex] || null;
  const hasMultipleImages = images.length > 1;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>{ad.title}</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px' }}>
            {ad.price} {ad.currency}
          </h2>
        </div>
        {ad.status && (
          <div style={{
            display: 'inline-block',
            padding: '6px 12px',
            backgroundColor: ad.status === 'active' ? '#d4edda' : ad.status === 'sold' ? '#f8d7da' : '#e2e3e5',
            color: ad.status === 'active' ? '#155724' : ad.status === 'sold' ? '#721c24' : '#383d41',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            textTransform: 'uppercase',
          }}>
            {ad.status}
          </div>
        )}
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          {/* Main Image */}
          {mainImage && (
            <div style={{ marginBottom: '16px' }}>
              <img
                src={mainImage}
                alt={ad.title}
                style={{
                  width: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  backgroundColor: '#f8f9fa',
                }}
              />
            </div>
          )}
          
          {/* Thumbnails */}
          {hasMultipleImages && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${ad.title} - Image ${index + 1}`}
                  onClick={() => setMainImageIndex(index)}
                  style={{
                    width: '100px',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: mainImageIndex === index ? '3px solid #007bff' : '1px solid #ddd',
                    cursor: 'pointer',
                    opacity: mainImageIndex === index ? 1 : 0.7,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {ad.description && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '12px' }}>Description</h3>
          <p style={{ 
            whiteSpace: 'pre-wrap', 
            lineHeight: '1.6',
            fontSize: '16px',
            color: '#333',
          }}>
            {ad.description}
          </p>
        </div>
      )}

      {/* Owner Information */}
      {(ad.owner || ad.user) && (
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>Seller Information</h3>
          {(ad.owner?.name || ad.user?.name) && (
            <div style={{ marginBottom: '4px' }}>
              <strong>Name:</strong> {ad.owner?.name || ad.user?.name}
            </div>
          )}
          {(ad.owner?.email || ad.user?.email) && (
            <div style={{ marginBottom: '12px' }}>
              <strong>Email:</strong> {ad.owner?.email || ad.user?.email}
            </div>
          )}
          <button
            onClick={handleContactSeller}
            disabled={contacting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: contacting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: contacting ? 0.6 : 1,
            }}
          >
            {contacting ? 'Starting conversation...' : 'Contact seller'}
          </button>
        </div>
      )}

      {/* Created Date */}
      {ad.createdAt && (
        <div style={{ 
          marginTop: '20px', 
          padding: '12px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          fontSize: '14px',
          color: '#666',
        }}>
          <strong>Posted:</strong> {formatDate(ad.createdAt)}
        </div>
      )}
    </div>
  );
};

export default AdDetails;
