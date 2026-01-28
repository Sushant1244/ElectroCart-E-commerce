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
  const [otpPending, setOtpPending] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verifying, setVerifying] = useState(false);

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
      // If backend returned a token/user (legacy), use it
      if (res.data && res.data.token && res.data.user) {
        const normalizedUser = onLogin(res.data.token, res.data.user);
        if (normalizedUser?.isAdmin) return navigate('/admin');
        return navigate('/');
      }
      // Otherwise expect a verification flow: backend sends { message, email }
      setRegisteredEmail(res.data.email || (email || '').trim());
      setOtpPending(true);
      return;
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

  const verifyOtp = async (e) => {
    e && e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) return alert('Enter the 6-digit code sent to your email');
    try {
      setVerifying(true);
      const resp = await API.post('/auth/verify-email', { email: registeredEmail || email, code: otpCode.trim() });
      // re-login or fetch user again if needed. For now, simply hide OTP panel and navigate home
      setOtpPending(false);
      // Attempt to log the user in automatically after successful verification
      try {
        const loginResp = await API.post('/auth/login', { email: registeredEmail || email, password });
        if (loginResp.data && loginResp.data.token && loginResp.data.user) {
          onLogin(loginResp.data.token, loginResp.data.user);
        }
      } catch (loginErr) {
        // ignore login failure - user can manually login
      }
      navigate('/');
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      if (serverMsg) return alert(serverMsg);
      alert('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Sign up to get started</p>
        
  {/* role selector removed: registrations create regular customers by default */}

        {!otpPending ? (
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
        ) : (
          <form onSubmit={verifyOtp} className="auth-form">
            <p>Please enter the 6-digit verification code sent to <strong>{registeredEmail || email}</strong></p>
            <div className="form-group">
              <label>Verification Code</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <button type="submit" className="btn-auth-primary" disabled={verifying}>{verifying ? 'Verifying...' : 'Verify Email'}</button>
            </div>
          </form>
        )}

        <p className="auth-footer">
          Do you have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

