import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAds } from '../api/endpoints';
import useCategories from '../hooks/useCategories';
import AdCard from '../components/AdCard';
import '../styles/ads.css';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
];

const getAdCategoryId = (ad) => {
  const c = ad?.category;
  if (!c) return '';
  if (typeof c === 'string') return c;
  if (typeof c === 'object') return String(c._id || c.id || '');
  return '';
};

const getAdCategorySlug = (ad) => {
  const c = ad?.category;
  if (!c) return '';
  if (typeof c === 'object') return String(c.slug || c.name || '').toLowerCase().trim();
  if (typeof c === 'string') return '';
  return '';
};

const normalizeSlug = (v) => {
  let s = String(v || '').toLowerCase().trim();
  s = s.replace(/\s+/g, '-');
  s = s.replace(/&/g, 'and');
  s = s.replace(/[^a-z0-9-]/g, '');
  return s;
};

// Aliasuri: slug din Home/URL -> slug-uri acceptate din backend (match strict)
const CATEGORY_SLUG_ALIASES = {
  imobiliare: ['imobiliare', 'cat-real-estate'],
  'cat-real-estate': ['cat-real-estate', 'imobiliare'],
  automobile: ['automobile', 'cat-automobile', 'auto-transport'],
  'cat-automobile': ['cat-automobile', 'automobile'],
  'electronice-tehnica': ['electronice-tehnica', 'cat-electronics', 'electronice-tehnica'],
  'cat-electronics': ['cat-electronics', 'electronice-tehnica'],
  'casa-gradina': ['casa-gradina', 'cat-home-garden', 'casa-gradina'],
  'cat-home-garden': ['cat-home-garden', 'casa-gradina'],
  'moda-frumusete': ['moda-frumusete', 'cat-fashion', 'moda-frumusete'],
  'cat-fashion': ['cat-fashion', 'moda-frumusete'],
  'locuri-de-munca': ['locuri-de-munca', 'cat-jobs', 'locuri-de-munca'],
  'cat-jobs': ['cat-jobs', 'locuri-de-munca'],
};

const getAdSubCategorySlug = (ad) => {
  const sub = ad?.subCategory;
  if (ad?.subCategorySlug) return String(ad.subCategorySlug).toLowerCase().trim();
  if (!sub) return '';
  if (typeof sub === 'string') return sub.toLowerCase().trim();
  if (typeof sub === 'object') return String(sub.slug || sub.name || '').toLowerCase().trim();
  return '';
};

const AdsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategories();
  const [loading, setLoading] = useState(true);
  const [allAds, setAllAds] = useState([]);
  const [visibleAds, setVisibleAds] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  const categoryIdParam = (searchParams.get('categoryId') || '').trim();
  const categorySlugParam = (searchParams.get('category') || '').trim();
  const subCategorySlugParam = (
    searchParams.get('subCategorySlug') ||
    searchParams.get('subCategory') ||
    searchParams.get('subCategoryId') ||
    ''
  ).trim();
  const searchParam = (searchParams.get('search') || '').trim();
  const sort = searchParams.get('sort') || '-createdAt';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  if (import.meta.env.DEV) {
    console.log('FILTER', {
      categoryIdParam,
      categorySlugParam,
      searchParam,
      sampleAd: allAds[0],
    });
  }

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);

      const shouldFetchAll = categoryIdParam || categorySlugParam || subCategorySlugParam;
      const fetchLimit = shouldFetchAll ? 10000 : limit;
      const fetchPage = shouldFetchAll ? 1 : page;

      const params = {
        page: fetchPage,
        limit: fetchLimit,
        sort,
      };

      if (categoryIdParam) params.categoryId = categoryIdParam;
      if (categorySlugParam) {
        params.category = categorySlugParam;
        params.categorySlug = categorySlugParam;
      }
      if (subCategorySlugParam) params.subCategorySlug = subCategorySlugParam;
      if (searchParam) params.search = searchParam;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const response = await getAds(params);
      const data = response.data;

      let adsArray = [];
      if (data?.ads && Array.isArray(data.ads)) {
        adsArray = data.ads;
      } else if (data?.data?.ads && Array.isArray(data.data.ads)) {
        adsArray = data.data.ads;
      } else if (Array.isArray(data)) {
        adsArray = data;
      }

      const fetchedAds = Array.isArray(adsArray) ? adsArray : [];

      if (import.meta.env.DEV) {
        console.log('[AdsPage] Fetched ads:', {
          count: fetchedAds.length,
          categoryIdParam,
          categorySlugParam,
          shouldFetchAll,
          sampleAd: fetchedAds[0],
        });
      }

      setAllAds(fetchedAds);

      const paginationData = data?.pagination || {};
      setPagination({
        page: shouldFetchAll ? 1 : (paginationData.page || page),
        pages: shouldFetchAll ? 1 : (paginationData.pages || 1),
        total: paginationData.total || fetchedAds.length,
        hasNext: shouldFetchAll ? false : (paginationData.hasNext || false),
        hasPrev: shouldFetchAll ? false : (paginationData.hasPrev || false),
      });
    } catch (err) {
      console.error('Failed to fetch ads:', err);
      setAllAds([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, minPrice, maxPrice, categoryIdParam, categorySlugParam, subCategorySlugParam, searchParam]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  useEffect(() => {
    let filtered = [...allAds];

    if (categoryIdParam) {
      filtered = filtered.filter((ad) => {
        const adCategoryId = getAdCategoryId(ad);
        const directCategoryId = String(ad?.categoryId || '');
        const categoryObjId = String(ad?.category?._id || ad?.category?.id || '');
        return (
          adCategoryId === categoryIdParam ||
          directCategoryId === categoryIdParam ||
          categoryObjId === categoryIdParam
        );
      });
    } else if (categorySlugParam) {
      const slugNorm = normalizeSlug(categorySlugParam);
      const acceptedSlugs = new Set([
        slugNorm,
        ...(CATEGORY_SLUG_ALIASES[slugNorm] || []),
      ]);
      filtered = filtered.filter((ad) => {
        const adCategorySlug = normalizeSlug(getAdCategorySlug(ad));
        const directSlug = normalizeSlug(ad?.categorySlug);
        const categoryName = normalizeSlug(ad?.category?.name);
        return (
          (adCategorySlug && acceptedSlugs.has(adCategorySlug)) ||
          (directSlug && acceptedSlugs.has(directSlug)) ||
          (categoryName && acceptedSlugs.has(categoryName))
        );
      });
    }

    if (subCategorySlugParam) {
      const slug = subCategorySlugParam.toLowerCase().trim();
      filtered = filtered.filter((ad) => {
        const extractedSlug = getAdSubCategorySlug(ad);
        const subName = ad?.subCategory?.name ? String(ad.subCategory.name).toLowerCase().trim() : '';
        return (
          extractedSlug === slug ||
          (extractedSlug && extractedSlug.includes(slug)) ||
          subName === slug
        );
      });
    }

    if (searchParam) {
      const query = searchParam.toLowerCase();
      filtered = filtered.filter((ad) => {
        const title = String(ad?.title || ad?.name || '').toLowerCase();
        return title.includes(query);
      });
    }

    if (categoryIdParam || categorySlugParam || subCategorySlugParam || searchParam) {
      setPagination((prev) => ({
        ...prev,
        total: filtered.length,
      }));
    }

    setVisibleAds(filtered);

    if (import.meta.env.DEV) {
      console.log('[AdsPage] Filtering:', {
        totalAds: allAds.length,
        filteredAds: filtered.length,
        categoryIdParam,
        categorySlugParam,
        subCategorySlugParam,
        searchParam,
      });
    }
  }, [allAds, categoryIdParam, categorySlugParam, subCategorySlugParam, searchParam]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const clearCategory = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('categoryId');
    next.delete('category');
    next.delete('subCategorySlug');
    next.delete('subCategory');
    next.delete('subCategoryId');
    next.delete('page');
    setSearchParams(next);
  };

  const clearSubCategory = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('subCategorySlug');
    next.delete('subCategory');
    next.delete('subCategoryId');
    next.delete('page');
    setSearchParams(next);
  };

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    next.delete('page');
    setSearchParams(next);
  };

  const clearAll = () => setSearchParams({});

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const selectedCategory =
    categoryIdParam
      ? categories.find((c) => (c._id || c.id) === categoryIdParam)
      : categorySlugParam
        ? categories.find((c) => {
            const cs = (c.slug || '').toLowerCase().trim();
            const paramNorm = categorySlugParam.toLowerCase().trim();
            if (cs === paramNorm) return true;
            const accepted = CATEGORY_SLUG_ALIASES[normalizeSlug(categorySlugParam)];
            return accepted && accepted.some((a) => normalizeSlug(a) === normalizeSlug(cs));
          })
        : null;
  const selectedCategoryName = selectedCategory?.name || selectedCategory?.label || null;
  const availableSubcategories = selectedCategory?.subcategories || selectedCategory?.subs || [];
  const selectedSubcategory =
    subCategorySlugParam &&
    availableSubcategories.find(
      (sub) =>
        (sub.slug || sub).toString().toLowerCase() === subCategorySlugParam.toLowerCase()
    );
  const selectedSubcategoryName =
    selectedSubcategory?.name || selectedSubcategory?.label || selectedSubcategory || subCategorySlugParam;

  const hasActiveFilters =
    categoryIdParam || categorySlugParam || subCategorySlugParam || searchParam;

  return (
    <div className="ads-page">
      <div className="ads-container">
        <header className="ads-header">
          <div className="ads-header__left">
            <h1 className="ads-title">{selectedCategoryName || 'All Ads'}</h1>
            <p className="ads-subtitle">
              {visibleAds.length} {visibleAds.length === 1 ? 'result' : 'results'}
            </p>
          </div>
          <div className="ads-header__sort">
            <label className="filter-label" htmlFor="ads-sort">
              Sort
            </label>
            <select
              id="ads-sort"
              value={sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="field-input"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        {hasActiveFilters && (
          <div className="ads-chips">
            {(categoryIdParam || categorySlugParam) && (
              <span className="ads-chip">
                Category: {selectedCategoryName || categorySlugParam || categoryIdParam}
                <button
                  type="button"
                  onClick={clearCategory}
                  className="ads-chip-x"
                  aria-label="Clear category"
                >
                  ×
                </button>
              </span>
            )}
            {subCategorySlugParam && (
              <span className="ads-chip">
                Subcategory: {selectedSubcategoryName}
                <button
                  type="button"
                  onClick={clearSubCategory}
                  className="ads-chip-x"
                  aria-label="Clear subcategory"
                >
                  ×
                </button>
              </span>
            )}
            {searchParam && (
              <span className="ads-chip">
                Search: &quot;{searchParam}&quot;
                <button
                  type="button"
                  onClick={clearSearch}
                  className="ads-chip-x"
                  aria-label="Clear search"
                >
                  ×
                </button>
              </span>
            )}
            <button type="button" className="ads-chips-clear" onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}

        <div className="ads-layout">
          <aside className="ads-sidebar">
            <div className="filter-card">
              <h2 className="filter-title">Filters</h2>

              <div className="filter-group">
                <label className="filter-label" htmlFor="ads-category">
                  Category
                </label>
                <select
                  id="ads-category"
                  value={categoryIdParam || categorySlugParam || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const selectedCat = categories.find(
                        (c) =>
                          (c._id || c.id) === value ||
                          (c.slug || '').toLowerCase() === value.toLowerCase()
                      );
                      if (selectedCat) {
                        const catId = selectedCat._id || selectedCat.id || '';
                        const catSlug = (selectedCat.slug || '').trim();
                        if (catId) {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.set('categoryId', catId);
                          if (catSlug) newParams.set('category', catSlug);
                          newParams.delete('subCategorySlug');
                          newParams.delete('subCategory');
                          newParams.delete('subCategoryId');
                          newParams.delete('page');
                          setSearchParams(newParams);
                        } else if (catSlug) {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.set('category', catSlug);
                          newParams.delete('subCategorySlug');
                          newParams.delete('subCategory');
                          newParams.delete('subCategoryId');
                          newParams.delete('page');
                          setSearchParams(newParams);
                        }
                      }
                    } else {
                      clearCategory();
                    }
                  }}
                  className="field-input"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => {
                    const catId = cat._id || cat.id || '';
                    const catSlug = (cat.slug || '').trim();
                    const value = catId || catSlug;
                    return (
                      <option key={catId || catSlug} value={value}>
                        {cat.name || cat.label}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedCategory && (
                <div className="filter-group">
                  <label className="filter-label" htmlFor="ads-subcategory">
                    Subcategory
                  </label>
                  <select
                    id="ads-subcategory"
                    value={subCategorySlugParam}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      if (value) {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('subCategorySlug', value);
                        newParams.delete('subCategory');
                        newParams.delete('subCategoryId');
                        newParams.delete('page');
                        setSearchParams(newParams);
                      } else {
                        clearSubCategory();
                      }
                    }}
                    className="field-input"
                  >
                    <option value="">All Subcategories</option>
                    {availableSubcategories.map((sub) => {
                      const subSlug = sub.slug ?? sub;
                      const subLabel = sub.name || sub.label || subSlug;
                      return (
                        <option key={subSlug} value={subSlug}>
                          {subLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="filter-group">
                <label className="filter-label" htmlFor="ads-min-price">
                  Price Range
                </label>
                <div className="filter-row-2">
                  <input
                    id="ads-min-price"
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="field-input"
                  />
                  <input
                    id="ads-max-price"
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="field-input"
                  />
                </div>
              </div>
            </div>
          </aside>

          <main className="ads-main">
            {loading ? (
              <div className="ads-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-image" />
                    <div className="skeleton-body">
                      <div className="skeleton-line" />
                      <div className="skeleton-line" />
                      <div className="skeleton-line" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleAds.length === 0 ? (
              <div className="ads-empty">
                <div className="ads-empty__icon" aria-hidden>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                </div>
                <h3 className="ads-empty__title">No listings found</h3>
                <p className="ads-empty__text">
                  {hasActiveFilters
                    ? 'No listings found for this filter. Try adjusting your filters or search.'
                    : 'No ads available at the moment.'}
                </p>
                {hasActiveFilters && (
                  <button type="button" className="btn btn-secondary" onClick={clearAll}>
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="ads-grid">
                  {visibleAds.map((ad) => (
                    <AdCard key={ad._id || ad.id} ad={ad} showFavoriteButton={true} />
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="ads-pagination">
                    <button
                      type="button"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={!pagination.hasPrev || loading}
                      className="ads-pagination__btn"
                    >
                      Previous
                    </button>
                    <span className="ads-pagination__pill" aria-current="page">
                      {page}
                    </span>
                    <span className="ads-pagination__label">
                      of {pagination.pages}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={!pagination.hasNext || loading}
                      className="ads-pagination__btn"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdsPage;
