'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';

function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const oauthCode = params.get('code');

    if (!oauthCode) {
      router.replace('/login?error=oauth_failed');
      return;
    }

    // Exchange the short-lived one-time code for real tokens, then fetch user profile.
    authService
      .exchangeGithubCode(oauthCode)
      .then(({ accessToken, refreshToken }) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        return authService.me().then((user) => {
          setAuth(user, accessToken, refreshToken);
          router.replace('/dashboard');
        });
      })
      .catch(() => {
        router.replace('/login?error=oauth_failed');
      });
  }, [params, router, setAuth]);

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400 text-sm animate-pulse">Signing you in...</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">Loading...</p>
      </main>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
