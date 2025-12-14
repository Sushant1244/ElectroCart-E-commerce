import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ p }) {
  const getImageUrl = (img) => {
    if (!img) return '/placeholder.png';
    if (img.startsWith('http')) return img;
    // Handle both /uploads/ and full paths
    const cleanPath = img.startsWith('/uploads/') ? img : `/uploads/${img}`;
    return `http://localhost:5000${cleanPath}`;
  };
  
  const img = getImageUrl(p.images?.[0]);
  const rating = p.rating || 5;
  
  return (
    <div className="product-card">
      {p.featured && <span className="featured-badge">⭐ Featured</span>}
      <Link to={`/product/${p.slug}`}>
        <div className="product-image-wrapper">
          <img 
            src={img} 
            alt={p.name}
            onError={(e) => { 
              e.target.src = '/placeholder.png';
              e.target.onerror = null;
            }} 
          />
        </div>
        <h4>{p.name}</h4>
        <div className="product-rating">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>★</span>
          ))}
        </div>
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
