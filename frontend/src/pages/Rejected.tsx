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
        <h1>Access Denied</h1>
        <p className="rejected-message">
          Your account request has been rejected by an administrator.
        </p>
        <p className="rejected-description">
          If you believe this is a mistake, please contact the system administrator
          for more information.
        </p>

        <div className="rejected-info">
          <h3>Need help?</h3>
          <p>
            Contact your organization's administrator to understand why your
            access was denied and what steps you can take next.
          </p>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default Rejected;
