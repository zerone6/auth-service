import { OAuthProviderConfig } from '../types/auth';

export const oauthProviders: OAuthProviderConfig[] = [
  {
    id: 'google',
    name: 'Google',
    icon: '🔍',
    enabled: true,
    color: '#4285F4',
    url: '/auth/google',
  },
  {
    id: 'naver',
    name: 'Naver',
    icon: '🟢',
    enabled: false,
    color: '#03C75A',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '👤',
    enabled: false,
    color: '#1877F2',
  },
  {
    id: 'line',
    name: 'LINE',
    icon: '💬',
    enabled: false,
    color: '#00C300',
  },
];
