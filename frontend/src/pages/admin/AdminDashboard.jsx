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
      loadData();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const toggleFeatured = async (id, current) => {
    try {
      await API.put(`/products/${id}`, { featured: !current });
      setProducts(products.map(p => p._id === id ? { ...p, featured: !current } : p));
    } catch (err) {
      alert('Failed to update product');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Admin Dashboard - Elecrocart</h2>
        <div className="admin-header-actions">
          <Link to="/admin/add" className="btn-primary">Add New Product</Link>
          <Link to="/admin/orders" className="btn-primary">Manage Orders & Delivery</Link>
        </div>
      </div>

      {analytics && (
        <div className="analytics-section">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Sales</h3>
              <p className="stat-value">Rs {analytics.totalSales?.toLocaleString() || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Orders</h3>
              <p className="stat-value">{analytics.totalOrders || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Products</h3>
              <p className="stat-value">{products.length}</p>
            </div>
            <div className="stat-card">
              <h3>Featured Products</h3>
              <p className="stat-value">{products.filter(p => p.featured).length}</p>
            </div>
          </div>

          {analytics.salesByMonth && analytics.salesByMonth.length > 0 && (
            <div className="chart-container">
              <h3>Sales Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.salesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8884d8" name="Revenue (Rs)" />
                  <Line type="monotone" dataKey="count" stroke="#82ca9d" name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {analytics.topProducts && analytics.topProducts.length > 0 && (
            <div className="chart-container">
              <h3>Top Selling Products</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="productName" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalSold" fill="#8884d8" name="Units Sold" />
                  <Bar dataKey="totalRevenue" fill="#82ca9d" name="Revenue (Rs)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="products-section">
        <h3>All Products</h3>
        <div className="products-grid">
        {products.map(p => (
            <div key={p._id} className="admin-product-card">
              <div className="product-image">
                {(() => {
                  const raw = p.images?.[0] || UPLOAD_FALLBACK[p.slug] || null;
                  const src = raw ? resolveImageUrl(raw) : null;
                  return src ? (
                    <img src={src} alt={p.name} title={p.name} onError={(e) => { const { local, remote } = resolveImageSrc(raw.startsWith('/') ? raw : `/uploads/${raw}`); if (remote && e.currentTarget.src !== remote) e.currentTarget.src = remote; else e.currentTarget.src = ''; }} />
                  ) : (
                    <div className="placeholder-img">No Image</div>
                  );
                })()}
              </div>
              <div className="product-info">
            <h4>{p.name}</h4>
                <p className="price">Rs {p.price}</p>
                <p className="stock">Stock: {p.stock}</p>
                <p className="category">Category: {p.category || 'Uncategorized'}</p>
              </div>
              <div className="product-actions">
                <Link to={`/admin/edit/${p._id}`} className="btn-edit">Edit</Link>
                <button onClick={() => toggleFeatured(p._id, p.featured)} className={p.featured ? 'btn-featured active' : 'btn-featured'}>
                  {p.featured ? '★ Featured' : '☆ Feature'}
                </button>
                <button onClick={() => remove(p._id)} className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
        </div>
      </div>

  {/* uploads gallery removed */}
    </div>
  );
}
