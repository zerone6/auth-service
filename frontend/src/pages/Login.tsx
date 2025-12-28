import React from 'react';
import { oauthProviders } from '../config/oauthProviders';
import OAuthProviderButton from '../components/OAuthProviderButton';
import { OAuthProviderConfig } from '../types/auth';
import './Login.css';

const Login: React.FC = () => {

  const handleProviderClick = (provider: OAuthProviderConfig) => {
    if (provider.enabled && provider.url) {
      // Redirect to OAuth endpoint
      window.location.href = provider.url;
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>로그인 선택</h1>
          <p>원하시는 계정으로 로그인해주세요</p>
        </div>

        <div className="oauth-providers">
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
