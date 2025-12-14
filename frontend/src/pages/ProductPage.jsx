import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/api';

export default function ProductPage(){
  const { slug } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(()=> {
    API.get(`/products/${slug}`).then(res => setProduct(res.data)).catch(console.error);
  }, [slug]);

  const getImageUrl = (img) => {
    if (!img) return '/placeholder.png';
    if (img.startsWith('http')) return img;
    const cleanPath = img.startsWith('/uploads/') ? img : `/uploads/${img}`;
    return `http://localhost:5000${cleanPath}`;
  };

  if(!product) return <div className="loading">Loading...</div>;

  const addToCart = () => {
    if (product.stock === 0) {
      alert('This product is out of stock');
      return;
    }
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(item => item.product === product._id);
    
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ 
        product: product._id, 
        name: product.name, 
        price: product.price, 
        quantity: 1, 
        slug: product.slug,
        image: product.images?.[0]
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart');
  };

  return (
    <div className="product-page">
      <div className="images">
        {product.images?.length ? (
          product.images.map((i, idx) => (
            <img key={idx} src={getImageUrl(i)} alt={product.name} />
          ))
        ) : (
          <img src="/placeholder.png" alt={product.name} />
        )}
      </div>
      <div className="info">
        {product.featured && <span className="featured-badge">⭐ Featured Product</span>}
        <h2>{product.name}</h2>
        <p className="category-badge">Category: {product.category || 'Uncategorized'}</p>
        <p className="description">{product.description || 'No description available.'}</p>
        <div className="price-stock">
          <h3>Rs {product.price}</h3>
          <p className={product.stock > 0 ? 'stock-available' : 'stock-unavailable'}>
            {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
          </p>
        </div>
        <button 
          onClick={addToCart}
          disabled={product.stock === 0}
          className={product.stock === 0 ? 'btn-disabled' : ''}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}