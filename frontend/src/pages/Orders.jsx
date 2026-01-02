import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/orders/my');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Load orders failed', err);
      if (!err?.response) {
        setError('Cannot reach backend server. Is the API running?');
      } else if (err.response.status === 401) {
        // token invalid or missing — force re-login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      } else {
        setError(err.response.data?.message || 'Failed to load your orders');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

    if (loading) return <div className="loading">Loading your orders...</div>;

    if (error) {
      return (
        <div className="container page">
          <h1>My Orders</h1>
          <div>
            <div style={{color:'#b91c1c', marginBottom:12}}>{error}</div>
            <button className="btn" onClick={loadOrders}>Retry</button>
          </div>
        </div>
      );
    }

    if (!orders || orders.length === 0) {
      return (
        <div className="container page">
          <h1>My Orders</h1>
          <p>You have no orders yet.</p>
        </div>
      );
    }

    return (
      <div className="container page">
        <h1>My Orders</h1>
        <div className="orders-grid">
          {orders.map(o => (
            <div key={o._id} className="order-card">
              <h3>Order #{String(o._id).slice(-8)}</h3>
              <p><strong>Date:</strong> {new Date(o.createdAt).toLocaleString()}</p>
              <p><strong>Total:</strong> Rs {(o.totalPrice || o.total || 0).toFixed(2)}</p>
              <p><strong>Status:</strong> {o.status}</p>
              <div>
                <strong>Shipping Address</strong>
                <div>{o.shippingAddress?.fullName || o.shippingAddress?.name || ''}</div>
                <div>{o.shippingAddress?.line1 || o.shippingAddress?.address}</div>
                <div>{o.shippingAddress?.line2}</div>
                <div>{o.shippingAddress?.city} {o.shippingAddress?.postalCode}</div>
                <div>{o.shippingAddress?.country}</div>
              </div>
              <div className="order-items">
                <strong>Items:</strong>
                {o.items?.map((it, idx) => (
                  <div key={it._id || it.id || it.product?.id || idx}>{it.product?.name || it.name || 'Product'} - Qty: {it.quantity} - Rs {it.price}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
}
