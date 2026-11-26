'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AdminAuth } from '@/lib/auth';
import { 
  Lock, 
  Coffee, 
  Clock, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  Wifi,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

type ProfileType = 'Shift Pagi' | 'Shift Malam' | 'Admin Owner' | null;

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/kasir';

  const [selectedProfile, setSelectedProfile] = useState<ProfileType>(null);
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
    if (!selectedProfile) {
      setErrorMsg('Silakan pilih salah satu profil akses terlebih dahulu.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    const username = selectedProfile === 'Shift Pagi' 
      ? 'kasir_pagi' 
      : selectedProfile === 'Shift Malam' 
      ? 'kasir_malam' 
      : 'admin';

    const res = AdminAuth.login(username, password, selectedProfile);
    if (res.success) {
      setIsSuccess(true);
      // Redirect to owner dashboard if Admin Owner, or regular kasir dashboard
      const target = selectedProfile === 'Admin Owner' ? '/kasir/owner' : returnUrl;
      setTimeout(() => {
        window.location.href = target;
      }, 300);
    } else {
      setErrorMsg(res.error || 'Autentikasi gagal. Silakan periksa kembali PIN / Password.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#162a1f] text-stone-100 flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans">
      {/* Background Subtle Arc / Rings (Figma) */}
      <div className="absolute -left-64 -bottom-64 w-[580px] h-[580px] rounded-full border border-emerald-800/30 pointer-events-none" />
      <div className="absolute -left-48 -bottom-48 w-[420px] h-[420px] rounded-full border border-emerald-800/30 pointer-events-none" />
      <div className="absolute -left-32 -bottom-32 w-[280px] h-[280px] rounded-full border border-emerald-800/30 pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-2xs">
            <Coffee className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <span className="font-bold text-xs tracking-wider uppercase block text-white">ARUNA</span>
            <span className="text-[9px] text-emerald-400/80 tracking-widest block uppercase font-mono">CAFE & SPACE</span>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300/80 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Website customer</span>
        </Link>
      </header>

      {/* Main Content: Left Typography, Right Card */}
      <main className="relative z-10 max-w-6xl mx-auto w-full my-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Heading & WhatsApp Status */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-400 block">
                ARUNA OPERATIONS
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-[1.15]">
                Selamat datang,<br />
                pilih aksesmu.
              </h1>
              <p className="text-xs sm:text-sm text-stone-300/80 font-normal leading-relaxed max-w-md pt-1">
                Gunakan profil sesuai shift aktif. Akses admin hanya tersedia untuk owner.
              </p>
            </div>

            {/* Status WhatsApp Bot Card (Figma) */}
            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm max-w-sm">
              <div className="w-9 h-9 rounded-full bg-emerald-950/80 border border-emerald-700/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Wifi className="w-4 h-4" />
              </div>
              <div className="min-w-0 pr-4">
                <h4 className="text-xs font-bold text-white leading-tight">Notifikasi WhatsApp</h4>
                <p className="text-[10px] text-emerald-300/80">Tersambung • aktif 2 menit lalu</p>
              </div>
              <span className="ml-auto px-2 py-0.5 rounded-md bg-emerald-900/60 border border-emerald-500/40 text-[9px] font-black tracking-wider text-emerald-300 uppercase">
                ONLINE
              </span>
            </div>
          </div>

          {/* Right Column: Profiles Card */}
          <div className="lg:col-span-6 flex justify-end">
            <div className="bg-[#faf8f5] text-stone-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200/80 max-w-md w-full space-y-5">
              
              {/* Header inside card */}
              <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
                <span className="text-[10px] font-black tracking-widest text-stone-400 uppercase">
                  PILIH PROFIL AKSES
                </span>
                <span className="text-[11px] text-stone-400 font-medium">
                  3 profil tersedia
                </span>
              </div>

              {/* Error & Success Alerts */}
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {isSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-bold">Login berhasil! Membuka dashboard...</span>
                </div>
              )}

              {/* 3 Profile Cards (Figma) */}
              <div className="space-y-2.5">
                {/* 1. Shift Pagi */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProfile('Shift Pagi');
                    setPassword('');
                    setErrorMsg('');
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedProfile === 'Shift Pagi'
                      ? 'border-[#1b3728] bg-[#edf3ee] shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#faede6] text-[#b85c38] flex items-center justify-center shrink-0">
                      <Coffee className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 leading-tight">Shift Pagi</h4>
                      <p className="text-[11px] text-stone-500">08.00 – 17.00</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${selectedProfile === 'Shift Pagi' ? 'translate-x-0.5 text-stone-800' : ''}`} />
                </button>

                {/* 2. Shift Malam */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProfile('Shift Malam');
                    setPassword('');
                    setErrorMsg('');
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedProfile === 'Shift Malam'
                      ? 'border-[#1b3728] bg-[#edf3ee] shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#e9eef5] text-[#3b669e] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 leading-tight">Shift Malam</h4>
                      <p className="text-[11px] text-stone-500">17.00 – Tutup</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${selectedProfile === 'Shift Malam' ? 'translate-x-0.5 text-stone-800' : ''}`} />
                </button>

                {/* 3. Admin Owner */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProfile('Admin Owner');
                    setPassword('');
                    setErrorMsg('');
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedProfile === 'Admin Owner'
                      ? 'border-[#1b3728] bg-[#edf3ee] shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#eeeaf7] text-[#6b4fb0] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 leading-tight">Admin Owner</h4>
                      <p className="text-[11px] text-stone-500">Akses laporan penuh</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${selectedProfile === 'Admin Owner' ? 'translate-x-0.5 text-stone-800' : ''}`} />
                </button>
              </div>

              {/* PIN / Password Input Form (Figma Screenshot 4) */}
              {selectedProfile ? (
                <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 border-t border-stone-200/80 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-800">
                      {selectedProfile === 'Admin Owner' ? 'Password Admin Owner *' : 'PIN shift (6 digit) *'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoFocus
                        placeholder={selectedProfile === 'Admin Owner' ? 'Masukkan password owner' : 'Masukkan PIN shift'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 bg-white focus:outline-none focus:border-[#1b3728]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-stone-400 block">
                      {selectedProfile === 'Admin Owner' ? 'Password default: aruna1988' : 'PIN default: 1234 atau 1988'}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || isSuccess || !password.trim()}
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                      password.trim()
                        ? 'bg-[#1b3728] hover:bg-[#152c20] text-white shadow-md active:scale-98'
                        : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    <span>
                      {selectedProfile === 'Admin Owner' ? 'Masuk ke dashboard owner' : 'Masuk ke dashboard'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="pt-3 text-center border-t border-stone-200/80">
                  <p className="text-[11px] text-stone-400 font-medium">
                    🔒 Pilih profil untuk melanjutkan
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center sm:text-left text-[11px] text-emerald-300/60 font-medium">
        Sistem Internal Aruna Cafe • Jl. Bung Tomo, Samarinda Seberang
      </footer>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#162a1f] flex items-center justify-center text-xs font-bold text-emerald-300">
        Memuat Portal Aruna Operations...
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
