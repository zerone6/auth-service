import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Admin.module.css';

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

  const getRoleBadgeClass = (role: string) => {
    return role === 'admin' ? styles.badgeAdmin : styles.badgeUser;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.badgePending;
      case 'approved':
        return styles.badgeApproved;
      case 'rejected':
        return styles.badgeRejected;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.adminLoading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.adminError}>
          <h2>⚠️ {error}</h2>
          <button onClick={() => navigate('/success')}>Go Back</button>
        </div>
      </div>
    );
  }

  const displayUsers = activeTab === 'pending' ? pendingUsers : allUsers;

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <h1>👑 Admin Dashboard</h1>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Users</div>
          </div>
          <div className={`${styles.statCard} ${styles.statCardPending}`}>
            <div className={styles.statValue}>{stats.pending}</div>
            <div className={styles.statLabel}>Pending</div>
          </div>
          <div className={`${styles.statCard} ${styles.statCardApproved}`}>
            <div className={styles.statValue}>{stats.approved}</div>
            <div className={styles.statLabel}>Approved</div>
          </div>
          <div className={`${styles.statCard} ${styles.statCardRejected}`}>
            <div className={styles.statValue}>{stats.rejected}</div>
            <div className={styles.statLabel}>Rejected</div>
          </div>
        </div>
      )}

      <div className={styles.adminTabs}>
        <button
          className={`${styles.tab} ${activeTab === 'pending' ? styles.tabActive : ''}`}
          onClick={() => {
            setActiveTab('pending');
            setSelectedUsers(new Set());
          }}
        >
          Pending ({pendingUsers.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => {
            setActiveTab('all');
            setSelectedUsers(new Set());
          }}
        >
          All Users ({allUsers.length})
        </button>
      </div>

      {activeTab === 'pending' && pendingUsers.length > 0 && (
        <div className={styles.bulkActions}>
          <button
            className={`${styles.approveBtn} ${styles.bulkBtn} ${selectedUsers.size === 0 ? styles.bulkBtnDisabled : ''}`}
            onClick={handleBulkApprove}
            disabled={selectedUsers.size === 0}
          >
            ✓ Approve Selected ({selectedUsers.size})
          </button>
          <button
            className={`${styles.rejectBtn} ${styles.bulkBtn} ${selectedUsers.size === 0 ? styles.bulkBtnDisabled : ''}`}
            onClick={handleBulkReject}
            disabled={selectedUsers.size === 0}
          >
            ✗ Reject Selected ({selectedUsers.size})
          </button>
        </div>
      )}

      <div className={styles.usersTableContainer}>
        {displayUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No {activeTab === 'pending' ? 'pending' : ''} users found</p>
          </div>
        ) : (
          <table className={styles.usersTable}>
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
                    <span className={`${styles.badge} ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${getStatusBadgeClass(user.status)}`}>{user.status}</span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    {user.status === 'pending' && (
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.approveBtn}
                          onClick={() => handleApprove(user.id)}
                        >
                          ✓
                        </button>
                        <button
                          className={styles.rejectBtn}
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
