'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminAuth, AdminSession } from '@/lib/auth';
import { 
  UtensilsCrossed, 
  CalendarDays, 
  ReceiptText,
  Layers, 
  QrCode, 
  CreditCard, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  Menu, 
  X, 
  Volume2, 
  VolumeX,
  LogOut,
  UserCircle2,
  Coffee,
  MessageSquare,
  LayoutGrid,
  FileText
} from 'lucide-react';

interface AdminSidebarProps {
  currentPath: string;
  pendingOrdersCount?: number;
  pendingReservationsCount?: number;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export function AdminSidebar({
  currentPath,
  pendingOrdersCount = 0,
  pendingReservationsCount = 0,
  soundEnabled = true,
  onToggleSound,
}: AdminSidebarProps) {
  const router = useRouter();
  // Desktop collapse state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  // Mobile & tablet drawer state
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  // Admin auth session
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isShiftDropdownOpen, setIsShiftDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aruna_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {}

    const checkSession = () => {
      setSession(AdminAuth.getSession());
    };
    checkSession();
    window.addEventListener('aruna_admin_auth_changed', checkSession);
    return () => {
      window.removeEventListener('aruna_admin_auth_changed', checkSession);
    };
  }, []);

  const handleLogout = () => {
    if (confirm('Keluar dari portal admin Aruna?')) {
      AdminAuth.logout();
      router.push('/kasir/login');
    }
  };

  const handleToggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    try {
      localStorage.setItem('aruna_sidebar_collapsed', String(nextVal));
    } catch {}
  };

  const isOwner = session?.role === 'owner';
  const navItems = [
    {
      title: 'Pesanan & Reservasi',
      shortTitle: 'Pesanan',
      href: '/kasir',
      icon: FileText,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      badgeColor: 'bg-[#c85a32] text-white',
    },
    {
      title: 'Denah & QR Meja',
      shortTitle: 'Denah Meja',
      href: '/kasir/meja',
      icon: LayoutGrid,
    },
    {
      title: 'Stok Dessert',
      shortTitle: 'Stok',
      href: '/kasir/stok',
      icon: Layers,
    },
    {
      title: 'Rekap & Tutup Shift',
      shortTitle: 'Rekap Shift',
      href: '/kasir/histori',
      icon: ReceiptText,
    },
    ...(isOwner ? [
      {
        title: 'Ringkasan Bisnis (Owner)',
        shortTitle: 'Owner',
        href: '/kasir/owner',
        icon: CreditCard,
      }
    ] : [])
  ];

  return (
    <>
      {/* ======================================================== */}
      {/* 1. TOP BAR UNTUK HP (ANDROID) & TABLET (< lg)             */}
      {/* ======================================================== */}
      <header className="lg:hidden w-full bg-[#162a1f] text-stone-100 border-b border-stone-800 px-3.5 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-sm print:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
            title="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#f7f5f0] border border-white/10 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/aruna-logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-xs tracking-wider text-white uppercase">ARUNA</span>
                <span className="px-1 py-0.2 rounded bg-emerald-700 text-white text-[7px] font-black uppercase">POS</span>
              </div>
              <span className="text-[9px] text-stone-400 font-medium block mt-0.5">Kitchen & Dispatch</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                soundEnabled ? 'text-amber-400 bg-stone-800' : 'text-stone-500 bg-stone-800/60'
              }`}
              title={soundEnabled ? 'Audio Notif Aktif' : 'Audio Notif Mute'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}

          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. SLIDE-OVER DRAWER OVERLAY UNTUK HP & TABLET           */}
      {/* ======================================================== */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex animate-in fade-in duration-200 print:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <div 
            className="w-72 max-w-[80vw] h-full bg-[#162a1f] text-stone-200 flex flex-col justify-between shadow-2xl border-r border-stone-800 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col flex-1 overflow-y-auto">
              {/* Drawer Header */}
              <div className="p-4 border-b border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#f7f5f0] border border-white/10 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/aruna-logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-white tracking-widest uppercase block">ARUNA POS</span>
                    <span className="text-[10px] text-stone-400 font-medium block">Kitchen & Dispatch</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="p-3.5 space-y-6">
                <div>
                  <span className="px-3 text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">
                    Menu Utama
                  </span>
                  <nav className="space-y-1 text-xs">
                    {navItems.map((item) => {
                      const isActive = currentPath === item.href;
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold tracking-tight transition-colors ${
                            isActive
                              ? 'bg-[#c87a58] text-white shadow-xs'
                              : 'text-stone-300 hover:text-white hover:bg-stone-800'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                          <span className="flex-1">{item.title}</span>
                          {item.badge !== null && item.badge !== undefined && (
                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${item.badgeColor || 'bg-stone-700 text-white'}`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div>
                  <span className="px-3 text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">
                    Pintasan Tamu
                  </span>
                  <nav className="space-y-1 text-xs">
                    <Link
                      href="/order?table=Meja%2014"
                      target="_blank"
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-4 h-4 text-stone-400" />
                        <span>Web Menu Tamu</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                    </Link>
                  </nav>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-stone-800 bg-[#112218] text-xs space-y-3 text-stone-400">
              <div className="flex items-center justify-between">
                <span>Shift Kasir: Aktif</span>
                <span className="font-mono text-emerald-400 font-bold">● Online</span>
              </div>

              {session && (
                <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserCircle2 className="w-6 h-6 text-stone-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{session.name}</p>
                      <span className="text-[10px] text-[#c87a58] font-semibold uppercase">{session.role}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Keluar / Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DESKTOP SIDEBAR (EXACT MATCH FIGMA / CANVA MOCKUP)     */}
      {/* ======================================================== */}
      <aside className="hidden lg:flex flex-col justify-between shrink-0 z-40 bg-[#162a1f] text-stone-200 border-r border-stone-800/80 w-64 lg:h-screen lg:sticky lg:top-0 print:hidden select-none">
        <div className="flex flex-col flex-1 p-5 space-y-6 overflow-y-auto no-scrollbar">
          {/* Header & Logo */}
          <Link href="/" className="flex items-center gap-3 pt-1 group">
            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/90 shrink-0 bg-white/5 shadow-xs">
              <Coffee className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <span className="font-serif font-black text-sm text-white tracking-widest uppercase block leading-tight">
                ARUNA
              </span>
              <span className="text-[9px] font-sans text-stone-400 tracking-widest block uppercase font-medium mt-0.5">
                CAFE & SPACE
              </span>
            </div>
          </Link>

          {/* Akses Aktif Selector Card */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsShiftDropdownOpen(!isShiftDropdownOpen)}
              className="w-full bg-[#1a3224]/90 hover:bg-[#1a3224] border border-white/10 rounded-2xl p-3 flex items-center justify-between transition-colors cursor-pointer text-left"
            >
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500/90 block">
                  AKSES AKTIF
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-white tracking-tight">{session?.shift || 'Shift Pagi'}</span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${isShiftDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
            </button>

            {isShiftDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#122219] border border-white/15 rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                {(['Shift Pagi', 'Shift Malam', 'Admin Owner'] as const).map((s) => {
                  const isCur = (session?.shift || 'Shift Pagi') === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        AdminAuth.updateShift(s);
                        setIsShiftDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isCur ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-stone-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{s}</span>
                        <span className="text-[9px] text-stone-400 font-normal">
                          {s === 'Shift Pagi' ? '08.00 - 17.00' : s === 'Shift Malam' ? '17.00 - Tutup' : 'Akses Penuh'}
                        </span>
                      </div>
                      {isCur && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="space-y-2">
            <span className="px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 block mb-2.5">
              MENU UTAMA
            </span>

            <nav className="space-y-1.5 text-xs">
              {navItems.map((item) => {
                const isActive = currentPath === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'border border-white/15 bg-white/10 text-white font-bold shadow-xs'
                        : 'text-stone-400 hover:text-white hover:bg-white/5 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                    <span className="flex-1 truncate">{item.title}</span>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${item.badgeColor || 'bg-stone-700 text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Sidebar: WhatsApp Bot & Logout */}
        <div className="p-4 space-y-3 border-t border-white/5 bg-[#122319]">
          <div className="bg-[#1a3224]/80 border border-white/10 rounded-2xl p-3 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block leading-tight">WhatsApp Bot</span>
              <span className="text-[10px] text-emerald-400 font-medium block">● Tersambung</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-stone-400 hover:text-rose-400 text-xs font-medium px-2 py-1.5 transition-colors cursor-pointer w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}
