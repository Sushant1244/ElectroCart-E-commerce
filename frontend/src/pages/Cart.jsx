import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { resolveImageSrc } from '../utils/resolveImage';

export default function Cart(){
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'));

  // Resolve any items that lack an explicit image by using slug fallback or fetching product details
  useEffect(() => {
    let cancelled = false;
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const resolveImageForItem = async (item) => {
      // If item already has an encoded image URL, keep it
      if (item.image) return item.image;

      // If slug-based fallback exists, use it
      if (item.slug && SLUG_FALLBACK[item.slug]) {
        const { local, remote } = resolveImageSrc(SLUG_FALLBACK[item.slug]);
        return local || remote;
      }

      // Try fetching product details from backend using slug or product id
      try {
        if (item.slug) {
          const res = await API.get(`/products/${item.slug}`);
          const prod = res.data;
          if (prod?.images?.[0]) return `${API_BASE}${prod.images[0].startsWith('/') ? prod.images[0] : '/' + prod.images[0]}`;
        }
        if (item.product) {
          const res = await API.get(`/products/by-id/${item.product}`);
          const prod = res.data;
          if (prod?.images?.[0]) return `${API_BASE}${prod.images[0].startsWith('/') ? prod.images[0] : '/' + prod.images[0]}`;
        }
      } catch (e) {
        // ignore network errors and fall through to placeholder
      }

      return null;
    };

    (async () => {
      const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
      let changed = false;
      for (let i = 0; i < currentCart.length; i++) {
        const item = currentCart[i];
        if (!item.image) {
          // resolve and store absolute URL (encoded by backend file serving if necessary)
          // this stores a stable, ready-to-render URL in the cart object
          // eslint-disable-next-line no-await-in-loop
          const resolved = await resolveImageForItem(item);
          if (resolved) {
            currentCart[i].image = resolved;
            changed = true;
          }
        }
        if (cancelled) return;
      }
      if (changed) {
        localStorage.setItem('cart', JSON.stringify(currentCart));
        setCart(currentCart);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const getImageUrl = (img) => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const cleanPath = img.startsWith('/uploads/') ? img : `/uploads/${img}`;
    const lastSlash = cleanPath.lastIndexOf('/');
    const prefix = cleanPath.substring(0, lastSlash + 1);
    const filename = cleanPath.substring(lastSlash + 1);
    return `${API_BASE}${prefix}${encodeURIComponent(filename)}`;
  };

  // fallback map for known demo slugs
  const SLUG_FALLBACK = {
    'alpha-watch-ultra': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
    'wireless-headphones': '/uploads/Wireless Headphones.png',
    'homepad-mini': '/uploads/Homepad mini.png',
    'matrixsafe-charger': '/uploads/MatrixSafe Charger.png',
    'iphone-15-pro-max': '/uploads/Iphone 15 pro ma.png',
    'macbook-m2-dark-gray': '/uploads/MacBook Air M4.png'
  };
  useEffect(()=> {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const total = cart.reduce((s,c) => s + c.price * (c.quantity || 1), 0);

  const checkout = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to checkout');
      window.location.href = '/login';
      return;
    }
    try {
      const shippingAddress = {
        address: prompt('Enter shipping address:') || 'Default Address',
        city: prompt('Enter city:') || 'Default City',
        zipCode: prompt('Enter zip code:') || '00000'
      };
      const res = await API.post('/orders', { 
        items: cart.map(item => ({ product: item.product, price: item.price, quantity: item.quantity })), 
        total,
        shippingAddress
      });
      localStorage.removeItem('cart'); 
      setCart([]);
      alert('Order placed successfully!');
      window.location.href = '/';
    } catch(err) {
      alert(err?.response?.data?.message || 'Order failed');
    }
  };

  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  return (
    <div className="cart-page">
      <h2>Your Cart</h2>
      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <a href="/" className="btn-primary">Continue Shopping</a>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((c, i) => (
              <div key={i} className="cart-item">
                <div className="cart-item-thumb">
                  { (c.image && c.image !== 'null') || (c.slug && SLUG_FALLBACK[c.slug]) ? (
                    (() => {
                      const imgSrc = c.image || SLUG_FALLBACK[c.slug] || null;
                      if (!imgSrc) return <div className="thumb-placeholder" />;
                      const { local, remote } = resolveImageSrc(imgSrc.startsWith('/') ? imgSrc : `/uploads/${imgSrc}`);
                      return <img src={local || remote} alt={c.name} onError={(e)=>{ if (remote && e.currentTarget.src!==remote) e.currentTarget.src = remote; }} />;
                    })()
                  ) : (
                    <div className="thumb-placeholder" />
                  )}
                </div>

                <div className="cart-item-info">
                  <h4>{c.name}</h4>
                  <p className="cart-item-price">Rs {c.price}</p>
                </div>
                <div className="cart-item-controls">
                  <label>
                    Quantity:
                    <input 
                      type="number" 
                      value={c.quantity || 1} 
                      min="1"
                      onChange={(e) => {
                        const q = Number(e.target.value);
                        const newCart = [...cart];
                        newCart[i].quantity = q;
                        setCart(newCart);
                      }} 
                    />
                  </label>
                  <p className="item-total">Rs {(c.price * (c.quantity || 1)).toFixed(2)}</p>
                  <button onClick={() => removeItem(i)} className="btn-remove">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Total: Rs {total.toFixed(2)}</h3>
            <button onClick={checkout} className="btn-checkout">Proceed to Checkout</button>
          </div>
        </>
      )}
    </div>
  );
}