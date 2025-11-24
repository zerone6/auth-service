import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/auth';
import './Success.css';

const Success: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    fetch('/auth/logout', { method: 'POST', credentials: 'include' })
      .then(() => navigate('/login'))
      .catch(console.error);
  };

  const handleGoToAdmin = () => {
    navigate('/admin');
  };

  // Get user initials for avatar
  const getUserInitial = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="success-page">
        <div className="success-container">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="success-page">
      {/* Header */}
      <header className="success-header">
        <div className="header-container">
          <h1>가족 정보 공유 사이트</h1>

          {user && (
            <div className="profile-menu">
              <button
                className="profile-button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="avatar">
                  {getUserInitial()}
                </div>
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      {getUserInitial()}
                    </div>
                    <div className="dropdown-info">
                      <p className="dropdown-email">{user.email}</p>
                      <span className={`dropdown-badge ${user.role}`}>
                        {user.role === 'admin' ? '관리자' : '사용자'}
                      </span>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  {user.role === 'admin' && (
                    <button className="dropdown-item" onClick={handleGoToAdmin}>
                      <span className="dropdown-icon">👑</span>
                      관리자 대시보드
                    </button>
                  )}

                  <button className="dropdown-item" onClick={handleLogout}>
                    <span className="dropdown-icon">🚪</span>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="success-main">
        <div className="success-container">
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon calendar">📅</div>
              <div className="service-content">
                <h2>일시일정</h2>
                <p>선택</p>
              </div>
            </div>

            <div className="service-card disabled">
              <div className="service-icon home">🏠</div>
              <div className="service-content">
                <h2>부동산</h2>
                <p>계산기</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="success-footer">
        <p>&copy; 2024 Family Services. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Success;
