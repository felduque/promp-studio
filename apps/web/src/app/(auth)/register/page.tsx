'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { User, Mail, Lock, EyeOff, Eye, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      router.push('/projects');
    } catch {
      setError('Error al registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Registration Card */}
      <div className="bg-[#222a3d]/60 backdrop-blur-md rounded-xl p-8 shadow-[0_8px_32px_rgba(11,19,38,0.4)] border border-[rgba(70,69,84,0.15)] relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#060e20] rounded-lg mb-4 border border-[rgba(70,69,84,0.15)]">
            <User className="w-6 h-6 text-[#c0c1ff]" />
          </div>
          <h1 className="font-[var(--font-space-grotesk)] text-2xl font-semibold text-[#dae2fd] tracking-tight mb-2">
            Create Account
          </h1>
          <p className="text-[#c7c4d7] text-sm">
            Join the next generation of prompt engineering.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-[#93000a]/20 border border-[#ffb4ab]/20 rounded px-3 py-2 text-[#ffb4ab] text-sm text-center">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1">
            <label htmlFor="fullName" className="block text-xs uppercase tracking-[0.05em] text-[#c7c4d7]">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-[1.125rem] h-[1.125rem] text-[#c7c4d7]/50" />
              </span>
              <input
                id="fullName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full bg-[#060e20] text-[#dae2fd] rounded border-0 pl-10 py-2.5 text-sm focus:ring-0 focus:outline-none focus:shadow-[0_0_15px_rgba(192,193,255,0.1)] transition-shadow placeholder-[#c7c4d7]/50"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs uppercase tracking-[0.05em] text-[#c7c4d7]">
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-[1.125rem] h-[1.125rem] text-[#c7c4d7]/50" />
              </span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@neuralarchitect.io"
                className="w-full bg-[#060e20] text-[#dae2fd] rounded border-0 pl-10 py-2.5 text-sm focus:ring-0 focus:outline-none focus:shadow-[0_0_15px_rgba(192,193,255,0.1)] transition-shadow placeholder-[#c7c4d7]/50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs uppercase tracking-[0.05em] text-[#c7c4d7]">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-[1.125rem] h-[1.125rem] text-[#c7c4d7]/50" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#060e20] text-[#dae2fd] rounded border-0 pl-10 pr-10 py-2.5 text-sm focus:ring-0 focus:outline-none focus:shadow-[0_0_15px_rgba(192,193,255,0.1)] transition-shadow placeholder-[#c7c4d7]/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#c7c4d7] hover:text-[#dae2fd] transition-colors"
              >
                {showPassword ? <Eye className="w-[1.125rem] h-[1.125rem]" /> : <EyeOff className="w-[1.125rem] h-[1.125rem]" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 border-0 rounded text-sm font-medium text-[#1000a9] bg-gradient-to-r from-[#c0c1ff] to-[#8083ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Creating...' : 'Create Account'}</span>
              {!loading && <ArrowRight className="w-[1.125rem] h-[1.125rem]" />}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="mt-8 mb-6 flex items-center">
          <div className="flex-grow border-t border-[rgba(70,69,84,0.15)]" />
          <span className="flex-shrink-0 mx-4 text-xs text-[#c7c4d7] uppercase tracking-wider">Or continue with</span>
          <div className="flex-grow border-t border-[rgba(70,69,84,0.15)]" />
        </div>

        {/* Social */}
        <div className="space-y-3">
          <button type="button" className="flex items-center justify-center gap-2 w-full bg-[#131b2e] text-[#dae2fd] font-medium rounded py-2.5 hover:bg-[#171f33] transition-colors border border-[rgba(70,69,84,0.15)] text-sm">
            Google
          </button>
          <button type="button" className="flex items-center justify-center gap-2 w-full bg-[#131b2e] text-[#dae2fd] font-medium rounded py-2.5 hover:bg-[#171f33] transition-colors border border-[rgba(70,69,84,0.15)] text-sm">
            GitHub
          </button>
        </div>

        {/* Footer link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#c7c4d7]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#c0c1ff] hover:text-[#8083ff] font-medium transition-colors ml-1">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
