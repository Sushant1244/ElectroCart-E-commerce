import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  React.useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0));
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    const interval = setInterval(updateCartCount, 1000);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
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
                <button className="link-btn" onClick={() => { onLogout(); navigate('/'); }}>Logout</button>
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
            <nav className="main-nav">
              <Link to="/">HOME</Link>
              <Link to="/#products">ELECTRONICS</Link>
              <Link to="/blog">BLOG</Link>
              <Link to="/pages">PAGES</Link>
              <Link to="/contact">CONTACT</Link>
            </nav>
            <div className="header-actions">
              <div className="search-box">
                <input aria-label="Search products" className="search-input" placeholder="Search products, brands..." />
              </div>
              <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">❤</Link>
              <Link to="/cart" className="icon-btn cart-icon" aria-label="Cart">🛒{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}</Link>
            </div>
        </div>
      </header>
    </>
  );
}
