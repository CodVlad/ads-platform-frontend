import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import ProfileMenu from './ProfileMenu';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav style={{
      backgroundColor: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px',
      }}>
        <Link 
          to="/" 
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#007bff',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🏠 AdsPlatform
        </Link>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          {user ? (
            <ProfileMenu />
          ) : (
            <>
              <ProfileMenu />
              <Link
                to="/register"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

