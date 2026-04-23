'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Mail, Lock, Terminal } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/projects');
    } catch {
      setError('Credenciales inválidas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Brand */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 bg-[#131b2e] rounded-xl flex items-center justify-center mb-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-[rgba(70,69,84,0.15)] relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#c0c1ff]/20 to-transparent rounded-xl opacity-50" />
          <Terminal className="w-8 h-8 text-[#c0c1ff] drop-shadow-[0_0_8px_rgba(192,193,255,0.4)] relative z-10" />
        </div>
        <h1 className="font-[var(--font-space-grotesk)] text-3xl font-bold tracking-tighter text-[#dae2fd]">
          Prompt Studio
        </h1>
        <p className="text-[#c7c4d7] text-sm mt-2">The Neural Architect Workspace</p>
      </div>

      {/* Login Card */}
      <div className="bg-[#131b2e] rounded-2xl p-8 shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-[rgba(70,69,84,0.15)] backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-[#93000a]/20 border border-[#ffb4ab]/20 rounded px-3 py-2 text-[#ffb4ab] text-sm text-center">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-xs font-semibold text-[#c7c4d7] uppercase tracking-widest">
              Email Address
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#908fa0]">
                <Mail className="w-5 h-5" />
              </span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="architect@neural.com"
                className="block w-full pl-10 pr-3 py-3 bg-[#060e20] border border-[rgba(70,69,84,0.3)] rounded text-[#dae2fd] placeholder-[#908fa0] focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff] focus:outline-none focus:shadow-[0_0_15px_rgba(192,193,255,0.1)] transition-all font-[var(--font-geist-mono)] text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-semibold text-[#c7c4d7] uppercase tracking-widest">
                Password
              </label>
              <a href="#" className="text-xs text-[#c0c1ff] hover:text-[#8083ff] transition-colors">
                Forgot password?
              </a>
            </div>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#908fa0]">
                <Lock className="w-5 h-5" />
              </span>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-3 bg-[#060e20] border border-[rgba(70,69,84,0.3)] rounded text-[#dae2fd] placeholder-[#908fa0] focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff] focus:outline-none focus:shadow-[0_0_15px_rgba(192,193,255,0.1)] transition-all font-[var(--font-geist-mono)] text-sm"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border-0 rounded text-sm font-semibold text-[#1000a9] bg-gradient-to-r from-[#c0c1ff] to-[#8083ff] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c0c1ff] focus:ring-offset-[#0b1326] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[rgba(70,69,84,0.2)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-[#131b2e] text-[#c7c4d7] tracking-wide">Or continue with</span>
          </div>
        </div>

        {/* Social */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" className="flex items-center justify-center w-full px-4 py-2.5 border border-[rgba(70,69,84,0.3)] rounded bg-[#060e20] text-[#dae2fd] hover:bg-[#2d3449]/30 transition-colors text-sm font-medium">
            Google
          </button>
          <button type="button" className="flex items-center justify-center w-full px-4 py-2.5 border border-[rgba(70,69,84,0.3)] rounded bg-[#060e20] text-[#dae2fd] hover:bg-[#2d3449]/30 transition-colors text-sm font-medium">
            GitHub
          </button>
        </div>
      </div>

      {/* Footer link */}
      <p className="mt-8 text-center text-sm text-[#c7c4d7]">
        New to Prompt Studio?{' '}
        <Link href="/register" className="font-medium text-[#c0c1ff] hover:text-[#8083ff] transition-colors">
          Create an account
        </Link>
      </p>
    </>
  );
}
