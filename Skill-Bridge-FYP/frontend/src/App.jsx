import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WelcomeScreen from './components/welcome/WelcomeScreen';
import { io } from 'socket.io-client';
import Login from './components/user-dashboard/Login';
import Register from './components/user-dashboard/Register';
import Skills from './components/user-dashboard/Skills';
import UserDashboard from './components/user-dashboard/UserDashboard';
import AdminDashboard from './components/admin-dashboard/AdminDashboard';
import ProfilePage from './components/user-dashboard/ProfilePage';
import EditProfileForm from './components/user-dashboard/EditProfileForm';
import AddSkill from './components/user-dashboard/AddSkill';
import SkillDetail from './components/user-dashboard/SkillDetail';
import Inbox from './components/user-dashboard/Inbox';
import ProjectDetail from './components/user-dashboard/ProjectDetail';
import UserDetail from './components/user-dashboard/UserDetail';
import './styles/global.css';

function App() {
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) return;
    const parsed = JSON.parse(userData);
    const key = `presence_${parsed.email}`;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Prevent double connections in React StrictMode by reusing an existing socket
    let created = false;
    let socket = window.__SB_SOCKET;
    if (!socket) {
      created = true;
      socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: { token },
        reconnectionAttempts: 5,
      });
      window.__SB_SOCKET = socket;
    }

    const safeEmit = (ev, payload) => {
      try {
        socket && socket.emit && socket.emit(ev, payload);
      } catch (e) {}
    };

    socket.on('connect', () => {
      // mark online on connect
      safeEmit('presence:change', { status: 'online' });
      // expose for logout handlers (already set above when created)
      window.__SB_SOCKET = socket;
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err && err.message ? err.message : err);
    });

    socket.on('user:presence', (data) => {
      if (data && data.email) {
        // update localStorage for UI hooks
        localStorage.setItem(`presence_${data.email}`, JSON.stringify({ status: data.status, lastSeen: data.lastSeen }));
        // dispatch a custom event for listeners
        window.dispatchEvent(new CustomEvent('presence:update', { detail: { email: data.email, status: data.status, lastSeen: data.lastSeen } }));
      }
    });

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') safeEmit('presence:change', { status: 'offline' });
      else safeEmit('presence:change', { status: 'online' });
    };

    const beforeunloadHandler = () => {
      safeEmit('presence:change', { status: 'offline' });
      if (created && socket) socket.disconnect();
    };

    window.addEventListener('beforeunload', beforeunloadHandler);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      try {
        safeEmit('presence:change', { status: 'offline' });
        if (created && socket) socket.disconnect();
      } catch (e) {}
      window.removeEventListener('beforeunload', beforeunloadHandler);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/edit-profile" element={<EditProfileForm />} />
        <Route path="/add-skill" element={<AddSkill />} />
        <Route path="/skill/:id" element={<SkillDetail />} />
        <Route path="/user/:id" element={<UserDetail />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/inbox" element={<Navigate to="/dashboard?tab=inbox" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
