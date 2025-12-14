import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { Link } from 'react-router-dom';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await API.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

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

      <div className="orders-grid">
        {orders.map(order => (
          <div key={order._id} className="order-card">
            <div className="order-header">
              <h3>Order #{order._id.slice(-8)}</h3>
              <span className={`status-badge ${order.status}`}>{order.status}</span>
            </div>
            
            <div className="order-info">
              <p><strong>Customer:</strong> {order.user?.name || order.user?.email || 'N/A'}</p>
              <p><strong>Total:</strong> Rs {order.total?.toFixed(2)}</p>
              <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Delivery Status:</strong> 
                <span className={`delivery-status ${order.deliveryStatus || 'pending'}`}>
                  {order.deliveryStatus || 'pending'}
                </span>
              </p>
              {order.trackingNumber && (
                <p><strong>Tracking:</strong> {order.trackingNumber}</p>
              )}
            </div>

            <div className="order-items">
              <strong>Items:</strong>
              {order.items?.map((item, idx) => (
                <div key={idx} className="order-item">
                  {item.product?.name || 'Product'} - Qty: {item.quantity} - Rs {item.price}
                </div>
              ))}
            </div>

            {order.deliveryUpdates && order.deliveryUpdates.length > 0 && (
              <div className="delivery-timeline">
                <strong>Delivery Updates:</strong>
                {order.deliveryUpdates.map((update, idx) => (
                  <div key={idx} className="timeline-item">
                    <span className="timeline-date">{new Date(update.timestamp).toLocaleString()}</span>
                    <span className="timeline-status">{update.status}</span>
                    {update.location && <span className="timeline-location">{update.location}</span>}
                  </div>
                ))}
              </div>
            )}

            <div className="order-actions">
              <button 
                onClick={() => setSelectedOrder(order)}
                className="btn-edit"
              >
                Update Status
              </button>
            </div>
          </div>
        ))}
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

