import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/auth';
import styles from './Success.module.css';

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
      <div className={styles.successPage}>
        <div className={styles.successContainer}>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login required
  if (!user) {
    return (
      <div className={styles.successPage}>
        <header className={styles.successHeader}>
          <div className={styles.headerContainer}>
            <h1>가족 정보 공유 사이트</h1>
          </div>
        </header>

        <main className={styles.successMain}>
          <div className={styles.successContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className={styles.loginCard}>
              <h2>로그인이 필요합니다</h2>
              <p>서비스를 이용하시려면 로그인해주세요</p>
              <a href="/auth/login" className={styles.loginButton}>
                로그인
              </a>
            </div>
          </div>
        </main>

        <footer className={styles.successFooter}>
          <p>&copy; 2024 Family Services. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className={styles.successPage}>
      {/* Header */}
      <header className={styles.successHeader}>
        <div className={styles.headerContainer}>
          <h1>가족 정보 공유 사이트</h1>

          {user && (
            <div className={styles.profileMenu}>
              <button
                className={styles.profileButton}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className={styles.avatar}>
                  {getUserInitial()}
                </div>
              </button>

              {dropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownAvatar}>
                      {getUserInitial()}
                    </div>
                    <div className={styles.dropdownInfo}>
                      <p className={styles.dropdownEmail}>{user.email}</p>
                      <span className={`${styles.dropdownBadge} ${user.role === 'admin' ? styles.dropdownBadgeAdmin : styles.dropdownBadgeUser}`}>
                        {user.role === 'admin' ? '관리자' : '사용자'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.dropdownDivider}></div>

                  {user.role === 'admin' && (
                    <button className={styles.dropdownItem} onClick={handleGoToAdmin}>
                      <span className={styles.dropdownIcon}>👑</span>
                      관리자 대시보드
                    </button>
                  )}

                  <button className={styles.dropdownItem} onClick={handleLogout}>
                    <span className={styles.dropdownIcon}>🚪</span>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.successMain}>
        <div className={styles.successContainer}>
          <div className={styles.servicesGrid}>
            <a href="/highschool/" className={styles.serviceCard}>
              <div className={`${styles.serviceIcon} ${styles.serviceIconCalendar}`}>📅</div>
              <div className={styles.serviceContent}>
                <h2>일시일정</h2>
                <p>선택</p>
              </div>
            </a>

            <div
              className={`${styles.serviceCard} ${styles.serviceCardDisabled}`}
              onClick={() => alert('서비스 준비중입니다.')}
            >
              <div className={`${styles.serviceIcon} ${styles.serviceIconHome}`}>🏠</div>
              <div className={styles.serviceContent}>
                <h2>부동산</h2>
                <p>계산기</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.successFooter}>
        <p>&copy; 2024 Family Services. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Success;
