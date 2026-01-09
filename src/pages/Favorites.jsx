import { useFavorites } from '../hooks/useFavorites';
import AdCard from '../components/AdCard';

const Favorites = () => {
  const { favorites, loadFavorites, loading } = useFavorites();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>My Favorites</h1>
        <button
          onClick={loadFavorites}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading && favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading favorites...</div>
      ) : favorites.length === 0 ? (
        <div>No favorites yet</div>
      ) : (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          {favorites.map((ad) => (
            <AdCard key={ad._id || ad.id} ad={ad} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
