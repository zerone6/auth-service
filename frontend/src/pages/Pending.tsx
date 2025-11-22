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
        <h1>Approval Pending</h1>
        <p className="pending-message">
          Your account has been created successfully!
        </p>
        <p className="pending-description">
          Please wait for an administrator to approve your access.
          You will receive an email notification once your account is approved.
        </p>

        <div className="pending-info">
          <h3>What happens next?</h3>
          <ul>
            <li>An administrator will review your request</li>
            <li>You'll receive an email when approved</li>
            <li>Once approved, you can sign in and access the service</li>
          </ul>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Pending;
