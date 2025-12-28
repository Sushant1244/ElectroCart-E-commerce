import React, { useState } from 'react';
import API from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register({ onLogin }){
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const navigate = useNavigate();

  const register = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      alert('Please agree to the Terms of Service');
      return;
    }
    try {
      const res = await API.post('/auth/register', { 
        name: (name || '').trim(),
        email: (email || '').trim(),
        password: (password || '').trim()
      });
      const normalizedUser = onLogin(res.data.token, res.data.user);
      if (normalizedUser?.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      // Surface server validation messages and network errors to help debugging
      const serverMsg = err?.response?.data?.message;
      const status = err?.response?.status;
      if (serverMsg) {
        alert(serverMsg + (status ? ` (status ${status})` : ''));
      } else if (err.request && !err.response) {
        // Network error / backend unreachable
        alert(`Unable to contact backend at ${API_BASE}.\nPlease start the backend: open a terminal and run:\ncd backend && npm install && node server.js`);
      } else if (err.message) {
        alert('Registration failed: ' + err.message);
      } else {
        alert('Registration failed');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Sign up to get started</p>
        
  {/* role selector removed: registrations create regular customers by default */}

        <form onSubmit={register} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input 
                type="text" 
                value={name} 
                onChange={e=>setName(e.target.value)} 
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input 
                type="email" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder="Create a password"
                required
              />
              <button 
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input 
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword} 
                onChange={e=>setConfirmPassword(e.target.value)} 
                placeholder="Confirm your password"
                required
              />
              <button 
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={agreeTerms}
                onChange={e=>setAgreeTerms(e.target.checked)}
                required
              />
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>

          <button type="submit" className="btn-auth-primary">Create Account</button>
        </form>

        <p className="auth-footer">
          Do you have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

