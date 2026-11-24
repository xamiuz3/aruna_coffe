'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CafeStore } from '@/lib/store';
import { Order, OrderStatus } from '@/lib/types';
import { RealtimeOrders } from '@/lib/realtime';
import { ReceiptPrint } from '@/components/ReceiptPrint';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminTopNav } from '@/components/AdminTopNav';
import { 
  CalendarDays, 
  Clock, 
  Check, 
  X, 
  ExternalLink, 
  Search, 
  Printer, 
  UtensilsCrossed, 
  Layers, 
  QrCode, 
  CreditCard, 
  CheckCircle2, 
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Eye,
  FileText
} from 'lucide-react';

export default function AdminReservasiPage() {
  const [orders, setOrders] = useState<Order[]>(() => CafeStore.getInitialOrders());
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'upcoming' | 'completed'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const loadReservations = useCallback(async () => {
    try {
      const allOrders = await CafeStore.getOrders();
      const resOrders = allOrders.filter(o => o.order_type === 'reservation');
      setOrders(resOrders);
    } catch (e) {
      console.error('Failed to load reservations:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();

    const unsubscribe = RealtimeOrders.subscribe((event) => {
      if (event.type === 'NEW_ORDER' && event.order.order_type === 'reservation') {
        setOrders(prev => [event.order, ...prev.filter(o => o.id !== event.order.id)]);
      } else if (event.type === 'UPDATE_ORDER' && event.order.order_type === 'reservation') {
        setOrders(prev => prev.map(o => o.id === event.order.id ? event.order : o));
      }
    });

    const interval = setInterval(loadReservations, 2000);
    const handleUpdate = () => {
      loadReservations();
    };

    window.addEventListener('arjuna_store_updated', handleUpdate);
    return () => {
      clearInterval(interval);
      unsubscribe();
      window.removeEventListener('arjuna_store_updated', handleUpdate);
    };
  }, [loadReservations]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await CafeStore.updateOrderStatus(orderId, newStatus);
      await loadReservations();
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const handleToggleMajoo = async (orderId: string, currentVal: boolean) => {
    await CafeStore.toggleMajooRecorded(orderId, !currentVal);
    await loadReservations();
  };

  const handlePrint = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
      setPrintingOrder(null);
    }, 150);
  };

  // Filter reservations
  const filteredReservations = orders.filter(order => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && order.status !== 'pending_payment') return false;
      if (statusFilter === 'confirmed' && order.status !== 'confirmed') return false;
      if (statusFilter === 'processing' && order.status !== 'processing') return false;
      if (statusFilter === 'completed' && order.status !== 'completed') return false;
      if (statusFilter === 'cancelled' && order.status !== 'cancelled') return false;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || 
      order.customer_name.toLowerCase().includes(q) ||
      (order.customer_phone && order.customer_phone.toLowerCase().includes(q)) ||
      order.table_number.toLowerCase().includes(q) ||
      order.order_number.toLowerCase().includes(q) ||
      (order.items && order.items.some(i => i.item_name.toLowerCase().includes(q)));

    if (!matchSearch) return false;

    const orderDate = order.reservation_date ? order.reservation_date.split('T')[0] : '';

    if (customDate) {
      return orderDate === customDate;
    }

    if (dateFilter === 'today') {
      return orderDate === todayStr && order.status !== 'completed' && order.status !== 'cancelled';
    }
    if (dateFilter === 'tomorrow') {
      return orderDate === tomorrowStr && order.status !== 'completed' && order.status !== 'cancelled';
    }
    if (dateFilter === 'upcoming') {
      return orderDate >= todayStr && order.status !== 'completed' && order.status !== 'cancelled';
    }
    if (dateFilter === 'completed') {
      return order.status === 'completed' || order.status === 'cancelled';
    }

    return true;
  });

  const totalCount = orders.length;
  const pendingCount = orders.filter(o => o.status === 'pending_payment').length;
  const confirmedCount = orders.filter(o => o.status === 'confirmed' || o.status === 'processing').length;
  const todayCount = orders.filter(o => o.reservation_date?.startsWith(todayStr)).length;

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage) || 1;
  const paginatedReservations = filteredReservations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-[#1c1917] flex flex-col lg:flex-row items-start antialiased font-sans">
      
      {/* ======================================================== */}
      {/* 1. SIDEBAR ADMIN (BISA DI-MINIMIZE & RESPONSIF HP/TABLET)*/}
      {/* ======================================================== */}
      <AdminSidebar
        currentPath="/kasir/reservasi"
        pendingReservationsCount={pendingCount}
        pendingOrdersCount={orders.filter(o => o.order_type !== 'reservation' && o.status === 'pending_payment').length}
      />

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT AREA                                     */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* TOP NAVBAR (JAM, TANGGAL & PEMBERITAHUAN PESANAN / BAHAN HABIS) */}
        <AdminTopNav />

        <main className="p-3 sm:p-5 lg:p-6 space-y-4 max-w-[1440px] w-full mx-auto">
          
          {/* Top 4 Stat Summary Cards */}
          <div className="print:hidden grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Stat 1: Total Reservasi */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Total Reservasi
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-black text-stone-900 mt-0.5 block">
                  {String(totalCount).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-stone-400 font-medium block mt-0.5">
                  Semua reservasi masuk
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
                <CalendarDays className="w-5 h-5 text-stone-700" />
              </div>
            </div>

            {/* Stat 2: Menunggu Cek QRIS */}
            <div className={`rounded-2xl p-4 border shadow-2xs flex items-center justify-between transition-colors ${
              pendingCount > 0 
                ? 'bg-amber-50/60 border-amber-300' 
                : 'bg-white border-stone-200/90'
            }`}>
              <div>
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Menunggu Cek QRIS
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-black text-amber-900 mt-0.5 block">
                  {String(pendingCount).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                  {pendingCount > 0 ? 'Perlu diverifikasi' : 'Semua terverifikasi'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                <QrCode className="w-5 h-5 text-amber-800" />
              </div>
            </div>

            {/* Stat 3: Reservasi Hari Ini */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Reservasi Hari Ini
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-black text-stone-900 mt-0.5 block">
                  {String(todayCount).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-stone-400 font-medium block mt-0.5">
                  Jadwal kedatangan hari ini
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                <Clock className="w-5 h-5 text-emerald-700" />
              </div>
            </div>

            {/* Stat 4: Siap / Terkonfirmasi */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Siap / Terkonfirmasi
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-black text-stone-900 mt-0.5 block">
                  {String(confirmedCount).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-stone-400 font-medium block mt-0.5">
                  Meja sudah siap disiapkan
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#c87a58] shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#c87a58]" />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TABEL UTAMA RESERVASI (PERSIS 100% SESUAI REFERENSI MOCKUP) */}
          {/* ======================================================== */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
            
            {/* Header Box: Judul & Subtitle & Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-stone-150">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                    Daftar Reservasi Masuk
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Update real-time jadwal booking, menu pre-order & pembayaran dari customer
                  </p>
                </div>

                {/* Filter Right: Search Input + Status Dropdown + Tombol Reservasi Baru */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                  <div className="relative w-full sm:w-52">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari ID, nama, meja..."
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
                      <option value="pending">Menunggu Cek QRIS</option>
                      <option value="confirmed">Terkonfirmasi (Siap)</option>
                      <option value="processing">Sedang Dimasak</option>
                      <option value="completed">Selesai (Hadir)</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>

                    <Link
                      href="/?tab=reservation"
                      target="_blank"
                      className="px-3 py-2 sm:py-1.5 rounded-xl bg-[#c87a58] hover:bg-[#b86948] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                    >
                      <span>+ Baru</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Filter Tabs: Semua, Hari Ini, Besok, Mendatang, Riwayat, Date Picker */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-3 sm:mt-4 pt-1">
                <button
                  type="button"
                  onClick={() => { setDateFilter('all'); setCustomDate(''); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                    dateFilter === 'all' && !customDate
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200'
                  }`}
                >
                  Semua ({totalCount})
                </button>

                <button
                  type="button"
                  onClick={() => { setDateFilter('today'); setCustomDate(''); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                    dateFilter === 'today' && !customDate
                      ? 'bg-[#c87a58] text-white border-[#c87a58]'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200'
                  }`}
                >
                  Hari Ini ({todayCount})
                </button>

                <button
                  type="button"
                  onClick={() => { setDateFilter('tomorrow'); setCustomDate(''); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                    dateFilter === 'tomorrow' && !customDate
                      ? 'bg-[#c87a58] text-white border-[#c87a58]'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200'
                  }`}
                >
                  Besok
                </button>

                <button
                  type="button"
                  onClick={() => { setDateFilter('upcoming'); setCustomDate(''); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                    dateFilter === 'upcoming' && !customDate
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200'
                  }`}
                >
                  Mendatang
                </button>

                <button
                  type="button"
                  onClick={() => { setDateFilter('completed'); setCustomDate(''); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                    dateFilter === 'completed' && !customDate
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200'
                  }`}
                >
                  Riwayat
                </button>

                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 rounded-xl border border-stone-300 text-xs font-bold text-stone-800 bg-stone-50 focus:bg-white outline-none cursor-pointer"
                  title="Pilih tanggal tertentu"
                />
              </div>
            </div>

            {/* ======================================================== */}
            {/* VIEW 1: TAMPILAN KARTU RESERVASI ANDROID (TIDAK PERLU GESER DATA) */}
            {/* ======================================================== */}
            <div className="block md:hidden divide-y divide-stone-150">
              {loading ? (
                <div className="py-12 px-4 text-center text-stone-400 italic">
                  Memuat data reservasi...
                </div>
              ) : paginatedReservations.length === 0 ? (
                <div className="py-12 px-4 text-center text-stone-400 italic">
                  Tidak ada reservasi yang sesuai filter
                </div>
              ) : (
                paginatedReservations.map(order => {
                  const isQris = order.payment_method === 'qris';
                  const tableNumOnly = order.table_number.replace(/meja\s*/i, '') || order.table_number;

                  return (
                    <div key={order.id} className="p-3.5 space-y-3 bg-white hover:bg-amber-50/20 transition-colors">
                      {/* Baris 1: ID, Meja, dan Jadwal */}
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
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                            Reservasi
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 font-bold bg-stone-100 px-2 py-0.5 rounded shrink-0">
                          {order.guest_count || 4} Tamu
                        </span>
                      </div>

                      {/* Baris 2: Pemesan & Jadwal Datang */}
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
                          <span className="text-[10px] text-stone-400 uppercase font-bold block">Jadwal</span>
                          <span className="font-bold text-stone-800 text-xs block">
                            {formatSchedule(order)}
                          </span>
                        </div>
                      </div>

                      {/* Baris 3: Menu Pre-order & Catatan */}
                      <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-150 space-y-1">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase text-stone-400 block">
                              Pre-order ({order.items.length} item)
                            </span>
                            {order.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] text-stone-800">
                                <span className="truncate pr-2">
                                  <strong className="text-[#c87a58] mr-1">{it.quantity}x</strong>
                                  {it.item_name}
                                </span>
                                <span className="font-mono text-stone-600 shrink-0 text-[10px]">
                                  Rp {it.subtotal.toLocaleString('id-ID')}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic text-[11px] block">
                            Tanpa hidangan pre-order
                          </span>
                        )}
                        {order.notes && (
                          <div className="pt-1.5 mt-1 border-t border-stone-200/70 text-[10px] text-amber-800 italic">
                            Catatan Tamu: &quot;{order.notes}&quot;
                          </div>
                        )}
                      </div>

                      {/* Baris 4: Pembayaran / DP & Bukti QRIS */}
                      <div className="flex items-center justify-between text-xs pt-0.5 flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isQris ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            DP {isQris ? 'QRIS' : 'KASIR'}
                          </span>
                          <span className="font-bold text-stone-800 text-xs">
                            Rp {(order.down_payment || order.total_amount).toLocaleString('id-ID')}
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

                        <span className="text-[10px] text-stone-400">
                          Total: Rp {order.total_amount.toLocaleString('id-ID')}
                        </span>
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
                            <option value="pending_payment">{isQris ? 'Cek QRIS ▾' : 'Menunggu Bayar ▾'}</option>
                            <option value="confirmed">Terkonfirmasi ▾</option>
                            <option value="processing">Diproses ▾</option>
                            <option value="completed">Selesai (Hadir) ▾</option>
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
                    <th className="py-3 px-3 sm:px-4">BOOKING ID</th>
                    <th className="py-3 px-2 sm:px-3 text-center">MEJA</th>
                    <th className="py-3 px-3 sm:px-4">PELANGGAN</th>
                    <th className="py-3 px-3 sm:px-4">JADWAL & TAMU</th>
                    <th className="py-3 px-3 sm:px-4">PEMBAYARAN / DP</th>
                    <th className="py-3 px-2 sm:px-3">STATUS</th>
                    <th className="py-3 px-3 sm:px-4 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-800 text-[11px]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400 italic">
                        Memuat data reservasi...
                      </td>
                    </tr>
                  ) : paginatedReservations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400 italic">
                        Tidak ada reservasi yang sesuai filter
                      </td>
                    </tr>
                  ) : (
                    paginatedReservations.map(order => {
                      const isQris = order.payment_method === 'qris';
                      const tableNumOnly = order.table_number.replace(/meja\s*/i, '') || order.table_number;

                      return (
                        <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                          {/* 1. BOOKING ID */}
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                            <span 
                              className="font-bold text-[#c87a58] text-xs block cursor-pointer hover:underline" 
                              title={`Booking ID Lengkap: ${order.order_number}`}
                              onClick={() => setDetailOrder(order)}
                            >
                              {formatOrderNumber(order.order_number)}
                            </span>
                            <span className="text-[10px] text-stone-400 block font-normal mt-0.5">
                              Reservasi
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

                          {/* 4. JADWAL & TAMU */}
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                            <strong className="text-stone-800 font-semibold text-xs block">
                              {formatSchedule(order)}
                            </strong>
                            <button
                              type="button"
                              onClick={() => setDetailOrder(order)}
                              className="text-[10px] text-stone-400 hover:text-stone-700 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer mt-0.5"
                            >
                              <span>{order.items && order.items.length > 0 ? `${order.items.length} menu pre-order →` : 'Lihat detail reservasi →'}</span>
                            </button>
                          </td>

                          {/* 5. PEMBAYARAN / DP */}
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                            <strong className="text-stone-800 font-semibold text-xs block">
                              DP {isQris ? 'QRIS' : 'Kasir'} · Rp {(order.down_payment || order.total_amount).toLocaleString('id-ID')}
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
                                <option value="pending_payment">{isQris ? 'Cek QRIS ▾' : 'Menunggu Bayar ▾'}</option>
                                <option value="confirmed">Terkonfirmasi ▾</option>
                                <option value="processing">Diproses ▾</option>
                                <option value="completed">Selesai (Hadir) ▾</option>
                                <option value="cancelled">Dibatalkan ▾</option>
                              </select>
                              <ChevronDown className="w-3 h-3 text-current opacity-60 absolute right-2 pointer-events-none" />
                            </div>
                          </td>

                          {/* 7. AKSI */}
                          <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handlePrint(order)}
                                className="bg-[#181513] hover:bg-black text-white text-[11px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print Struk</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailOrder(order)}
                                className="border border-stone-200 hover:bg-stone-50 text-stone-700 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Detail
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
                Menampilkan {paginatedReservations.length} dari {filteredReservations.length} data reservasi
              </span>
              {totalPages > 1 && (
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
              )}
            </div>

          </div>

        </main>
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL DETAIL RESERVASI & MENU PRE-ORDER               */}
      {/* ======================================================== */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm">#{detailOrder.order_number}</span>
                <span className="bg-[#c87a58] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {detailOrder.table_number}
                </span>
                <span className="bg-purple-950 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-800">
                  Reservasi Meja
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
                  <strong className="text-stone-900 text-sm block">{detailOrder.customer_name}</strong>
                  <p className="text-stone-500 font-mono text-[11px] mt-0.5">{detailOrder.customer_phone || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Jadwal Kedatangan</span>
                  <strong className="text-stone-900 text-sm block">
                    {formatSchedule(detailOrder)}
                  </strong>
                  <p className="text-stone-500 text-[11px] mt-0.5">
                    Metode DP: {detailOrder.payment_method === 'qris' ? 'QRIS BRI Merchant' : 'Kasir Saat Tiba'}
                  </p>
                </div>
              </div>

              {detailOrder.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-amber-900">
                  <span className="font-bold text-[10px] uppercase block text-amber-800">Catatan Tamu:</span>
                  <p className="italic text-[11px] mt-0.5">&quot;{detailOrder.notes}&quot;</p>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                  Menu Hidangan Pre-Order ({detailOrder.items?.length || 0} item)
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
                    <div className="p-4 text-center text-stone-400 italic">
                      Tamu ini hanya booking meja tanpa memilih menu pre-order
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-700">Total DP / Tagihan</span>
                <span className="font-serif font-black text-[#c87a58] text-base">
                  Rp {(detailOrder.down_payment || detailOrder.total_amount).toLocaleString('id-ID')}
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
                <span>Print Slip Meja</span>
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

      {/* ======================================================== */}
      {/* 4. MODAL PREVIEW BUKTI TRANSFER QRIS                     */}
      {/* ======================================================== */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-3.5 bg-stone-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs">Bukti Transfer DP QRIS / Bank</span>
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
                      <span className="text-xs font-bold text-stone-900">Dokumen Bukti Transfer DP (PDF)</span>
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
                  <p className="text-[11px] text-stone-500">File bukti tidak dapat diakses atau URL rusak.</p>
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

      {/* ======================================================== */}
      {/* 5. TEMPLATE CETAK STRUK THERMAL                          */}
      {/* ======================================================== */}
      {printingOrder && (
        <ReceiptPrint order={printingOrder} />
      )}

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
