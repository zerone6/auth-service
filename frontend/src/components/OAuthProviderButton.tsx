import React from 'react';
import { OAuthProviderConfig } from '../types/auth';
import './OAuthProviderButton.css';

interface Props {
  provider: OAuthProviderConfig;
  onClick: (provider: OAuthProviderConfig) => void;
}

const OAuthProviderButton: React.FC<Props> = ({ provider, onClick }) => {
  const handleClick = () => {
    if (provider.enabled) {
      onClick(provider);
    }
  };

  return (
    <button
      className={`oauth-button ${!provider.enabled ? 'disabled' : ''}`}
      onClick={handleClick}
      disabled={!provider.enabled}
      style={{
        borderColor: provider.enabled ? provider.color : '#ccc',
      }}
    >
      <span className="oauth-icon">{provider.icon}</span>
      <span className="oauth-name">
        {provider.enabled ? `Continue with ${provider.name}` : `${provider.name} (TBD)`}
      </span>
      {!provider.enabled && <span className="oauth-badge">Coming Soon</span>}
    </button>
  );
};

export default OAuthProviderButton;
