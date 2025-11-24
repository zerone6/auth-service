import { OAuthProviderConfig } from '../types/auth';

export const oauthProviders: OAuthProviderConfig[] = [
  {
    id: 'google',
    name: 'Google',
    icon: 'google',
    enabled: true,
    color: '#4285F4',
    url: '/auth/google',
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: 'apple',
    enabled: false,
    color: '#000000',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    enabled: false,
    color: '#1877F2',
  },
  {
    id: 'naver',
    name: 'Naver',
    icon: 'naver',
    enabled: false,
    color: '#03C75A',
  },
  {
    id: 'line',
    name: 'LINE',
    icon: 'line',
    enabled: false,
    color: '#00B900',
  },
];
