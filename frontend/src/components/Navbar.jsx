import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  return (
    <header className="navbar">
      <h1>TextToSpeech</h1>
      <nav>
        {user ? (
          <>
            <Link to="/">Convert</Link>
            <Link to="/dashboard">Dashboard</Link>
            <span className={`tier-badge tier-${user.tier}`}>{user.tier}</span>
            <button onClick={onLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
