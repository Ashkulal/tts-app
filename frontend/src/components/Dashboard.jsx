import React, { useState, useEffect } from 'react';

function Dashboard({ token, user }) {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
      fetch('/api/dashboard/history', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    ])
      .then(([statsData, historyData]) => {
        setStats(statsData);
        setHistory(historyData.conversions || []);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2>Dashboard</h2>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="value">{stats.totalConversions}</div>
            <div className="label">Total Conversions</div>
          </div>
          <div className="stat-card">
            <div className="value">{stats.todayConversions}</div>
            <div className="label">Today</div>
          </div>
          <div className="stat-card">
            <div className="value">{stats.totalCharacters.toLocaleString()}</div>
            <div className="label">Characters Processed</div>
          </div>
          <div className="stat-card">
            <div className="value">
              <span className={`tier-badge tier-${stats.tier}`}>{stats.tier}</span>
            </div>
            <div className="label">Current Plan</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Conversion History</h3>
        {history.length === 0 ? (
          <p>No conversions yet. Start by converting some text!</p>
        ) : (
          history.map((item) => (
            <div key={item.id} className="history-item">
              <div className="info">
                <span className="type">{item.input_type}</span>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                  {item.source_text?.substring(0, 100)}
                  {item.source_text?.length > 100 ? '...' : ''}
                </p>
                <small>{new Date(item.created_at).toLocaleString()}</small>
              </div>
              <audio controls src={item.audio_url} style={{ width: '200px' }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
