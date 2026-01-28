import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import ProfileMenu from './ProfileMenu';
import { safeGetUnreadCount } from '../api/chat';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [navSearch, setNavSearch] = useState('');
  const [unread, setUnread] = useState(0);

  // Sync search input with URL param (for back/forward navigation)
  useEffect(() => {
    const searchParam = searchParams.get('search');
    const isAdsRoute = location.pathname === '/ads' || location.hash.startsWith('#/ads');
    if (isAdsRoute) {
      setNavSearch(searchParam ? String(searchParam) : '');
      return;
    }
    // Keep user input when not on /ads; do not sync to unrelated routes
  }, [searchParams, location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = String(navSearch || '').trim();
    if (!q) {
      sessionStorage.removeItem('last_ads_search');
      navigate('/ads');
      return;
    }
    sessionStorage.setItem('last_ads_search', q);
    navigate(`/ads?search=${encodeURIComponent(q)}`);
  };

  // Fetch unread count on mount and poll every 30s
  useEffect(() => {
    let alive = true;

    const load = async () => {
      // STOP calling protected endpoints when token missing
      const token = localStorage.getItem('token');
      if (!token || !user) {
        setUnread(0);
        return;
      }

      try {
        const data = await safeGetUnreadCount();
        if (!alive) return;
        
        // If skipped or rate limited, keep last known value
        if (data?.skipped || data?.rateLimited) {
          return;
        }
        
        const count = Number(data?.count || 0);
        if (Number.isFinite(count)) {
          setUnread(count);
        }
      } catch (e) {
        // Silent fail - never log 429 or spam console
        if (e?.response?.status === 429) {
          return;
        }
        // Handle 401 silently
        if (e?.response?.status === 401) {
          setUnread(0);
          return;
        }
      }
    };

    if (user) {
      load();
      const t = setInterval(load, 30000); // 30 seconds
      return () => { 
        alive = false; 
        clearInterval(t); 
      };
    } else {
      setUnread(0);
    }
  }, [user]);

  // Refresh when navigating to /chats (messages might have been read)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      return;
    }

    if (location.pathname === '/chats' || location.hash === '#/chats') {
      const load = async () => {
        try {
          const data = await safeGetUnreadCount();
          
          // If skipped or rate limited, keep last known value
          if (data?.skipped || data?.rateLimited) {
            return;
          }
          
          const count = Number(data?.count || 0);
          if (Number.isFinite(count)) {
            setUnread(count);
          }
        } catch (e) {
          // Silent fail - never log 429
          if (e?.response?.status === 429) {
            return;
          }
          // Handle 401 silently
          if (e?.response?.status === 401) {
            setUnread(0);
            return;
          }
        }
      };
      load();
    }
  }, [location.pathname, location.hash, user]);

  return (
    <nav className="p-navbar p-glass">
      <div className="p-container">
        <div className="p-navbar-inner">
          <Link to="/" className="nav-link" style={{ fontSize: 20 }}>
            AdsPlatform
          </Link>

        {/* Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          style={{ flex: 1, maxWidth: 520 }}
        >
          <div className="u-row" style={{ position: 'relative', gap: 0 }}>
            <input className="p-input" style={{ paddingRight: 44, borderRadius: 999 }} type="text" value={navSearch} onChange={(e) => setNavSearch(e.target.value)} placeholder="Search ads…" />
            <button
              type="submit"
              className="nav-icon-btn"
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34 }}
              aria-label="Search"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>
        </form>

        <div className="u-row" style={{ gap: 12 }}>
          {user && (
            <Link
              to="/chats"
              className="nav-icon-btn"
              aria-label="Messages"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {unread > 0 && (
                <span className="nav-badge-green">
                  {unread > 99 ? '99+' : String(unread)}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <ProfileMenu />
          ) : (
            <>
              <ProfileMenu />
              <Link to="/register" className="btn btn-primary">
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

