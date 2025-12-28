import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

export default function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    const updateCartCount = () => {
      let cart = [];
      try {
        const raw = localStorage.getItem('cart') || '[]';
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) cart = parsed;
      } catch (e) {
        console.error('Failed to parse cart from localStorage', e);
        cart = [];
      }
      setCartCount(cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0));
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    // also listen for in-tab cart updates
    window.addEventListener('cartUpdated', updateCartCount);
    const interval = setInterval(updateCartCount, 1000);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href="#content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          // try to focus an element with id 'content' or the products section; fallback to body
          const target = document.getElementById('content') || document.getElementById('products') || document.querySelector('main') || document.body;
          if (target) {
            target.setAttribute('tabindex', '-1');
            target.focus();
          }
        }}
      >
        Skip to content
      </a>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container">
          <div className="top-bar-left">
            <span>📞 +9779701605257</span>
            <span>📍 Store Location</span>
          </div>
          <div className="top-bar-center">
            <span>Tell a friend about Elecrocart & get 20% off</span>
          </div>
          <div className="top-bar-right">
            <select className="currency-select">
              <option>USD</option>
              <option>EUR</option>
              <option>NPR</option>
            </select>
            {user ? (
              <>
                <span>Welcome, {user.name || user.email}</span>
                {user.isAdmin === true && <Link to="/admin">Admin</Link>}
                <button aria-label="Logout" className="link-btn" onClick={() => { onLogout(); navigate('/'); }}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <span>/</span>
                <Link to="/register">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="header">
        <div className="container header-content">
          <div className="brand">
            <Link to="/">
              <span className="brand-icon">E</span>
              <span className="brand-text">Elecrocart</span>
            </Link>
          </div>
            <nav className="main-nav" role="navigation" aria-label="Main navigation">
              {/* Use aria-current to indicate active link for assistive tech */}
              <Link to="/" aria-current={location.pathname === '/' && !location.hash ? 'page' : undefined}>HOME</Link>
              <Link to="/#products" aria-current={(location.hash && location.hash.includes('products')) || (location.pathname === '/' && (new URLSearchParams(location.search).has('category'))) ? 'page' : undefined}>ELECTRONICS</Link>
              <Link to="/blog" aria-current={location.pathname === '/blog' ? 'page' : undefined}>BLOG</Link>
              <Link to="/pages" aria-current={location.pathname === '/pages' ? 'page' : undefined}>PAGES</Link>
              <Link to="/contact" aria-current={location.pathname === '/contact' ? 'page' : undefined}>CONTACT</Link>
            </nav>
            <div className="header-actions">
              <div className="search-box">
                <input
                  aria-label="Search products"
                  className="search-input"
                  placeholder="Search products, brands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`); } }}
                />
                {/* search button removed per request; Enter key in input still triggers search */}
              </div>
              <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">❤</Link>
              <Link to="/cart" className="icon-btn cart-icon" aria-label={`Cart with ${cartCount} items`}>🛒{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}</Link>
            </div>
        </div>
      </header>
    </>
  );
}
