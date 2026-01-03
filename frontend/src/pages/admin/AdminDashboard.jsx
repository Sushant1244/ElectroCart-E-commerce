import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { resolveImageSrc } from '../../utils/resolveImage';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard(){
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadsList, setUploadsList] = useState([]);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // small slug -> upload fallback map
  const UPLOAD_FALLBACK = {
    'alpha-watch-ultra': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
    'wireless-headphones': '/uploads/Wireless Headphones.png',
    'homepad-mini': '/uploads/Homepad mini.png',
    'matrixsafe-charger': '/uploads/MatrixSafe Charger.png',
    'iphone-15-pro-max': '/uploads/Iphone 15 pro ma.png',
    'macbook-m2-dark-gray': '/uploads/MacBook Air M4.png'
  };

  const resolveImageUrl = (imgPath) => {
    if (!imgPath) return null;
    const { local, remote } = resolveImageSrc(imgPath.startsWith('/') ? imgPath : `/uploads/${imgPath}`);
    return local || remote;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, analyticsRes] = await Promise.all([
        API.get('/products'),
        API.get('/analytics').catch(() => ({ data: null }))
      ]);
      setProducts(productsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete product?')) return;
    try {
    await API.delete(`/products/${id}`);
    setProducts(products.filter(p => p._id !== id));
  try { window.dispatchEvent(new CustomEvent('productsChanged')); localStorage.setItem('productsChanged', String(Date.now())); } catch (err) { /* ignore */ }
  loadData();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const toggleFeatured = async (id, current) => {
    try {
      await API.put(`/products/${id}`, { featured: !current });
      setProducts(products.map(p => p._id === id ? { ...p, featured: !current } : p));
  try { window.dispatchEvent(new CustomEvent('productsChanged')); localStorage.setItem('productsChanged', String(Date.now())); } catch (err) { /* ignore */ }
    } catch (err) {
      alert('Failed to update product');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="admin-sub">Overview and product management</p>
        </div>
        <div className="admin-header-actions">
          <Link to="/admin/add" className="btn-primary">Add New Product</Link>
          <Link to="/admin/orders" className="btn-outline">Manage Orders</Link>
        </div>
      </div>

      {analytics && (
        <section className="analytics-section">
          <div className="stats-grid">
            <div className="stat-card">
              <small>Total Sales</small>
              <div className="stat-value">Rs {analytics.totalSales?.toLocaleString() || 0}</div>
            </div>
            <div className="stat-card">
              <small>Total Orders</small>
              <div className="stat-value">{analytics.totalOrders || 0}</div>
            </div>
            <div className="stat-card">
              <small>Total Products</small>
              <div className="stat-value">{products.length}</div>
            </div>
            <div className="stat-card">
              <small>Featured</small>
              <div className="stat-value">{products.filter(p => p.featured).length}</div>
            </div>
          </div>

          <div className="charts-row">
            {analytics.salesByMonth && analytics.salesByMonth.length > 0 && (
              <div className="chart-card">
                <h4>Sales Over Time</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={analytics.salesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#4f46e5" name="Revenue" />
                    <Line type="monotone" dataKey="count" stroke="#10b981" name="Orders" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {analytics.topProducts && analytics.topProducts.length > 0 && (
              <div className="chart-card">
                <h4>Top Selling Products</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productName" angle={-30} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalSold" fill="#4f46e5" name="Units Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="products-section">
        <div className="products-header">
          <h3>All Products</h3>
          <p className="muted">Manage your catalog — edit, feature or remove products.</p>
        </div>

        <div className="products-grid">
          {products.map(p => (
            <article key={p._id} className="admin-product-card">
              <div className="card-media">
                {(() => {
                  const raw = p.images?.[0] || UPLOAD_FALLBACK[p.slug] || null;
                  const src = raw ? resolveImageUrl(raw) : null;
                  return src ? (
                    <img
                      src={src}
                      alt={p.name}
                      title={p.name}
                      loading="lazy"
                      onError={(e) => {
                        try {
                          const { local, remote } = resolveImageSrc(raw.startsWith('/') ? raw : `/uploads/${raw}`);
                          // try remote backend URL if local public URL failed
                          const candidates = [];
                          if (remote) candidates.push(remote);
                          // also try a decoded variant in case encoding issues exist
                          try { candidates.push(decodeURI(remote)); } catch (error_) { console.debug('decodeURI failed', error_); }
                          // finally try the local path again
                          if (local) candidates.push(local);

                          for (const c of candidates) {
                            if (!c) continue;
                            if (e.currentTarget.src === c) continue;
                            e.currentTarget.src = c;
                            return;
                          }
                        } catch (error_) {
                          console.debug('image onError candidates failed', error_);
                        }
                        // last resort: use an inline SVG placeholder
                        e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="14">Image not available</text></svg>';
                      }}
                    />
                  ) : (
                    <div className="placeholder-img">No Image</div>
                  );
                })()}
                {p.featured && <span className="badge-featured">Featured</span>}
              </div>

              <div className="card-body">
                <h4 className="card-title">{p.name}</h4>
                <div className="product-meta">
                  <div className="price">Rs {p.price}</div>
                  <div className="stock">Stock: {p.stock}</div>
                </div>
                <div className="product-actions">
                  <Link to={`/admin/edit/${p._id}`} className="btn-edit">Edit</Link>
                  <a className="btn-view" href={`/product/${p.slug}`} target="_blank" rel="noreferrer">View</a>
                  <button onClick={() => toggleFeatured(p._id, p.featured)} className={p.featured ? 'btn-featured active' : 'btn-featured'}>
                    {p.featured ? '★' : '☆'}
                  </button>
                  <button onClick={() => remove(p._id)} className="btn-delete">Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
