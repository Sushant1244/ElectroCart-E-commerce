import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/api';
import { resolveImageSrc } from '../utils/resolveImage';

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(undefined);
  const [imageUrls, setImageUrls] = useState([]); // array of { local, remote, url }
  const [mainImageObj, setMainImageObj] = useState(null);

  const DEMOS = {
    'alpha-watch-ultra': { _id: 'demo1', name: 'Alpha Watch ultra', slug: 'alpha-watch-ultra', price: 3500, images: ['/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png'], stock: 10, featured: true, description: 'Demo Alpha Watch' },
    'wireless-headphones': { _id: 'demo2', name: 'Wireless Headphones', slug: 'wireless-headphones', price: 3200, images: ['/uploads/Wireless Headphones.png'], stock: 25, description: 'Demo headphones' },
    'homepad-mini': { _id: 'demo3', name: 'Homepad mini', slug: 'homepad-mini', price: 1200, images: ['/uploads/Homepad mini.png'], stock: 50 },
    'matrixsafe-charger': { _id: 'demo4', name: 'MatrixSafe Charger', slug: 'matrixsafe-charger', price: 1700, images: ['/uploads/MatrixSafe Charger.png'], stock: 30 },
    'iphone-15-pro-max': { _id: 'demo5', name: 'Iphone 15 Pro max', slug: 'iphone-15-pro-max', price: 178900, images: ['/uploads/Iphone 15 pro ma.png'], stock: 15, featured: true },
    'macbook-m2-dark-gray': { _id: 'demo6', name: 'Macbook M2 Dark gray', slug: 'macbook-m2-dark-gray', price: 117000, images: ['/uploads/MacBook Air M4.png'], stock: 8 },
  };

  useEffect(() => {
    let cancelled = false;
    setProduct(undefined);
    if (!slug) { navigate('/'); return; }
    API.get(`/products/${slug}`).then(res => { if (!cancelled) setProduct(res.data); }).catch(err => {
      console.error('Failed to load product', err?.message || err);
      if (!cancelled) {
        const demo = DEMOS[slug] || Object.values(DEMOS).find(d => (d.slug === slug) || ((d.name || '').toLowerCase().includes((slug || '').replace(/-/g,' ').toLowerCase())));
        if (demo) setProduct(demo);
        else setProduct(null);
      }
    });
    return () => { cancelled = true; };
  }, [slug]);

  // Helper to normalize many image shapes into a list of candidate paths
  const normalizeImages = (imgs) => {
    if (!imgs) return [];
    if (Array.isArray(imgs)) return imgs.slice();
    if (typeof imgs === 'string') {
      try { const p = JSON.parse(imgs); if (Array.isArray(p)) return p; } catch (e) {}
      if (imgs.includes(',')) return imgs.split(',').map(s=>s.trim()).filter(Boolean);
      return [imgs];
    }
    if (typeof imgs === 'object') return [imgs];
    return [String(imgs)];
  };

  useEffect(() => {
    if (!product) {
      setImageUrls([]);
      setMainImageObj(null);
      return;
    }
    // attempt to load the public uploads index to help match messy filenames (spaces, emoji)
    let uploadsIndex = null;
    try {
      // the file is bundled under public/uploads/_list.json in dev
      uploadsIndex = require('../../public/uploads/_list.json');
    } catch (e) {
      try {
        // try relative path fetch as a last resort in browser (this code only runs server-side during build/read)
        // leave uploadsIndex null if not available
        uploadsIndex = null;
      } catch (_e) { uploadsIndex = null; }
    }
    const raw = normalizeImages(product.images || []);
    const candidates = [];
    for (let entry of raw) {
      if (!entry) continue;
      if (typeof entry === 'object') {
        if (entry.url) candidates.push(entry.url);
        else if (entry.path) candidates.push(entry.path);
        continue;
      }
      const s = String(entry).trim();
      if (!s) continue;
      if (s.startsWith('http') || s.startsWith('/')) candidates.push(s);
      else candidates.push(`/uploads/${s}`);
    }

    // fallback map
    const FALLBACK = {
      'alpha-watch-ultra': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
      'alpha-watch-series': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
      'wireless-headphones': '/uploads/Wireless Headphones.png',
      'homepad-mini': '/uploads/Homepad mini.png',
      'matrixsafe-charger': '/uploads/MatrixSafe Charger.png',
      'iphone-15-pro-max': '/uploads/Iphone 15 pro ma.png',
      'macbook-m2-dark-gray': '/uploads/MacBook Air M4.png',
      'music-magnet-headphone': '/uploads/Music magnet Headphone.jpg',
      'security-smart-camera': '/uploads/Security Smart Camera.png',
      'smart-box': '/uploads/Smart Box.png',
      'mini-speaker': '/uploads/Mini Speaker.png',
      'entertainment-games-pack': '/uploads/ENTERTAINMENT & GAMES.png'
    };

    if (candidates.length === 0 && FALLBACK[product.slug]) candidates.push(FALLBACK[product.slug]);

    // helper: try to match a candidate path to an exact filename in uploadsIndex
    const matchToUploadList = (path) => {
      if (!uploadsIndex || !Array.isArray(uploadsIndex)) return path;
      // extract filename
      const fn = String(path).split('/').pop();
      // try exact match
      const exact = uploadsIndex.find(u => u === fn || u === ` ${fn}` || u.trim() === fn.trim());
      if (exact) return `/uploads/${exact}`;
      // try case-insensitive match ignoring extra spaces
      const cleaned = fn.replace(/\s+/g, ' ').trim().toLowerCase();
      const found = uploadsIndex.find(u => (u || '').replace(/\s+/g,' ').trim().toLowerCase() === cleaned);
      if (found) return `/uploads/${found}`;
      return path;
    };

    const resolved = candidates.map(c => {
      try {
        const adjusted = matchToUploadList(c.startsWith('/') ? c : `/uploads/${c}`);
        const { local, remote } = resolveImageSrc(adjusted.startsWith('/') ? adjusted : `/uploads/${adjusted}`);
        return { local, remote, url: (remote || local || adjusted) };
      } catch (e) { return { local: null, remote: null, url: c }; }
    });

    setImageUrls(resolved);
    setMainImageObj(resolved[0] || null);
  }, [product]);

  if (product === undefined) return <div className="loading">Loading...</div>;
  if (product === null) return (
    <div className="product-page">
      <div className="loading-error">
        <h3>Product not available</h3>
        <p>The product details couldn't be loaded right now. You can try again or continue browsing.</p>
  <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
          <button className="btn" onClick={() => window.location.reload()}>Retry</button>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    </div>
  );

  const chosen = mainImageObj?.url || (imageUrls[0] && imageUrls[0].url) || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="520" height="400"><rect width="100%" height="100%" fill="%23fafafa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="20">No image</text></svg>';

  const addToCart = () => {
    if (product.stock === 0) { alert('This product is out of stock'); return; }
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(item => item.product === product._id);
    if (existingIndex >= 0) cart[existingIndex].quantity += 1;
    else {
      const imgObj = mainImageObj || imageUrls[0] || null;
      cart.push({ product: product._id, name: product.name, price: product.price, quantity: 1, slug: product.slug, image: (imgObj && (imgObj.remote || imgObj.local)) || null });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart');
  };

  return (
    <div className="product-page">
      <div className="images">
        <img
          src={chosen}
          alt={product.name}
          className="main-product-image"
          loading="lazy"
          onError={(e) => {
            try {
              const cur = e.currentTarget.src;
              const obj = imageUrls.find(o => o.url === cur || o.local === cur || o.remote === cur);
              if (obj && obj.remote && cur !== obj.remote) { e.currentTarget.src = obj.remote; return; }
            } catch (err) {}
            e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="520" height="400"><rect width="100%" height="100%" fill="%23fafafa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="20">No image</text></svg>';
            e.currentTarget.onerror = null;
          }}
        />

        {imageUrls && imageUrls.length > 1 && (
          <div className="thumbnails" style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
            {imageUrls.map((obj, idx) => (
              <img
                key={(obj.url || '') + idx}
                src={obj.url}
                alt={`${product.name} ${idx+1}`}
                className={`thumb ${mainImageObj && obj.url === mainImageObj.url ? 'active' : ''}`}
                style={{width:'72px',height:'72px',objectFit:'cover',borderRadius:'6px',border:(mainImageObj && obj.url===mainImageObj.url)? '2px solid #2563eb':'1px solid #eee'}}
                onClick={() => setMainImageObj(obj)}
                onError={(e) => {
                  try { if (obj.remote && e.currentTarget.src !== obj.remote) { e.currentTarget.src = obj.remote; return; } } catch(_ ){}
                  e.currentTarget.style.display = 'none';
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="info">
        {product.featured && <span className="featured-badge">⭐ Featured Product</span>}
        <h2>{product.name}</h2>
        <p className="category-badge">Category: {product.category || 'Uncategorized'}</p>
        <p className="description">{product.description || 'No description available.'}</p>
        <div className="price-stock">
          <h3>
            Rs {product.price}
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="original-price" style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.9rem' }}>
                Rs {product.originalPrice}
              </span>
            )}
          </h3>
          <p className={product.stock > 0 ? 'stock-available' : 'stock-unavailable'}>
            {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
          </p>
        </div>
        <button onClick={addToCart} disabled={product.stock === 0} className={product.stock === 0 ? 'btn-disabled' : ''}>
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}