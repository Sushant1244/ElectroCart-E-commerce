import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductPage from './pages/ProductPage';
import SearchResults from './pages/SearchResults';
import Cart from './pages/Cart';
import Blog from './pages/Blog';
import Pages from './pages/Pages';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAddProduct from './pages/admin/AdminAddProduct';
import AdminEditProduct from './pages/admin/AdminEditProduct';
import AdminOrders from './pages/admin/AdminOrders';
import Header from './components/Header';
import Footer from './components/Footer';
import API, { setAuthToken } from './api/api';

function App(){
  const parseIsAdmin = (v) => {
    if (v === true || v === 1) return true;
    if (v === false || v === 0) return false;
    if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
    return Boolean(v);
  };

  const storedUser = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      if (!u) return null;
      // normalize isAdmin to boolean in a robust way
      if (u.isAdmin !== undefined) u.isAdmin = parseIsAdmin(u.isAdmin);
      return u;
    } catch (e) {
      return null;
    }
  })();
  const [user, setUser] = useState(storedUser || null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    setAuthToken(token);
  }, []);
  const onLogin = (token, user) => {
    // normalize isAdmin to boolean before storing
    const normalized = { ...user, isAdmin: parseIsAdmin(user?.isAdmin) };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalized));
    setAuthToken(token);
    setUser(normalized);
    return normalized;
  };
  const onLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
    setUser(null);
  };

  return (
    <div className="app">
      <Header user={user} onLogout={onLogout}/>
  <main id="content" className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/pages" element={<Pages />} />
          <Route path="/login" element={<Login onLogin={onLogin} />} />
          <Route path="/register" element={<Register onLogin={onLogin} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={ user?.isAdmin ? <AdminDashboard /> : <Navigate to="/login" /> } />
          <Route path="/admin/add" element={ user?.isAdmin ? <AdminAddProduct /> : <Navigate to="/login" /> } />
          <Route path="/admin/edit/:id" element={ user?.isAdmin ? <AdminEditProduct /> : <Navigate to="/login" /> } />
          <Route path="/admin/orders" element={ user?.isAdmin ? <AdminOrders /> : <Navigate to="/login" /> } />
          <Route path="/contact" element={<div className="container"><h1>Contact Us</h1><p>Email: info@elecrocart.com | Phone: +1234567890</p></div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;