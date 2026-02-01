import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { Link, useLocation } from 'react-router-dom';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const location = useLocation();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await API.get('/orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // If navigation included openOrderId in state, open that order once orders are loaded
  useEffect(() => {
    const openId = location?.state?.openOrderId;
    if (!openId) return;
    if (orders && orders.length) {
      const found = orders.find(o => String(o._id || o.id) === String(openId));
      if (found) setSelectedOrder(found);
      // clear history state to avoid reopening on refresh/back
      try { window.history.replaceState({}, document.title); } catch (e) {}
    }
  }, [location, orders]);

  const updateOrderStatus = async (orderId, status, deliveryStatus, trackingNumber) => {
    try {
      await API.patch(`/orders/${orderId}`, {
        status,
        deliveryStatus,
        trackingNumber,
        note: `Status updated to ${deliveryStatus || status}`,
        location: 'Warehouse'
      });
      loadOrders();
      setSelectedOrder(null);
      alert('Order status updated');
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div className="admin-orders">
      <div className="admin-header">
        <h2>Order Management & Delivery Tracking</h2>
      </div>

      <div className="orders-table-wrap">
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
            {orders.map(order => (
              <tr key={order._id || order.id}>
                {
                  (() => {
                    const oid = order.id || order._id || '';
                    const displayId = String(oid);
                    return (
                      <td>{displayId.startsWith('ORD-') ? displayId : `ORD-${displayId.slice(-3)}`}</td>
                    );
                  })()
                }
                <td>{order.customer || order.customerName || order.user?.name || order.user?.email || 'N/A'}</td>
                <td>{order.email || order.emailAddress || order.user?.email || ''}</td>
                <td>{(() => {
                  const totalVal = order.total ?? order.totalPrice ?? order.amount ?? order.grandTotal ?? 0;
                  return typeof totalVal === 'number' ? totalVal.toLocaleString(undefined, { minimumFractionDigits: 0 }) : String(totalVal);
                })()}</td>
                <td>
                  <select
                    className={`status-badge-select ${order.status || 'pending'}`}
                    value={order.status || 'pending'}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      try {
                        await updateOrderStatus(order._id, newStatus, order.deliveryStatus, order.trackingNumber);
                      } catch (err) {}
                    }}
                    aria-label={`Order ${String(order._id).slice(-8)} status`}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td>{(() => {
                  const d = order.createdAt || order.created_at || order.date || order.purchasedAt || order.timestamp || null;
                  try { return d ? new Date(d).toLocaleDateString() : ''; } catch (e) { return ''; }
                })()}</td>
                <td>
                  <button className="link" onClick={() => setSelectedOrder(order)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Update Order Status</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              updateOrderStatus(
                selectedOrder._id,
                formData.get('status'),
                formData.get('deliveryStatus'),
                formData.get('trackingNumber')
              );
            }}>
              <div className="form-group">
                <label>Order Status</label>
                <select name="status" defaultValue={selectedOrder.status}>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label>Delivery Status</label>
                <select name="deliveryStatus" defaultValue={selectedOrder.deliveryStatus || 'pending'}>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tracking Number</label>
                <input 
                  type="text" 
                  name="trackingNumber" 
                  placeholder="Enter tracking number"
                  defaultValue={selectedOrder.trackingNumber || ''}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Update</button>
                <button type="button" onClick={() => setSelectedOrder(null)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

