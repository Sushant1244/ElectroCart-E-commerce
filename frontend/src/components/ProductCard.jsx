import React from 'react';
import { Link } from 'react-router-dom';
import { resolveImageSrc } from '../utils/resolveImage';

export default function ProductCard({ p }) {
  // Fallback map: when the API returns generic names (Image 1.png) or images are missing,
  // use a known filename from backend/uploads based on product slug.
  const UPLOAD_FALLBACK = {
    'alpha-watch-ultra': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
    'wireless-headphones': '/uploads/Wireless Headphones.png',
    'homepad-mini': '/uploads/Homepad mini.png',
    'matrixsafe-charger': '/uploads/MatrixSafe Charger.png',
    'iphone-15-pro-max': '/uploads/Iphone 15 pro ma.png',
  'macbook-m2-dark-gray': '/uploads/MacBook Air M4.png',
  'music-magnet-headphone': '/uploads/Music magnet Headphone.jpg',
  'security-smart-camera': '/uploads/Security Smart Camera.png',
  'smart-box': '/uploads/Smart Box.png',
  'macbook-air-m3': '/uploads/Macebook Air M3.png',
  'mini-speaker': '/uploads/Mini Speaker.png',
  'entertainment-games-pack': '/uploads/ENTERTAINMENT & GAMES.png'
  };

  const getImageUrl = (img) => {
    if (!img) return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="200"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="14">No image</text></svg>';
    const { local, remote } = resolveImageSrc(img);
    // try local (frontend/public/uploads) first, then remote
    return local || remote;
  };

  // prefer the first product image unless it's a generic 'Image X' filename
  const rawFirst = p.images?.[0];
  let img;
  if (rawFirst && !rawFirst.includes('Image ')) img = getImageUrl(rawFirst);
  else if (UPLOAD_FALLBACK[p.slug]) img = getImageUrl(UPLOAD_FALLBACK[p.slug]);
  else if (p.name && /watch/i.test(p.name)) img = getImageUrl(UPLOAD_FALLBACK['alpha-watch-ultra']);
  else img = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="200"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="14">No image</text></svg>';
  const rating = p.rating || 5;
  
  return (
  <div className="product-card">
      {p.featured && <span className="featured-badge">⭐ Featured</span>}
  <Link to={`/product/${p.slug || p._id}`}>
        <div className="product-image-wrapper">
          <div className="image-square">
            <img
              src={img}
              alt={p.name}
              title={img}
              onError={(e) => {
                // If the browser failed to load local asset, try remote backend URL once.
                try {
                  const { remote } = resolveImageSrc(p.images?.[0] || '');
                  if (remote && e.currentTarget.src !== remote) {
                    e.currentTarget.src = remote;
                    return;
                  }
                } catch (err) {
                  // ignore
                }
                e.currentTarget.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
                e.currentTarget.onerror = null;
              }}
            />
          </div>
        </div>

        <div className="product-rating">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>★</span>
          ))}
        </div>

  <h4 className="product-title">{p.name}</h4>
        {p.description && (
          <p className="product-excerpt" title={p.description}>
            {p.description.length > 140 ? p.description.slice(0, 140) + '…' : p.description}
          </p>
        )}
        
        <div className="product-pricing">
          <span className="current-price">Rs {p.price?.toLocaleString()}</span>
          {p.originalPrice && p.originalPrice > p.price && (
            <span className="original-price">Rs {p.originalPrice?.toLocaleString()}</span>
          )}
        </div>
        {p.stock !== undefined && (
          <>
            {p.stock < 10 && p.stock > 0 && <p className="stock-warning">Only {p.stock} left!</p>}
            {p.stock === 0 && <p className="out-of-stock">Out of Stock</p>}
          </>
        )}
      </Link>
    </div>
  );
}
