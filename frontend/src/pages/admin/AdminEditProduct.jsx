import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { resolveImageSrc } from '../../utils/resolveImage';
import UploadsPicker from '../../components/UploadsPicker';
import { useParams, useNavigate } from 'react-router-dom';

export default function AdminEditProduct(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState(10);
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState(5);
  const [featured, setFeatured] = useState(false);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const res = await API.get(`/products/by-id/${id}`);
      const p = res.data;
      if (p) {
        setProduct(p);
        setName(p.name || '');
        setDesc(p.description || '');
        setPrice(p.price || 0);
        setOriginalPrice(p.originalPrice || '');
        setStock(p.stock || 0);
        setCategory(p.category || '');
        setRating(p.rating || 5);
        setFeatured(p.featured || false);
        setExistingImages(p.images || []);
      }
    } catch (err) {
      alert('Failed to load product');
      navigate('/admin');
    }
  };

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
    form.append('featured', featured);
    
    // Only append new images if files are selected
    if (images && images.length && typeof images[0] === 'string') {
      form.append('images', JSON.stringify(images));
    } else {
      for (let i = 0; i < images.length; i++) {
        form.append('images', images[i]);
      }
    }

    try {
      // Do not set Content-Type manually; let the browser include multipart boundary
      await API.put(`/products/${id}`, form);
      alert('Product updated successfully');
  try { window.dispatchEvent(new CustomEvent('productsChanged')); localStorage.setItem('productsChanged', String(Date.now())); } catch (err) { /* ignore */ }
  navigate('/admin');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update product');
    }
  };

  if (!product) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-form-container">
      <h2>Edit Product</h2>
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
            <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Current Price" required min="0" step="0.01" />
          </div>
          
          <div className="form-group">
            <label>Original Price (Rs) - Optional</label>
            <input type="number" value={originalPrice} onChange={e=>setOriginalPrice(e.target.value)} placeholder="Original Price (for discount)" min="0" step="0.01" />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Stock</label>
            <input type="number" value={stock} onChange={e=>setStock(e.target.value)} placeholder="Stock" min="0" />
          </div>
          
          <div className="form-group">
            <label>Rating (1-5)</label>
            <input type="number" value={rating} onChange={e=>setRating(e.target.value)} placeholder="Rating" min="1" max="5" step="0.1" />
          </div>
        </div>
        
        <div className="form-group">
          <label>Category</label>
          <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Category" />
        </div>

        <div className="form-group">
          <label>
            <input type="checkbox" checked={featured} onChange={e=>setFeatured(e.target.checked)} />
            Featured Product
          </label>
        </div>

        {existingImages.length > 0 && (
          <div className="form-group">
            <label>Current Images</label>
            <div className="existing-images">
              {existingImages.map((img, idx) => {
                const raw = img;
                const { local, remote } = resolveImageSrc(raw.startsWith('/') ? raw : `/uploads/${raw}`);
                const src = local || remote || '';
                return (
                  <img
                    key={String(img) + idx}
                    src={src}
                    alt={`Product ${idx + 1}`}
                    onError={(e) => { if (remote && e.currentTarget.src !== remote) e.currentTarget.src = remote; else e.currentTarget.src = ''; }}
                  />
                );
              })}
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label>Add New Images</label>
          <input type="file" multiple onChange={e=>setImages(e.target.files)} accept="image/*" />
          <small>Select new images to add (existing images will be kept)</small>
          <div style={{marginTop: 8}}>
            <strong>Or choose from existing uploads</strong>
            <UploadsPicker onSelect={(selected) => setImages(selected)} />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary">Update Product</button>
          <button type="button" onClick={() => navigate('/admin')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}

