import React from 'react';
import { useNavigate } from 'react-router-dom';
import { oauthProviders } from '../config/oauthProviders';
import OAuthProviderButton from '../components/OAuthProviderButton';
import { OAuthProviderConfig } from '../types/auth';
import './SignUp.css';

const SignUp: React.FC = () => {
  const navigate = useNavigate();

  const handleProviderClick = (provider: OAuthProviderConfig) => {
    if (provider.enabled && provider.url) {
      // Redirect to OAuth endpoint (same as login)
      window.location.href = provider.url;
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1>📝 Sign Up</h1>
          <p>Create a new account with your preferred method</p>
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

        <div className="signup-footer">
          <p>
            Already have an account?{' '}
            <button
              className="link-button"
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
