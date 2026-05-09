import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getDateKey = (date) => {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
};

const getDayRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dates = [];
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return dates;
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const Overview = () => {
  const [users, setUsers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [usersRes, skillsRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/admin/skills`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [usersJson, skillsJson] = await Promise.all([usersRes.json(), skillsRes.json()]);

        if (usersRes.ok && usersJson.success) {
          setUsers(usersJson.users || []);
        } else {
          throw new Error(usersJson.message || 'Failed to load users');
        }

        if (skillsRes.ok && skillsJson.success) {
          setSkills(skillsJson.skills || []);
        } else {
          throw new Error(skillsJson.message || 'Failed to load skills');
        }
      } catch (err) {
        console.error('Overview load error:', err);
        setError('Unable to load overview data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const storedReports = [];
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('reports_')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(parsed)) {
            storedReports.push(...parsed.map((item) => ({ ...item, userEmail: item.userEmail || key.replace('reports_', '') })));
          }
        } catch (err) {
          console.warn('Invalid report storage for', key, err);
        }
      }
    });
    setReports(storedReports);
  }, []);

  useEffect(() => {
    if (!users.length) return;

    const activityDates = users
      .map((user) => getDateKey(user.lastSeen || user.joined))
      .filter(Boolean)
      .sort();

    if (!activityDates.length) {
      const today = new Date();
      const formatted = today.toISOString().split('T')[0];
      setStartDate(formatted);
      setEndDate(formatted);
      return;
    }

    const latestDate = activityDates[activityDates.length - 1];
    const latest = new Date(latestDate);
    const earliest = new Date(activityDates[0]);
    const start = new Date(Math.max(earliest.getTime(), latest.getTime() - 6 * 24 * 60 * 60 * 1000));
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(latest.toISOString().split('T')[0]);
  }, [users]);

  const totalUsers = users.length;
  const totalSkills = skills.length;
  const unverifiedSkills = skills.filter((skill) => skill.badgeStatus === 'unverified').length;
  const pendingReports = reports.filter((report) => report.status === 'pending').length;

  const chartData = useMemo(() => {
    if (!startDate || !endDate) return [];
    const dateRange = getDayRange(startDate, endDate);
    return dateRange.map((date) => {
      const dateKey = date.toISOString().split('T')[0];
      const count = users.reduce((total, user) => {
        const activityDate = getDateKey(user.lastSeen || user.joined);
        return activityDate === dateKey ? total + 1 : total;
      }, 0);
      return { date: dateKey, count };
    });
  }, [users, startDate, endDate]);

  const maxCount = Math.max(...chartData.map((item) => item.count), 1);
  const totalLogins = chartData.reduce((sum, item) => sum + item.count, 0);

  if (loading) {
    return (
      <div className="overview-loading">
        <p>Loading overview...</p>
      </div>
    );
  }

  return (
    <div className="section-content overview-section">
      {error && <div className="notification error"><span>{error}</span></div>}

      <motion.div className="stats-grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <motion.div className="stat-card" whileHover={{ y: -4 }}>
          <div className="stat-icon">👥</div>
          <div className="stat-details">
            <h3>Total Users</h3>
            <p className="stat-value">{totalUsers}</p>
          </div>
        </motion.div>

        <motion.div className="stat-card" whileHover={{ y: -4 }}>
          <div className="stat-icon">🎯</div>
          <div className="stat-details">
            <h3>Total Skills</h3>
            <p className="stat-value">{totalSkills}</p>
          </div>
        </motion.div>

        <motion.div className="stat-card" whileHover={{ y: -4 }}>
          <div className="stat-icon">⚠️</div>
          <div className="stat-details">
            <h3>Unverified Skills</h3>
            <p className="stat-value">{unverifiedSkills}</p>
          </div>
        </motion.div>

        <motion.div className="stat-card" whileHover={{ y: -4 }}>
          <div className="stat-icon">📝</div>
          <div className="stat-details">
            <h3>Pending Reports</h3>
            <p className="stat-value">{pendingReports}</p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div className="chart-section overview-chart-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="overview-chart-top">
          <div>
            <h2>User Login Activity</h2>
            <p>Login counts are grouped by login date. Use the date range to focus the chart.</p>
          </div>
          <div className="overview-date-filter-row">
            <label>
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
              />
            </label>
            <label>
              End date
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </label>
          </div>
        </div>

        <div className="overview-chart-summary">
          <div>
            <span>Login total</span>
            <strong>{totalLogins}</strong>
          </div>
          <div>
            <span>Date range</span>
            <strong>{startDate} → {endDate}</strong>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="chart-bars">
            {chartData.map((item) => (
              <div key={item.date} className="chart-bar-item">
                <div
                  className="chart-bar-fill"
                  style={{ height: `${(item.count / maxCount) * 220}px` }}
                  title={`${item.count} logins on ${item.date}`}
                >
                  <span>{item.count}</span>
                </div>
                <div className="chart-bar-label">{item.date.slice(5)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="activity-placeholder">
            <p>No login activity found for the selected range.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Overview;
