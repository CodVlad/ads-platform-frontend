import { useState } from 'react';
import useCategories from '../hooks/useCategories';

const FiltersBar = ({ initialValues = {}, onApply, onReset }) => {
  // Create initial filters from initialValues (only used for initial state)
  const getInitialFilters = () => ({
    q: initialValues.q || initialValues.search || '',
    minPrice: initialValues.minPrice || '',
    maxPrice: initialValues.maxPrice || '',
    currency: initialValues.currency || '',
    category: initialValues.category || '',
    subCategory: initialValues.subCategory || '',
    sort: initialValues.sort || 'newest',
    // Dynamic filters based on category
    brand: initialValues.brand || '',
    condition: initialValues.condition || '',
    model: initialValues.model || '',
    yearMin: initialValues.yearMin || '',
    yearMax: initialValues.yearMax || '',
    fuel: initialValues.fuel || '',
    rooms: initialValues.rooms || '',
    areaMin: initialValues.areaMin || '',
    areaMax: initialValues.areaMax || '',
  });

  // Use lazy initialization - state is only set once on mount
  // If parent needs to reset filters, it should remount this component with a key
  const [filters, setFilters] = useState(getInitialFilters);
  
  // Categories from API
  const { categories, loading: loadingCategories } = useCategories();

  // Get available subcategories for selected category
  const selectedCategory = categories.find(c => c.slug === filters.category);
  const availableSubcategories = selectedCategory?.subcategories || selectedCategory?.subs || [];

  const handleChange = (field, value) => {
    if (field === 'category') {
      // Reset subcategory and dynamic filters when category changes
      setFilters((prev) => ({
        ...prev,
        category: value,
        subCategory: '',
        // Clear dynamic filters
        brand: '',
        condition: '',
        model: '',
        yearMin: '',
        yearMax: '',
        fuel: '',
        rooms: '',
        areaMin: '',
        areaMax: '',
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleApply = () => {
    // Build values object, only including non-empty values
    const values = {};
    if (filters.q.trim()) {
      values.q = filters.q.trim();
    }
    if (filters.minPrice) {
      values.minPrice = Number(filters.minPrice);
    }
    if (filters.maxPrice) {
      values.maxPrice = Number(filters.maxPrice);
    }
    if (filters.currency && filters.currency.trim() !== '') {
      values.currency = filters.currency;
    }
    if (filters.category && filters.category.trim() !== '') {
      values.categorySlug = filters.category; // Backend expects categorySlug
    }
    if (filters.subCategory && filters.subCategory.trim() !== '') {
      values.subCategorySlug = filters.subCategory; // Backend expects subCategorySlug
    }
    // Map q to search for backend
    if (filters.q && filters.q.trim()) {
      values.search = filters.q.trim();
    }
    // Include sort
    if (filters.sort) {
      values.sort = filters.sort;
    }
    
    // Dynamic filters based on category
    const categorySlug = filters.category;
    
    // Electronics filters
    if (categorySlug === 'electronice-si-tehnica') {
      if (filters.brand && filters.brand.trim()) {
        values.brand = filters.brand.trim();
      }
      if (filters.condition && filters.condition.trim()) {
        values.condition = filters.condition;
      }
    }
    
    // Auto filters
    if (categorySlug === 'auto-si-transport') {
      if (filters.brand && filters.brand.trim()) {
        values.brand = filters.brand.trim();
      }
      if (filters.model && filters.model.trim()) {
        values.model = filters.model.trim();
      }
      if (filters.yearMin) {
        const yearMin = Number(filters.yearMin);
        if (!isNaN(yearMin) && isFinite(yearMin)) {
          values.yearMin = yearMin;
        }
      }
      if (filters.yearMax) {
        const yearMax = Number(filters.yearMax);
        if (!isNaN(yearMax) && isFinite(yearMax)) {
          values.yearMax = yearMax;
        }
      }
      if (filters.fuel && filters.fuel.trim()) {
        values.fuel = filters.fuel;
      }
    }
    
    // Real estate filters
    if (categorySlug === 'imobiliare') {
      if (filters.rooms && filters.rooms.trim()) {
        values.rooms = filters.rooms;
      }
      if (filters.areaMin) {
        const areaMin = Number(filters.areaMin);
        if (!isNaN(areaMin) && isFinite(areaMin) && areaMin >= 0) {
          values.areaMin = areaMin;
        }
      }
      if (filters.areaMax) {
        const areaMax = Number(filters.areaMax);
        if (!isNaN(areaMax) && isFinite(areaMax) && areaMax >= 0) {
          values.areaMax = areaMax;
        }
      }
    }
    
    onApply(values);
  };

  const handleReset = () => {
    setFilters({
      q: '',
      minPrice: '',
      maxPrice: '',
      currency: '',
      category: '',
      subCategory: '',
      sort: 'newest',
      brand: '',
      condition: '',
      model: '',
      yearMin: '',
      yearMax: '',
      fuel: '',
      rooms: '',
      areaMin: '',
      areaMax: '',
    });
    onReset();
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        alignItems: 'end',
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            🔍 Search
          </label>
          <input
            type="text"
            name="q"
            value={filters.q}
            onChange={(e) => handleChange('q', e.target.value)}
            placeholder="Search ads..."
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            Min Price
          </label>
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => handleChange('minPrice', e.target.value)}
            placeholder="Min"
            min="0"
            step="0.01"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            Max Price
          </label>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => handleChange('maxPrice', e.target.value)}
            placeholder="Max"
            min="0"
            step="0.01"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            Currency
          </label>
          <select
            value={filters.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">All Currencies</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="MDL">MDL</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            disabled={loadingCategories}
            style={{ width: '100%' }}
          >
            <option value="">{loadingCategories ? 'Loading...' : 'All Categories'}</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name || cat.label}
              </option>
            ))}
          </select>
        </div>

        {filters.category && (
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Subcategory
            </label>
            <select
              value={filters.subCategory}
              onChange={(e) => handleChange('subCategory', e.target.value)}
              disabled={loadingCategories || !filters.category}
              style={{ width: '100%' }}
            >
              <option value="">All Subcategories</option>
              {availableSubcategories.map((subCat) => {
                const subSlug = subCat.slug || subCat;
                const subLabel = subCat.name || subCat.label || subCat;
                return (
                  <option key={subSlug} value={subSlug}>
                    {subLabel}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Dynamic filters based on category */}
        {filters.category === 'electronice-si-tehnica' && (
          <>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Brand
              </label>
              <input
                type="text"
                value={filters.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                placeholder="Brand"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Condition
              </label>
              <select
                value={filters.condition}
                onChange={(e) => handleChange('condition', e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">All Conditions</option>
                <option value="new">New</option>
                <option value="used">Used</option>
              </select>
            </div>
          </>
        )}

        {filters.category === 'auto-si-transport' && (
          <>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Brand
              </label>
              <input
                type="text"
                value={filters.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                placeholder="Brand"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Model
              </label>
              <input
                type="text"
                value={filters.model}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder="Model"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Year Min
              </label>
              <input
                type="number"
                value={filters.yearMin}
                onChange={(e) => handleChange('yearMin', e.target.value)}
                placeholder="Min"
                min="1900"
                max="2100"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Year Max
              </label>
              <input
                type="number"
                value={filters.yearMax}
                onChange={(e) => handleChange('yearMax', e.target.value)}
                placeholder="Max"
                min="1900"
                max="2100"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Fuel
              </label>
              <select
                value={filters.fuel}
                onChange={(e) => handleChange('fuel', e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">All Fuels</option>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
                <option value="lpg">LPG</option>
              </select>
            </div>
          </>
        )}

        {filters.category === 'imobiliare' && (
          <>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Rooms
              </label>
              <select
                value={filters.rooms}
                onChange={(e) => handleChange('rooms', e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">All Rooms</option>
                <option value="1">1 Room</option>
                <option value="2">2 Rooms</option>
                <option value="3">3 Rooms</option>
                <option value="4">4 Rooms</option>
                <option value="5+">5+ Rooms</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Area Min (m²)
              </label>
              <input
                type="number"
                value={filters.areaMin}
                onChange={(e) => handleChange('areaMin', e.target.value)}
                placeholder="Min"
                min="0"
                step="1"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Area Max (m²)
              </label>
              <input
                type="number"
                value={filters.areaMax}
                onChange={(e) => handleChange('areaMax', e.target.value)}
                placeholder="Max"
                min="0"
                step="1"
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            Sort
          </label>
          <select
            value={filters.sort}
            onChange={(e) => handleChange('sort', e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleApply}
            className="btn-primary"
            style={{ flex: 1, padding: '10px 16px' }}
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className="btn-secondary"
            style={{ flex: 1, padding: '10px 16px' }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltersBar;

