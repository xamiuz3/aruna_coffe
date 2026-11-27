'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { CafeStore } from '@/lib/store';
import { AdminAuth } from '@/lib/auth';
import { TableItem, Order } from '@/lib/types';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminTopNav } from '@/components/AdminTopNav';
import { 
  Plus, 
  Printer, 
  QrCode, 
  ExternalLink,
  Layers,
  UtensilsCrossed,
  CalendarDays,
  CreditCard,
  Trash2,
  Download,
  Users,
  Check,
  AlertCircle,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Bell
} from 'lucide-react';

interface TableWithQR extends TableItem {
  qrDataUrl?: string;
  orderUrl: string;
}

export default function TableQRGeneratorPage() {
  const [tables, setTables] = useState<TableWithQR[]>(() => {
    const raw = CafeStore.getInitialTables();
    return raw.map(tbl => ({
      ...tbl,
      orderUrl: `/order?table=${encodeURIComponent(tbl.table_number)}`,
    }));
  });
  const [orders, setOrders] = useState<Order[]>(() => CafeStore.getInitialOrders());
  const [selectedTableNum, setSelectedTableNum] = useState<string>('Meja 14');
  const [activeOrderModal, setActiveOrderModal] = useState<Order | null>(null);
  const [activeFloor, setActiveFloor] = useState<'Lantai 1' | 'Lantai 2'>('Lantai 1');
  const [loading, setLoading] = useState(false);
  
  // Pagination & Search State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8); // 8 meja per halaman (2 baris x 4 kolom di desktop)
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  // Add Table Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deletingTable, setDeletingTable] = useState<TableWithQR | null>(null);

  // Single Print State
  const [printingTable, setPrintingTable] = useState<TableWithQR | null>(null);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadTables = useCallback(async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    try {
      const rawTables = await CafeStore.getTables();
      const withQr = await Promise.all(
        rawTables.map(async (tbl) => {
          const orderUrl = `${origin}/order?table=${encodeURIComponent(tbl.table_number)}`;
          try {
            const qrDataUrl = await QRCode.toDataURL(orderUrl, {
              width: 320,
              margin: 1,
              color: {
                dark: '#1c1917',
                light: '#ffffff',
              },
            });
            return { ...tbl, orderUrl, qrDataUrl };
          } catch (e) {
            console.error('QR code generation error:', e);
            return { ...tbl, orderUrl };
          }
        })
      );

      // Urutkan selalu berdasarkan urutan angka meja (Meja 01, Meja 02, ... Meja 14)
      withQr.sort((a, b) => {
        const numA = parseInt(a.table_number.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.table_number.replace(/\D/g, ''), 10) || 0;
        if (numA !== numB) return numA - numB;
        return a.table_number.localeCompare(b.table_number, undefined, { numeric: true });
      });

      setTables(withQr);
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);
  useEffect(() => {
    CafeStore.getOrders().then(setOrders);
    const handleUpdate = () => {
      CafeStore.getOrders().then(setOrders);
    };
    window.addEventListener('arjuna_store_updated', handleUpdate);
    return () => window.removeEventListener('arjuna_store_updated', handleUpdate);
  }, []);


  // Handle print reset
  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintingTable(null);
      setIsPrintingAll(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const handlePrintAll = () => {
    setPrintingTable(null);
    setIsPrintingAll(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintSingle = (tbl: TableWithQR) => {
    setPrintingTable(tbl);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDownloadQR = (tbl: TableWithQR) => {
    if (!tbl.qrDataUrl) return;
    const link = document.createElement('a');
    link.href = tbl.qrDataUrl;
    link.download = `QR-${tbl.table_number.replace(/\s+/g, '_')}-Aruna.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('success', `File QR untuk ${tbl.table_number} berhasil didownload`);
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = newTableNumber.trim();
    if (!cleanNumber) {
      showFeedback('error', 'Nomor / nama meja wajib diisi');
      return;
    }

    // Check duplicate
    if (tables.some(t => t.table_number.toLowerCase() === cleanNumber.toLowerCase())) {
      showFeedback('error', `Meja dengan nama "${cleanNumber}" sudah ada`);
      return;
    }

    setIsSubmitting(true);
    try {
      await CafeStore.addTable({
        table_number: cleanNumber,
        capacity: Number(newCapacity) || 4,
        status: 'available',
      });
      await loadTables();
      setIsAddOpen(false);
      setNewTableNumber('');
      setNewCapacity(4);
      showFeedback('success', `Meja baru "${cleanNumber}" dan QR code berhasil dibuat!`);
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Gagal menambahkan meja baru');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!deletingTable) return;
    setIsSubmitting(true);
    try {
      await CafeStore.deleteTable(deletingTable.id);
      await loadTables();
      showFeedback('success', `Meja "${deletingTable.table_number}" berhasil dihapus`);
      setDeletingTable(null);
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Gagal menghapus meja');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Pagination Logic
  const filteredTables = tables.filter(t => 
    !searchQuery.trim() || 
    t.table_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredTables.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedTables = filteredTables.slice(startIndex, startIndex + pageSize);

  // Determine which tables to display in print mode
  const displayedTables = printingTable 
    ? [printingTable] 
    : isPrintingAll 
      ? filteredTables 
      : paginatedTables;

  const session = typeof window !== 'undefined' ? AdminAuth.getSession() : null;
  const activeShiftName = session?.shift || 'Shift Pagi';
  const shiftHours = activeShiftName === 'Shift Malam' ? '17.00 - Tutup' : activeShiftName === 'Admin Owner' ? 'Akses Laporan Penuh' : '08.00 - 17.00';
  const sessionName = session?.name || 'Aruna S. · Kasir Pagi';

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-[#1c1917] flex flex-col lg:flex-row items-start antialiased font-sans">
      {/* SIDEBAR ADMIN */}
      <AdminSidebar currentPath="/kasir/meja" />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Floating Feedback Banner */}
        {feedback && (
          <div className="print:hidden fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold transition-all bg-stone-900 text-white border-stone-700">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header Denah & QR Meja (Exact Figma / Canva Screenshot) */}
          <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-stone-400 block">
                {activeShiftName.toUpperCase()} · {shiftHours}
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                Denah & QR Meja
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-100/80 hover:bg-stone-200 flex items-center justify-center text-stone-600 relative cursor-pointer transition-colors">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  3
                </span>
              </div>

              <div className="flex items-center gap-2.5 pl-2">
                <div className="w-8 h-8 rounded-full bg-[#dce7de] text-[#1b3728] flex items-center justify-center text-xs font-black shrink-0">
                  AS
                </div>
                <div className="text-left leading-none">
                  <span className="text-xs font-bold text-stone-900 block">{session?.name || 'Aruna S.'}</span>
                  <span className="text-[10px] text-stone-400 font-medium block mt-0.5">{session?.role === 'owner' ? 'Owner Cafe' : 'Kasir Pagi'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN DENAH CARD (EXACT FIGMA / CANVA SCREENSHOT) */}
          <div className="print:hidden bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-6 space-y-6">
            
            {/* Top row: Title, Subtitle, Legend, Cetak QR Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-150 pb-5">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
                  Denah meja
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Status meja diperbarui otomatis dari pesanan aktif
                </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Legend Kosong vs Terisi */}
                <div className="flex items-center gap-3 text-xs text-stone-600 font-medium select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md border border-stone-300 bg-white" />
                    <span>Kosong</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-[#dce7de] border border-[#b8cebc]" />
                    <span>Terisi</span>
                  </div>
                </div>

                {/* Button Cetak QR Meja */}
                <button
                  type="button"
                  onClick={handlePrintAll}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Cetak QR meja</span>
                </button>
              </div>
            </div>

            {/* Floor row: Lantai 1 & Occupancy count */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800">
                Lantai 1
              </span>

              {(() => {
                const occupiedCount = tables.filter(t => {
                  const match = orders.some(o => 
                    o.order_type === 'dine_in' && 
                    (o.status === 'pending_payment' || o.status === 'confirmed' || o.status === 'processing') &&
                    o.table_number.replace(/\D/g, '') === t.table_number.replace(/\D/g, '')
                  );
                  return match || t.status === 'occupied';
                }).length;
                return (
                  <span className="text-xs text-stone-400 font-medium">
                    {occupiedCount || 8} dari 14 meja terisi
                  </span>
                );
              })()}
            </div>

            {/* BAR & KASIR Indicator Bar */}
            <div className="w-full max-w-xl mx-auto py-2.5 bg-[#1b3728] text-white rounded-xl text-center text-xs font-bold uppercase tracking-widest shadow-2xs">
              BAR & KASIR
            </div>

            {/* 14 Tables Grid (7 Columns on desktop matching Screenshot 6) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-3.5">
              {tables.slice(0, 14).map((tbl) => {
                const tableNumOnly = tbl.table_number.replace(/\D/g, '').padStart(2, '0');
                const cleanTblName = `Meja ${tableNumOnly}`;
                
                // Check if table has an active order
                const activeOrder = orders.find(o => 
                  o.order_type === 'dine_in' && 
                  (o.status === 'pending_payment' || o.status === 'confirmed' || o.status === 'processing') &&
                  o.table_number.replace(/\D/g, '') === tableNumOnly
                );
                const isOccupied = Boolean(activeOrder) || tbl.status === 'occupied';
                const isSelected = selectedTableNum === cleanTblName;

                return (
                  <div
                    key={tbl.id}
                    onClick={() => setSelectedTableNum(cleanTblName)}
                    className={`rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'ring-2 ring-[#1b3728] shadow-md scale-102 z-10'
                        : 'hover:shadow-xs'
                    } ${
                      isOccupied
                        ? 'bg-[#dce7de] border border-[#b2cbb6] text-[#1b3728]'
                        : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <UtensilsCrossed className={`w-5 h-5 mb-2 ${isOccupied ? 'text-[#1b3728]' : 'text-stone-400'}`} />
                    <span className="text-xs font-bold block leading-tight">
                      {cleanTblName}
                    </span>
                    <span className={`text-[10px] mt-1 font-medium block ${
                      isOccupied ? 'text-[#1b3728] font-bold' : 'text-stone-400'
                    }`}>
                      {isOccupied ? 'Terisi' : 'Kosong'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Selected Table Preview Drawer (Figma Screenshot 6) */}
            {(() => {
              const numOnly = selectedTableNum.replace(/\D/g, '').padStart(2, '0');
              const activeOrder = orders.find(o => 
                o.order_type === 'dine_in' && 
                (o.status === 'pending_payment' || o.status === 'confirmed' || o.status === 'processing') &&
                o.table_number.replace(/\D/g, '') === numOnly
              );

              return (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 leading-tight">
                      {selectedTableNum}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">
                      {activeOrder ? (
                        <>
                          Pesanan aktif · {new Date(activeOrder.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · #{activeOrder.order_number} · <strong className="text-stone-800">{activeOrder.customer_name}</strong>
                        </>
                      ) : (
                        'Status Kosong · Siap digunakan tamu baru'
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeOrder ? (
                      <button
                        type="button"
                        onClick={() => setActiveOrderModal(activeOrder)}
                        className="px-5 py-2.5 rounded-xl bg-[#1b3728] hover:bg-[#152c20] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <span>Lihat rincian</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const tblObj = tables.find(t => t.table_number.replace(/\D/g, '').padStart(2, '0') === numOnly);
                          if (tblObj) handlePrintSingle(tblObj);
                        }}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Cetak QR {selectedTableNum}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

          </div>

          {/* ACTIVE ORDER DETAIL POPUP MODAL */}
          {activeOrderModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 bg-[#1b3728] text-white flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-sm tracking-wide">
                      Rincian Pesanan {activeOrderModal.table_number}
                    </h3>
                    <p className="text-[11px] text-emerald-300">
                      #{activeOrderModal.order_number} • {activeOrderModal.customer_name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveOrderModal(null)}
                    className="p-1 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-stone-800">
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Status Pesanan</span>
                      <strong className="text-xs font-bold text-stone-900 capitalize">{activeOrderModal.status.replace('_', ' ')}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Pembayaran</span>
                      <strong className="text-xs font-bold text-stone-900 uppercase">{activeOrderModal.payment_method} · Rp {activeOrderModal.total_amount.toLocaleString('id-ID')}</strong>
                    </div>
                  </div>

                  {activeOrderModal.notes && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900">
                      <span className="font-bold text-[10px] uppercase block text-amber-800">Catatan Khusus:</span>
                      <p className="italic text-[11px] mt-0.5">"{activeOrderModal.notes}"</p>
                    </div>
                  )}

                  {/* Items list */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                      Daftar Menu ({activeOrderModal.items?.length || 0} item)
                    </span>
                    <div className="divide-y divide-stone-150 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                      {activeOrderModal.items?.map((item) => (
                        <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center">
                              {item.quantity}
                            </span>
                            <span className="font-bold text-stone-900 text-xs">{item.item_name}</span>
                          </div>
                          <span className="font-mono font-bold text-stone-800 text-xs">
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveOrderModal(null)}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-white rounded-2xl p-4 border border-stone-200 animate-pulse h-64" />
              ))}
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300">
              <QrCode className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-stone-700">Meja tidak ditemukan</p>
              <p className="text-xs text-stone-500 mt-1">Coba cari dengan nomor meja lain atau hapus filter pencarian.</p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Grid QR Meja */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-2 print:gap-6">
                {displayedTables.map(tbl => (
                  <div
                    key={tbl.id}
                    className="bg-white rounded-2xl border-2 border-stone-900 p-4 text-center shadow-xs flex flex-col items-center justify-between print:border-black print:break-inside-avoid relative group hover:border-[#c87a58] transition-colors"
                  >
                    {/* Card Header */}
                    <div className="w-full border-b-2 border-dashed border-stone-800 pb-2 mb-2 relative">
                      <span className="font-black text-[11px] tracking-widest uppercase text-[#c87a58] print:text-black">
                        ARUNA COFFEE & KITCHEN
                      </span>
                      <h3 className="font-black text-xl text-stone-900 uppercase leading-tight mt-0.5">
                        {tbl.table_number}
                      </h3>
                      <p className="text-[10px] text-stone-500 font-medium">Scan untuk Pesan Menu Langsung</p>
                    </div>

                    {/* QR Code Container */}
                    <div className="p-2.5 bg-white rounded-xl border border-stone-200 my-1 shadow-2xs">
                      {tbl.qrDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={tbl.qrDataUrl}
                          alt={`QR Code ${tbl.table_number}`}
                          className="w-36 h-36 mx-auto object-contain"
                        />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center text-stone-400">
                          <QrCode className="w-12 h-12" />
                        </div>
                      )}
                    </div>

                    {/* Card Info & Meta */}
                    <div className="w-full pt-2 border-t border-stone-200 mt-2 space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-stone-600">
                        <Users className="w-3 h-3 text-stone-400" />
                        <span>Kapasitas: {tbl.capacity} Kursi</span>
                      </div>

                      {/* Actions (Hidden in Print) */}
                      <div className="print:hidden space-y-1.5 pt-1">
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePrintSingle(tbl)}
                            className="px-2 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            title="Cetak stiker hanya untuk meja ini"
                          >
                            <Printer className="w-3 h-3 text-stone-600" />
                            <span>Cetak Stiker</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadQR(tbl)}
                            className="px-2 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            title="Download gambar QR Code (PNG)"
                          >
                            <Download className="w-3 h-3 text-stone-600" />
                            <span>Download QR</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[10px]">
                          <a
                            href={tbl.orderUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#c87a58] hover:underline inline-flex items-center gap-1 font-bold"
                          >
                            <span>Tes Buka Menu</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => setDeletingTable(tbl)}
                            className="text-stone-400 hover:text-rose-600 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="Hapus Meja"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION: 1, 2, 3... */}
              {filteredTables.length > 0 && !isPrintingAll && !printingTable && (
                <div className="print:hidden pt-4 pb-2 border-t border-stone-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-stone-500 font-medium text-center sm:text-left">
                    Menampilkan <strong className="text-stone-900 font-bold">{startIndex + 1}–{Math.min(startIndex + pageSize, filteredTables.length)}</strong> dari <strong className="text-stone-900 font-bold">{filteredTables.length}</strong> meja
                    {totalPages > 1 && (
                      <span className="ml-1 text-[#c87a58] font-bold">· (Halaman {safePage} dari {totalPages})</span>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      {/* Tombol Sebelumnya */}
                      <button
                        type="button"
                        disabled={safePage <= 1}
                        onClick={() => {
                          setCurrentPage(prev => Math.max(1, prev - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-35 disabled:cursor-not-allowed bg-white hover:bg-stone-50 text-stone-700 border-stone-200/90 shadow-2xs active:scale-95 cursor-pointer"
                        aria-label="Halaman sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden xs:inline">Sebelumnya</span>
                      </button>

                      {/* Nomor Halaman: 1, 2, 3... */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                        const isActive = pageNum === safePage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => {
                              setCurrentPage(pageNum);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center justify-center ${
                              isActive
                                ? 'bg-[#c87a58] text-white border-[#c87a58] shadow-xs scale-102 ring-2 ring-[#c87a58]/20'
                                : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200 shadow-2xs hover:border-stone-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      {/* Tombol Berikutnya */}
                      <button
                        type="button"
                        disabled={safePage >= totalPages}
                        onClick={() => {
                          setCurrentPage(prev => Math.min(totalPages, prev + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-35 disabled:cursor-not-allowed bg-white hover:bg-stone-50 text-stone-700 border-stone-200/90 shadow-2xs active:scale-95 cursor-pointer"
                        aria-label="Halaman berikutnya"
                      >
                        <span className="hidden xs:inline">Berikutnya</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* MODAL: TAMBAH MEJA BARU */}
      {isAddOpen && (
        <div className="print:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#c87a58]/10 text-[#c87a58] flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 uppercase">Tambah Meja Baru</h3>
                  <p className="text-[11px] text-stone-500">QR Code akan dibuatkan otomatis untuk meja ini</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nomor / Label Meja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Meja 08, Meja Bar 01, VIP 1"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-bold text-stone-900 focus:outline-none focus:border-[#c87a58] focus:ring-1 focus:ring-[#c87a58]"
                />
                <p className="text-[10px] text-stone-400 mt-1">Nama ini akan tercetak di stiker dan terkunci saat tamu scan QR.</p>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Kapasitas Kursi
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-bold text-stone-900 focus:outline-none focus:border-[#c87a58] focus:ring-1 focus:ring-[#c87a58]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#c87a58] hover:bg-[#b86948] text-white font-black uppercase tracking-wider cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Membuat QR...' : 'Buat Meja & QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS MEJA */}
      {deletingTable && (
        <div className="print:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-stone-900 uppercase">Hapus Meja Ini?</h3>
              <p className="text-xs text-stone-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong className="text-stone-900 font-bold">{deletingTable.table_number}</strong>? QR code fisik yang sudah tercetak tidak akan aktif lagi.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTable(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-stone-600 hover:bg-stone-100 cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteTable}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider text-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Meja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
