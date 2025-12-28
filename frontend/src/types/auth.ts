export interface User {
  userId: number;
  email: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export type OAuthProvider = 'google' | 'apple' | 'facebook' | 'naver' | 'line';

export interface OAuthProviderConfig {
  id: OAuthProvider;
  name: string;
  icon: string;
  enabled: boolean;
  color: string;
  url?: string;
}
