import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import TextConverter from './components/TextConverter';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) setUser(data.user);
          else localStorage.removeItem('token');
        })
        .catch(() => localStorage.removeItem('token'));
    }
  }, [token]);

  const handleAuth = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="container">
          <Routes>
            <Route path="/login" element={!user ? <Login onAuth={handleAuth} /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register onAuth={handleAuth} /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <TextConverter token={token} /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={user ? <Dashboard token={token} user={user} /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
