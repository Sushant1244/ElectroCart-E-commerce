import React, { useEffect, useState } from 'react';
import './admin.css';
import API from '../../api/api';
import { resolveImageSrc } from '../../utils/resolveImage';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
    try {
      const { local, remote } = resolveImageSrc(imgPath.startsWith('/') ? imgPath : `/uploads/${imgPath}`);
      return local || remote;
    } catch (e) {
      return imgPath.startsWith('/') ? imgPath : `/uploads/${imgPath}`;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [pRes, aRes, oRes] = await Promise.all([
          API.get('/products').catch(() => ({ data: [] })),
          API.get('/analytics').catch(() => ({ data: null })),
          API.get('/orders').catch(() => ({ data: null }))
        ]);
        setProducts(pRes.data || []);
        setAnalytics(aRes.data || null);
        setOrders((oRes && oRes.data) || []);
      } catch (err) {
        console.debug('load error', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  // Derived stats with safe fallbacks
  const totalRevenue = analytics?.totalSales || (analytics?.salesByMonth ? analytics.salesByMonth.reduce((s, r) => s + (r.total || 0), 0) : 0);
  const totalOrders = analytics?.totalOrders || (orders.length || 0);
  const topProducts = analytics?.topProducts || products.slice().sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 6).map(p => ({ productId: p._id, productName: p.name, totalSold: p.sold || 0, price: p.price, image: p.images?.[0] || UPLOAD_FALLBACK[p.slug] }));
  const lowStock = products.filter(p => Number(p.stock) < 20).slice(0, 6);

  const salesByMonth = analytics?.salesByMonth || [
    { month: 'Jan', total: 42000 },
    { month: 'Feb', total: 52000 },
    { month: 'Mar', total: 60000 },
    { month: 'Apr', total: 56000 },
    { month: 'May', total: 72000 },
    { month: 'Jun', total: 82000 }
  ];

  const weeklySales = analytics?.weeklySales || [
    { day: 'Mon', sales: 140 },
    { day: 'Tue', sales: 180 },
    { day: 'Wed', sales: 210 },
    { day: 'Thu', sales: 200 },
    { day: 'Fri', sales: 240 },
    { day: 'Sat', sales: 270 },
    { day: 'Sun', sales: 300 }
  ];

  const categoryDistribution = analytics?.categoryDistribution || [
    { name: 'Electronics', value: 35 },
    { name: 'Audio', value: 25 },
    { name: 'Computers', value: 20 },
    { name: 'Accessories', value: 15 },
    { name: 'Smart Home', value: 5 }
  ];

  const recentOrders = orders.length ? orders.slice(0, 5) : [
    { id: 'ORD-001', customer: 'John Smith', total: 1598, status: 'delivered', date: '2026-01-08' },
    { id: 'ORD-002', customer: 'Sarah Johnson', total: 448, status: 'shipped', date: '2026-01-09' },
    { id: 'ORD-003', customer: 'Michael Chen', total: 2548, status: 'processing', date: '2026-01-09' },
    { id: 'ORD-004', customer: 'Emily Davis', total: 349, status: 'pending', date: '2026-01-10' },
    { id: 'ORD-005', customer: 'David Wilson', total: 148, status: 'pending', date: '2026-01-10' }
  ];

  const COLORS = ['#4f46e5', '#7c3aed', '#10b981', '#2563eb', '#ffb020'];

  return (
    <div className="admin-v2">
      <header className="admin-top">
        <div className="brand">
          <div className="brand-icon">▢</div>
          <div>
            <h1>Admin Dashboard</h1>
            <div className="sub">Manage your e‑commerce store</div>
          </div>
        </div>
        <div className="top-actions">
          <button className="link-logout">Logout</button>
        </div>
      </header>

      <nav className="nav-tabs">
        {['Overview', 'Products', 'Orders'].map(t => (
          <button key={t} className={`nav-tab ${t === activeTab ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </nav>

      {activeTab === 'Overview' && (
        <main className="overview">
          <section className="stats-cards">
            <div className="stat">
              <small>Total Revenue</small>
              <div className="value">${totalRevenue?.toLocaleString()}</div>
              <div className="delta positive">+12.5%</div>
            </div>
            <div className="stat">
              <small>Total Sales</small>
              <div className="value">{totalOrders}</div>
              <div className="delta positive">+8.3%</div>
            </div>
            <div className="stat">
              <small>Products</small>
              <div className="value">{products.length}</div>
              <div className="muted">{products.reduce((s, p) => s + (Number(p.stock) || 0), 0)} in stock</div>
            </div>
            <div className="stat">
              <small>Total Orders</small>
              <div className="value">{orders.length || totalOrders}</div>
              <div className="delta positive">+15.2%</div>
            </div>
          </section>

          {lowStock.length > 0 && (
            <section className="low-stock">
              <div className="ls-header">
                <div>
                  <strong>Low Stock Alert</strong>
                  <div className="muted">{lowStock.length} products running low on stock (less than 20 units)</div>
                </div>
              </div>
              <div className="ls-list">
                {lowStock.map(p => (
                  <div key={p._id} className="ls-item">
                    <div className="ls-item-left">
                      <img src={resolveImageUrl(p.images?.[0] || UPLOAD_FALLBACK[p.slug])} alt="" />
                      <div>
                        <div className="ls-title">{p.name}</div>
                        <div className="muted small">{p.category || 'General'}</div>
                      </div>
                    </div>
                    <div className="ls-item-right">
                      <div className="muted">Only {p.stock} left</div>
                      <button className="btn-primary small">Restock</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="charts-grid">
            <div className="card">
              <h4>Revenue Overview</h4>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={salesByMonth} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v) => `$${new Intl.NumberFormat().format(v)}`} />
                  <Line type="monotone" dataKey="total" stroke="#2563eb" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h4>Sales Trend</h4>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h4>Category Distribution</h4>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {categoryDistribution.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h4>Top Selling Products</h4>
              <div className="top-products">
                {topProducts.map((tp, i) => (
                  <div key={tp.productId || i} className="top-product-row">
                    <div className="rank">#{i + 1}</div>
                    <img src={resolveImageUrl(tp.image || '')} alt="" />
                    <div className="tp-meta">
                      <div className="tp-name">{tp.productName}</div>
                      <div className="muted small">{tp.totalSold} sales</div>
                    </div>
                    <div className="tp-price">${tp.price || ''}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="recent-orders card">
            <div className="ro-header">
              <h4>Recent Orders</h4>
              <Link to="/admin/orders" className="link">View All</Link>
            </div>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.customer}</td>
                    <td>${o.total}</td>
                    <td><span className={`badge status-${o.status}`}>{o.status}</span></td>
                    <td>{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      )}

      {activeTab === 'Products' && (
        <main className="products-overview">
          <div className="products-actions">
            <input className="search" placeholder="Search products..." />
            <select className="filter"><option>All Categories</option></select>
            <div style={{flex:1}} />
            <button className="btn-outline">Export</button>
            <Link to="/admin/add" className="btn-primary">+ Add Product</Link>
          </div>

          <section className="products-grid v2">
            {products.map(p => (
              <article key={p._id} className="product-card">
                <div className="media">
                  <img src={resolveImageUrl(p.images?.[0] || UPLOAD_FALLBACK[p.slug])} alt="" />
                </div>
                <div className="p-body">
                  <h5>{p.name}</h5>
                  <p className="muted small">{p.description?.slice(0, 80)}</p>
                  <div className="p-meta">
                    <div>${p.price}</div>
                    <div className="muted">{p.stock} in stock</div>
                  </div>
                  <div className="p-actions">
                    <Link to={`/admin/edit/${p._id}`} className="btn-edit small">Edit</Link>
                    <button className="btn-delete small">Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </main>
      )}

      {activeTab === 'Orders' && (
        <main className="orders-overview">
          <div className="orders-actions">
            <input className="search" placeholder="Search orders..." />
            <select className="filter"><option>All Status</option></select>
            <div style={{flex:1}} />
            <button className="btn-primary">Export Orders</button>
          </div>

          <section className="orders-table-wrap card">
            <table className="orders-table full">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(orders.length ? orders : recentOrders).map((o, i) => (
                  <tr key={o.id || i}>
                    <td>{o.id || `ORD-${i + 1}`}</td>
                    <td>{o.customer || o.name}</td>
                    <td>{o.email || '—'}</td>
                    <td>${o.total || 0}</td>
                    <td><span className={`badge status-${o.status || 'pending'}`}>{o.status || 'pending'}</span></td>
                    <td>{o.date || '—'}</td>
                    <td><Link to="#" className="link">View Details</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      )}
    </div>
  );
}
