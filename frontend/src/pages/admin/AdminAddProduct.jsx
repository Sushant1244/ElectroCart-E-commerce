import React, { useState } from 'react';
import API from '../../api/api';
import { useNavigate } from 'react-router-dom';

export default function AdminAddProduct(){
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState(10);
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', name);
    form.append('description', desc);
    form.append('price', price);
    if (originalPrice) form.append('originalPrice', originalPrice);
    form.append('stock', stock);
    form.append('category', category);
    form.append('rating', rating);
    for (let i = 0; i < images.length; i++) form.append('images', images[i]);

    try {
      await API.post('/products', form, { headers: {'Content-Type': 'multipart/form-data'} });
      alert('Product added');
      navigate('/admin');
    } catch (err) {
      alert(err?.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="admin-form-container">
      <h2>Add New Product</h2>
      <form onSubmit={submit} className="admin-form">
        <div className="form-group">
          <label>Product Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" required />
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description" rows="4" />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Price (Rs)</label>
            <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price" required min="0" step="0.01" />
          </div>
          
          <div className="form-group">
            <label>Stock</label>
            <input type="number" value={stock} onChange={e=>setStock(e.target.value)} placeholder="Stock" min="0" />
          </div>
        </div>
        
        <div className="form-group">
          <label>Category</label>
          <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Category" />
        </div>
        
        <div className="form-group">
          <label>Product Images</label>
          <input type="file" multiple onChange={e=>setImages(e.target.files)} accept="image/*" />
          <small>You can select multiple images (max 6)</small>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary">Add Product</button>
          <button type="button" onClick={() => navigate('/admin')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}