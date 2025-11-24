import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Rejected.css';

const Rejected: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    fetch('/auth/logout', { method: 'POST', credentials: 'include' })
      .then(() => navigate('/login'))
      .catch(console.error);
  };

  return (
    <div className="rejected-container">
      <div className="rejected-card">
        <div className="rejected-icon">❌</div>
        <h1>접근 거부</h1>
        <p className="rejected-message">
          관리자에 의해 계정 요청이 거부되었습니다.
        </p>
        <p className="rejected-description">
          실수라고 생각되시면 시스템 관리자에게 문의하여 자세한 정보를 확인하세요.
        </p>

        <div className="rejected-info">
          <h3>도움이 필요하신가요?</h3>
          <p>
            조직의 관리자에게 연락하여 접근이 거부된 이유와 다음에 취할 수 있는 조치를 확인하세요.
          </p>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default Rejected;
