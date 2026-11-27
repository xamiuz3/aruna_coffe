'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CafeStore } from '@/lib/store';
import { AdminAuth } from '@/lib/auth';
import { Order, OrderStatus } from '@/lib/types';
import { playNotificationSound, unlockAudioContext } from '@/lib/sound';
import { RealtimeOrders } from '@/lib/realtime';
import { ReceiptPrint } from '@/components/ReceiptPrint';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminTopNav } from '@/components/AdminTopNav';
import { 
  Bell,
  MessageCircle,
  MessageSquare,
  ShoppingBag, 
  Printer, 
  Check, 
  Clock, 
  X, 
  Eye, 
  Layers, 
  QrCode, 
  RefreshCw, 
  AlertCircle,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Search,
  TrendingUp,
  UtensilsCrossed,
  CheckCircle2,
  Coffee,
  CalendarDays,
  FileCheck2,
  ShieldCheck,
  Home,
  CreditCard,
  ReceiptText,
  LayoutGrid,
  Table as TableIcon,
  FileText,
  Trash2
} from 'lucide-react';

export default function KasirDashboard() {
  const [orders, setOrders] = useState<Order[]>(() => CafeStore.getInitialOrders());
  const [typeFilter, setTypeFilter] = useState<'all' | 'today' | 'order' | 'reservation'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    setSession(AdminAuth.getSession());
    const handleAuthChange = () => {
      setSession(AdminAuth.getSession());
      setCurrentPage(1);
    };
    window.addEventListener('aruna_admin_auth_changed', handleAuthChange);
    return () => window.removeEventListener('aruna_admin_auth_changed', handleAuthChange);
  }, []);

  const prevOrderCountRef = useRef<number>(0);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const soundEnabledRef = useRef<boolean>(true);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const triggerNewOrderAlert = (order?: Order) => {
    if (soundEnabledRef.current) {
      playNotificationSound();
    }
    const label = order 
      ? `🔔 Pesanan Baru Masuk! Meja ${order.table_number} (${order.customer_name}) · Rp ${order.total_amount.toLocaleString('id-ID')}`
      : '🔔 Ada pesanan baru masuk dari pelanggan!';
    setNotificationBanner(label);
    setTimeout(() => setNotificationBanner(null), 7000);
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    soundEnabledRef.current = nextVal;
    unlockAudioContext();
    setAudioUnlocked(true);
    if (nextVal) {
      playNotificationSound();
    }
  };

  const handleTestSound = () => {
    unlockAudioContext();
    setAudioUnlocked(true);
    playNotificationSound();
  };

  const fetchOrders = async () => {
    const list = await CafeStore.getOrders();
    
    // Inisialisasi set known order IDs pertama kali (supaya order lama tidak memicu bunyi bel)
    if (knownOrderIdsRef.current.size === 0) {
      list.forEach(o => knownOrderIdsRef.current.add(o.id));
      prevOrderCountRef.current = list.length;
      setOrders(list);
      return;
    }

    // Deteksi pesanan baru nyata hanya jika jumlah pesanan bertambah sejak load
    const now = Date.now();
    const newItems = list.filter(o => {
      if (knownOrderIdsRef.current.has(o.id)) return false;
      const orderTime = new Date(o.created_at).getTime();
      const isJustCreated = !isNaN(orderTime) && (now - orderTime) < 60 * 1000;
      return isJustCreated;
    });

    list.forEach(o => knownOrderIdsRef.current.add(o.id));

    if (newItems.length > 0 && prevOrderCountRef.current > 0 && list.length > prevOrderCountRef.current) {
      triggerNewOrderAlert(newItems[0]);
    }

    prevOrderCountRef.current = list.length;
    setOrders(list);
  };

  useEffect(() => {
    // Unlock Audio Context pada klik/interaksi kasir pertama kali
    const handleUserInteraction = () => {
      unlockAudioContext();
      setAudioUnlocked(true);
    };
    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, { once: true });
    window.addEventListener('pointerdown', handleUserInteraction, { once: true });

    fetchOrders();

    // 1. Langsung tangkap event Realtime (Cross-Tab BroadcastChannel & Supabase Realtime)
    const unsubscribeRealtime = RealtimeOrders.subscribe((event) => {
      if (event.type === 'NEW_ORDER') {
        if (!knownOrderIdsRef.current.has(event.order.id)) {
          knownOrderIdsRef.current.add(event.order.id);
          setOrders(prev => [event.order, ...prev.filter(o => o.id !== event.order.id)]);
          triggerNewOrderAlert(event.order);
        }
      } else if (event.type === 'UPDATE_ORDER') {
        setOrders(prev => prev.map(o => o.id === event.order.id ? event.order : o));
      } else if (event.type === 'DELETE_ORDER') {
        setOrders(prev => prev.filter(o => o.id !== event.orderId));
      }
    });

    // 2. Polling fallback 5 detik jika koneksi realtime WebSocket sempat drop
    const interval = setInterval(fetchOrders, 5000);
    const handleStoreUpdate = () => fetchOrders();
    window.addEventListener('arjuna_store_updated', handleStoreUpdate);

    return () => {
      clearInterval(interval);
      unsubscribeRealtime();
      window.removeEventListener('arjuna_store_updated', handleStoreUpdate);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('pointerdown', handleUserInteraction);
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    await CafeStore.updateOrderStatus(orderId, newStatus);
    fetchOrders();
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!confirm(`Hapus permanen pesanan #${order.order_number} (${order.customer_name})? Data ini juga akan hilang dari layar pelanggan.`)) {
      return;
    }
    await CafeStore.deleteOrder(order.id);
    setOrders(prev => prev.filter(o => o.id !== order.id));
    fetchOrders();
  };

  const handleToggleMajoo = async (orderId: string, currentVal: boolean) => {
    await CafeStore.toggleMajooRecorded(orderId, !currentVal);
    fetchOrders();
  };

  const handlePrint = (order: Order) => {
    setPrintingOrder(order);
    const cleanup = () => {
      setPrintingOrder(null);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const isOrderToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    return d.toDateString() === new Date().toDateString();
  };

  const activeSession = session || (typeof window !== 'undefined' ? AdminAuth.getSession() : null);
  const activeShiftName = activeSession?.shift || 'Shift Pagi';
  const shiftHours = activeShiftName === 'Shift Malam' ? '17.00 - Tutup' : activeShiftName === 'Admin Owner' ? 'Akses Laporan Penuh' : '08.00 - 17.00';
  const sessionName = activeSession?.name || 'Aruna S. · Kasir Pagi';

  const getOrderShift = (order: Order): 'Shift Pagi' | 'Shift Malam' => {
    if (order.shift) return order.shift;
    const h = new Date(order.created_at).getHours();
    return (h >= 8 && h < 17) ? 'Shift Pagi' : 'Shift Malam';
  };

  // Filter pesanan khusus sesuai shift aktif (kecuali Admin Owner yang melihat semua)
  const shiftOrders = activeShiftName === 'Admin Owner'
    ? orders
    : orders.filter(o => getOrderShift(o) === activeShiftName);

  // Counts for tabs & top stats (khusus shift aktif)
  const allCount = shiftOrders.length;
  const todayOrdersCount = shiftOrders.filter(o => isOrderToday(o.created_at)).length;
  const pendingCount = shiftOrders.filter(o => o.status === 'pending_payment').length;
  const orderCount = shiftOrders.filter(o => o.order_type !== 'reservation').length;
  const reservationCount = shiftOrders.filter(o => o.order_type === 'reservation').length;

  const newOrdersTodayCount = shiftOrders.filter(o => isOrderToday(o.created_at) && o.order_type !== 'reservation' && o.status !== 'completed').length;
  const pendingQrisCount = shiftOrders.filter(o => o.payment_method === 'qris' && o.status === 'pending_payment').length;
  const reservationsTodayCount = shiftOrders.filter(o => o.order_type === 'reservation' && isOrderToday(o.created_at)).length;
  const totalReservationGuests = shiftOrders
    .filter(o => o.order_type === 'reservation')
    .reduce((sum, o) => sum + (o.guest_count || 4), 0);

  // Filtered orders (khusus shift aktif)
  const filteredOrders = shiftOrders.filter(order => {
    if (typeFilter === 'today' && !isOrderToday(order.created_at)) return false;
    if (typeFilter === 'order' && order.order_type === 'reservation') return false;
    if (typeFilter === 'reservation' && order.order_type !== 'reservation') return false;

    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && order.status !== 'pending_payment') return false;
      if (statusFilter === 'confirmed' && order.status !== 'confirmed') return false;
      if (statusFilter === 'processing' && order.status !== 'processing') return false;
      if (statusFilter === 'completed' && order.status !== 'completed') return false;
      if (statusFilter === 'cancelled' && order.status !== 'cancelled') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match = 
        order.order_number.toLowerCase().includes(q) ||
        order.table_number.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        (order.customer_phone && order.customer_phone.toLowerCase().includes(q)) ||
        (order.items && order.items.some(i => i.item_name.toLowerCase().includes(q)));
      if (!match) return false;
    }

    return true;
  });

  // SORT STRICTLY: NEWEST FIRST (DESCENDING BY CREATED_AT)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime() || 0;
    const timeB = new Date(b.created_at).getTime() || 0;
    return timeB - timeA;
  });

  const itemsPerPage = 8;
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage) || 1;
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const currentDateString = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const handleToggleItemCheck = (orderId: string, itemId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updatedItems = (o.items || []).map(it => it.id === itemId ? { ...it, checked: !it.checked } : it);
      return { ...o, items: updatedItems };
    }));
    if (detailOrder && detailOrder.id === orderId) {
      setDetailOrder(prev => {
        if (!prev) return null;
        const updatedItems = (prev.items || []).map(it => it.id === itemId ? { ...it, checked: !it.checked } : it);
        return { ...prev, items: updatedItems };
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-[#1c1917] flex flex-col lg:flex-row items-start antialiased font-sans">
      {/* SIDEBAR ADMIN (BISA DI-MINIMIZE & RESPONSIF HP/TABLET) */}
      <AdminSidebar
        currentPath="/kasir"
        pendingOrdersCount={pendingCount}
        pendingReservationsCount={shiftOrders.filter(o => o.order_type === 'reservation' && o.status === 'pending_payment').length}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* ======================================================== */}
      {/* MAIN CONTENT AREA                                        */}
      {/* ======================================================== */}
      <div className={`flex-1 flex flex-col min-w-0 w-full ${printingOrder ? 'print:hidden' : ''}`}>

        {/* Banner Alert Notifikasi Baru */}
        {notificationBanner && (
          <div className="bg-[#c87a58] text-white px-4 py-2.5 font-bold text-xs text-center flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top duration-200">
            <Bell className="w-4 h-4 animate-bounce" />
            <span>{notificationBanner}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header Bar (Figma Screenshot 5) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-stone-400 block">
                {activeShiftName.toUpperCase()} · {shiftHours}
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                Pesanan & Reservasi
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleSound}
                className="w-8 h-8 rounded-full bg-stone-100/80 hover:bg-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 relative cursor-pointer transition-colors"
                title="Status Notifikasi Suara"
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2.5 pl-2">
                <div className="w-8 h-8 rounded-full bg-[#dce7de] text-[#1b3728] flex items-center justify-center text-xs font-black shrink-0">
                  AS
                </div>
                <div className="text-left leading-none">
                  <span className="text-xs font-bold text-stone-900 block">{activeSession?.name || 'Aruna S.'}</span>
                  <span className="text-[10px] text-stone-400 font-medium block mt-0.5">{activeSession?.role === 'owner' ? 'Owner Cafe' : activeShiftName === 'Shift Malam' ? 'Kasir Malam' : 'Kasir Pagi'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 1. TOP STATS 4 KARTU (EXACT FIGMA SCREENSHOT 5)           */}
          {/* ======================================================== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Pesanan Baru */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-stone-500 block">
                  Pesanan baru
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1 block">
                  {newOrdersTodayCount}
                </span>
                <span className="text-[10px] text-stone-400 font-medium block mt-0.5">
                  Shift aktif hari ini
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1b3728] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-[#1b3728]" />
              </div>
            </div>

            {/* 2. Reservasi Hari Ini */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-stone-500 block">
                  Reservasi hari ini
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1 block">
                  {reservationsTodayCount}
                </span>
                <span className="text-[10px] text-stone-400 font-medium block mt-0.5">
                  {shiftOrders.filter(o => o.order_type === 'reservation' && o.status === 'pending_payment').length} menunggu konfirmasi
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#b85c38] flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-[#b85c38]" />
              </div>
            </div>

            {/* 3. Perlu Cek QRIS */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-stone-500 block">
                  Perlu cek QRIS
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1 block">
                  {pendingQrisCount}
                </span>
                <span className="text-[10px] text-stone-400 font-medium block mt-0.5">
                  Periksa pembayaran
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#2d6fa8] flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5 text-[#2d6fa8]" />
              </div>
            </div>

            {/* 4. Notifikasi WA */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-stone-500 block">
                  Notifikasi WA
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1 block">
                  Aktif
                </span>
                <span className="text-[10px] text-stone-400 font-medium block mt-0.5">
                  93% pesan terkirim
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1b3728] flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-[#1b3728]" />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. TABEL UTAMA (EXACT MATCH FIGMA / CANVA MOCKUP)        */}
          {/* ======================================================== */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
            
            {/* Header Box: Judul & Subtitle & Filter Bar */}
            <div className="p-5 border-b border-stone-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
                    Pesanan masuk
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Diperbarui otomatis beberapa detik lalu
                  </p>
                </div>

                {/* Filter Right: Search Input + Print Semua Button */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari ID, nama..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-[#1b3728] bg-white shadow-2xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print semua</span>
                  </button>
                </div>
              </div>

              {/* Filter Tabs: Semua 16, Pesanan 12, Reservasi 4 */}
              <div className="flex items-center gap-6 mt-4 pt-1 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter('all');
                    setCurrentPage(1);
                  }}
                  className={`pt-3 pb-1 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                    typeFilter === 'all'
                      ? 'text-stone-900 border-b-2 border-[#1b3728]'
                      : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <span>Semua</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    typeFilter === 'all' ? 'bg-[#dce7de] text-[#1b3728]' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {allCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter('order');
                    setCurrentPage(1);
                  }}
                  className={`pt-3 pb-1 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                    typeFilter === 'order'
                      ? 'text-stone-900 border-b-2 border-[#1b3728]'
                      : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <span>Pesanan</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    typeFilter === 'order' ? 'bg-[#dce7de] text-[#1b3728]' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {orderCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter('reservation');
                    setCurrentPage(1);
                  }}
                  className={`pt-3 pb-1 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                    typeFilter === 'reservation'
                      ? 'text-stone-900 border-b-2 border-[#1b3728]'
                      : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <span>Reservasi</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    typeFilter === 'reservation' ? 'bg-[#dce7de] text-[#1b3728]' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {reservationCount}
                  </span>
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* VIEW 1: TAMPILAN KARTU ANDROID / MOBILE (TANPA PERLU GESER) */}
            {/* ======================================================== */}
            <div className="block md:hidden divide-y divide-stone-150">
              {paginatedOrders.length === 0 ? (
                <div className="py-12 px-4 text-center text-stone-400 italic">
                  Tidak ada antrean pesanan atau reservasi yang sesuai filter
                </div>
              ) : (
                paginatedOrders.map(order => {
                  const isQris = order.payment_method === 'qris';
                  const tableNumOnly = order.table_number.replace(/meja\s*/i, '') || order.table_number;
                  const isReservation = order.order_type === 'reservation';
                  const timeInfo = formatOrderTime(order.created_at);
                  const isPending = order.status === 'pending_payment';
                  const isNewOrder = (timeInfo.isRecent || timeInfo.isToday) && isPending;

                  return (
                    <div key={order.id} className={`p-3.5 space-y-3 transition-colors ${
                      isNewOrder ? 'bg-amber-50/80 border-l-4 border-l-[#c87a58]' : 'bg-white hover:bg-stone-50/50'
                    }`}>
                      {/* Baris 1: ID, Badge BARU, Badge Meja, Badge Jenis, dan Jam */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span 
                            onClick={() => setDetailOrder(order)}
                            className="font-bold text-[#c87a58] text-xs cursor-pointer hover:underline"
                          >
                            {formatOrderNumber(order.order_number)}
                          </span>
                          {isNewOrder && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                              BARU
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200/90 text-[11px] font-bold text-stone-800">
                            Meja {tableNumOnly}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isReservation ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {isReservation ? 'Reservasi' : 'Self-order'}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[11px] font-bold block ${timeInfo.isToday ? 'text-emerald-700' : 'text-stone-600'}`}>
                            {timeInfo.displayDate}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono block">
                            {timeInfo.timeAgo}
                          </span>
                        </div>
                      </div>

                      {/* Baris 2: Pemesan & Total Tagihan */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <strong className="text-stone-900 font-bold text-xs block">
                            {order.customer_name}
                          </strong>
                          {order.customer_phone ? (
                            <a
                              href={`https://wa.me/${order.customer_phone.replace(/^0/, '62')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-700 font-medium hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <span>{order.customer_phone}</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-stone-400">-</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 uppercase font-bold block">Total</span>
                          <span className="font-serif font-black text-stone-900 text-sm">
                            Rp {order.total_amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Baris 3: Ringkasan Menu & Catatan */}
                      <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-150 space-y-1">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] text-stone-800">
                                <span className="truncate pr-2">
                                  <strong className="text-[#c87a58] mr-1">{it.quantity}x</strong>
                                  {it.item_name}
                                  {it.selected_variants && it.selected_variants.length > 0 && (
                                    <span className="text-stone-400 text-[10px] ml-1">
                                      ({it.selected_variants.map(v => v.chosen.name).join(', ')})
                                    </span>
                                  )}
                                </span>
                                <span className="font-mono text-stone-600 shrink-0 text-[10px]">
                                  Rp {it.subtotal.toLocaleString('id-ID')}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic text-[11px] block">
                            {isReservation ? 'Pre-order hidangan reservasi' : 'Tidak ada menu'}
                          </span>
                        )}
                        {order.notes && (
                          <div className="pt-1.5 mt-1 border-t border-stone-200/70 text-[10px] text-amber-800 italic">
                            Catatan: &quot;{order.notes}&quot;
                          </div>
                        )}
                      </div>

                      {/* Baris 4: Pembayaran & Bukti QRIS + Majoo POS */}
                      <div className="flex items-center justify-between text-xs pt-0.5 flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isQris ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {isQris ? 'QRIS BRI' : 'KASIR / TUNAI'}
                          </span>
                          {isQris && (
                            order.payment_proof_url ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProofUrl(order.payment_proof_url || null);
                                  setImageLoadError(false);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-amber-700" />
                                <span>Bukti QRIS</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-rose-500 font-medium">
                                Belum upload bukti
                              </span>
                            )
                          )}
                        </div>

                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-stone-500 hover:text-stone-800 select-none">
                          <input
                            type="checkbox"
                            checked={order.majoo_recorded}
                            onChange={() => handleToggleMajoo(order.id, order.majoo_recorded)}
                            className="w-3.5 h-3.5 rounded text-emerald-600 cursor-pointer"
                          />
                          <span>Majoo POS</span>
                        </label>
                      </div>

                      {/* Baris 5: Status Picker & Tombol Aksi */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-150">
                        {/* Status dropdown pill */}
                        <div className="relative inline-flex items-center flex-1 max-w-[170px]">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                            className={`w-full appearance-none text-[11px] font-bold pl-3 pr-6 py-1.5 rounded-xl border cursor-pointer outline-none transition-colors ${getStatusPillStyle(order.status, isQris)}`}
                          >
                            <option value="pending_payment">{isQris ? 'Cek QRIS ▾' : 'Pesanan baru ▾'}</option>
                            <option value="confirmed">Terkonfirmasi ▾</option>
                            <option value="processing">Diproses ▾</option>
                            <option value="completed">Selesai ▾</option>
                            <option value="cancelled">Dibatalkan ▾</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-current opacity-60 absolute right-2 pointer-events-none" />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailOrder(order)}
                            className="border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                          >
                            Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrint(order)}
                            className="bg-[#181513] hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Struk</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* ======================================================== */}
            {/* VIEW 2: TAMPILAN TABLE DESKTOP / TABLET (SCREEN >= md)   */}
            {/* ======================================================== */}
            <div className="hidden md:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs table-auto">
                <thead className="bg-[#faf9f6] text-stone-400 uppercase text-[10px] font-bold border-b border-stone-150 tracking-wider">
                  <tr>
                    <th className="py-3 px-3 sm:px-4">ORDER / BOOKING ID</th>
                    <th className="py-3 px-2 sm:px-3 text-center">MEJA</th>
                    <th className="py-3 px-3 sm:px-4">PELANGGAN</th>
                    <th className="py-3 px-3 sm:px-4">ITEM / JADWAL</th>
                    <th className="py-3 px-3 sm:px-4">PEMBAYARAN</th>
                    <th className="py-3 px-2 sm:px-3">STATUS</th>
                    <th className="py-3 px-3 sm:px-4 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-800 text-[11px]">
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400 italic">
                        Tidak ada antrean pesanan atau reservasi yang sesuai filter
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map(order => {
                      const isQris = order.payment_method === 'qris';
                      const tableNumOnly = order.table_number.replace(/meja\s*/i, '') || order.table_number;
                      const timeInfo = formatOrderTime(order.created_at);
                      const isPending = order.status === 'pending_payment';
                      const isNewOrder = (timeInfo.isRecent || timeInfo.isToday) && isPending;

                      return (
                        <tr key={order.id} className={`transition-colors ${
                          isNewOrder 
                            ? 'bg-amber-50/80 border-l-4 border-l-[#c87a58]' 
                            : 'hover:bg-amber-50/20'
                        }`}>
                          {/* 1. ORDER / BOOKING ID */}
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span 
                                className="font-bold text-[#c87a58] text-xs block cursor-pointer hover:underline" 
                                title={`Order ID Lengkap: ${order.order_number}`}
                                onClick={() => setDetailOrder(order)}
                              >
                                {formatOrderNumber(order.order_number)}
                              </span>
                              {isNewOrder && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                                  BARU
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-stone-400 block font-normal mt-0.5">
                              {order.order_type === 'reservation' ? 'Reservasi' : 'Self-order'}
                            </span>
                          </td>

                          {/* 2. MEJA */}
                          <td className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center">
                              <span className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200/80 flex items-center justify-center font-bold text-stone-800 text-xs shadow-2xs">
                                {tableNumOnly}
                              </span>
                              <span className="text-[10px] text-stone-400 font-normal mt-0.5">
                                Meja {tableNumOnly}
                              </span>
                            </div>
                          </td>

                          {/* 3. PELANGGAN */}
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                            <strong className="text-stone-800 font-semibold text-xs block">
                              {order.customer_name}
                            </strong>
                            <span className="text-[10px] text-stone-400 block font-mono mt-0.5">
                              {order.customer_phone || '-'}
                            </span>
                          </td>

                          {/* 4. ITEM / JADWAL */}
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                            {(() => {
                              const allChecked = order.items && order.items.length > 0 && order.items.every(i => i.checked);
                              const isDelayed = timeInfo.diffMinutes >= 45 && !allChecked && order.status !== 'completed' && order.status !== 'cancelled';
                              return (
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <strong className="text-stone-900 font-bold text-xs">
                                      {order.items?.length || 0} menu
                                    </strong>
                                    <span className="text-stone-300">·</span>
                                    <span className="text-[11px] text-stone-600 font-mono">
                                      {timeInfo.timeStr}
                                    </span>
                                  </div>
                                  {isDelayed ? (
                                    <div className="flex items-center gap-1 text-rose-600 font-bold text-[10px] mt-0.5">
                                      <Clock className="w-3 h-3 text-rose-600 shrink-0" />
                                      <span>{timeInfo.timeStr} +45 min</span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setDetailOrder(order)}
                                      className="text-[10px] text-stone-400 hover:text-stone-700 font-medium inline-flex items-center gap-0.5 mt-0.5 cursor-pointer"
                                    >
                                      <span>Lihat detail menu</span>
                                      <span>→</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* 5. PEMBAYARAN */}
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                            <strong className="text-stone-800 font-semibold text-xs block">
                              {order.order_type === 'reservation'
                                ? `DP ${isQris ? 'QRIS' : 'Kasir'} · Rp ${(order.down_payment || order.total_amount).toLocaleString('id-ID')}`
                                : `${isQris ? 'QRIS' : 'Kasir'} · Rp ${order.total_amount.toLocaleString('id-ID')}`
                              }
                            </strong>
                            {isQris ? (
                              order.payment_proof_url ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedProofUrl(order.payment_proof_url || null);
                                    setImageLoadError(false);
                                  }}
                                  className="text-[10px] text-[#c87a58] hover:underline font-semibold block cursor-pointer mt-0.5"
                                >
                                  Lihat Bukti QRIS
                                </button>
                              ) : (
                                <span className="text-[10px] text-rose-500 font-medium block mt-0.5">
                                  Belum upload bukti
                                </span>
                              )
                            ) : (
                              <span className="text-[10px] text-stone-400 block mt-0.5">
                                Bayar tunai di kasir
                              </span>
                            )}
                          </td>

                          {/* 6. STATUS (DROPDOWN PILL INTERAKTIF) */}
                          <td className="py-3 px-2 sm:px-3 whitespace-nowrap">
                            <div className="relative inline-flex items-center">
                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                                className={`appearance-none text-[11px] font-semibold pl-3 pr-6 py-1 rounded-full border cursor-pointer outline-none transition-colors ${getStatusPillStyle(order.status, isQris)}`}
                              >
                                <option value="pending_payment">{isQris ? 'Cek QRIS ▾' : 'Pesanan baru ▾'}</option>
                                <option value="confirmed">Terkonfirmasi ▾</option>
                                <option value="processing">Diproses ▾</option>
                                <option value="completed">Selesai ▾</option>
                                <option value="cancelled">Dibatalkan ▾</option>
                              </select>
                              <ChevronDown className="w-3 h-3 text-current opacity-60 absolute right-2 pointer-events-none" />
                            </div>
                          </td>

                          {/* 7. AKSI (3 ICON BUTTONS: VIEW, PRINT, WA) */}
                          <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1. View Detail */}
                              <button
                                type="button"
                                onClick={() => setDetailOrder(order)}
                                className="w-8 h-8 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                                title="Lihat Rincian Pesanan"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* 2. Print Struk */}
                              <button
                                type="button"
                                onClick={() => handlePrint(order)}
                                className="w-8 h-8 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                                title="Print Struk Kasir & Kitchen"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* 3. Chat WhatsApp */}
                              {order.customer_phone ? (
                                <a
                                  href={`https://wa.me/${order.customer_phone.replace(/^0/, '62')}?text=${encodeURIComponent(
                                    `Halo kak ${order.customer_name}, konfirmasi pesanan Anda di Aruna Cafe (Meja ${order.table_number}). Pesanan sedang kami siapkan.`
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-8 h-8 rounded-xl border border-stone-200 hover:bg-emerald-50 text-emerald-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                                  title="Chat WhatsApp Pelanggan"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                <button
                                  disabled
                                  className="w-8 h-8 rounded-xl border border-stone-100 text-stone-300 flex items-center justify-center cursor-not-allowed"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* 4. Hapus Pesanan Permanen */}
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(order)}
                                className="w-8 h-8 rounded-xl border border-stone-200 hover:bg-rose-50 hover:border-rose-200 text-stone-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                                title="Hapus Pesanan Permanen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 bg-white border-t border-stone-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
              <span>
                Menampilkan {paginatedOrders.length} dari {filteredOrders.length} data
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      currentPage === page
                        ? 'bg-stone-900 text-white'
                        : 'border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  ›
                </button>
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* MODAL ZOOM BUKTI BAYAR QRIS */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-3.5 bg-stone-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs">Bukti Transfer QRIS / Bank</span>
              <button
                onClick={() => {
                  setSelectedProofUrl(null);
                  setImageLoadError(false);
                }}
                className="p-1 rounded text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-stone-100 flex flex-col items-center justify-center min-h-[220px] max-h-[75vh] overflow-y-auto">
              {selectedProofUrl.includes('application/pdf') || selectedProofUrl.toLowerCase().includes('.pdf') ? (
                <div className="w-full space-y-3 text-center">
                  <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-stone-900">Dokumen Bukti Transfer (PDF)</span>
                    </div>
                    <a
                      href={selectedProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#c87a58] hover:bg-[#b86948] text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>Buka / Unduh PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <iframe
                    src={selectedProofUrl}
                    className="w-full h-80 rounded-xl border border-stone-300 bg-white shadow-2xs"
                    title="Pratinjau PDF Bukti Transfer"
                  />
                </div>
              ) : imageLoadError ? (
                <div className="text-center p-6 space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold text-stone-800">Bukti transfer belum dapat ditampilkan</p>
                  <p className="text-[11px] text-stone-500">Pelanggan belum mengupload bukti transfer atau file URL tidak dapat diakses.</p>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedProofUrl}
                  alt="Bukti Transfer QRIS"
                  className="max-w-full rounded shadow-xs object-contain"
                  onError={() => setImageLoadError(true)}
                />
              )}
            </div>
            <div className="p-3 bg-white border-t border-stone-200 flex justify-end">
              <button
                onClick={() => {
                  setSelectedProofUrl(null);
                  setImageLoadError(false);
                }}
                className="bg-stone-900 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL PESANAN / MENU */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm">#{detailOrder.order_number}</span>
                <span className="bg-[#c87a58] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {detailOrder.table_number}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-stone-800">
              <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Pemesan</span>
                  <strong className="text-stone-900">{detailOrder.customer_name}</strong>
                  <p className="text-stone-500 font-mono text-[11px]">{detailOrder.customer_phone || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Waktu / Jadwal</span>
                  <strong className="text-stone-900">
                    {detailOrder.order_type === 'reservation'
                      ? `${detailOrder.reservation_date || 'Hari ini'} (${detailOrder.guest_count} Tamu)`
                      : new Date(detailOrder.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'}
                  </strong>
                  <p className="text-stone-500 text-[11px]">Metode: {detailOrder.payment_method === 'qris' ? 'QRIS BRI' : 'Kasir'}</p>
                </div>
              </div>

              {detailOrder.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-amber-900">
                  <span className="font-bold text-[10px] uppercase block text-amber-800">Catatan Khusus:</span>
                  <p className="italic text-[11px] mt-0.5">&quot;{detailOrder.notes}&quot;</p>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                  Rincian Menu ({detailOrder.items?.length || 0} item)
                </span>
                <div className="divide-y divide-stone-150 border border-stone-200 rounded-xl overflow-hidden bg-white">
                  {detailOrder.items && detailOrder.items.length > 0 ? (
                    detailOrder.items.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-start justify-between gap-3 bg-white hover:bg-stone-50/60 transition-colors">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={Boolean(item.checked)}
                            onChange={() => handleToggleItemCheck(detailOrder.id, item.id)}
                            className="w-4 h-4 rounded text-[#1b3728] border-stone-300 mt-0.5 cursor-pointer accent-[#1b3728]"
                            title="Centang jika menu ini sudah diantar ke meja"
                          />
                          <div className="min-w-0">
                            <div className={`font-bold ${item.checked ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                              <span className="text-[#1b3728] font-black mr-1.5">{item.quantity}x</span>
                              {item.item_name}
                            </div>
                            {item.selected_variants && item.selected_variants.length > 0 && (
                              <p className="text-[10px] text-stone-500 mt-0.5">
                                {item.selected_variants.map(v => v.chosen.name).join(', ')}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-[10px] text-amber-700 italic mt-0.5">Note: {item.notes}</p>
                            )}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-stone-800 text-[11px] whitespace-nowrap">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-stone-400 italic">Tidak ada rincian item pre-order</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-700">Total Tagihan</span>
                <span className="font-serif font-black text-[#c87a58] text-base">
                  Rp {detailOrder.total_amount.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Checkbox Majoo POS */}
              <label className="flex items-center gap-2 cursor-pointer bg-stone-50 hover:bg-stone-100 p-3 rounded-xl border border-stone-200 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={detailOrder.majoo_recorded}
                  onChange={() => {
                    handleToggleMajoo(detailOrder.id, detailOrder.majoo_recorded);
                    setDetailOrder(prev => prev ? { ...prev, majoo_recorded: !prev.majoo_recorded } : null);
                  }}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="font-bold text-stone-800 text-xs block">Catat ke Majoo POS</span>
                  <span className="text-[10px] text-stone-400 block">Centang jika transaksi sudah diinput manual ke mesin kasir Majoo</span>
                </div>
                {detailOrder.majoo_recorded && (
                  <Check className="w-4 h-4 text-emerald-600 font-bold" />
                )}
              </label>
            </div>

            <div className="p-3.5 bg-stone-100 border-t border-stone-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  handlePrint(detailOrder);
                }}
                className="bg-stone-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Struk</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="border border-stone-300 hover:bg-white text-stone-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT RECEIPT COMPONENT */}
      <div id="print-receipt-container">
        {printingOrder && <ReceiptPrint order={printingOrder} />}
      </div>
    </div>
  );
}

function formatOrderNumber(num: string) {
  const parts = num.split('-');
  if (parts.length === 3) {
    return `#${parts[0]}-${parts[2]}`;
  }
  return `#${num}`;
}

function formatOrderTime(createdAt: string): { 
  displayDate: string; 
  timeStr: string;
  timeAgo: string; 
  isToday: boolean;
  isRecent: boolean;
  diffMinutes: number;
} {
  if (!createdAt) return { displayDate: '-', timeStr: '-', timeAgo: '', isToday: false, isRecent: false, diffMinutes: 0 };
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return { displayDate: '-', timeStr: '-', timeAgo: '', isToday: false, isRecent: false, diffMinutes: 0 };

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - d.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');

  let dateLabel = '';
  if (isToday) {
    dateLabel = 'Hari Ini';
  } else if (isYesterday) {
    dateLabel = 'Kemarin';
  } else {
    dateLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  let timeAgo = '';
  if (diffMinutes < 2) {
    timeAgo = 'Baru saja';
  } else if (diffMinutes < 60) {
    timeAgo = `${diffMinutes} mnt lalu`;
  } else if (diffHours < 24 && isToday) {
    timeAgo = `${diffHours} jam lalu`;
  } else if (isYesterday) {
    timeAgo = 'Kemarin';
  } else {
    timeAgo = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  const isRecent = diffMinutes < 30 && isToday;

  return {
    displayDate: `${dateLabel}, ${timeStr}`,
    timeStr,
    timeAgo,
    isToday,
    isRecent,
    diffMinutes,
  };
}

function formatSchedule(order: Order) {
  if (order.order_type === 'reservation') {
    const raw = order.reservation_date || '';
    if (raw.includes('T')) {
      const [d, t] = raw.split('T');
      const parts = d.split('-');
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthIdx = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      const formattedDate = `${day} ${monthNames[monthIdx] || parts[1]}`;
      return `${formattedDate} · ${t} · ${order.guest_count || 4} tamu`;
    }
    return `${raw || 'Hari ini'} · ${order.guest_count || 4} tamu`;
  }
  const timeStr = new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${order.items?.length || 0} menu · ${timeStr}`;
}

function getStatusPillStyle(status: OrderStatus, isQris: boolean) {
  switch (status) {
    case 'pending_payment':
      return isQris
        ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    case 'processing':
      return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
    case 'completed':
      return 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200';
    case 'cancelled':
      return 'bg-stone-100 text-stone-400 border-stone-200 hover:bg-stone-200';
    default:
      return 'bg-stone-100 text-stone-600 border-stone-200';
  }
}

function matchStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'pending_payment':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'confirmed':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'processing':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'completed':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'cancelled':
      return 'bg-stone-100 text-stone-600 border-stone-200';
    default:
      return 'bg-stone-100 text-stone-600 border-stone-200';
  }
}
