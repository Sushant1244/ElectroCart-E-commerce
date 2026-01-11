import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';

export default function Payment() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('cod');
  const [loading, setLoading] = useState(false);

  // detect stored user to block admins from placing orders in the regular checkout flow
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { return null; }
  })();
  const isAdminUser = !!(storedUser && (storedUser.isAdmin === true || String(storedUser.isAdmin) === 'true'));

  const cart = (() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) { return []; }
  })();
  const shippingAddress = (() => {
    try { return JSON.parse(localStorage.getItem('shippingAddress') || 'null'); } catch (e) { return null; }
  })();

  const total = cart.reduce((s,c) => s + (c.price || 0) * (c.quantity || 1), 0);

  const placeOrder = async () => {
  if (isAdminUser) return alert('Admin users are not allowed to place purchases via the public checkout. Use the Admin → Create Order tool to create orders for customers.');
  if (!shippingAddress) return alert('Please save a shipping address first');
    setLoading(true);
    try {
      const payload = { items: cart, shippingAddress, total, paymentMethod: method };
      const res = await API.post('/orders', payload);
      // If order was created, navigate to orders page and include id so user can track it
      const created = res?.data;
      localStorage.removeItem('cart');
      if (created && created._id) {
        navigate('/orders', { state: { justPlacedOrderId: created._id } });
      } else {
        navigate('/');
      }
      alert('Order placed successfully');
    } catch (err) {
      console.error('Place order failed', err);
      // Network error (server not reachable) often shows err.message like 'Network Error' or errno ECONNREFUSED
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;
      if (!err?.response) {
        // No response means the request couldn't reach the server
        alert('Failed to place order — cannot reach backend server. Is the backend running?');
      } else if (status >= 500) {
        alert(serverMessage || 'Server error while placing order. Check backend logs.');
      } else {
        alert(serverMessage || 'Failed to place order');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container payment-page">
      <h1>Checkout & Payment</h1>
      <div className="payment-grid">
        <main>
          <section className="card" style={{padding:20, marginBottom:16}} aria-labelledby="pm-heading">
            <h2 id="pm-heading">Payment Method</h2>
            <div className="payment-methods" role="radiogroup" aria-label="Payment methods" style={{marginTop:12}}>
              <label style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                <input aria-label="Cash on Delivery" type="radio" name="pm" value="cod" checked={method==='cod'} onChange={() => setMethod('cod')} />
                <div>
                  <div style={{fontWeight:600}}>Cash on Delivery</div>
                  <div style={{fontSize:13,color:'#666'}}>Pay when the order is delivered to your address.</div>
                </div>
              </label>

              <label style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                <input aria-label="eSewa" type="radio" name="pm" value="esewa" checked={method==='esewa'} onChange={() => setMethod('esewa')} />
                <div>
                  <div style={{fontWeight:600}}>eSewa</div>
                  <div style={{fontSize:13,color:'#666'}}>Quick online payment via eSewa wallet.</div>
                </div>
              </label>

              <label style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                <input aria-label="Khalti" type="radio" name="pm" value="khalti" checked={method==='khalti'} onChange={() => setMethod('khalti')} />
                <div>
                  <div style={{fontWeight:600}}>Khalti</div>
                  <div style={{fontSize:13,color:'#666'}}>Secure payment using Khalti.</div>
                </div>
              </label>

              <label style={{display:'flex',alignItems:'center',gap:12}}>
                <input aria-label="Bank Transfer" type="radio" name="pm" value="bank" checked={method==='bank'} onChange={() => setMethod('bank')} />
                <div>
                  <div style={{fontWeight:600}}>Bank Transfer</div>
                  <div style={{fontSize:13,color:'#666'}}>Manual bank transfer — upload proof after transfer.</div>
                </div>
              </label>
            </div>
          </section>

          {method === 'bank' && (
            <section className="card" style={{padding:16, marginBottom:16}}>
              <h3 style={{marginTop:0}}>Bank transfer details</h3>
              <p style={{margin:0}}>Account: <strong>1234567890</strong></p>
              <p style={{margin:0}}>Bank: <strong>Example Bank</strong></p>
              <p style={{margin:0}}>IFSC: <strong>EXAMP0001</strong></p>
              <p style={{marginTop:8,color:'#555'}}>Please make the transfer and use your order ID as reference. Upload transfer proof in your order details later.</p>
            </section>
          )}

          <div style={{display:'flex',gap:12}}>
            <button className="btn btn-primary" onClick={placeOrder} disabled={loading} aria-disabled={loading}>
              {loading ? 'Placing order…' : `Pay Rs ${total.toFixed(2)}`}
            </button>
            <button className="btn" onClick={() => navigate('/cart')} disabled={loading}>Back to Cart</button>
          </div>
        </main>

        <aside>
          <div className="card order-summary" style={{padding:16}}>
            <h3 style={{marginTop:0}}>Order Summary</h3>
            <div style={{marginTop:8}}>
              {cart.length === 0 ? <div>No items in cart</div> : (
                <div>
                  {cart.map((c) => (
                    <div key={c._id || c.id || c.slug || c.name} className="item">
                      <div style={{width:48,height:48,overflow:'hidden',borderRadius:6,background:'#f7f7f7',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <img src={c.image || ''} alt={c.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600}}>{c.name}</div>
                        <div style={{fontSize:13,color:'#666'}}>Qty: {c.quantity || 1}</div>
                      </div>
                      <div style={{fontWeight:600}}>Rs {(c.price || 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr />
            <div className="totals">
              <div>Total</div>
              <div>Rs {total.toFixed(2)}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
