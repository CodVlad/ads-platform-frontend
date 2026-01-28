import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAds } from '../api/endpoints';
import useCategories from '../hooks/useCategories';
import AdCard from '../components/AdCard';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
];

// Helper to extract categoryId from ad
const getAdCategoryId = (ad) => {
  const c = ad?.category;
  if (!c) return '';
  // if category is ObjectId string
  if (typeof c === 'string') return c;
  // if category is populated object
  if (typeof c === 'object') return String(c._id || c.id || '');
  return '';
};

// Helper to extract category slug from ad
const getAdCategorySlug = (ad) => {
  const c = ad?.category;
  if (!c) return '';
  if (typeof c === 'object') return String(c.slug || c.name || '').toLowerCase().trim();
  // if backend stores slug string directly (unlikely but handle it)
  if (typeof c === 'string') return '';
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

  // Read filters from URL
  const categoryIdParam = (searchParams.get('categoryId') || '').trim();
  const categorySlugParam = (searchParams.get('category') || '').trim();
  const searchParam = (searchParams.get('search') || '').trim();
  const sort = searchParams.get('sort') || '-createdAt';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  // DEV logs
  if (import.meta.env.DEV) {
    console.log('FILTER', { 
      categoryIdParam, 
      categorySlugParam, 
      searchParam, 
      sampleAd: allAds[0] 
    });
  }

  // Fetch ads from API (without filtering)
  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        sort,
      };
      
      // Try server-side filtering first (if API supports it)
      if (categoryIdParam) params.categoryId = categoryIdParam;
      if (categorySlugParam) params.category = categorySlugParam;
      if (categorySlugParam) params.categorySlug = categorySlugParam;
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
      
      // Store all fetched ads (DO NOT filter here)
      setAllAds(fetchedAds);
      
      const paginationData = data?.pagination || {};
      setPagination({
        page: paginationData.page || page,
        pages: paginationData.pages || 1,
        total: paginationData.total || fetchedAds.length,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false,
      });
    } catch (err) {
      console.error('Failed to fetch ads:', err);
      setAllAds([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, minPrice, maxPrice, categoryIdParam, categorySlugParam, searchParam]);

  // Fetch ads when params change
  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Filter ads based on query params (client-side fallback)
  useEffect(() => {
    let filtered = [...allAds];

    // Prefer categoryId over slug
    if (categoryIdParam) {
      filtered = filtered.filter((ad) => {
        const adCategoryId = getAdCategoryId(ad);
        return adCategoryId === categoryIdParam;
      });
    } else if (categorySlugParam) {
      const slug = categorySlugParam.toLowerCase();
      filtered = filtered.filter((ad) => {
        const adCategorySlug = getAdCategorySlug(ad);
        return adCategorySlug === slug;
      });
    }

    // Filter by search (title contains query)
    if (searchParam) {
      const query = searchParam.toLowerCase();
      filtered = filtered.filter((ad) => {
        const title = String(ad?.title || ad?.name || '').toLowerCase();
        return title.includes(query);
      });
    }

    setVisibleAds(filtered);
  }, [allAds, categoryIdParam, categorySlugParam, searchParam]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete('page'); // Reset to page 1 on filter change
    setSearchParams(newParams);
  };

  const clearCategory = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('categoryId');
    next.delete('category');
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

  // Find selected category name from categories list
  const selectedCategory = categoryIdParam 
    ? categories.find(c => (c._id || c.id) === categoryIdParam)
    : categorySlugParam
    ? categories.find(c => (c.slug || '').toLowerCase() === categorySlugParam.toLowerCase())
    : null;
  const selectedCategoryName = selectedCategory?.name || selectedCategory?.label || null;

  return (
    <div className="page">
      <div className="container">
        {/* Premium Header with Filters */}
        <div className="page-header">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="page-header__title">
                {selectedCategoryName || 'All Ads'}
              </h1>
              <p className="page-header__subtitle">
                {visibleAds.length} {visibleAds.length === 1 ? 'result' : 'results'}
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          {(categoryIdParam || categorySlugParam || searchParam) && (
            <div className="flex items-center gap-2 flex-wrap mb-6">
              {(categoryIdParam || categorySlugParam) && (
                <span className="pill">
                  Category: {selectedCategoryName || categorySlugParam || categoryIdParam}
                  <button
                    type="button"
                    onClick={clearCategory}
                    className="pill-x"
                    aria-label="Clear category"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchParam && (
                <span className="pill">
                  Search: "{searchParam}"
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="pill-x"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                </span>
              )}
              <button className="btn btn-secondary btn-sm" onClick={clearAll}>
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="ads-layout">
          {/* Filters Sidebar */}
          <div className="ads-sidebar card card--pad">
            <h3 className="t-h3 mb-6">Filters</h3>

            <div className="flex flex-col gap-6">
              <div>
                <label className="t-small t-bold mb-2 block">Category</label>
                <select
                  value={categoryIdParam || categorySlugParam || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const selectedCat = categories.find(c => (c._id || c.id) === value || (c.slug || '').toLowerCase() === value.toLowerCase());
                      if (selectedCat) {
                        const catId = selectedCat._id || selectedCat.id || '';
                        const catSlug = (selectedCat.slug || '').trim();
                        if (catId) {
                          handleFilterChange('categoryId', catId);
                          if (catSlug) {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.set('categoryId', catId);
                            newParams.set('category', catSlug);
                            newParams.delete('page');
                            setSearchParams(newParams);
                          }
                        } else if (catSlug) {
                          handleFilterChange('category', catSlug);
                        }
                      }
                    } else {
                      clearCategory();
                    }
                  }}
                  className="input"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => {
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

              <div>
                <label className="t-small t-bold mb-2 block">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="input"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="t-small t-bold mb-2 block">Sort By</label>
                <select
                  value={sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="input"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Ads Grid */}
          <div>
            {loading ? (
              <div className="grid grid-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card card--pad" style={{ height: 320, background: 'var(--surface-2)' }} />
                ))}
              </div>
            ) : visibleAds.length === 0 ? (
              <div className="card card--pad text-center py-6">
                <h3 className="t-h3 mb-2">No listings found</h3>
                <p className="t-body t-muted mb-4">
                  {(categoryIdParam || categorySlugParam || searchParam)
                    ? 'Try adjusting your filters or search terms'
                    : 'No ads available at the moment'
                  }
                </p>
                {(categoryIdParam || categorySlugParam || searchParam) && (
                  <button className="btn btn-secondary" onClick={clearAll}>
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-3">
                  {visibleAds.map(ad => (
                    <AdCard key={ad._id || ad.id} ad={ad} showFavoriteButton={true} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={!pagination.hasPrev || loading}
                      className="btn btn-secondary"
                    >
                      Previous
                    </button>
                    <span className="t-body t-bold">
                      Page {page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={!pagination.hasNext || loading}
                      className="btn btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .ads-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
          align-items: start;
        }
        .ads-sidebar {
          position: sticky;
          top: 24px;
        }
        @media (max-width: 1024px) {
          .ads-layout {
            grid-template-columns: 1fr;
          }
          .ads-sidebar {
            position: static;
            margin-bottom: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdsPage;
