import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

interface User {
  id: number;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, pendingRes, allRes] = await Promise.all([
        fetch('/admin/stats', { credentials: 'include' }),
        fetch('/admin/users/pending', { credentials: 'include' }),
        fetch('/admin/users', { credentials: 'include' }),
      ]);

      if (!statsRes.ok || !pendingRes.ok || !allRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const statsData = await statsRes.json();
      const pendingData = await pendingRes.json();
      const allData = await allRes.json();

      setStats(statsData.stats);
      setPendingUsers(pendingData.users);
      setAllUsers(allData.users);
    } catch (err) {
      console.error(err);
      setError('Failed to load admin data. You may not have admin access.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: number) => {
    try {
      const res = await fetch(`/admin/users/${userId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to approve user');
      }

      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to approve user');
    }
  };

  const handleReject = async (userId: number) => {
    if (!confirm('Are you sure you want to reject this user?')) {
      return;
    }

    try {
      const res = await fetch(`/admin/users/${userId}/reject`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to reject user');
      }

      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to reject user');
    }
  };

  const handleCheckboxChange = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === pendingUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(pendingUsers.map((u) => u.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select users to approve');
      return;
    }

    if (!confirm(`Are you sure you want to approve ${selectedUsers.size} user(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      const approvePromises = Array.from(selectedUsers).map((userId) =>
        fetch(`/admin/users/${userId}/approve`, {
          method: 'POST',
          credentials: 'include',
        })
      );

      await Promise.all(approvePromises);
      setSelectedUsers(new Set());
      await loadData();
      alert('Selected users have been approved');
    } catch (err) {
      console.error(err);
      alert('Failed to approve users');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select users to reject');
      return;
    }

    if (!confirm(`Are you sure you want to reject ${selectedUsers.size} user(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      const rejectPromises = Array.from(selectedUsers).map((userId) =>
        fetch(`/admin/users/${userId}/reject`, {
          method: 'POST',
          credentials: 'include',
        })
      );

      await Promise.all(rejectPromises);
      setSelectedUsers(new Set());
      await loadData();
      alert('Selected users have been rejected');
    } catch (err) {
      console.error(err);
      alert('Failed to reject users');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    fetch('/auth/logout', { method: 'POST', credentials: 'include' })
      .then(() => navigate('/login'))
      .catch(console.error);
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container">
        <div className="admin-error">
          <h2>⚠️ {error}</h2>
          <button onClick={() => navigate('/success')}>Go Back</button>
        </div>
      </div>
    );
  }

  const displayUsers = activeTab === 'pending' ? pendingUsers : allUsers;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>👑 Admin Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-value">{stats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-value">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('pending');
            setSelectedUsers(new Set());
          }}
        >
          Pending ({pendingUsers.length})
        </button>
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('all');
            setSelectedUsers(new Set());
          }}
        >
          All Users ({allUsers.length})
        </button>
      </div>

      {activeTab === 'pending' && pendingUsers.length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            className="approve-btn"
            onClick={handleBulkApprove}
            disabled={selectedUsers.size === 0}
            style={{ padding: '10px 20px', cursor: selectedUsers.size === 0 ? 'not-allowed' : 'pointer', opacity: selectedUsers.size === 0 ? 0.5 : 1 }}
          >
            ✓ Approve Selected ({selectedUsers.size})
          </button>
          <button
            className="reject-btn"
            onClick={handleBulkReject}
            disabled={selectedUsers.size === 0}
            style={{ padding: '10px 20px', cursor: selectedUsers.size === 0 ? 'not-allowed' : 'pointer', opacity: selectedUsers.size === 0 ? 0.5 : 1 }}
          >
            ✗ Reject Selected ({selectedUsers.size})
          </button>
        </div>
      )}

      <div className="users-table-container">
        {displayUsers.length === 0 ? (
          <div className="empty-state">
            <p>No {activeTab === 'pending' ? 'pending' : ''} users found</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                {activeTab === 'pending' && (
                  <th style={{ width: '50px' }}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === pendingUsers.length && pendingUsers.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                )}
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayUsers.map((user) => (
                <tr key={user.id}>
                  {activeTab === 'pending' && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleCheckboxChange(user.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}
                  <td>{user.email}</td>
                  <td>{user.name || '-'}</td>
                  <td>
                    <span className={`badge ${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${user.status}`}>{user.status}</span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    {user.status === 'pending' && (
                      <div className="action-buttons">
                        <button
                          className="approve-btn"
                          onClick={() => handleApprove(user.id)}
                        >
                          ✓
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleReject(user.id)}
                        >
                          ✗
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Admin;
