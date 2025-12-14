import React, { useState, useEffect } from 'react';
import API from '../api/api';

export default function Cart(){
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'));
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