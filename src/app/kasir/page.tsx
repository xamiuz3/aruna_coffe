'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CafeStore } from '@/lib/store';
import { Order, OrderStatus } from '@/lib/types';
import { playNotificationSound, unlockAudioContext } from '@/lib/sound';
import { RealtimeOrders } from '@/lib/realtime';
import { ReceiptPrint } from '@/components/ReceiptPrint';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminTopNav } from '@/components/AdminTopNav';
import { 
  Bell, 
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
  FileText
} from 'lucide-react';

export default function KasirDashboard() {
  const [orders, setOrders] = useState<Order[]>(() => CafeStore.getInitialOrders());
  const [typeFilter, setTypeFilter] = useState<'all' | 'order' | 'reservation'>('all');
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
    
    // Inisialisasi set known order IDs pertama kali
    if (knownOrderIdsRef.current.size === 0 && list.length > 0) {
      list.forEach(o => knownOrderIdsRef.current.add(o.id));
      prevOrderCountRef.current = list.length;
      setOrders(list);
      return;
    }

    // Deteksi apakah ada pesanan baru yang belum pernah dilihat
    const newItems = list.filter(o => !knownOrderIdsRef.current.has(o.id));
    if (newItems.length > 0) {
      newItems.forEach(o => knownOrderIdsRef.current.add(o.id));
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

  const handleToggleMajoo = async (orderId: string, currentVal: boolean) => {
    await CafeStore.toggleMajooRecorded(orderId, !currentVal);
    fetchOrders();
  };

  const handlePrint = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Counts for tabs & top stats
  const allCount = orders.length;
  const pendingCount = orders.filter(o => o.status === 'pending_payment').length;
  const orderCount = orders.filter(o => o.order_type !== 'reservation').length;
  const reservationCount = orders.filter(o => o.order_type === 'reservation').length;

  const newOrdersTodayCount = orders.filter(o => o.order_type !== 'reservation' && o.status !== 'completed').length;
  const pendingQrisCount = orders.filter(o => o.payment_method === 'qris' && o.status === 'pending_payment').length;
  const reservationsTodayCount = orders.filter(o => o.order_type === 'reservation').length;
  const totalReservationGuests = orders
    .filter(o => o.order_type === 'reservation')
    .reduce((sum, o) => sum + (o.guest_count || 4), 0);

  // Filtered orders
  const filteredOrders = orders.filter(order => {
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

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const currentDateString = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-[#1c1917] flex flex-col lg:flex-row items-start antialiased font-sans">
      {/* ======================================================== */}
      {/* 1. SIDEBAR ADMIN (BISA DI-MINIMIZE & RESPONSIF HP/TABLET)*/}
      {/* ======================================================== */}
      <AdminSidebar
        currentPath="/kasir"
        pendingOrdersCount={pendingCount}
        pendingReservationsCount={orders.filter(o => o.order_type === 'reservation' && o.status === 'pending_payment').length}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT AREA                                     */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        
        {/* TOP NAVBAR (JAM, TANGGAL & PEMBERITAHUAN PESANAN / BAHAN HABIS) */}
        <AdminTopNav
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onTestSound={handleTestSound}
        />

        {/* Banner Aktivasi Suara Bel (Jika belum pernah diklik di browser) */}
        {!audioUnlocked && (
          <div 
            onClick={handleTestSound}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm select-none"
          >
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            <span>Klik di sini sekali untuk mengaktifkan notifikasi suara bel pesanan otomatis (Browser Audio Permission)</span>
          </div>
        )}

        {/* Banner Alert Notifikasi Baru */}
        {notificationBanner && (
          <div className="bg-[#c87a58] text-white px-4 py-2.5 font-bold text-xs text-center flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top duration-200">
            <Bell className="w-4 h-4 animate-bounce" />
            <span>{notificationBanner}</span>
          </div>
        )}

        <main className="p-3 sm:p-5 lg:p-6 space-y-4 max-w-[1440px] w-full mx-auto">
          
          {/* ======================================================== */}
          {/* 1. TOP STATS 4 KARTU (PERSIS REFERENSI SCREENSHOT)       */}
          {/* ======================================================== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Pesanan Baru */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Pesanan Baru
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-black text-stone-900 mt-0.5 block">
                  {String(newOrdersTodayCount).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-stone-400 font-medium block mt-0.5">
                  -3 sejak 10:00
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <UtensilsCrossed className="w-5 h-5 text-rose-600" />
              </div>
            </div>

            {/* 2. Menunggu Cek QRIS */}
            <div className={`rounded-2xl p-4 border shadow-2xs flex items-center justify-between transition-colors ${
              pendingQrisCount > 0 
                ? 'bg-amber-50/60 border-amber-300' 
                : 'bg-white border-stone-200/90'
            }`}>
              <div>
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Menunggu Cek QRIS
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-black text-amber-900 mt-0.5 block">
                  {String(pendingQrisCount).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                  Perlu diverifikasi
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                <QrCode className="w-5 h-5 text-amber-800" />
              </div>
            </div>

            {/* 3. Reservasi Hari Ini */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Reservasi Hari Ini
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-black text-stone-900 mt-0.5 block">
                  {String(reservationsTodayCount).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-stone-400 font-medium block mt-0.5">
                  {totalReservationGuests} total tamu
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                <CalendarDays className="w-5 h-5 text-emerald-700" />
              </div>
            </div>

            {/* 4. Stok Menipis */}
            <Link 
              href="/kasir/stok" 
              className="bg-white hover:bg-stone-50 transition-colors rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex items-center justify-between group"
            >
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Stok Menipis
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-black text-stone-900 mt-0.5 block">
                  04
                </span>
                <span className="text-[10px] text-rose-600 font-bold block mt-0.5 group-hover:underline">
                  Perlu restock
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
                <Layers className="w-5 h-5 text-stone-700" />
              </div>
            </Link>
          </div>

          {/* ======================================================== */}
          {/* 2. TABEL UTAMA (PERSIS 100% SESUAI SCREENSHOT USER)      */}
          {/* ======================================================== */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
            
            {/* Header Box: Judul & Subtitle & Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-stone-150">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                    Pesanan & Reservasi Masuk
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Update real-time dari customer
                  </p>
                </div>

                {/* Filter Right: Search Input + Status Dropdown + Histori Button */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                  <div className="relative w-full sm:w-56">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari ID atau pelanggan..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-2 sm:py-1.5 rounded-xl border border-stone-300 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-[#c87a58] bg-stone-50/70 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-xl border border-stone-300 text-xs font-medium text-stone-700 bg-white outline-none cursor-pointer focus:border-[#c87a58]"
                    >
                      <option value="all">Semua status ▾</option>
                      <option value="pending">Menunggu Bayar / Cek QRIS</option>
                      <option value="confirmed">Dikonfirmasi</option>
                      <option value="processing">Sedang Dimasak</option>
                      <option value="completed">Selesai</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>

                    <Link
                      href="/kasir/histori"
                      className="px-3 py-2 sm:py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                      title="Buka arsip pembayaran dan riwayat transaksi lalu"
                    >
                      <ReceiptText className="w-3.5 h-3.5 text-[#c87a58]" />
                      <span>Arsip</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Filter Tabs: Semua 11, Pesanan 8, Reservasi 3 (Scrollable di Android) */}
              <div className="flex items-center gap-4 sm:gap-6 mt-3 sm:mt-4 overflow-x-auto no-scrollbar border-b border-transparent -mb-5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter('all');
                    setCurrentPage(1);
                  }}
                  className={`pb-3 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative shrink-0 ${
                    typeFilter === 'all'
                      ? 'text-[#c87a58] border-b-2 border-[#c87a58]'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <span>Semua</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    typeFilter === 'all' ? 'bg-[#c87a58]/15 text-[#c87a58]' : 'bg-stone-100 text-stone-600'
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
                  className={`pb-3 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative shrink-0 ${
                    typeFilter === 'order'
                      ? 'text-[#c87a58] border-b-2 border-[#c87a58]'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <span>Pesanan</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    typeFilter === 'order' ? 'bg-[#c87a58]/15 text-[#c87a58]' : 'bg-stone-100 text-stone-600'
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
                  className={`pb-3 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative shrink-0 ${
                    typeFilter === 'reservation'
                      ? 'text-[#c87a58] border-b-2 border-[#c87a58]'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <span>Reservasi</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    typeFilter === 'reservation' ? 'bg-[#c87a58]/15 text-[#c87a58]' : 'bg-stone-100 text-stone-600'
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

                  return (
                    <div key={order.id} className="p-3.5 space-y-3 bg-white hover:bg-amber-50/20 transition-colors">
                      {/* Baris 1: ID, Badge Meja, Badge Jenis, dan Jam */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span 
                            onClick={() => setDetailOrder(order)}
                            className="font-bold text-[#c87a58] text-xs cursor-pointer hover:underline"
                          >
                            {formatOrderNumber(order.order_number)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200/90 text-[11px] font-bold text-stone-800">
                            Meja {tableNumOnly}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isReservation ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {isReservation ? 'Reservasi' : 'Self-order'}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-medium shrink-0">
                          {isReservation 
                            ? formatSchedule(order) 
                            : new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'}
                        </span>
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

                      return (
                        <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                          {/* 1. ORDER / BOOKING ID */}
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                            <span 
                              className="font-bold text-[#c87a58] text-xs block cursor-pointer hover:underline" 
                              title={`Order ID Lengkap: ${order.order_number}`}
                              onClick={() => setDetailOrder(order)}
                            >
                              {formatOrderNumber(order.order_number)}
                            </span>
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
                            <strong className="text-stone-800 font-semibold text-xs block">
                              {formatSchedule(order)}
                            </strong>
                            <button
                              type="button"
                              onClick={() => setDetailOrder(order)}
                              className="text-[10px] text-stone-400 hover:text-stone-700 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer mt-0.5"
                            >
                              <span>Lihat detail menu</span>
                              <span>→</span>
                            </button>
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

                          {/* 7. AKSI (PERSIS MOCKUP: ORDER = PRINT STRUK, RESERVASI = DETAIL) */}
                          <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end">
                              {order.order_type === 'reservation' ? (
                                <button
                                  type="button"
                                  onClick={() => setDetailOrder(order)}
                                  className="border border-stone-200 hover:bg-stone-50 text-stone-700 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  Detail
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handlePrint(order)}
                                  className="bg-[#181513] hover:bg-black text-white text-[11px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Print Struk</span>
                                </button>
                              )}
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
                      <div key={idx} className="p-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-stone-900">
                            <span className="text-[#c87a58] font-black mr-1">{item.quantity}x</span>
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
