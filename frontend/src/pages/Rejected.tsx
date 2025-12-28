import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Rejected.module.css';

const Rejected: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    fetch('/auth/logout', { method: 'POST', credentials: 'include' })
      .then(() => navigate('/login'))
      .catch(console.error);
  };

  return (
    <div className={styles.rejectedContainer}>
      <div className={styles.rejectedCard}>
        <div className={styles.rejectedIcon}>❌</div>
        <h1>접근 거부</h1>
        <p className={styles.rejectedMessage}>
          관리자에 의해 계정 요청이 거부되었습니다.
        </p>
        <p className={styles.rejectedDescription}>
          실수라고 생각되시면 시스템 관리자에게 문의하여 자세한 정보를 확인하세요.
        </p>

        <div className={styles.rejectedInfo}>
          <h3>도움이 필요하신가요?</h3>
          <p>
            조직의 관리자에게 연락하여 접근이 거부된 이유와 다음에 취할 수 있는 조치를 확인하세요.
          </p>
        </div>

        <button className={styles.logoutButton} onClick={handleLogout}>
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default Rejected;
