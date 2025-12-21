import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/api';
import { resolveImageSrc } from '../utils/resolveImage';

export default function ProductPage(){
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(undefined);
  // Demo fallback products used when backend is unavailable
  const DEMOS = {
    'alpha-watch-ultra': { _id: 'demo1', name: 'Alpha Watch ultra', slug: 'alpha-watch-ultra', price: 3500, images: ['/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png'], stock: 10, featured: true, description: 'Demo Alpha Watch' },
    'wireless-headphones': { _id: 'demo2', name: 'Wireless Headphones', slug: 'wireless-headphones', price: 3200, images: ['/uploads/Wireless Headphones.png'], stock: 25, description: 'Demo headphones' },
    'homepad-mini': { _id: 'demo3', name: 'Homepad mini', slug: 'homepad-mini', price: 1200, images: ['/uploads/Homepad mini.png'], stock: 50 },
    'matrixsafe-charger': { _id: 'demo4', name: 'MatrixSafe Charger', slug: 'matrixsafe-charger', price: 1700, images: ['/uploads/MatrixSafe Charger.png'], stock: 30 },
    'iphone-15-pro-max': { _id: 'demo5', name: 'Iphone 15 Pro max', slug: 'iphone-15-pro-max', price: 178900, images: ['/uploads/Iphone 15 pro ma.png'], stock: 15, featured: true },
    'macbook-m2-dark-gray': { _id: 'demo6', name: 'Macbook M2 Dark gray', slug: 'macbook-m2-dark-gray', price: 117000, images: ['/uploads/MacBook Air M4.png'], stock: 8 },
    // extra demo items present on the home page
    'music-magnet-headphone': { _id: 'demo7', name: 'Music Magnet Headphone', slug: 'music-magnet-headphone', price: 14500, images: ['/uploads/Music magnet Headphone.jpg'], stock: 20 },
    'security-smart-camera': { _id: 'demo8', name: 'Security Smart Camera', slug: 'security-smart-camera', price: 850, images: ['/uploads/Security Smart Camera.png'], stock: 40 },
    'smart-box': { _id: 'demo9', name: 'Smart Box', slug: 'smart-box', price: 2999, images: ['/uploads/Smart Box.png'], stock: 12 },
    'mini-speaker': { _id: 'demo11', name: 'Mini Speaker', slug: 'mini-speaker', price: 2400, images: ['/uploads/Mini Speaker.png'], stock: 35 },
    'entertainment-games-pack': { _id: 'demo12', name: 'ENTERTAINMENT & GAMES Pack', slug: 'entertainment-games-pack', price: 450, images: ['/uploads/ENTERTAINMENT & GAMES.png'], stock: 50 }
  };

  useEffect(()=> {
  let cancelled = false;
  // indicate loading state
  setProduct(undefined);
  if (!slug) { navigate('/'); return; }
  API.get(`/products/${slug}`).then(res => { if (!cancelled) setProduct(res.data); }).catch(err => {
    // If backend is down, attempt to show a local demo product so the page still renders.
    console.error('Failed to load product', err?.message || err);
    if (!cancelled) {
      // direct exact-key match first
      let demo = DEMOS[slug];
      // fallback: try to find a demo whose slug or name resembles the requested slug
      if (!demo) {
        const needle = (slug || '').replace(/-/g, ' ').toLowerCase();
        demo = Object.values(DEMOS).find(d => (d.slug === slug) || ((d.name || '').toLowerCase().includes(needle)));
      }
      if (demo) setProduct(demo);
      else setProduct(null);
    }
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
    const refetch = async () => {
      // show loading
      setProduct(undefined);
      try {
        const res = await API.get(`/products/${slug}`);
        setProduct(res.data);
        return;
      } catch (err) {
        console.error('Refetch failed', err);
      }
      // fallback to demo product if available
      const demo = DEMOS[slug];
      if (demo) setProduct(demo);
      else setProduct(null);
    };

    return (
      <div className="product-page">
        <div className="loading-error">
          <h3>Product not available</h3>
          <p>The product details couldn't be loaded right now. You can try again or continue browsing.</p>
          <div style={{display: 'flex', gap: 8, marginTop: 12}}>
            <button className="btn" onClick={refetch}>Retry</button>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Home</button>
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
  ,
  // extra demo fallbacks
  'music-magnet-headphone': '/uploads/Music magnet Headphone.jpg',
  'security-smart-camera': '/uploads/Security Smart Camera.png',
  'smart-box': '/uploads/Smart Box.png',
  'mini-speaker': '/uploads/Mini Speaker.png',
  'entertainment-games-pack': '/uploads/ENTERTAINMENT & GAMES.png'
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
      // prefer the already-resolved main image
      if (!imgUrl && resolvedSrc) imgUrl = resolvedSrc;

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