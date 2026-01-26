import React, { useEffect, useState } from 'react';
import API from '../api/api';
import ProductCard from '../components/ProductCard';
import { Link, useNavigate } from 'react-router-dom';

export default function Wishlist() {
  const [items, setItems] = useState([]); // array of product objects or minimal placeholders
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    // Avoid depending on backend availability: show lightweight placeholders
    setLoading(true);
    setError(null);
    try {
      let ids = [];
      try { ids = JSON.parse(localStorage.getItem('wishlist') || '[]'); } catch (e) { ids = []; }
      if (!Array.isArray(ids) || ids.length === 0) { setItems([]); setLoading(false); return; }
  const merged = ids.map(id => ({ _id: id, slug: id, name: String(id), price: null, images: ['/uploads/Last productt.png'], rating: 0 }));
      setItems(merged);

      // fetch each product in background and merge results as they arrive
      ids.forEach(async (id) => {
        try {
          const res = await API.get(`/products/${encodeURIComponent(id)}`).then(r => r.data).catch(() => null);
          if (res) {
            setItems(prev => (prev || []).map(item => (String(item._id) === String(id) ? res : item)));
          }
        } catch (err) {
          // ignore per-item failure
        }
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load wishlist', err);
      setError('Failed to load wishlist. Try reloading the page.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onStorage = (e) => { if (e.key === 'wishlist') load(); };
    const onEvent = () => load();
    window.addEventListener('storage', onStorage);
    window.addEventListener('wishlistUpdated', onEvent);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('wishlistUpdated', onEvent); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeOne = (id) => {
    try {
      const list = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const next = list.filter(x => x !== id);
      localStorage.setItem('wishlist', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { productId: id, added: false } }));
      load();
    } catch (err) {}
  };

  // Always render the page wrapper and header so the route never appears blank.
  // Render loading / error / items inside the main container.
  // Add a console debug to make client-side issues visible in browser console.
  // eslint-disable-next-line no-console
  console.debug('Wishlist render', { loading, error, itemsLength: items.length });

  return (
    <div className="container">
      <div className="section-header">
        <h2>Your Wishlist</h2>
        <div>
          <Link to="/products" className="link-btn" style={{ marginRight: 12 }}>Continue shopping</Link>
          <button className="btn" onClick={() => { localStorage.removeItem('wishlist'); window.dispatchEvent(new CustomEvent('wishlistUpdated')); load(); }}>Clear wishlist</button>
        </div>
      </div>

      {loading && <div className="loading">Loading wishlist…</div>}
      {error && (
        <div className="loading-error">
          <h3>Error</h3>
          <p>{error}</p>
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => load()}>Retry</button>
          </div>
        </div>
      )}

      {!loading && !error && (!items || items.length === 0) && (
        <div className="no-products">Your wishlist is empty. Browse products and tap the heart to save them.</div>
      )}

      {!loading && !error && items && items.length > 0 && (
        <div className="grid">
          {items.map((p) => (
            <div key={p._id || p.slug} className="wishlist-item">
              <ProductCard p={p} />
              <div className="wishlist-actions">
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeOne(p._id || p.slug); }} className="btn">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
