'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CafeStore } from '@/lib/store';
import { Order, RawMaterial, MenuItem } from '@/lib/types';
import { RealtimeOrders } from '@/lib/realtime';
import { 
  Bell, 
  Clock, 
  Calendar, 
  UtensilsCrossed, 
  CalendarDays, 
  AlertTriangle, 
  PackageX, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  ChevronRight, 
  X, 
  Layers, 
  Sparkles,
  Check
} from 'lucide-react';

interface AdminTopNavProps {
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export function AdminTopNav({
  soundEnabled = true,
  onToggleSound,
}: AdminTopNavProps) {
  // Live Clock State
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

  // Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Popover State
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'stock'>('all');
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(new Set());
  const popoverRef = useRef<HTMLDivElement>(null);

  // 1. Live Clock Interval
  useEffect(() => {
    setCurrentDateTime(new Date());
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Click outside listener for Notification Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen]);

  // 3. Load Data & Store update listener
  const loadStoreData = async () => {
    try {
      const [orderList, matList, itemList] = await Promise.all([
        CafeStore.getOrders(),
        CafeStore.getRawMaterials(),
        CafeStore.getMenuItems(),
      ]);
      setOrders(orderList);
      setMaterials(matList);
      setMenuItems(itemList);
    } catch (err) {
      console.error('Gagal mengambil data notifikasi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();

    const unsubscribe = RealtimeOrders.subscribe((event) => {
      if (event.type === 'NEW_ORDER') {
        setOrders((prev) => [event.order, ...prev.filter((o) => o.id !== event.order.id)]);
      } else if (event.type === 'UPDATE_ORDER') {
        setOrders((prev) => prev.map((o) => (o.id === event.order.id ? event.order : o)));
      }
    });

    const interval = setInterval(loadStoreData, 2000);
    const handleUpdate = () => loadStoreData();
    window.addEventListener('arjuna_store_updated', handleUpdate);
    return () => {
      clearInterval(interval);
      unsubscribe();
      window.removeEventListener('arjuna_store_updated', handleUpdate);
    };
  }, []);

  // 4. Generate Structured Notifications
  // a) Pesanan Masuk (Order & Reservasi)
  const pendingOrders = orders.filter(
    (o) => o.status === 'pending_payment' || o.status === 'confirmed'
  );

  const orderNotifications = pendingOrders.map((o) => {
    const isQris = o.payment_method === 'qris';
    const isPending = o.status === 'pending_payment';
    const isReservation = o.order_type === 'reservation';

    return {
      id: `notif-ord-${o.id}`,
      type: 'order' as const,
      title: isReservation
        ? `Reservasi: ${o.customer_name} (${o.table_number})`
        : `Pesanan Baru: ${o.table_number} · ${o.customer_name}`,
      description: isPending
        ? isQris
          ? `Menunggu verifikasi QRIS · Total: Rp ${o.total_amount.toLocaleString('id-ID')}`
          : `Menunggu bayar di kasir · Total: Rp ${o.total_amount.toLocaleString('id-ID')}`
        : `Terkonfirmasi · Siap disiapkan (${o.items?.length || 0} menu)`,
      time: new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
      href: isReservation ? '/kasir/reservasi' : '/kasir',
      urgent: isPending,
      category: isReservation ? 'Reservasi' : 'Pesanan Meja',
      icon: isReservation ? CalendarDays : UtensilsCrossed,
      color: isPending ? 'text-amber-600 bg-amber-50' : 'text-[#c87a58] bg-[#c87a58]/10',
    };
  });

  // b) Bahan Baku Habis / Menipis & Menu Nonaktif
  const lowStockMaterials = materials.filter(
    (m) => m.current_stock <= m.minimum_stock
  );

  const stockNotifications = lowStockMaterials.map((m) => {
    const isOutOfStock = m.current_stock <= 0;
    return {
      id: `notif-stock-${m.id}`,
      type: 'stock' as const,
      title: isOutOfStock ? `Stok Habis: ${m.name}` : `Stok Menipis: ${m.name}`,
      description: isOutOfStock
        ? `Stok 0 ${m.unit}! Menu terkait tidak dapat dipesan.`
        : `Sisa: ${m.current_stock.toLocaleString('id-ID')} ${m.unit} (Batas minimum: ${m.minimum_stock} ${m.unit})`,
      time: 'Perlu restock',
      href: '/kasir/stok',
      urgent: isOutOfStock,
      category: isOutOfStock ? 'Habis Total' : 'Perlu Restock',
      icon: isOutOfStock ? PackageX : AlertTriangle,
      color: isOutOfStock ? 'text-rose-600 bg-rose-50' : 'text-amber-700 bg-amber-50',
    };
  });

  // Gabungkan semua notifikasi
  const allNotifications = [...orderNotifications, ...stockNotifications];
  const unreadCount = allNotifications.filter((n) => !readNotifIds.has(n.id)).length;

  const filteredNotifications = allNotifications.filter((n) => {
    if (activeTab === 'orders') return n.type === 'order';
    if (activeTab === 'stock') return n.type === 'stock';
    return true;
  });

  const markAllAsRead = () => {
    const allIds = new Set(allNotifications.map((n) => n.id));
    setReadNotifIds(allIds);
  };

  // Format Date String
  const dateFormatted = currentDateTime
    ? new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(currentDateTime)
    : 'Memuat...';

  // Format Time String (Live update)
  const timeFormatted = currentDateTime
    ? currentDateTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WITA'
    : '--:--:--';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/90 px-3 sm:px-6 py-2.5 sm:py-3 transition-colors shadow-2xs">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
        
        {/* ======================================================== */}
        {/* SISI KIRI: JAM & TANGGAL HARI INI                        */}
        {/* ======================================================== */}
        <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
          {/* Tanggal Hari Ini */}
          <div className="flex items-center gap-1.5 text-stone-800">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-600 shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c87a58]" />
            </div>
            <div>
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block leading-none">
                Hari Ini
              </span>
              <span className="text-xs sm:text-sm font-bold text-stone-900 capitalize mt-0.5 block leading-tight">
                {dateFormatted}
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-stone-200" />

          {/* Jam Real-time (Digital Clock) */}
          <div className="flex items-center gap-1.5 text-stone-800">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-600 shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block leading-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Clock
              </span>
              <span className="text-xs sm:text-sm font-mono font-black text-stone-900 mt-0.5 block leading-tight tracking-tight">
                {timeFormatted}
              </span>
            </div>
          </div>

          {/* Badge Outlet Samarinda */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200/80 text-[11px] text-stone-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Outlet Samarinda</span>
            <span className="text-stone-300">·</span>
            <span className="text-emerald-700 font-bold">Shift Aktif</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SISI KANAN: TOGGLE SUARA & ICON NOTIFICATION CENTER      */}
        {/* ======================================================== */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative" ref={popoverRef}>
          
          {/* Tombol Toggle Audio Notifikasi */}
          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                  : 'bg-stone-100 border-stone-200 text-stone-500 hover:bg-stone-200'
              }`}
              title={soundEnabled ? 'Suara bel aktif saat pesanan masuk' : 'Suara bel dimatikan'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-stone-400" />
              )}
              <span className="hidden md:inline text-[11px]">
                {soundEnabled ? 'Bel Aktif' : 'Mute'}
              </span>
            </button>
          )}

          {/* Tombol Icon Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer relative ${
                isNotifOpen
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : unreadCount > 0
                  ? 'bg-amber-50/80 border-amber-300 text-stone-800 hover:bg-amber-100 shadow-2xs'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
              title="Pemberitahuan Pesanan & Bahan Baku"
            >
              <Bell className={`w-4 h-4 sm:w-5 sm:h-5 ${unreadCount > 0 && !isNotifOpen ? 'animate-bounce text-[#c87a58]' : ''}`} />

              {/* Badge Counter Notifikasi */}
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-md border-2 border-white animate-in zoom-in-75">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* ======================================================== */}
            {/* POPOVER DROPDOWN NOTIFIKASI KASIR                        */}
            {/* ======================================================== */}
            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                
                {/* Header Dropdown */}
                <div className="p-3.5 bg-stone-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-amber-300">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs">Pemberitahuan Kasir</h3>
                      <p className="text-[10px] text-stone-400">
                        {allNotifications.length} peringatan aktif
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[10px] text-stone-300 hover:text-white underline cursor-pointer"
                      >
                        Tandai dibaca
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsNotifOpen(false)}
                      className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs (Semua, Pesanan, Bahan/Stok) */}
                <div className="flex items-center border-b border-stone-150 bg-stone-50 px-3 pt-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`pb-2 font-bold transition-colors cursor-pointer border-b-2 text-[11px] ${
                      activeTab === 'all'
                        ? 'text-[#c87a58] border-[#c87a58]'
                        : 'text-stone-500 border-transparent hover:text-stone-800'
                    }`}
                  >
                    Semua ({allNotifications.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className={`pb-2 font-bold transition-colors cursor-pointer border-b-2 text-[11px] flex items-center gap-1 ${
                      activeTab === 'orders'
                        ? 'text-[#c87a58] border-[#c87a58]'
                        : 'text-stone-500 border-transparent hover:text-stone-800'
                    }`}
                  >
                    <span>Pesanan</span>
                    {orderNotifications.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-100 text-amber-800 font-black">
                        {orderNotifications.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('stock')}
                    className={`pb-2 font-bold transition-colors cursor-pointer border-b-2 text-[11px] flex items-center gap-1 ${
                      activeTab === 'stock'
                        ? 'text-[#c87a58] border-[#c87a58]'
                        : 'text-stone-500 border-transparent hover:text-stone-800'
                    }`}
                  >
                    <span>Stok Bahan</span>
                    {stockNotifications.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-100 text-rose-800 font-black">
                        {stockNotifications.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* List Notifikasi */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-stone-100">
                  {filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center text-stone-400 space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="font-bold text-xs text-stone-700">Semua Terkendali!</p>
                      <p className="text-[11px] text-stone-400">
                        Tidak ada antrean pesanan baru dan stok bahan dalam batas aman.
                      </p>
                    </div>
                  ) : (
                    filteredNotifications.map((notif) => {
                      const IconComponent = notif.icon;
                      const isUnread = !readNotifIds.has(notif.id);

                      return (
                        <Link
                          key={notif.id}
                          href={notif.href}
                          onClick={() => {
                            setReadNotifIds((prev) => new Set([...prev, notif.id]));
                            setIsNotifOpen(false);
                          }}
                          className={`p-3.5 flex items-start gap-3 hover:bg-stone-50 transition-colors block ${
                            isUnread ? 'bg-amber-50/40' : 'bg-white'
                          }`}
                        >
                          {/* Icon Kategori */}
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${notif.color}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>

                          {/* Konten Notifikasi */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                notif.type === 'stock'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {notif.category}
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono">
                                {notif.time}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-stone-900 mt-1 truncate">
                              {notif.title}
                            </h4>
                            <p className="text-[11px] text-stone-500 leading-tight mt-0.5">
                              {notif.description}
                            </p>
                          </div>

                          {/* Dot status unread */}
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-[#c87a58] shrink-0 mt-2" />
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>

                {/* Footer Dropdown dengan Tombol Navigasi Cepat */}
                <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
                  <Link
                    href="/kasir/stok"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-[11px] text-stone-600 hover:text-stone-900 font-bold flex items-center gap-1"
                  >
                    <Layers className="w-3.5 h-3.5 text-stone-500" />
                    <span>Cek Stok & BOM</span>
                  </Link>

                  <Link
                    href="/kasir"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-[11px] text-[#c87a58] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>Pesanan Hari Ini</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
