import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/auth';
import './Success.css';

const Success: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="success-container">
        <div className="success-card">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">✅</div>
        <h1>환영합니다!</h1>
        <p className="success-message">
          로그인에 성공하였습니다.
        </p>

        {user && (
          <div className="user-info">
            <p className="user-email">{user.email}</p>
            <span className={`user-badge ${user.role}`}>
              {user.role === 'admin' ? '👑 관리자' : '👤 사용자'}
            </span>
          </div>
        )}

        <div className="success-actions">
          {user?.role === 'admin' && (
            <button className="admin-button" onClick={handleGoToAdmin}>
              관리자 대시보드로 이동
            </button>
          )}
          <button className="logout-button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
};

export default Success;
