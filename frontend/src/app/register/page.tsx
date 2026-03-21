'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Code2, Github } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.register({ email, username, password });
      localStorage.setItem('access_token', data.tokens.accessToken);
      localStorage.setItem('refresh_token', data.tokens.refreshToken);
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Code2 size={36} className="text-blue-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-gray-400 text-sm mt-1">Start exploring codebases with AI</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <a
            href={authService.getGithubLoginUrl()}
            className="flex items-center justify-center gap-2 w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Github size={17} /> Continue with GitHub
          </a>

          <div className="relative flex items-center">
            <div className="flex-1 border-t border-gray-800" />
            <span className="px-3 text-xs text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-800" />
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email" required
              className="w-full bg-gray-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
            />
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Username" required minLength={3}
              className="w-full bg-gray-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
            />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 8 characters)" required minLength={8}
              className="w-full bg-gray-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
            />
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
