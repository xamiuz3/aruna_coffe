'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AdminAuth } from '@/lib/auth';
import { 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Home,
  CheckCircle2
} from 'lucide-react';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/kasir';

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Jika sudah login, langsung arahkan ke returnUrl
  useEffect(() => {
    if (AdminAuth.isAuthenticated()) {
      window.location.href = returnUrl;
    }
  }, [returnUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const res = AdminAuth.login(username, password);
    if (res.success) {
      setIsSuccess(true);
      window.location.href = returnUrl;
    } else {
      setErrorMsg(res.error || 'Login gagal');
      setIsLoading(false);
    }
  };

  const fillQuickAccount = (user: string, pin: string) => {
    setUsername(user);
    setPassword(pin);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#141210] text-[#f7f5f0] flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background ambient pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#c87a58_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Subtle brand glow behind card */}
      <div className="absolute w-96 h-96 bg-[#c87a58]/10 rounded-full blur-3xl pointer-events-none -top-20 -right-20" />
      <div className="absolute w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -bottom-20 -left-20" />

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Branding Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto border-2 border-stone-800 shadow-xl bg-[#f7f5f0] p-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/aruna-logo.jpg" 
              alt="Aruna Cafe Logo" 
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-[10px] font-black uppercase tracking-widest text-[#c87a58] mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#c87a58]" />
              <span>Portal Otorisasi Staf</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Aruna Kitchen & POS
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              Sistem Manajemen Kasir, Reservasi, dan Inventaris
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-[#1c1917]/90 backdrop-blur-xl border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {isSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5 animate-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-bold">Login berhasil! Mengalihkan ke dashboard kasir...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-300">
                Username Akun
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin / kasir"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-900/80 border border-stone-700/80 text-white placeholder-stone-500 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#c87a58] focus:ring-1 focus:ring-[#c87a58] transition-all"
                  autoComplete="username"
                  disabled={isLoading || isSuccess}
                />
              </div>
            </div>

            {/* Input Password / PIN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-300">
                  Password / PIN Keamanan
                </label>
                <span className="text-[10px] text-stone-500">PIN 4-8 Digit</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password atau PIN"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-stone-900/80 border border-stone-700/80 text-white placeholder-stone-500 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#c87a58] focus:ring-1 focus:ring-[#c87a58] transition-all"
                  autoComplete="current-password"
                  disabled={isLoading || isSuccess}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full py-3.5 rounded-2xl bg-[#c87a58] hover:bg-[#b86948] active:scale-[0.98] disabled:opacity-50 text-white font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#c87a58]/20 transition-all cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard Kasir</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Staff Helper */}
          <div className="pt-4 border-t border-stone-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span className="font-bold text-stone-300">Pilihan Cepat Staf Aruna:</span>
              <span className="text-[10px] text-stone-500">Klik untuk isi otomatis</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickAccount('admin', '1988')}
                className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-stone-700 text-left transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-stone-200 group-hover:text-[#c87a58]">
                  Akun Admin
                </div>
                <div className="text-[10px] font-mono text-stone-400">
                  User: admin / PIN: 1988
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillQuickAccount('kasir', '1234')}
                className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-stone-700 text-left transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-stone-200 group-hover:text-[#c87a58]">
                  Akun Kasir
                </div>
                <div className="text-[10px] font-mono text-stone-400">
                  User: kasir / PIN: 1234
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Back Link to Guest / Menu */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-stone-900"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Menu Tamu</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#141210] flex items-center justify-center text-xs font-bold text-stone-400">
        Memuat Portal Admin...
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
