import React from 'react';
import { oauthProviders } from '../config/oauthProviders';



const Login: React.FC = () => {
  React.useEffect(() => {
    // Automatically redirect to Google login (first provider)
    // The user requested to skip the selection screen and strictly support Google.
    // This aligns the behavior with the main site's direct login flow.
    const googleProvider = oauthProviders.find(p => p.id === 'google');
    if (googleProvider && googleProvider.url) {
      window.location.href = googleProvider.url;
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Google 로그인 페이지로 이동 중...</p>
      </div>
    </div>
  );
};

export default Login;
