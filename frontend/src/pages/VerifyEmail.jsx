import React, { useState } from 'react';
import API from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmail({ user, onVerified }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  const email = user?.email || localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').email : '';

  const submit = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) return alert('Enter 6-digit code');
    try {
      setLoading(true);
      await API.post('/auth/verify-email', { email, code });
      // update localStorage user
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      u.emailVerified = true;
      localStorage.setItem('user', JSON.stringify(u));
      if (onVerified) onVerified(u);
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.message;
      alert(msg || 'Verification failed');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    try {
      setResendLoading(true);
      await API.post('/auth/resend-verification', { email });
      alert('Verification code resent');
    } catch (err) {
      const msg = err?.response?.data?.message;
      alert(msg || 'Failed to resend code');
    } finally { setResendLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Verify your email</h2>
        <p className="auth-subtitle">Enter the 6-digit code sent to {email}</p>
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label>Verification Code</label>
            <div className="input-wrapper">
              <input value={code} onChange={e=>setCode(e.target.value)} placeholder="123456" maxLength={6} required />
            </div>
          </div>
          <div className="form-group">
            <button className="btn-auth-primary" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
          </div>
        </form>
        <p>
          Didn't get a code? <button onClick={resend} disabled={resendLoading} className="btn-link">{resendLoading ? 'Resending...' : 'Resend code'}</button>
        </p>
      </div>
    </div>
  );
}
