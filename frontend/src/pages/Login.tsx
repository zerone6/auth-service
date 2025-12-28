import React from 'react';
import { oauthProviders } from '../config/oauthProviders';
import OAuthProviderButton from '../components/OAuthProviderButton';
import { OAuthProviderConfig } from '../types/auth';
import styles from './Login.module.css';

const Login: React.FC = () => {

  const handleProviderClick = (provider: OAuthProviderConfig) => {
    if (provider.enabled && provider.url) {
      // Redirect to OAuth endpoint
      window.location.href = provider.url;
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1>로그인 선택</h1>
          <p>원하시는 계정으로 로그인해주세요</p>
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
      </div>
    </div>
  );
};

export default Login;
