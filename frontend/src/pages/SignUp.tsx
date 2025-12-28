import React from 'react';
import { useNavigate } from 'react-router-dom';
import { oauthProviders } from '../config/oauthProviders';
import OAuthProviderButton from '../components/OAuthProviderButton';
import { OAuthProviderConfig } from '../types/auth';
import styles from './SignUp.module.css';

const SignUp: React.FC = () => {
  const navigate = useNavigate();

  const handleProviderClick = (provider: OAuthProviderConfig) => {
    if (provider.enabled && provider.url) {
      // Redirect to OAuth endpoint (same as login)
      window.location.href = provider.url;
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupCard}>
        <div className={styles.signupHeader}>
          <h1>📝 Sign Up</h1>
          <p>Create a new account with your preferred method</p>
        </div>

        <div className={styles.oauthProviders}>
          {oauthProviders.map((provider) => (
            <OAuthProviderButton
              key={provider.id}
              provider={provider}
              onClick={handleProviderClick}
            />
          ))}
        </div>

        <div className={styles.signupFooter}>
          <p>
            Already have an account?{' '}
            <button
              className={styles.linkButton}
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
