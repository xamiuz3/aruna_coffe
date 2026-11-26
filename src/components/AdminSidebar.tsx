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
  Menu, 
  X, 
  Volume2, 
  VolumeX,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  UserCircle2
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
      icon: UtensilsCrossed,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      badgeColor: 'bg-[#c85a32] text-white',
    },
    {
      title: 'Denah & QR Meja',
      shortTitle: 'Denah Meja',
      href: '/kasir/meja',
      icon: QrCode,
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
      {/* 3. DESKTOP & TABLET SIDEBAR (BISA DI-MINIMIZE 100%)       */}
      {/* ======================================================== */}
      <aside 
        className={`hidden lg:flex flex-col justify-between shrink-0 z-40 bg-[#162a1f] text-stone-200 border-r border-stone-800 lg:h-screen lg:sticky lg:top-0 transition-all duration-200 print:hidden ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          {/* Header & Logo with Minimize Button */}
          <div className={`p-4 border-b border-stone-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed ? (
              <>
                <Link href="/" className="flex items-center gap-3 group overflow-hidden">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0 border border-white/10 bg-[#f7f5f0]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/aruna-logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-white tracking-widest uppercase">ARUNA</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-700 text-white text-[8px] font-black uppercase">POS</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider truncate">
                      Kitchen & Dispatch
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleToggleCollapse}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer shrink-0 ml-1"
                  title="Minimize Sidebar (Persempit)"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shrink-0 border border-white/10 bg-[#f7f5f0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/aruna-logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={handleToggleCollapse}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                  title="Perluas Sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4 text-[#c87a58]" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="p-3 space-y-6">
            <div>
              {!isCollapsed && (
                <span className="px-3 text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">
                  Menu Utama
                </span>
              )}

              <nav className="space-y-1.5 text-xs">
                {navItems.map((item) => {
                  const isActive = currentPath === item.href;
                  const Icon = item.icon;

                  if (isCollapsed) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`relative flex items-center justify-center p-3 rounded-xl transition-all group ${
                          isActive
                            ? 'bg-[#c87a58] text-white shadow-xs'
                            : 'text-stone-400 hover:text-white hover:bg-stone-800'
                        }`}
                        title={item.title}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        {item.badge !== null && item.badge !== undefined && (
                          <span className={`absolute -top-1 -right-1 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-stone-900 ${item.badgeColor || 'bg-stone-700 text-white'}`}>
                            {item.badge}
                          </span>
                        )}
                        {/* Hover Tooltip Floating */}
                        <div className="absolute left-full ml-2 px-2.5 py-1 bg-stone-900 text-white text-[11px] font-bold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                          {item.title}
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold tracking-tight transition-colors ${
                        isActive
                          ? 'bg-[#c87a58] text-white shadow-xs'
                          : 'text-stone-300 hover:text-white hover:bg-stone-800'
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

            {/* Quick Link Menu Tamu */}
            <div>
              {!isCollapsed && (
                <span className="px-3 text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">
                  Pintasan Tamu
                </span>
              )}
              <nav className="space-y-1 text-xs">
                {isCollapsed ? (
                  <Link
                    href="/order?table=Meja%2014"
                    target="_blank"
                    className="flex items-center justify-center p-3 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors group relative"
                    title="Buka Web Menu Tamu"
                  >
                    <ExternalLink className="w-5 h-5 shrink-0" />
                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-stone-900 text-white text-[11px] font-bold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      Web Menu Tamu
                    </div>
                  </Link>
                ) : (
                  <Link
                    href="/order?table=Meja%2014"
                    target="_blank"
                    className="flex items-center justify-between px-3.5 py-2 rounded-xl font-bold text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <ExternalLink className="w-4 h-4 text-stone-400 shrink-0" />
                      <span className="truncate">Web Menu Tamu</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-stone-800 bg-[#112218] space-y-2 text-xs">
          {onToggleSound && (
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!isCollapsed && <span className="text-[11px] text-stone-400">Audio Bel:</span>}
              <button
                type="button"
                onClick={onToggleSound}
                className={`p-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  soundEnabled
                    ? 'bg-[#c87a58] text-white'
                    : 'bg-stone-800 text-stone-400 border border-stone-700'
                }`}
                title={soundEnabled ? 'Audio Notif Aktif' : 'Audio Notif Mute'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                {!isCollapsed && <span>{soundEnabled ? 'Aktif' : 'Mute'}</span>}
              </button>
            </div>
          )}

          {!isCollapsed ? (
            <div className="pt-2 border-t border-stone-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>Shift: Aktif</span>
                <span className="font-mono text-emerald-400 font-bold">● Online</span>
              </div>

              {session && (
                <div className="p-2 rounded-xl bg-stone-900/90 border border-stone-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center text-stone-300 font-black text-xs shrink-0 border border-stone-700">
                      {session.username.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">{session.name}</p>
                      <span className="text-[9px] text-[#c87a58] font-bold uppercase">{session.role}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Keluar / Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 pt-2 border-t border-stone-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Shift Kasir: Online" />
              {session && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title={`Logout (${session.username})`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
