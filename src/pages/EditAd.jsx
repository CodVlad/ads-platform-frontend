import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAdById, updateAd, updateAdFormData, getCategoryBySlug } from '../api/endpoints';
import useCategories from '../hooks/useCategories';
import ImageUploader from '../components/ImageUploader';
import DynamicFields from '../components/DynamicFields';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import { capitalizeWords } from '../utils/text';
import { validateDynamicDetails, mergeFieldsByKey } from '../utils/dynamicDetailsValidation';
import '../styles/edit-ad.css';

const EditAd = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ad, setAd] = useState(null);

  const { categories, loading: loadingCategories } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [categorySlug, setCategorySlug] = useState('');
  const [subCategorySlug, setSubCategorySlug] = useState('');
  const [newImages, setNewImages] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [details, setDetails] = useState({});
  const [categoryWithFields, setCategoryWithFields] = useState(null);

  const adId = useMemo(() => (ad?._id || ad?.id || id || '').trim(), [ad, id]);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getAdById(id);
        const adData = res.data?.ad || res.data?.data || res.data;
        setAd(adData);

        setTitle(adData?.title || '');
        setDescription(adData?.description || '');
        setPrice(adData?.price != null ? String(adData.price) : '');
        setCurrency(adData?.currency || 'EUR');

        const catSlug =
          adData?.category?.slug ||
          adData?.categorySlug ||
          (typeof adData?.category === 'string' ? adData.category : '') ||
          '';
        const subSlug =
          adData?.subCategory?.slug ||
          adData?.subCategorySlug ||
          (typeof adData?.subCategory === 'string' ? adData.subCategory : '') ||
          '';
        setCategorySlug(catSlug);
        setSubCategorySlug(subSlug);

        const det = adData?.details ?? adData?.attributes;
        setDetails(
          det && typeof det === 'object' && !Array.isArray(det)
            ? { ...det }
            : {}
        );
      } catch (err) {
        const message = err?.response?.data?.message || err.message || 'Failed to load ad';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAd();
  }, [id]);

  // Load category schema (with fields) when categorySlug is set
  useEffect(() => {
    setCategoryWithFields(null);
    if (!categorySlug || !categorySlug.trim()) return;

    const fromList = categories.find((c) => c.slug === categorySlug);
    const hasFields = fromList?.fields && Array.isArray(fromList.fields) && fromList.fields.length > 0;
    if (hasFields) {
      setCategoryWithFields(fromList);
      return;
    }

    let cancelled = false;
    getCategoryBySlug(categorySlug)
      .then((res) => {
        if (cancelled) return;
        const cat = res?.data?.category ?? res?.data?.data ?? res?.data;
        if (cat && (cat.fields == null || Array.isArray(cat.fields))) {
          setCategoryWithFields(cat);
        } else {
          setCategoryWithFields(fromList || cat || null);
        }
      })
      .catch(() => {
        if (!cancelled) setCategoryWithFields(fromList || null);
      });
    return () => { cancelled = true; };
  }, [categorySlug, categories]);

  const selectedCategory = useMemo(
    () => categoryWithFields || categories.find((c) => c.slug === categorySlug),
    [categoryWithFields, categories, categorySlug],
  );
  const availableSubcategories = useMemo(
    () => selectedCategory?.subcategories || selectedCategory?.subs || [],
    [selectedCategory?.subcategories, selectedCategory?.subs],
  );
  const selectedSub = useMemo(
    () =>
      subCategorySlug
        ? availableSubcategories.find((s) => (s.slug || s) === subCategorySlug)
        : null,
    [subCategorySlug, availableSubcategories],
  );
  const mergedFields = useMemo(
    () => mergeFieldsByKey(selectedCategory?.fields || [], selectedSub?.fields || []),
    [selectedCategory?.fields, selectedSub?.fields],
  );

  // When subcategory changes: keep details but remove keys no longer in mergedFields
  useEffect(() => {
    if (!categorySlug) return;
    const sel = categoryWithFields || categories.find((c) => c.slug === categorySlug);
    const base = sel?.fields || [];
    const subs = sel?.subcategories || sel?.subs || [];
    const sub = subCategorySlug ? subs.find((s) => (s.slug || s) === subCategorySlug) : null;
    const merged = mergeFieldsByKey(base, sub?.fields || []);
    if (merged.length === 0) return; // preserve loaded ad.details until schema is ready
    const keys = new Set(merged.map((f) => f.key || f.name).filter(Boolean));
    setDetails((prev) => {
      const next = {};
      keys.forEach((k) => {
        if (prev[k] !== undefined) next[k] = prev[k];
      });
      if (
        Object.keys(next).length === Object.keys(prev).length &&
        Object.keys(prev).every((k) => keys.has(k))
      ) {
        return prev;
      }
      return next;
    });
  }, [categorySlug, subCategorySlug, categoryWithFields, categories]);

  const validate = () => {
    const errors = {};
    const t = title.trim();
    const d = description.trim();
    const p = Number(price);

    if (!t) errors.title = 'Title is required';
    else if (t.length < 3) errors.title = 'Title must be at least 3 characters';

    if (!d) errors.description = 'Description is required';
    else if (d.length < 20) errors.description = 'Description must be at least 20 characters';

    if (!price || !Number.isFinite(p) || p <= 0) errors.price = 'Price must be a number greater than 0';

    const validCurrencies = ['EUR', 'USD', 'MDL'];
    if (!currency || !validCurrencies.includes(currency)) errors.currency = 'Currency must be EUR, USD, or MDL';

    if (!categorySlug || !categorySlug.trim()) errors.category = 'Category is required';

    const detailErrors = validateDynamicDetails(mergedFields, details);
    Object.assign(errors, detailErrors);

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCategoryChange = (e) => {
    const newSlug = e.target.value;
    setCategorySlug(newSlug);
    setSubCategorySlug('');
    setDetails({});
    setValidationErrors((prev) => {
      const next = { ...prev, category: null, subCategory: null };
      Object.keys(next).forEach((k) => { if (k.startsWith('detail_')) delete next[k]; });
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    if (!adId) {
      showError('Missing ad id.');
      return;
    }
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        currency,
        categorySlug: categorySlug.trim(),
        details,
      };
      if (subCategorySlug && subCategorySlug.trim()) payload.subCategorySlug = subCategorySlug.trim();

      if (newImages.length > 0) {
        const formData = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (k === 'details') formData.append(k, JSON.stringify(v));
          else formData.append(k, String(v));
        });
        Array.from(newImages).forEach((file) => formData.append('images', file));
        await updateAdFormData(adId, formData);
      } else {
        await updateAd(adId, payload);
      }

      success('Ad updated');
      navigate('/my-ads');
    } catch (err) {
      const msg = parseError(err);
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const step1Active =
    title.trim().length >= 3 && description.trim().length >= 20 && price && Number(price) > 0;
  const step2Active = !!categorySlug?.trim();
  const step3Active = newImages.length > 0;

  const existingImages = Array.isArray(ad?.images) ? ad.images : [];
  const displayTitle = title.trim() || 'Your title…';
  const displayPrice =
    price && Number(price) > 0 ? `${price} ${currency}` : '--';
  const displayCategory =
    selectedCategory?.name || selectedCategory?.label || categorySlug || '--';
  const adStatus = ad?.status;

  if (loading) {
    return (
      <div className="editad-page">
        <div className="editad-shell">
          <div className="editad-skeleton card">
            <div className="editad-skeleton-line" />
            <div className="editad-skeleton-text" />
            <div className="editad-skeleton-text editad-skeleton-text--short" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !ad) {
    return (
      <div className="editad-page">
        <div className="editad-shell">
          <div className="editad-empty card">
            <div className="editad-empty__icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h2 className="editad-empty__title">Could not load ad</h2>
            <p className="editad-empty__text">{error}</p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/my-ads')}>
              Back to My Ads
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editad-page">
      <div className="editad-shell">
        <header className="editad-header">
          <div>
            <h1 className="editad-title">Edit Ad</h1>
            <p className="editad-sub">Update details and publish changes</p>
          </div>
          <div className="editad-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Back
            </button>
            <button
              type="submit"
              form="edit-ad-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </header>

        <div className="editad-grid">
          <aside className="editad-preview">
            <div className="card editad-preview-card">
              <h2 className="editad-preview-title">Live Preview</h2>
              <div className="editad-preview-label">Title</div>
              <div className={`editad-preview-value ${!title.trim() ? 'editad-preview-value--muted' : ''}`}>
                {displayTitle}
              </div>
              <div className="editad-preview-label">Price</div>
              <div className="editad-preview-value">{displayPrice}</div>
              <div className="editad-preview-label">Category</div>
              <div className="editad-preview-value">{capitalizeWords(displayCategory)}</div>
              {adStatus && (
                <>
                  <div className="editad-preview-label">Status</div>
                  <div className="editad-preview-value">
                    <span className="editad-preview-badge">{adStatus}</span>
                  </div>
                </>
              )}
            </div>

            {existingImages.length > 0 && (
              <div className="card editad-images-card">
                <h3 className="editad-images-title">Current images</h3>
                <div className="editad-images-grid">
                  {existingImages.slice(0, 8).map((src, idx) => (
                    <div key={`${src}-${idx}`} className="editad-images-item">
                      <img src={src} alt="" />
                    </div>
                  ))}
                </div>
                <p className="editad-images-note">
                  Upload new images to replace (if supported by backend).
                </p>
              </div>
            )}
          </aside>

          <main className="editad-form card">
            <div className="editad-stepper">
              <div className={`editad-stepper-step ${step1Active ? 'is-active' : ''}`}>
                <span className="editad-stepper-step-num">1</span>
                Details
              </div>
              <span className="editad-stepper-sep" />
              <div className={`editad-stepper-step ${step2Active ? 'is-active' : ''}`}>
                <span className="editad-stepper-step-num">2</span>
                Category
              </div>
              <span className="editad-stepper-sep" />
              <div className={`editad-stepper-step ${step3Active ? 'is-active' : ''}`}>
                <span className="editad-stepper-step-num">3</span>
                Images & Save
              </div>
            </div>

            <form id="edit-ad-form" onSubmit={handleSubmit}>
              {error && (
                <div className="editad-alert editad-alert--error" role="alert">
                  {error}
                </div>
              )}

              <section className="editad-section">
                <h3 className="editad-section-title">Listing details</h3>
                <p className="editad-section-sub">Title and description for your listing</p>

                <div className={`editad-field ${validationErrors.title ? 'editad-field--error' : ''}`}>
                  <label htmlFor="title" className="editad-field__label editad-field__label--required">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    className="editad-input"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, title: null }));
                    }}
                    disabled={saving}
                    placeholder="Enter ad title"
                  />
                  {validationErrors.title && (
                    <div className="editad-field__error">{validationErrors.title}</div>
                  )}
                </div>

                <div className={`editad-field ${validationErrors.description ? 'editad-field--error' : ''}`}>
                  <label htmlFor="description" className="editad-field__label editad-field__label--required">
                    Description
                  </label>
                  <textarea
                    id="description"
                    className="editad-input"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, description: null }));
                    }}
                    disabled={saving}
                    rows={6}
                    placeholder="Describe your item in detail (minimum 20 characters)"
                  />
                  <div
                    className={`editad-counter ${description.length >= 20 ? 'editad-counter--ok' : 'editad-counter--warn'}`}
                  >
                    {description.length} / 20 minimum
                  </div>
                  {validationErrors.description && (
                    <div className="editad-field__error">{validationErrors.description}</div>
                  )}
                </div>
              </section>

              <section className="editad-section">
                <h3 className="editad-section-title">Pricing</h3>
                <p className="editad-section-sub">Set price and currency</p>

                <div className="editad-grid-2">
                  <div className={`editad-field ${validationErrors.price ? 'editad-field--error' : ''}`}>
                    <label htmlFor="price" className="editad-field__label editad-field__label--required">
                      Price
                    </label>
                    <input
                      type="number"
                      id="price"
                      className="editad-input"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value);
                        setValidationErrors((prev) => ({ ...prev, price: null }));
                      }}
                      disabled={saving}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    {validationErrors.price && (
                      <div className="editad-field__error">{validationErrors.price}</div>
                    )}
                  </div>
                  <div className={`editad-field ${validationErrors.currency ? 'editad-field--error' : ''}`}>
                    <label htmlFor="currency" className="editad-field__label editad-field__label--required">
                      Currency
                    </label>
                    <select
                      id="currency"
                      className="editad-input"
                      value={currency}
                      onChange={(e) => {
                        setCurrency(e.target.value);
                        setValidationErrors((prev) => ({ ...prev, currency: null }));
                      }}
                      disabled={saving}
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="MDL">MDL</option>
                    </select>
                    {validationErrors.currency && (
                      <div className="editad-field__error">{validationErrors.currency}</div>
                    )}
                  </div>
                </div>
              </section>

              <section className="editad-section">
                <h3 className="editad-section-title">Category</h3>
                <p className="editad-section-sub">Choose a category and optional subcategory</p>

                <div className={`editad-field ${validationErrors.category ? 'editad-field--error' : ''}`}>
                  <label htmlFor="category" className="editad-field__label editad-field__label--required">
                    Category
                  </label>
                  <select
                    id="category"
                    className="editad-input"
                    value={categorySlug}
                    onChange={handleCategoryChange}
                    disabled={saving || loadingCategories}
                  >
                    <option value="">
                      {loadingCategories ? 'Loading categories…' : 'Select Category'}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {capitalizeWords(cat.name || cat.label)}
                      </option>
                    ))}
                  </select>
                  {validationErrors.category && (
                    <div className="editad-field__error">{validationErrors.category}</div>
                  )}
                </div>

                {categorySlug && (
                  <div className={`editad-field ${validationErrors.subCategory ? 'editad-field--error' : ''}`}>
                    <label htmlFor="subCategory" className="editad-field__label">
                      Subcategory
                    </label>
                    <select
                      id="subCategory"
                      className="editad-input"
                      value={subCategorySlug}
                      onChange={(e) => {
                        setSubCategorySlug(e.target.value);
                        setValidationErrors((prev) => ({ ...prev, subCategory: null }));
                      }}
                      disabled={saving || loadingCategories || !categorySlug}
                    >
                      <option value="">Select Subcategory (optional)</option>
                      {availableSubcategories.map((subCat) => {
                        const subSlug = subCat.slug || subCat;
                        const subLabel = subCat.name || subCat.label || subCat;
                        return (
                          <option key={subSlug} value={subSlug}>
                            {capitalizeWords(subLabel)}
                          </option>
                        );
                      })}
                    </select>
                    {validationErrors.subCategory && (
                      <div className="editad-field__error">{validationErrors.subCategory}</div>
                    )}
                  </div>
                )}
              </section>

              {categorySlug && mergedFields.length > 0 && (
                <section className="editad-section editad-section--details">
                  <h3 className="editad-section-title">Details</h3>
                  <p className="editad-section-sub">Category-specific criteria</p>
                  <div className="editad-details-grid">
                    <DynamicFields
                      fields={mergedFields}
                      value={details}
                      onChange={setDetails}
                      errors={Object.fromEntries(
                        mergedFields
                          .filter((f) => (f.key || f.name) && validationErrors[`detail_${f.key || f.name}`])
                          .map((f) => [(f.key || f.name), validationErrors[`detail_${f.key || f.name}`]])
                      )}
                      disabled={saving}
                      fieldClassName="editad-field"
                      inputClassName="editad-input"
                    />
                  </div>
                </section>
              )}

              <section className="editad-section">
                <h3 className="editad-section-title">Images</h3>
                <p className="editad-section-sub">Upload new images to replace (if supported by backend)</p>

                {existingImages.length > 0 && (
                  <div className="editad-field">
                    <div className="editad-field__label">Current images</div>
                    <div className="editad-images-grid editad-images-grid--form">
                      {existingImages.slice(0, 8).map((src, idx) => (
                        <div key={`${src}-${idx}`} className="editad-images-item">
                          <img src={src} alt="" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`editad-field ${validationErrors.images ? 'editad-field--error' : ''}`}>
                  <label className="editad-field__label">Upload new images (optional)</label>
                  <ImageUploader value={newImages} onChange={setNewImages} maxFiles={10} />
                  <div className="editad-field__hint">
                    Upload new images to replace. Backend may replace existing images.
                  </div>
                  {validationErrors.images && (
                    <div className="editad-field__error">{validationErrors.images}</div>
                  )}
                </div>
              </section>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
};

export default EditAd;
