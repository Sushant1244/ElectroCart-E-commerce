import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';

export default function Payment() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('cod');
  const [loading, setLoading] = useState(false);

  const cart = (() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) { return []; }
  })();
  const shippingAddress = (() => {
    try { return JSON.parse(localStorage.getItem('shippingAddress') || 'null'); } catch (e) { return null; }
  })();

  const total = cart.reduce((s,c) => s + (c.price || 0) * (c.quantity || 1), 0);

  const placeOrder = async () => {
    if (!shippingAddress) return alert('Please save a shipping address first');
    setLoading(true);
    try {
      const payload = {
        items: cart,
        shippingAddress,
        total,
        paymentMethod: method
      };

      // For demo, backend marks paid for online methods and not for COD
      const res = await API.post('/orders', payload);
      localStorage.removeItem('cart');
      navigate('/');
      alert('Order placed successfully');
    } catch (err) {
      console.error('Place order failed', err);
      alert(err?.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page">
      <h1>Payment</h1>
      <div className="payment-methods">
        <label>
          <input type="radio" name="pm" value="cod" checked={method==='cod'} onChange={() => setMethod('cod')} /> Cash on Delivery
        </label>
        <label>
          <input type="radio" name="pm" value="esewa" checked={method==='esewa'} onChange={() => setMethod('esewa')} /> eSewa
        </label>
        <label>
          <input type="radio" name="pm" value="khalti" checked={method==='khalti'} onChange={() => setMethod('khalti')} /> Khalti
        </label>
        <label>
          <input type="radio" name="pm" value="bank" checked={method==='bank'} onChange={() => setMethod('bank')} /> Bank Transfer
        </label>
      </div>

      {method === 'bank' && (
        <div className="bank-details">
          <h3>Bank transfer details</h3>
          <p>Account: 1234567890</p>
          <p>Bank: Example Bank</p>
          <p>IFSC: EXAMP0001</p>
          <p>Please make the transfer and use the reference as your order number.</p>
        </div>
      )}

      <div style={{marginTop:20}}>
        <button className="btn btn-primary" onClick={placeOrder} disabled={loading}>{loading ? 'Placing order...' : `Pay ${total.toFixed(2)}`}</button>
      </div>
    </div>
  );
}
