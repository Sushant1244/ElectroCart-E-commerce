import React, { useEffect, useState } from 'react';
import './admin.css';
import API from '../../api/api';
import { resolveImageSrc } from '../../utils/resolveImage';
import { Link, useNavigate } from 'react-router-dom';
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
  const [exportMsg, setExportMsg] = useState('');
  const navigate = useNavigate();
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('All Categories');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All Status');

  const UPLOAD_FALLBACK = {
    'alpha-watch-ultra': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
    'wireless-headphones': '/uploads/Wireless Headphones.png',
    'homepad-mini': '/uploads/Homepad mini.png',
    'matrixsafe-charger': '/uploads/MatrixSafe Charger.png',
    'iphone-15-pro-max': '/uploads/Iphone 15 pro ma.png',
    'macbook-m2-dark-gray': '/uploads/MacBook Air M4.png'
  };

  const resolveImageUrl = (imgPath) => {
    // always return a usable url; fall back to a small placeholder in the Vite public folder
    if (!imgPath) return '/vite.svg';
    try {
      const lookupPath = imgPath.startsWith('/') ? imgPath : `/uploads/${imgPath}`;
      const { local, remote } = resolveImageSrc(lookupPath);
      const url = local || remote || lookupPath;
      return encodeURI(url);
    } catch (e) {
      const url = imgPath.startsWith('/') ? imgPath : `/uploads/${imgPath}`;
      return encodeURI(url);
    }
  };

  // currency formatter for Nepal Rupee (NPR)
  const currencyFormatter = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 2 });
  const formatCurrency = (v) => {
    // handle null/undefined gracefully
    const num = Number(v ?? 0) || 0;
    return currencyFormatter.format(num);
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

  // Export orders to CSV
  const exportOrders = () => {
    try {
  console.log('Export Orders clicked — orders length:', orders && orders.length);
  const list = orders && orders.length ? orders : (recentOrders || []);
      if (!list || list.length === 0) return alert('No orders to export');
      const headers = ['Order ID','Customer','Email','Total','Status','Date'];
      const rows = list.map(o => [o.id || o._id || '', (o.customer || o.name || ''), (o.email || ''), (o.total || ''), (o.status || ''), (o.date || o.createdAt || '')]);
      const csvContent = [headers, ...rows].map(r => r.map(v => '"' + String(v ?? '').replace(/"/g,'""') + '"').join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
  console.log('Export Orders created file for', list.length, 'rows');
  setExportMsg(`Exported ${list.length} orders`);
  // auto-clear message after a few seconds
  setTimeout(() => setExportMsg(''), 4000);
    } catch (err) {
      console.error('Export orders failed', err);
  setExportMsg('Export failed — see console');
  console.error(err);
    }
  };

  // Restock a product: prompt for quantity to ADD and update backend
  const restockProduct = async (product) => {
    try {
      const addStr = window.prompt(`Enter quantity to add to "${product.name}" (current: ${product.stock || 0})`, '10');
      if (addStr === null) return; // cancelled
      const add = Number(addStr);
      if (!Number.isFinite(add) || add <= 0) return alert('Please enter a positive number');
      const newStock = (Number(product.stock) || 0) + add;
      // call backend (admin route) to update product stock; updateProduct maps 'stock' to countInStock
      const res = await API.put(`/products/${product._id}`, { stock: newStock });
      const updated = res.data;
      // update local products state
      setProducts((prev) => prev.map(p => (p._id === updated._id ? updated : p)));
      alert(`Updated stock for ${updated.name} → ${updated.stock}`);
    } catch (err) {
      console.error('Restock failed', err);
      const msg = err?.response?.data?.message || 'Failed to restock product. Are you an admin and is the backend running?';
      alert(msg);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  // computed filtered lists
  const filteredProducts = products.filter(p => {
    const q = productSearch.trim().toLowerCase();
    if (q && !(p.name || '').toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q) && !(p.category || '').toLowerCase().includes(q)) return false;
    if (productCategory && productCategory !== 'All Categories' && (p.category || '') !== productCategory) return false;
    return true;
  });

  const filteredOrders = (orders && orders.length ? orders : []).filter(o => {
    const q = orderSearch.trim().toLowerCase();
    if (q && !((o.customer || o.name || '').toLowerCase().includes(q) || (o.email || '').toLowerCase().includes(q) || (String(o.id || o._id || '')).includes(q))) return false;
    if (orderStatusFilter && orderStatusFilter !== 'All Status' && (o.status || '').toLowerCase() !== orderStatusFilter.toLowerCase()) return false;
    return true;
  });

  // Derived stats with safe fallbacks
  // Prefer analytics.totalSales when present. If analytics is not available, fall back
  // to summing salesByMonth (if provided) or summing the loaded orders as a last resort.
  const totalRevenue = (
    (analytics && typeof analytics.totalSales === 'number' ? Number(analytics.totalSales) : null) ??
    (analytics && Array.isArray(analytics.salesByMonth) ? analytics.salesByMonth.reduce((s, r) => s + (Number(r.total) || 0), 0) : null) ??
    (orders && orders.length ? orders.reduce((s, o) => s + (Number(o.total) || 0), 0) : 0)
  );
  const totalOrders = analytics?.totalOrders || (orders.length || 0);
  // Top products: prefer analytics payload; otherwise derive from product.sold; if still empty, derive from recent orders
  let topProducts = analytics?.topProducts || products.slice().sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 6).map(p => ({ productId: p._id, productName: p.name, totalSold: p.sold || 0, price: p.price, image: p.images?.[0] || UPLOAD_FALLBACK[p.slug] }));
  if ((!topProducts || topProducts.length === 0) && orders && orders.length) {
    const counts = {};
    for (const o of orders) {
      const items = o.items || o.orderItems || [];
      for (const it of items) {
        const pid = it.product || it.productId || it._id || it.id || it.slug || it.name;
        const qty = Number(it.quantity || 1) || 1;
        const name = it.name || it.productName || '';
        counts[pid] = counts[pid] || { totalSold: 0, name, price: it.price || 0, image: (it.image || '') };
        counts[pid].totalSold += qty;
      }
    }
    topProducts = Object.keys(counts).map(k => {
      const entry = counts[k];
      // try to find a matching product in the loaded products array by id, slug, or name
      const byId = products.find(p => (p._id && String(p._id) === String(k)) || (p.id && String(p.id) === String(k)));
      const bySlug = products.find(p => p.slug && String(p.slug) === String(k));
      const byName = products.find(p => p.name && String(p.name).toLowerCase() === String(k).toLowerCase());
      const matched = byId || bySlug || byName;
      const image = entry.image || (matched && (matched.images?.[0] || UPLOAD_FALLBACK[matched.slug])) || '';
      const price = entry.price || (matched && matched.price) || 0;
      return { productId: k, productName: entry.name || (matched && matched.name) || k, totalSold: entry.totalSold, price, image };
    }).sort((a,b)=>b.totalSold-a.totalSold).slice(0,6);
  }
  const lowStock = products.filter(p => Number(p.stock) < 20).slice(0, 6);

  // Helper to build salesByMonth from orders when analytics is not available
  const deriveSalesByMonthFromOrders = (ordersList) => {
    if (!ordersList || ordersList.length === 0) return [];
    // Build totals keyed by YYYY-MM so we can present last 6 months
    const totals = {};
    for (const o of ordersList) {
      const dt = new Date(o.date || o.createdAt || o.created_at || o.created_at || Date.now());
      if (isNaN(dt)) continue;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const amt = Number(o.total || o.orderTotal || o.amount || 0) || 0;
      totals[key] = (totals[key] || 0) + amt;
    }
    // produce last 6 months labels ending this month
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleString(undefined, { month: 'short' });
      months.push({ monthKey: key, month: monthName, total: Number(totals[key] || 0) });
    }
    return months.map(m => ({ month: m.month, total: Number(m.total) || 0 }));
  };

  let salesByMonth = (analytics?.salesByMonth || []);
  // normalize numbers if analytics provided
  if (Array.isArray(salesByMonth) && salesByMonth.length > 0) {
    salesByMonth = salesByMonth.map(r => ({ ...r, total: Number(r.total) || 0 }));
  } else {
    salesByMonth = deriveSalesByMonthFromOrders(orders);
  }

  // If still empty or all zeros, fall back to example data to keep UI populated
  const fallbackSales = [
    { month: 'Jan', total: 42000 },
    { month: 'Feb', total: 52000 },
    { month: 'Mar', total: 60000 },
    { month: 'Apr', total: 56000 },
    { month: 'May', total: 72000 },
    { month: 'Jun', total: 82000 }
  ];
  const anyReal = Array.isArray(salesByMonth) && salesByMonth.some(r => Number(r.total) > 0);
  if (!anyReal) salesByMonth = fallbackSales.map(r => ({ ...r, total: Number(r.total) || 0 }));

  // Debug helper: surface the computed salesByMonth in console to help diagnose empty charts
  console.debug('AdminDashboard salesByMonth:', salesByMonth);

  const hasRevenue = Array.isArray(salesByMonth) && salesByMonth.some(r => Number(r.total) > 0);

  const weeklySales = (analytics?.weeklySales || [
    { day: 'Mon', sales: 140 },
    { day: 'Tue', sales: 180 },
    { day: 'Wed', sales: 210 },
    { day: 'Thu', sales: 200 },
    { day: 'Fri', sales: 240 },
    { day: 'Sat', sales: 270 },
    { day: 'Sun', sales: 300 }
  ]).map(r => ({ ...r, sales: Number(r.sales) || 0 }));

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
        <div className="value">{formatCurrency(totalRevenue)}</div>
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
                      {(() => { const { local, remote } = resolveImageSrc(p.images?.[0] || UPLOAD_FALLBACK[p.slug]); return (<img src={local || remote || '/vite.svg'} alt="" loading="lazy" onError={(e)=>{ if (remote && e.currentTarget.src !== remote) e.currentTarget.src = remote; else e.currentTarget.src='/vite.svg'; }} />); })()}
                      <div>
                        <div className="ls-title">{p.name}</div>
                        <div className="muted small">{p.category || 'General'}</div>
                      </div>
                    </div>
                    <div className="ls-item-right">
                      <div className="muted">Only {p.stock} left</div>
                      <button className="btn-primary small" onClick={() => restockProduct(p)}>Restock</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="charts-grid">
            <div className="card">
              <h4>Revenue Overview</h4>
              {hasRevenue ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={salesByMonth} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Line type="monotone" dataKey="total" stroke="#2563eb" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>No revenue data</div>
                    <div style={{ fontSize: 13 }}>No sales recorded for the selected period or analytics backend not available.</div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h4>Sales Trend</h4>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
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
                    {(() => { const { local, remote } = resolveImageSrc(tp.image || ''); return (<img src={local || remote || '/vite.svg'} alt="" loading="lazy" onError={(e)=>{ if (remote && e.currentTarget.src !== remote) e.currentTarget.src = remote; else e.currentTarget.src='/vite.svg'; }} />); })()}
                    <div className="tp-meta">
                      <div className="tp-name">{tp.productName}</div>
                      <div className="muted small">{tp.totalSold} sales</div>
                    </div>
                    <div className="tp-price">{formatCurrency(tp.price)}</div>
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
                    <td>{formatCurrency(o.total)}</td>
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
            <input className="search" placeholder="Search products..." value={productSearch} onChange={e=>setProductSearch(e.target.value)} />
            <select className="filter" value={productCategory} onChange={e=>setProductCategory(e.target.value)}>
              <option>All Categories</option>
              {[...new Set(products.map(p=>p.category).filter(Boolean))].map(c => <option key={c}>{c}</option>)}
            </select>
            <div style={{flex:1}} />
            <button className="btn-outline">Export</button>
            <Link to="/admin/add" className="btn-primary">+ Add Product</Link>
          </div>

          <section className="products-grid v2">
            {filteredProducts.map(p => (
              <article key={p._id} className="product-card">
                <div className="media">
                  {(() => { const { local, remote } = resolveImageSrc(p.images?.[0] || UPLOAD_FALLBACK[p.slug]); return (<img src={local || remote || '/vite.svg'} alt="" loading="lazy" onError={(e)=>{ if (remote && e.currentTarget.src !== remote) e.currentTarget.src = remote; else e.currentTarget.src='/vite.svg'; }} />); })()}
                </div>
                <div className="p-body">
                  <h5>{p.name}</h5>
                  <p className="muted small">{p.description?.slice(0, 80)}</p>
                  <div className="p-meta">
                    <div>{formatCurrency(p.price)}</div>
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
            <input className="search" placeholder="Search orders..." value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} />
            <select className="filter" value={orderStatusFilter} onChange={e=>setOrderStatusFilter(e.target.value)}>
              <option>All Status</option>
              {[...new Set((orders||[]).map(o=>o.status).filter(Boolean))].map(s => <option key={s}>{s}</option>)}
            </select>
            <div style={{flex:1}} />
            <button className="btn-primary" onClick={exportOrders}>Export Orders</button>
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
  {filteredOrders.map((o, i) => (
                   <tr key={o.id || i}>
                     <td>{o.id || `ORD-${i + 1}`}</td>
                     <td>{o.customer || o.name}</td>
                     <td>{o.email || '—'}</td>
                     <td>{formatCurrency(o.total || 0)}</td>
                     <td><span className={`badge status-${o.status || 'pending'}`}>{o.status || 'pending'}</span></td>
                     <td>{o.date || '—'}</td>
                     <td><Link to="#" className="link" onClick={(e) => { e.preventDefault(); navigate('/admin/orders', { state: { openOrderId: o._id || o.id } }); }}>View Details</Link></td>
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
