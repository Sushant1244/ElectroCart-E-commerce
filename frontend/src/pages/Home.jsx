import React, { useEffect, useState } from 'react';
import API from '../api/api';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';

export default function Home(){
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const [allRes, featuredRes] = await Promise.all([
        API.get('/products'),
        API.get('/products?featured=true').catch(() => ({ data: [] }))
      ]);
      setProducts(allRes.data);
      setFeaturedProducts(featuredRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const categories = [
    { name: 'iPhone', image: '📱' },
    { name: 'Mini Speaker', image: '🔊' },
    { name: 'iPad', image: '📱' },
    { name: 'Headphone', image: '🎧' },
    { name: 'Camera', image: '📷' },
    { name: 'Accessories', image: '🔌' }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-banner">
        <div className="hero-slide active">
          <div className="container hero-content-wrapper">
            <div className="hero-content">
              <span className="hero-badge">SALE UP TO 30% OFF</span>
              <h1>Apple Watch Series</h1>
              <p>Featured packed at a better value than over powerful sensors to monitor your fitness.</p>
              <Link to="/#products" className="btn-shop-now">Shop Now →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Categories */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Trending Categories</h2>
          <div className="categories-grid">
            {categories.map((cat, idx) => (
              <div key={idx} className="category-card">
                <div className="category-icon">{cat.image}</div>
                <h4>{cat.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Banners */}
      <section className="promo-section">
        <div className="container">
          <div className="promo-banners">
            <div className="promo-banner">
              <div className="promo-content">
                <h3>Security Smart Camera</h3>
                <p>Just Start at $850</p>
                <button className="btn-promo">Shop Now</button>
              </div>
              <div className="promo-image">📹</div>
            </div>
            <div className="promo-banner">
              <div className="promo-content">
                <h3>ENTERTAINMENT & GAMES</h3>
                <p>Just Start at $450</p>
                <button className="btn-promo">Shop Now</button>
              </div>
              <div className="promo-image">🎮</div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Products */}
      <section className="latest-products" id="products">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Latest Products</h2>
            <Link to="/#products" className="view-all-link">View All Product</Link>
          </div>
          <div className="grid">
            {products.slice(0, 5).map(p => <ProductCard key={p._id} p={p} />)}
          </div>
        </div>
      </section>

      {/* Discount Banner */}
      <section className="discount-banner">
        <div className="container">
          <div className="discount-content">
            <div className="discount-text">
              <button className="hurry-btn">Hurry Up!</button>
              <h2>Up To 20% Discount Check it Out</h2>
              <div className="countdown">
                <div className="countdown-item"><span className="countdown-value">310</span><span className="countdown-label">DAYS</span></div>
                <div className="countdown-item"><span className="countdown-value">02</span><span className="countdown-label">HRS</span></div>
                <div className="countdown-item"><span className="countdown-value">09</span><span className="countdown-label">MNS</span></div>
                <div className="countdown-item"><span className="countdown-value">02</span><span className="countdown-label">SEC</span></div>
              </div>
              <button className="btn-shop-now">SHOP NOW</button>
            </div>
            <div className="discount-images">
              <div className="phone-image">📱</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Products */}
      <section className="popular-products">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Popular Product</h2>
            <div className="category-filters">
              <button className="filter-btn active">All</button>
              <button className="filter-btn">Accessories</button>
              <button className="filter-btn">iPhone</button>
              <button className="filter-btn">Laptop</button>
              <button className="filter-btn">iPad</button>
            </div>
          </div>
          <div className="grid">
            {products.slice(0, 8).map(p => <ProductCard key={p._id} p={p} />)}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="featured-section">
          <div className="container">
            <h2 className="section-title">⭐ Featured Products</h2>
            <div className="grid">
              {featuredProducts.map(p => <ProductCard key={p._id} p={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Blog & Events Section */}
      <section className="blog-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Blog & Events</h2>
            <Link to="/blog" className="view-all-link">View All →</Link>
          </div>
          <div className="blog-grid">
            <div className="blog-card">
              <div className="blog-image">
                <div className="placeholder-blog-img">📻</div>
              </div>
              <div className="blog-date">October 15, 2025</div>
              <h3>Music magnate headphone</h3>
            </div>
            <div className="blog-card">
              <div className="blog-image">
                <div className="placeholder-blog-img">💻</div>
              </div>
              <div className="blog-date">October 15, 2025</div>
              <h3>Macbook air labore at dolore</h3>
            </div>
            <div className="blog-card">
              <div className="blog-image">
                <div className="placeholder-blog-img">🎧</div>
              </div>
              <div className="blog-date">October 15, 2025</div>
              <h3>Music magnate headphone</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Service Features */}
      <section className="service-features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">📦</div>
              <h4>Free Delivery</h4>
              <p>And free returns. See checkout for delivery date.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💳</div>
              <h4>Pay monthly at 0% APR</h4>
              <p>Choose to checkout with Apple Card monthly instalments.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚙️</div>
              <h4>Personalize it</h4>
              <p>Engrave your device with your name or a personal note</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
