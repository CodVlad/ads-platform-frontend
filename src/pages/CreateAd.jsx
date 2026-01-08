import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAd } from '../api/endpoints';

const CreateAd = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validate = () => {
    const errors = {};

    // Title: required, min 3 chars
    const titleTrimmed = title.trim();
    if (!titleTrimmed) {
      errors.title = 'Title is required';
    } else if (titleTrimmed.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    // Description: required, min 20 chars
    if (!description || !description.trim()) {
      errors.description = 'Description is required';
    } else if (description.length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    // Price: must be finite number > 0
    const priceNum = Number(price);
    if (!price || !isFinite(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be a number greater than 0';
    }

    // Currency: must be one of ["EUR","USD","MDL"]
    const validCurrencies = ['EUR', 'USD', 'MDL'];
    if (!currency || !validCurrencies.includes(currency)) {
      errors.currency = 'Currency must be EUR, USD, or MDL';
    }

    // At least 1 image required
    if (images.length === 0) {
      errors.images = 'At least one image is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setValidationErrors({});

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      // Build FormData with correct types
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', String(Number(price)));
      formData.append('currency', currency);
      
      // Append all images
      Array.from(images).forEach((file) => {
        formData.append('images', file);
      });

      // Debug log before sending
      console.log("CREATE_AD_FORM:", {
        title,
        descriptionLen: description.length,
        price,
        currency,
        filesCount: images.length,
      });
      console.log("Submitting createAd to:", import.meta.env.VITE_API_URL + "/api/ads");
      
      await createAd(formData);
      
      // Navigate to my-ads after successful creation
      navigate('/my-ads');
    } catch (err) {
      const status = err?.response?.status;
      const backend = err?.response?.data;
      const msg = backend?.message || err.message || 'Failed to create ad';
      
      // Extract backend validation details
      let detailsMsg = msg;
      if (backend?.details?.errors?.length) {
        detailsMsg = backend.details.errors
          .map((e) => `${e.field}: ${e.message}`)
          .join('\n');
      }
      
      console.error("CREATE_AD_BACKEND:", backend);
      setError(detailsMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setValidationErrors((prev) => ({ ...prev, images: null }));
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Create Ad</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '4px' }}>
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setValidationErrors((prev) => ({ ...prev, title: null }));
            }}
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '16px',
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

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '4px' }}>
            Description (min 20 chars) *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setValidationErrors((prev) => ({ ...prev, description: null }));
            }}
            disabled={loading}
            rows={5}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '16px',
              border: validationErrors.description ? '1px solid red' : '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {description.length} / 20 characters
          </div>
          {validationErrors.description && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {validationErrors.description}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="price" style={{ display: 'block', marginBottom: '4px' }}>
              Price *
            </label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setValidationErrors((prev) => ({ ...prev, price: null }));
              }}
              disabled={loading}
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '16px',
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
            <label htmlFor="currency" style={{ display: 'block', marginBottom: '4px' }}>
              Currency *
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                setValidationErrors((prev) => ({ ...prev, currency: null }));
              }}
              disabled={loading}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '16px',
                border: validationErrors.currency ? '1px solid red' : '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="MDL">MDL</option>
            </select>
            {validationErrors.currency && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {validationErrors.currency}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="images" style={{ display: 'block', marginBottom: '4px' }}>
            Images (at least 1) *
          </label>
          <input
            type="file"
            id="images"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '16px',
              border: validationErrors.images ? '1px solid red' : '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
          {images.length > 0 && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {images.length} image(s) selected
            </div>
          )}
          {validationErrors.images && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {validationErrors.images}
            </div>
          )}
        </div>

        {success && (
          <div style={{
            color: 'green',
            marginBottom: '16px',
            padding: '8px',
            backgroundColor: '#e6ffe6',
            borderRadius: '4px',
          }}>
            Ad created successfully! Redirecting to My Ads...
          </div>
        )}

        {error && (
          <div style={{
            color: 'red',
            marginBottom: '16px',
            padding: '8px',
            backgroundColor: '#ffe6e6',
            borderRadius: '4px',
            whiteSpace: 'pre-line',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating...' : 'Create Ad'}
        </button>
      </form>
    </div>
  );
};

export default CreateAd;

