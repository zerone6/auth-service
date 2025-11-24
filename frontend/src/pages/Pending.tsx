import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Pending.css';

const Pending: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    fetch('/auth/logout', { method: 'POST', credentials: 'include' })
      .then(() => navigate('/login'))
      .catch(console.error);
  };

  return (
    <div className="pending-container">
      <div className="pending-card">
        <div className="pending-icon">⏳</div>
        <h1>승인 대기 중</h1>
        <p className="pending-message">
          계정이 성공적으로 생성되었습니다!
        </p>
        <p className="pending-description">
          관리자의 승인을 기다려주세요.
          계정 승인 시 이메일로 알림을 받으실 수 있습니다.
        </p>

        <div className="pending-info">
          <h3>다음 단계</h3>
          <ul>
            <li>관리자가 요청을 검토합니다</li>
            <li>승인 시 이메일로 알림을 받습니다</li>
            <li>승인 후 로그인하여 서비스를 이용할 수 있습니다</li>
          </ul>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default Pending;
