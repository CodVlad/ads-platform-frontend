import { useFavorites } from '../auth/FavoritesContext';
import AdCard from '../components/AdCard';

const Favorites = () => {
  const { favorites, loadFavorites } = useFavorites();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>My Favorites</h1>
        <button
          onClick={loadFavorites}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {favorites.length === 0 ? (
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
