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
      // If user chose Khalti, call backend initiate endpoint and redirect to Khalti payment page
      if (method === 'khalti' && created && created._id) {
        try {
          // Use Khalti client widget for smoother UX. Ensure public key exists in env
          let publicKey = import.meta.env.VITE_KHALTI_PUBLIC_KEY || window.__KHALTI_PUBLIC_KEY__ || null;
          // If publicKey not available at build time, fetch from backend config endpoint
          if (!publicKey) {
            try {
              const cfg = await API.get('/payments/khati/config');
              publicKey = cfg?.data?.publicKey || null;
            } catch (e) {
              console.warn('Failed to fetch khalti config from server', e);
            }
          }
          if (!publicKey) throw new Error('Khalti public key not configured');
          const khaltiAmount = Math.round(total * 100);
          // Load Khalti script dynamically if not present
          if (!window.KhaltiCheckout) {
            await new Promise((resolve, reject) => {
              const s = document.createElement('script');
              s.src = 'https://khalti.com/static/khalti-checkout.js';
              s.async = true;
              s.onload = resolve;
              s.onerror = reject;
              document.head.appendChild(s);
            });
          }
          if (!window.KhaltiCheckout) throw new Error('Khalti widget failed to load');

          const config = {
            publicKey: publicKey,
            productIdentity: created._id,
            productName: 'ElectroCart Order',
            productUrl: window.location.origin,
            eventHandler: {
              onSuccess: async (payload) => {
                // payload.token, payload.amount
                try {
                  // First call server debug endpoint to surface raw Khalti response for troubleshooting
                  try {
                    const dbg = await API.post('/payments/khati/debug-verify', { token: payload.token, amount: payload.amount, purchase_order_id: created._id });
                    console.debug('Khalti debug verify response', dbg && dbg.data);
                    // If debug verify returned non-2xx, surface the body to the user for support
                    if (!(dbg.status >= 200 && dbg.status < 300)) {
                      alert('Payment verification failed (provider). Details logged to console. Contact support with order id: ' + (created._id || created.id));
                      // still navigate so user can see order in pending state
                      localStorage.removeItem('cart');
                      navigate('/orders', { state: { justPlacedOrderId: created._id } });
                      return;
                    }
                  } catch (dbgErr) {
                    console.warn('Debug verify call failed', dbgErr);
                  }

                  // If debug shows OK, call official verify to mark order paid
                  await API.post('/payments/khati/verify', { token: payload.token, amount: payload.amount, purchase_order_id: created._id });
                  localStorage.removeItem('cart');
                  navigate('/orders', { state: { justPlacedOrderId: created._id } });
                } catch (err) {
                  console.error('Khalti verify failed', err);
                  alert('Payment verification failed. Please contact support. Order created and is pending.');
                  navigate('/orders', { state: { justPlacedOrderId: created._id } });
                }
              },
              onError: (err) => {
                console.error('Khalti checkout error', err);
                alert('Payment failed or cancelled.');
                navigate('/orders', { state: { justPlacedOrderId: created._id } });
              },
              onClose: () => {
                // user closed the widget
              }
            }
          };

          const checkout = new window.KhaltiCheckout(config);
          checkout.show({ amount: khaltiAmount });
          return;
        } catch (e) {
          console.error('Khalti client flow failed', e && e.message ? e.message : e);
          // Fallback: navigate to orders and inform user
          localStorage.removeItem('cart');
          alert('Order created but payment flow failed to start. Please check your orders.');
          if (created && created._id) navigate('/orders', { state: { justPlacedOrderId: created._id } }); else navigate('/');
          return;
        }
      }

      // Non-Khalti flows: clear cart and navigate to orders
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
          <section className="card p-16 mb-16" aria-labelledby="pm-heading">
            <h2 id="pm-heading">Payment Method</h2>
            <div className="payment-methods mt-8" role="radiogroup" aria-label="Payment methods">
              <label className="flex items-center mb-10" style={{gap:12}}>
                <input aria-label="Cash on Delivery" type="radio" name="pm" value="cod" checked={method==='cod'} onChange={() => setMethod('cod')} />
                <div>
                  <div style={{fontWeight:600}}>Cash on Delivery</div>
                  <div className="small-muted">Pay when the order is delivered to your address.</div>
                </div>
              </label>

              <label className="flex items-center mb-10" style={{gap:12}}>
                <input aria-label="eSewa" type="radio" name="pm" value="esewa" checked={method==='esewa'} onChange={() => setMethod('esewa')} />
                <div>
                  <div style={{fontWeight:600}}>eSewa</div>
                  <div className="small-muted">Quick online payment via eSewa wallet.</div>
                </div>
              </label>

              <label className="flex items-center mb-10" style={{gap:12}}>
                <input aria-label="Khalti" type="radio" name="pm" value="khalti" checked={method==='khalti'} onChange={() => setMethod('khalti')} />
                <div>
                  <div style={{fontWeight:600}}>Khalti</div>
                  <div className="small-muted">Secure payment using Khalti.</div>
                </div>
              </label>

              <label className="flex items-center" style={{gap:12}}>
                <input aria-label="Bank Transfer" type="radio" name="pm" value="bank" checked={method==='bank'} onChange={() => setMethod('bank')} />
                <div>
                  <div style={{fontWeight:600}}>Bank Transfer</div>
                  <div className="small-muted">Manual bank transfer — upload proof after transfer.</div>
                </div>
              </label>
            </div>
          </section>

          {method === 'bank' && (
            <section className="card p-16 mb-16">
              <h3 className="mt-0">Bank transfer details</h3>
              <p style={{margin:0}}>Account: <strong>1234567890</strong></p>
              <p style={{margin:0}}>Bank: <strong>Example Bank</strong></p>
              <p style={{margin:0}}>IFSC: <strong>EXAMP0001</strong></p>
              <p className="mt-8 small-muted">Please make the transfer and use your order ID as reference. Upload transfer proof in your order details later.</p>
            </section>
          )}

          <div className="flex" style={{gap:12}}>
            <button className="btn btn-primary" onClick={placeOrder} disabled={loading} aria-disabled={loading}>
              {loading ? 'Placing order…' : `Pay Rs ${total.toFixed(2)}`}
            </button>
            <button className="btn" onClick={() => navigate('/cart')} disabled={loading}>Back to Cart</button>
          </div>
        </main>

        <aside>
          <div className="card order-summary p-16">
            <h3 style={{marginTop:0}}>Order Summary</h3>
            <div style={{marginTop:8}}>
              {cart.length === 0 ? <div>No items in cart</div> : (
                <div>
                  {cart.map((c) => (
                    <div key={c._id || c.id || c.slug || c.name} className="item">
                      <div className="img-48">
                        <img src={c.image || ''} alt={c.name} className="img-100pct" />
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600}}>{c.name}</div>
                        <div className="small-muted">Qty: {c.quantity || 1}</div>
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
