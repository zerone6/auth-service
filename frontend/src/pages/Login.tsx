import React from 'react';
import { useNavigate } from 'react-router-dom';
import { oauthProviders } from '../config/oauthProviders';
import OAuthProviderButton from '../components/OAuthProviderButton';
import { OAuthProviderConfig } from '../types/auth';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();

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
          <h1>🔐 Sign In</h1>
          <p>Choose your preferred authentication method</p>
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

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <button
              className="link-button"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
