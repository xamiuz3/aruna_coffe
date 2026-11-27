'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CafeStore } from '@/lib/store';
import { Order } from '@/lib/types';
import { AdminAuth } from '@/lib/auth';
import { RealtimeOrders } from '@/lib/realtime';
import { AdminSidebar } from '@/components/AdminSidebar';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Filter, 
  PieChart, 
  BarChart3, 
  FileSpreadsheet, 
  Search,
  Bell,
  CalendarDays,
  UtensilsCrossed,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function AdminOwnerDashboard() {
  const [orders, setOrders] = useState<Order[]>(() => CafeStore.getInitialOrders());
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [filterMethod, setFilterMethod] = useState<'all' | 'cashier' | 'qris'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = () => CafeStore.getOrders(true).then(setOrders);
    load();
    const unsubscribeRealtime = RealtimeOrders.subscribe((event) => {
      if (event.type === 'NEW_ORDER' || event.type === 'UPDATE_ORDER' || event.type === 'DELETE_ORDER') {
        load();
      }
    });
    const handleUpdate = () => load();
    window.addEventListener('arjuna_store_updated', handleUpdate);
    const poll = setInterval(load, 5000);
    return () => {
      clearInterval(poll);
      unsubscribeRealtime();
      window.removeEventListener('arjuna_store_updated', handleUpdate);
    };
  }, []);

  const session = typeof window !== 'undefined' ? AdminAuth.getSession() : null;

  // Hanya hitung pesanan yang sudah terkonfirmasi / diproses / selesai (sinkron dengan Kasir & Rekap Shift)
  const validOrders = orders.filter(
    o => o.status === 'confirmed' || o.status === 'processing' || o.status === 'completed'
  );

  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toDateString();

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const prevSevenDaysStart = new Date(sevenDaysAgo);
  prevSevenDaysStart.setDate(prevSevenDaysStart.getDate() - 7);

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const todayOrders = validOrders.filter(o => new Date(o.created_at).toDateString() === todayStr);
  const yesterdayOrders = validOrders.filter(o => new Date(o.created_at).toDateString() === yesterdayStr);
  const weekOrders = validOrders.filter(o => new Date(o.created_at) >= sevenDaysAgo);
  const prevWeekOrders = validOrders.filter(o => {
    const d = new Date(o.created_at);
    return d >= prevSevenDaysStart && d < sevenDaysAgo;
  });
  const monthOrders = validOrders.filter(o => {
    const d = new Date(o.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const weekRevenue = weekOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const prevWeekRevenue = prevWeekOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const monthRevenue = monthOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const calcGrowthPct = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? '+100%' : '0%';
    const diff = ((curr - prev) / prev) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };
  const todayGrowth = calcGrowthPct(todayRevenue, yesterdayRevenue);
  const weekGrowth = calcGrowthPct(weekRevenue, prevWeekRevenue);

  const totalCash = validOrders.filter(o => o.payment_method === 'cashier').reduce((s, o) => s + o.total_amount, 0);
  const totalQris = validOrders.filter(o => o.payment_method === 'qris').reduce((s, o) => s + o.total_amount, 0);
  const totalAllMethods = totalCash + totalQris;
  const qrisPercentage = totalAllMethods > 0 ? Math.round((totalQris / totalAllMethods) * 100) : 0;
  const cashPercentage = totalAllMethods > 0 ? 100 - qrisPercentage : 0;

  // Real 7-day trend chart from actual orders
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const rawTrend = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - idx));
    const dStr = d.toDateString();
    const amount = validOrders
      .filter(o => new Date(o.created_at).toDateString() === dStr)
      .reduce((s, o) => s + o.total_amount, 0);
    return { day: dayNames[d.getDay()], amount };
  });
  const maxTrendAmount = Math.max(...rawTrend.map(t => t.amount), 1);
  const weeklyTrend = rawTrend.map(t => ({
    ...t,
    height: t.amount > 0 ? `${Math.max(12, Math.round((t.amount / maxTrendAmount) * 100))}%` : '4%',
  }));
  const avgDailyRevenue = Math.round(weekRevenue / 7);

  // Filter orders for Rincian Transaksi Keseluruhan table based on filterPeriod
  const periodFilteredOrders = validOrders.filter(o => {
    const d = new Date(o.created_at);
    if (filterPeriod === 'today') return d.toDateString() === todayStr;
    if (filterPeriod === 'week') return d >= sevenDaysAgo;
    if (filterPeriod === 'month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    return true;
  });

  // Group real orders by date
  const groupedByDate = new Map<string, { dateObj: Date; ordersCount: number; cash: number; nonCash: number; total: number }>();
  periodFilteredOrders.forEach(o => {
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const existing = groupedByDate.get(key) || { dateObj: d, ordersCount: 0, cash: 0, nonCash: 0, total: 0 };
    existing.ordersCount += 1;
    if (o.payment_method === 'cashier') existing.cash += o.total_amount;
    else existing.nonCash += o.total_amount;
    existing.total += o.total_amount;
    groupedByDate.set(key, existing);
  });

  const sortedDailyEntries = Array.from(groupedByDate.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  const dailyReports = sortedDailyEntries.map(([, val], idx) => {
    const prevEntry = sortedDailyEntries[idx + 1]?.[1];
    const change = prevEntry ? calcGrowthPct(val.total, prevEntry.total) : (val.total > 0 ? '+100%' : '0%');
    return {
      date: val.dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      ordersCount: val.ordersCount,
      cash: val.cash,
      nonCash: val.nonCash,
      tax: Math.round(val.total * 0.1),
      total: val.total,
      change,
    };
  });

  const handleExportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Tanggal,Jumlah Transaksi,Total Tunai,Total QRIS,Pajak 10%,Total Pendapatan,% Perubahan\n"
      + dailyReports.map(r => `"${r.date}",${r.ordersCount},${r.cash},${r.nonCash},${r.tax},${r.total},"${r.change}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Keuangan_Owner_Aruna_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-[#1c1917] flex flex-col lg:flex-row items-start antialiased font-sans">
      <AdminSidebar currentPath="/kasir/owner" />

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#1b3728] text-emerald-300 text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>AKSES OWNER</span>
                </span>
                <span className="text-xs text-stone-400 font-medium">Laporan Eksekutif & Analitik Bisnis</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                Ringkasan Bisnis & Laporan Transaksi
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-4 py-2.5 rounded-2xl bg-[#1b3728] hover:bg-[#152c20] text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Laporan (Excel/CSV)</span>
              </button>
            </div>
          </div>

          {/* 3 REVENUE STAT CARDS WITH % CHANGES (PRD SPECIFICATION) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Pendapatan Hari Ini */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Pendapatan Hari Ini
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  todayGrowth.startsWith('-') ? 'text-rose-700 bg-rose-50' : 'text-emerald-700 bg-emerald-50'
                }`}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{todayGrowth}</span>
                </span>
              </div>
              <div>
                <span className="text-3xl font-serif font-black text-stone-900 block tracking-tight">
                  Rp {todayRevenue.toLocaleString('id-ID')}
                </span>
                <span className="text-[11px] text-stone-400 font-medium block mt-1">
                  vs kemarin (Rp {yesterdayRevenue.toLocaleString('id-ID')})
                </span>
              </div>
            </div>

            {/* 2. Pendapatan Minggu Ini */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Pendapatan Minggu Ini
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  weekGrowth.startsWith('-') ? 'text-rose-700 bg-rose-50' : 'text-emerald-700 bg-emerald-50'
                }`}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{weekGrowth}</span>
                </span>
              </div>
              <div>
                <span className="text-3xl font-serif font-black text-stone-900 block tracking-tight">
                  Rp {weekRevenue.toLocaleString('id-ID')}
                </span>
                <span className="text-[11px] text-stone-400 font-medium block mt-1">
                  vs minggu lalu (Rp {prevWeekRevenue.toLocaleString('id-ID')})
                </span>
              </div>
            </div>

            {/* 3. Pendapatan Bulan Ini */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Pendapatan Bulan Ini
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span>{monthOrders.length} transaksi</span>
                </span>
              </div>
              <div>
                <span className="text-3xl font-serif font-black text-[#1b3728] block tracking-tight">
                  Rp {monthRevenue.toLocaleString('id-ID')}
                </span>
                <span className="text-[11px] text-stone-400 font-medium block mt-1">
                  Akumulasi transaksi terbayar bulan ini
                </span>
              </div>
            </div>
          </div>

          {/* CHARTS & BREAKDOWN SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 7-Day Revenue Trend Chart */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-stone-150 pb-3">
                <div>
                  <h3 className="text-lg font-serif font-bold text-stone-900 tracking-tight">
                    Tren Pendapatan Harian (7 Hari Terakhir)
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Rata-rata omset harian: Rp {avgDailyRevenue.toLocaleString('id-ID')} / hari
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  Tren Naik
                </span>
              </div>

              {/* Bar Chart Visualization */}
              <div className="h-56 w-full flex items-end justify-between gap-3 pt-6 px-2">
                {weeklyTrend.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(item.amount / 1000000).toFixed(1)}jt
                    </span>
                    <div 
                      style={{ height: item.height }}
                      className="w-full max-w-[48px] bg-[#1b3728] rounded-xl hover:bg-[#28533d] transition-all group-hover:scale-102 cursor-pointer shadow-2xs"
                    />
                    <span className="text-xs font-bold text-stone-600 mt-1">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Breakdown Donut */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-6 space-y-5 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900 tracking-tight">
                  Metode Pembayaran
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Distribusi pembayaran non-tunai vs tunai
                </p>

                {/* Donut representation */}
                <div className="my-6 flex flex-col items-center justify-center">
                  <div className="w-36 h-36 rounded-full border-12 border-emerald-800 border-t-amber-500 flex items-center justify-center shadow-inner">
                    <div className="text-center">
                      <span className="text-2xl font-black font-serif text-stone-900">{qrisPercentage}%</span>
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">QRIS</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-800" />
                      <span className="font-bold text-stone-800">QRIS Digital</span>
                    </div>
                    <span className="font-mono font-bold text-stone-900">
                      Rp {totalQris.toLocaleString('id-ID')} ({qrisPercentage}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="font-bold text-stone-800">Tunai Kasir</span>
                    </div>
                    <span className="font-mono font-bold text-stone-900">
                      Rp {totalCash.toLocaleString('id-ID')} ({cashPercentage}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* LAPORAN TRANSAKSI KESELURUHAN (TABLE RINCI OWNER) */}
          <div id="laporan" className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-150 pb-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
                  Rincian Transaksi Keseluruhan
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Rincian harian: omset tunai, nontunai, pajak 10%, dan performa pertumbuhan
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value as any)}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-800 bg-white"
                >
                  <option value="today">Hari Ini</option>
                  <option value="week">7 Hari Terakhir</option>
                  <option value="month">Bulan Ini</option>
                  <option value="all">Semua Periode</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs table-auto">
                <thead className="bg-[#faf9f6] text-stone-400 uppercase text-[10px] font-bold border-b border-stone-150 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">TANGGAL</th>
                    <th className="py-3 px-3 text-center">TRANSAKSI</th>
                    <th className="py-3 px-4">TOTAL TUNAI</th>
                    <th className="py-3 px-4">TOTAL NONTUNAI (QRIS)</th>
                    <th className="py-3 px-4">PAJAK 10%</th>
                    <th className="py-3 px-4">TOTAL PENDAPATAN</th>
                    <th className="py-3 px-4 text-right">% PERUBAHAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-800 text-[11px]">
                  {dailyReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400 text-xs">
                        Belum ada transaksi terbayar pada periode ini.
                      </td>
                    </tr>
                  ) : dailyReports.map((row, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-stone-900 whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono font-bold">
                          {row.ordersCount} order
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-stone-700 whitespace-nowrap">
                        Rp {row.cash.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-stone-700 whitespace-nowrap">
                        Rp {row.nonCash.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-500 whitespace-nowrap">
                        Rp {row.tax.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-stone-900 text-xs whitespace-nowrap">
                        Rp {row.total.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                        <span className={row.change.startsWith('+') ? 'text-emerald-700' : 'text-rose-600'}>
                          {row.change}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
