import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAds } from '../api/endpoints';
import AdCard from '../components/AdCard';
import FiltersBar from '../components/FiltersBar';
import useCategories from '../hooks/useCategories';
import { buildAdsQuery } from '../utils/adsQuery';

const Home = () => {
  const { categories } = useCategories(); // For getting category labels
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from URL params or defaults
  const getInitialFilters = () => {
    const params = Object.fromEntries(searchParams);
    return {
      q: params.search || params.q || '',
      minPrice: params.minPrice || '',
      maxPrice: params.maxPrice || '',
      currency: params.currency || '',
      category: params.categorySlug || '',
      subCategory: params.subCategorySlug || '',
      sort: params.sort || 'newest',
      // Dynamic filters
      brand: params.brand || '',
      condition: params.condition || '',
      model: params.model || '',
      yearMin: params.yearMin || '',
      yearMax: params.yearMax || '',
      fuel: params.fuel || '',
      rooms: params.rooms || '',
      areaMin: params.areaMin || '',
      areaMax: params.areaMax || '',
    };
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ads, setAds] = useState([]);
  const [filters, setFilters] = useState(getInitialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchAds = useCallback(async (filterParams = {}, page = 1, limit = 12) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params using helper function
      const params = buildAdsQuery(filterParams, page, limit);
      
      const response = await getAds(params);
      
      // Normalize response - try multiple paths to extract array
      let adsArray = [];
      const data = response.data;
      
      if (data?.ads && Array.isArray(data.ads)) {
        adsArray = data.ads;
      } else if (data?.data?.ads && Array.isArray(data.data.ads)) {
        adsArray = data.data.ads;
      } else if (data?.data && Array.isArray(data.data)) {
        adsArray = data.data;
      } else if (data?.items && Array.isArray(data.items)) {
        adsArray = data.items;
      } else if (Array.isArray(data)) {
        adsArray = data;
      }
      
      // Ensure ads is always an array
      let finalAds = Array.isArray(adsArray) ? adsArray : [];
      
      // Local filtering fallback if backend doesn't support category filter
      if (filterParams.categorySlug) {
        const categorySlug = filterParams.categorySlug;
        finalAds = finalAds.filter((ad) => {
          // Try multiple possible paths for category in ad object
          const adCategory = ad.category?.slug || ad.category || ad.categorySlug;
          return adCategory === categorySlug;
        });
      }
      
      // Apply subcategory filter if exists (local fallback)
      if (filterParams.subCategorySlug && finalAds.length > 0) {
        const subCategorySlug = filterParams.subCategorySlug;
        finalAds = finalAds.filter((ad) => {
          const adSubCategory = ad.subCategory?.slug || ad.subCategory || ad.subCategorySlug;
          return adSubCategory === subCategorySlug;
        });
      }
      
      setAds(finalAds);
      
      // Extract pagination from response
      const paginationData = data?.pagination || {};
      setPagination({
        page: paginationData.page || page,
        limit: paginationData.limit || limit,
        pages: paginationData.pages || 1,
        total: paginationData.total || 0,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false,
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load ads');
      setAds([]); // Ensure ads is array even on error
      // Reset pagination on error
      setPagination({
        page: 1,
        limit: 12,
        pages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch ads whenever URL params change (source of truth)
  useEffect(() => {
    const params = Object.fromEntries(searchParams);
    
    // Extract page and limit from URL or use defaults
    const page = params.page ? parseInt(params.page, 10) : 1;
    const limit = params.limit ? parseInt(params.limit, 10) : 12;
    
    // Build filter params from URL
    const filterParams = {
      search: params.search || '',
      categorySlug: params.categorySlug || '',
      subCategorySlug: params.subCategorySlug || '',
      minPrice: params.minPrice || '',
      maxPrice: params.maxPrice || '',
      currency: params.currency || '',
      sort: params.sort || 'newest',
      // Dynamic filters
      brand: params.brand || '',
      condition: params.condition || '',
      model: params.model || '',
      yearMin: params.yearMin || '',
      yearMax: params.yearMax || '',
      fuel: params.fuel || '',
      rooms: params.rooms || '',
      areaMin: params.areaMin || '',
      areaMax: params.areaMax || '',
    };
    
    // Update local filters state to match URL
    setFilters({
      q: filterParams.search,
      minPrice: filterParams.minPrice,
      maxPrice: filterParams.maxPrice,
      currency: filterParams.currency,
      category: filterParams.categorySlug,
      subCategory: filterParams.subCategorySlug,
      sort: filterParams.sort,
      brand: filterParams.brand,
      condition: filterParams.condition,
      model: filterParams.model,
      yearMin: filterParams.yearMin,
      yearMax: filterParams.yearMax,
      fuel: filterParams.fuel,
      rooms: filterParams.rooms,
      areaMin: filterParams.areaMin,
      areaMax: filterParams.areaMax,
    });
    
    // Fetch with params from URL
    const queryParams = buildAdsQuery(filterParams, page, limit);
    fetchAds(queryParams, page, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only depend on searchParams, fetchAds is stable

  const handleApplyFilters = (values) => {
    // Clear previous error
    setError(null);

    // Convert prices to numbers for validation
    const min = values.minPrice !== "" && values.minPrice !== null ? Number(values.minPrice) : undefined;
    const max = values.maxPrice !== "" && values.maxPrice !== null ? Number(values.maxPrice) : undefined;

    // Validation: Check if minPrice > maxPrice when both are valid numbers
    if (min !== undefined && max !== undefined && !isNaN(min) && !isNaN(max)) {
      if (min > max) {
        setError('Minimum price cannot be greater than maximum price');
        return; // Do NOT update URL if validation fails
      }
    }

    // Build query params using helper (page=1 on Apply)
    const filterParams = {
      search: values.search || values.q || '',
      categorySlug: values.categorySlug || '',
      subCategorySlug: values.subCategorySlug || '',
      minPrice: values.minPrice || '',
      maxPrice: values.maxPrice || '',
      currency: values.currency || '',
      sort: values.sort || 'newest',
    };
    
    const params = buildAdsQuery(filterParams, 1, pagination.limit);

    // Update URL (this will trigger useEffect to fetch)
    const urlParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        urlParams.set(key, String(params[key]));
      }
    });
    setSearchParams(urlParams);
    // Note: fetchAds will be triggered by useEffect watching searchParams
  };

  const handleResetFilters = () => {
    // Clear any validation errors
    setError(null);

    // Clear URL params completely (this will trigger useEffect to fetch with defaults)
    setSearchParams({});
    // Note: fetchAds will be triggered by useEffect watching searchParams
  };

  const handlePageChange = (newPage) => {
    // Update only page in URL, keep all other params
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set('page', String(newPage));
    setSearchParams(currentParams);
    // Note: fetchAds will be triggered by useEffect watching searchParams
  };

  return (
    <div className="page-container" style={{ padding: 0, background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '1400px', padding: '0 20px' }}>
        {/* Hero Section */}
        <div style={{ 
          marginBottom: '48px',
          padding: '60px 0',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '24px',
            padding: '48px 40px',
            color: '#fff',
            boxShadow: '0 12px 40px rgba(102, 126, 234, 0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative elements */}
            <div style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '400px',
              height: '400px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              filter: 'blur(80px)',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-80px',
              left: '-80px',
              width: '300px',
              height: '300px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '50%',
              filter: 'blur(60px)',
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 style={{ 
                fontSize: '3.5rem', 
                fontWeight: '800', 
                color: '#fff',
                marginBottom: '16px',
                lineHeight: '1.1',
                textShadow: '0 2px 20px rgba(0,0,0,0.1)',
              }}>
                Discover Amazing Deals
              </h1>
              <p style={{ 
                fontSize: '1.25rem', 
                color: 'rgba(255,255,255,0.95)',
                margin: 0,
                fontWeight: '400',
                maxWidth: '600px',
                lineHeight: '1.6',
              }}>
                Browse through thousands of listings and find exactly what you're looking for
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: '#fff',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>🔍</div>
            <div style={{ 
              color: '#666', 
              fontSize: '18px',
              fontWeight: '500',
            }}>
              Loading amazing deals...
            </div>
          </div>
        )}
        
        {error && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '32px',
            border: '2px solid #fed7d7',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{ 
              color: '#c53030', 
              marginBottom: '20px',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              {error}
            </div>
            <button
              onClick={() => fetchAds({}, pagination.page, pagination.limit)}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }
              }}
            >
              {loading ? 'Refreshing...' : 'Try Again'}
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{ marginBottom: '32px' }}>
              <FiltersBar
                key={JSON.stringify(filters)}
                initialValues={filters}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
              />
            </div>
            
            {/* Results Summary */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '16px', 
              marginBottom: '32px',
              flexWrap: 'wrap',
              padding: '20px 24px',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}>
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{ 
                    fontSize: '20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: '700',
                  }}>
                    {pagination.total || ads.length}
                  </span>
                  <span style={{ color: '#666', fontSize: '15px', fontWeight: '500' }}>
                    {pagination.total === 1 ? 'result' : 'results'}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{ color: '#666', fontSize: '15px', fontWeight: '500' }}>Page</span>
                  <span style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '700',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                  }}>
                    {pagination.page} / {pagination.pages}
                  </span>
                </div>
                {(filters.category || filters.subCategory) && (() => {
                  const category = filters.category ? categories.find(c => c.slug === filters.category) : null;
                  const subcategories = category?.subcategories || category?.subs || [];
                  const subCategory = filters.subCategory && filters.category
                    ? subcategories.find(sub => {
                        const subSlug = sub.slug || sub;
                        return subSlug === filters.subCategory;
                      })
                    : null;
                  const categoryLabel = category?.name || category?.label || filters.category || '';
                  const subCategoryLabel = subCategory?.name || subCategory?.label || filters.subCategory || '';
                  
                  return (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{ color: '#666', fontSize: '15px', fontWeight: '500' }}>Filter:</span>
                      <span style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontWeight: '600',
                      }}>
                        {subCategoryLabel 
                          ? `${categoryLabel} / ${subCategoryLabel}`
                          : categoryLabel}
                      </span>
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={() => fetchAds({}, pagination.page, pagination.limit)}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: '2px solid #e8ecf1',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#667eea',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = '#e8ecf1';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                🔄 Refresh
              </button>
            </div>

            {/* Ads Grid */}
            {Array.isArray(ads) && ads.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 20px',
                background: '#fff',
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}>
                <div style={{ 
                  fontSize: '80px', 
                  marginBottom: '24px',
                  opacity: 0.2,
                }}>🔍</div>
                <h3 style={{ 
                  color: '#1a1a1a', 
                  marginBottom: '12px',
                  fontSize: '1.75rem',
                  fontWeight: '600',
                }}>
                  No results found
                </h3>
                <p style={{ 
                  color: '#666',
                  fontSize: '16px',
                  maxWidth: '400px',
                  margin: '0 auto',
                }}>
                  Try adjusting your filters to see more results
                </p>
              </div>
            ) : Array.isArray(ads) ? (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '28px',
                  marginBottom: '48px',
                }}>
                  {ads.map((ad) => (
                    <div key={ad._id} style={{
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}>
                      <AdCard ad={ad} showFavoriteButton={true} />
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    marginTop: '48px',
                    marginBottom: '32px',
                  }}>
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev || loading}
                      style={{
                        background: !pagination.hasPrev || loading
                          ? '#e8ecf1'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: !pagination.hasPrev || loading ? '#999' : '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: !pagination.hasPrev || loading ? 'not-allowed' : 'pointer',
                        opacity: !pagination.hasPrev || loading ? 0.5 : 1,
                        transition: 'all 0.2s',
                        boxShadow: !pagination.hasPrev || loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
                      }}
                      onMouseEnter={(e) => {
                        if (pagination.hasPrev && !loading) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pagination.hasPrev && !loading) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                        }
                      }}
                    >
                      ← Previous
                    </button>
                    <div style={{
                      padding: '12px 28px',
                      background: '#fff',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}>
                      Page {pagination.page} of {pagination.pages}
                    </div>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext || loading}
                      style={{
                        background: !pagination.hasNext || loading
                          ? '#e8ecf1'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: !pagination.hasNext || loading ? '#999' : '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: !pagination.hasNext || loading ? 'not-allowed' : 'pointer',
                        opacity: !pagination.hasNext || loading ? 0.5 : 1,
                        transition: 'all 0.2s',
                        boxShadow: !pagination.hasNext || loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
                      }}
                      onMouseEnter={(e) => {
                        if (pagination.hasNext && !loading) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pagination.hasNext && !loading) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                        }
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </>
        )}
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
