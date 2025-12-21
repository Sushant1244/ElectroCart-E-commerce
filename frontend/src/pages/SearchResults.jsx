import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../api/api';
import ProductCard from '../components/ProductCard';

export default function SearchResults(){
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const q = params.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Local demo products (same as Home demo set) used when backend returns nothing
  const DEMO_PRODUCTS = [
    { _id: 'demo1', name: 'Alpha Watch ultra', slug: 'alpha-watch-ultra', price: 3500, images: ['/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png'], stock: 10, featured: true, description: 'Demo Alpha Watch' },
    { _id: 'demo2', name: 'Wireless Headphones', slug: 'wireless-headphones', price: 3200, images: ['/uploads/Wireless Headphones.png'], stock: 25 },
    { _id: 'demo3', name: 'Homepad mini', slug: 'homepad-mini', price: 1200, images: ['/uploads/Homepad mini.png'], stock: 50 },
    { _id: 'demo4', name: 'MatrixSafe Charger', slug: 'matrixsafe-charger', price: 1700, images: ['/uploads/MatrixSafe Charger.png'], stock: 30 },
    { _id: 'demo5', name: 'Iphone 15 Pro max', slug: 'iphone-15-pro-max', price: 178900, images: ['/uploads/Iphone 15 pro ma.png'], stock: 15, featured: true },
    { _id: 'demo6', name: 'Macbook M2 Dark gray', slug: 'macbook-m2-dark-gray', price: 117000, images: ['/uploads/MacBook Air M4.png'], stock: 8 },
    { _id: 'demo7', name: 'Music Magnet Headphone', slug: 'music-magnet-headphone', price: 14500, images: ['/uploads/Music magnet Headphone.jpg'], stock: 20 },
    { _id: 'demo8', name: 'Security Smart Camera', slug: 'security-smart-camera', price: 850, images: ['/uploads/Security Smart Camera.png'], stock: 40 },
    { _id: 'demo9', name: 'Smart Box', slug: 'smart-box', price: 2999, images: ['/uploads/Smart Box.png'], stock: 12 },
    { _id: 'demo10', name: 'Macbook Air M3', slug: 'macbook-air-m3', price: 98000, images: ['/uploads/Macebook Air M3.png'], stock: 6 },
    { _id: 'demo11', name: 'Mini Speaker', slug: 'mini-speaker', price: 2400, images: ['/uploads/Mini Speaker.png'], stock: 35 },
    { _id: 'demo12', name: 'ENTERTAINMENT & GAMES Pack', slug: 'entertainment-games-pack', price: 450, images: ['/uploads/ENTERTAINMENT & GAMES.png'], stock: 50 }
  ];

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        // Backend supports basic category filtering and featured; for search we'll fetch all and filter client-side
        const res = await API.get('/products');
        if (cancelled) return;
        const apiItems = (res.data && res.data.length) ? res.data : [];
        // merge demo products with API results, prefer API items when slugs collide
        const merged = [];
        const seen = new Set();
        const pushIfNew = (it) => {
          const key = it.slug || it._id;
          if (!key || seen.has(key)) return;
          seen.add(key);
          merged.push(it);
        };
        apiItems.forEach(pushIfNew);
        DEMO_PRODUCTS.forEach(pushIfNew);

        const term = q.trim().toLowerCase();
        const filtered = merged.filter(p => (p.name||'').toLowerCase().includes(term) || (p.description||'').toLowerCase().includes(term) || (p.category||'').toLowerCase().includes(term) || (p.slug||'').toLowerCase().includes(term));
        setResults(filtered);
      } catch (e) {
        console.error('Search API failed, falling back to demo products', e);
        const term = q.trim().toLowerCase();
        const filtered = DEMO_PRODUCTS.filter(p => (p.name||'').toLowerCase().includes(term) || (p.description||'').toLowerCase().includes(term) || (p.category||'').toLowerCase().includes(term) || (p.slug||'').toLowerCase().includes(term));
        setResults(filtered);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [q]);

  return (
    <div className="container">
      <h2>Search results for "{q}"</h2>
      {loading ? <div className="loading">Loading...</div> : (
        results.length === 0 ? (
          <div>No products found.</div>
        ) : (
          <div className="grid">
            {results.map(p => <ProductCard key={p._id} p={p} />)}
          </div>
        )
      )}
    </div>
  );
}
