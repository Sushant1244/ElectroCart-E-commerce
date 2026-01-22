import React, { useEffect, useState } from 'react';
import API from '../api/api';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);

  const load = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifs(res.data || []);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  };

  useEffect(() => { load(); }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => (n.id === id || n._id === id ? { ...n, read: true } : n)));
    } catch (e) { console.error('Failed to mark read', e); }
  };

  return (
    <div className="notif-root">
      <button className="notif-btn" onClick={() => { setOpen(!open); if (!open) load(); }} aria-label="Notifications">
        🔔
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-menu">
          {notifs.length === 0 && <div className="muted">No notifications</div>}
          {notifs.map(n => (
            <div key={n.id || n._id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
              <div className="notif-title">{n.title}</div>
              <div className="notif-body small muted">{n.body}</div>
              {!n.read && <button className="link small" onClick={() => markRead(n.id || n._id)}>Mark read</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
