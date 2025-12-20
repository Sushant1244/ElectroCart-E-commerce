import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/api';
import { resolveImageSrc } from '../utils/resolveImage';

export default function ProductPage(){
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(undefined);

  useEffect(()=> {
  let cancelled = false;
  // indicate loading state
  setProduct(undefined);
  if (!slug) { navigate('/'); return; }
  API.get(`/products/${slug}`).then(res => { if (!cancelled) setProduct(res.data); }).catch(err => {
    // fallback map (also used for demo/offline product rendering)
    const FALLBACK = {
      'alpha-watch-ultra': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
      'alpha-watch-series': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
      'wireless-headphones': '/uploads/Wireless Headphones.png',
      'homepad-mini': '/uploads/Homepad mini.png',
      'matrixsafe-charger': '/uploads/MatrixSafe Charger.png',
      'iphone-15-pro-max': '/uploads/Iphone 15 pro ma.png',
      'macbook-m2-dark-gray': '/uploads/MacBook Air M4.png'
    };
      console.error(err);
      if (!cancelled) setProduct(null);
    });
    return () => { cancelled = true; };
  }, [slug]);

  const getImageUrl = (img) => {
    if (!img) return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="520" height="400"><rect width="100%" height="100%" fill="%23fafafa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="20">No image</text></svg>';
    const { local, remote } = resolveImageSrc(img.startsWith('/') ? img : `/uploads/${img}`);
    return local || remote;
  };

  // no-op: fallback map is defined below as FALLBACK

  if (product === undefined) return <div className="loading">Loading...</div>;
  if (product === null) {
    // backend failed to respond or product not found — show friendly fallback and a retry button
    return (
      <div className="product-page">
        <div className="loading-error">
          <h3>Product not available</h3>
          <p>The product details couldn't be loaded right now. You can try again or continue browsing.</p>
          <div style={{marginTop:12}}>
            <button className="btn" onClick={() => window.location.reload()}>Retry</button>
            <a href="/" className="btn btn-primary" style={{marginLeft:8}}>Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  // choose first image; if none, use fallback map based on slug
  const FALLBACK = {
    'alpha-watch-ultra': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
    'alpha-watch-series': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
    'wireless-headphones': '/uploads/Wireless Headphones.png',
    'homepad-mini': '/uploads/Homepad mini.png',
    'matrixsafe-charger': '/uploads/MatrixSafe Charger.png',
    'iphone-15-pro-max': '/uploads/Iphone 15 pro ma.png',
    'macbook-m2-dark-gray': '/uploads/MacBook Air M4.png'
  };

  // If product has images use first. Otherwise try slug fallback, then name-based fallback for common words like 'watch'.
  let mainImage = product.images?.[0] ?? FALLBACK[product.slug] ?? null;
  if (!mainImage && product.name && /watch/i.test(product.name)) {
    mainImage = FALLBACK['alpha-watch-series'] || FALLBACK['alpha-watch-ultra'] || null;
  }

  // Resolve a final image src to always render an image element (use fallback if needed)
  const resolvedSrc = mainImage ? getImageUrl(mainImage) : getImageUrl(FALLBACK['alpha-watch-series'] || FALLBACK['alpha-watch-ultra']);

  const addToCart = () => {
    if (product.stock === 0) {
      alert('This product is out of stock');
      return;
    }
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(item => item.product === product._id);
    
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      // store the resolved, encoded URL so cart can render directly
      let imgUrl = null;
      if (product.images?.[0]) imgUrl = getImageUrl(product.images[0]);
      else if (FALLBACK[product.slug]) imgUrl = getImageUrl(FALLBACK[product.slug]);

      cart.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        slug: product.slug,
        image: imgUrl,
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart');
  };

  return (
    <div className="product-page">
      <div className="images">
        <img
          src={resolvedSrc}
          alt={product.name}
          className="main-product-image"
          loading="lazy"
          title={resolvedSrc}
          onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="520" height="400"><rect width="100%" height="100%" fill="%23fafafa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="20">No image</text></svg>'; e.currentTarget.onerror=null; }}
        />
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
              <span className="original-price" style={{ marginLeft: '12px', textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.9rem' }}>
                Rs {product.originalPrice}
              </span>
            )}
          </h3>
          <p className={product.stock > 0 ? 'stock-available' : 'stock-unavailable'}>
            {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
          </p>
        </div>
        <button 
          onClick={addToCart}
          disabled={product.stock === 0}
          className={product.stock === 0 ? 'btn-disabled' : ''}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}