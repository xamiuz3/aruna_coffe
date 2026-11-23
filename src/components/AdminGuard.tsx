'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminAuth, AdminSession } from '@/lib/auth';
import Link from 'next/link';
import { Lock, ArrowRight, Home } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const active = AdminAuth.getSession();
    setSession(active);
    setIsReady(true);

    if (!active) {
      const returnUrl = encodeURIComponent(pathname || '/kasir');
      router.replace(`/kasir/login?returnUrl=${returnUrl}`);
    }

    const handleAuthChange = () => {
      const updated = AdminAuth.getSession();
      setSession(updated);
      if (!updated && typeof window !== 'undefined' && !window.location.pathname.startsWith('/kasir/login')) {
        const returnUrl = encodeURIComponent(pathname || '/kasir');
        router.replace(`/kasir/login?returnUrl=${returnUrl}`);
      }
    };

    window.addEventListener('aruna_admin_auth_changed', handleAuthChange);
    return () => {
      window.removeEventListener('aruna_admin_auth_changed', handleAuthChange);
    };
  }, [router, pathname]);

  if (!isReady) {
    return <div className="min-h-screen bg-[#181513]" />;
  }

  if (!session) {
    const returnUrl = encodeURIComponent(pathname || '/kasir');
    return (
      <div className="min-h-screen bg-[#141210] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="max-w-md w-full bg-[#1c1917] border border-stone-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-wider border border-red-500/20">
              Akses Terbatas
            </span>
            <h2 className="text-xl font-black text-white">Otorisasi Admin Diperlukan</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              Silakan login dengan akun kasir atau admin yang berwenang.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href={`/kasir/login?returnUrl=${returnUrl}`}
              className="w-full py-3 px-4 rounded-xl bg-[#c87a58] hover:bg-[#b86948] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <span>Login ke Portal Admin</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Menu Tamu</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
