'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CafeStore } from '@/lib/store';
import { Order } from '@/lib/types';
import { RealtimeOrders } from '@/lib/realtime';
import { 
  CheckCircle2, 
  Clock, 
  UtensilsCrossed, 
  XCircle, 
  ArrowLeft,
  Check,
  ChefHat,
  Sparkles,
  RefreshCw,
  QrCode
} from 'lucide-react';

function OrderStatusContent() {
  const params = useParams();
  const orderId = (params?.id as string) || '';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    // Simpan orderId ke riwayat sesi customer
    if (typeof window !== 'undefined') {
      try {
        CafeStore.addCustomerOrderId(orderId);
      } catch {}
    }

    async function fetchOrder() {
      const res = await CafeStore.getOrderById(orderId);
      if (!res) {
        CafeStore.removeCustomerOrderId(orderId);
      }
      setOrder(res);
      setLoading(false);
    }
    fetchOrder();

    const unsubscribeRealtime = RealtimeOrders.subscribe((event) => {
      if (event.type === 'DELETE_ORDER' && event.orderId === orderId) {
        CafeStore.removeCustomerOrderId(orderId);
        setOrder(null);
      } else if (event.type === 'UPDATE_ORDER' && event.order.id === orderId) {
        setOrder(event.order);
      }
    });

    // Polling setiap 2 detik & listener update real-time
    const interval = setInterval(fetchOrder, 2000);
    const handleStoreUpdate = () => fetchOrder();
    window.addEventListener('arjuna_store_updated', handleStoreUpdate);

    return () => {
      clearInterval(interval);
      unsubscribeRealtime();
      window.removeEventListener('arjuna_store_updated', handleStoreUpdate);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-[#c87a58] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-stone-600">Memuat status pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center justify-center p-4 text-center">
        <p className="text-sm font-bold text-stone-800">Pesanan tidak ditemukan</p>
        <Link href="/order" className="mt-3 text-xs text-[#c87a58] font-bold underline">
          Kembali ke Menu
        </Link>
      </div>
    );
  }

  // Hitung tahapan aktif (1: Menunggu, 2: Dikonfirmasi, 3: Dimasak, 4: Selesai)
  const getStepProgress = () => {
    switch (order.status) {
      case 'pending_payment': return 1;
      case 'confirmed': return 2;
      case 'processing': return 3;
      case 'completed': return 4;
      case 'cancelled': return -1;
      default: return 1;
    }
  };

  const currentStep = getStepProgress();

  const getStatusBadge = () => {
    switch (order.status) {
      case 'pending_payment':
        return {
          icon: <Clock className="w-5 h-5 text-amber-600" />,
          title: 'Menunggu Verifikasi Kasir',
          desc: order.payment_method === 'qris' 
            ? 'Bukti QRIS Anda sedang diperiksa oleh kasir. Pesanan akan segera diteruskan ke dapur.' 
            : 'Silakan menuju meja kasir untuk menyelesaikan pembayaran tunai.',
          bg: 'bg-amber-50 border-amber-200 text-amber-950',
          badgeText: 'Menunggu Cek Kasir',
        };
      case 'confirmed':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-blue-600" />,
          title: 'Pesanan Diterima Kasir',
          desc: 'Pesanan telah di-ACC kasir dan antrean sudah masuk ke meja dapur.',
          bg: 'bg-blue-50 border-blue-200 text-blue-950',
          badgeText: 'Terkonfirmasi',
        };
      case 'processing':
        return {
          icon: <ChefHat className="w-5 h-5 text-orange-600" />,
          title: 'Sedang Dimasak di Dapur',
          desc: 'Chef Aruna sedang meracik & memasak hidangan pesanan Anda.',
          bg: 'bg-orange-50 border-orange-200 text-orange-950',
          badgeText: 'Sedang Dimasak',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          title: 'Pesanan Selesai & Disajikan',
          desc: 'Hidangan Anda telah selesai disiapkan dan diantar ke meja. Selamat menikmati!',
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
          badgeText: 'Selesai',
        };
      case 'cancelled':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-600" />,
          title: 'Pesanan Dibatalkan',
          desc: 'Pesanan ini telah dibatalkan oleh kasir atau customer.',
          bg: 'bg-rose-50 border-rose-200 text-rose-950',
          badgeText: 'Dibatalkan',
        };
      default:
        return {
          icon: <Clock className="w-5 h-5 text-stone-600" />,
          title: 'Status Memproses',
          desc: '',
          bg: 'bg-stone-100 border-stone-200 text-stone-800',
          badgeText: 'Memproses',
        };
    }
  };

  const badge = getStatusBadge();

  const stepsList = [
    { num: 1, title: 'Menunggu', sub: 'Kasir / QRIS' },
    { num: 2, title: 'Diterima', sub: 'Masuk Antrean' },
    { num: 3, title: 'Dimasak', sub: 'Chef Dapur' },
    { num: 4, title: 'Selesai', sub: 'Siap Disajikan' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-stone-900 p-4 sm:p-6 max-w-lg mx-auto pb-20">
      
      {/* Top Navbar Back */}
      <div className="flex items-center justify-between pb-3.5 border-b border-stone-200">
        <Link 
          href={`/order?table=${encodeURIComponent(order.table_number)}`} 
          className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-950 font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Menu</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Live Tracker</span>
        </div>
      </div>

      {/* Header Info Pesanan */}
      <div className="mt-4 bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] text-stone-400 font-bold uppercase block tracking-wider">Nomor Pesanan</span>
          <span className="font-mono font-black text-sm text-[#c87a58] block mt-0.5">#{order.order_number}</span>
          <span className="text-[11px] text-stone-500 block mt-0.5">{order.customer_name}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-stone-400 font-bold uppercase block tracking-wider">Meja</span>
          <span className="font-black text-xs bg-stone-900 text-white px-2.5 py-1 rounded-lg inline-block mt-1 shadow-2xs">
            {order.table_number}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* STEPPER PROGRESS TRACKER (4 TAHAPAN JELAS)               */}
      {/* ======================================================== */}
      {currentStep !== -1 && (
        <div className="mt-4 bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-4 text-center">
            Progres Pesanan Anda
          </span>

          <div className="relative flex items-center justify-between">
            {/* Background Line */}
            <div className="absolute top-4 left-6 right-6 h-1 bg-stone-100 -z-0" />
            
            {/* Active Colored Line */}
            <div 
              className="absolute top-4 left-6 h-1 bg-[#c87a58] transition-all duration-500 -z-0"
              style={{
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '33%' : currentStep === 3 ? '66%' : 'calc(100% - 3rem)'
              }}
            />

            {/* 4 Step Nodes */}
            {stepsList.map((st) => {
              const isPast = currentStep > st.num;
              const isCurrent = currentStep === st.num;

              return (
                <div key={st.num} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-xs ${
                    isPast 
                      ? 'bg-emerald-600 text-white border-2 border-emerald-600'
                      : isCurrent
                        ? 'bg-[#c87a58] text-white border-2 border-[#c87a58] ring-4 ring-[#c87a58]/20 scale-110'
                        : 'bg-white text-stone-300 border-2 border-stone-200'
                  }`}>
                    {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : st.num}
                  </div>
                  <span className={`text-[10px] font-bold mt-2 tracking-tight ${
                    isCurrent ? 'text-[#c87a58]' : isPast ? 'text-stone-800' : 'text-stone-400'
                  }`}>
                    {st.title}
                  </span>
                  <span className="text-[8px] text-stone-400 font-medium hidden sm:block">
                    {st.sub}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STATUS CARD UTAMA */}
      <div className={`mt-4 p-4 sm:p-5 rounded-2xl border ${badge.bg} flex items-start gap-3.5 shadow-2xs`}>
        <div className="p-2 rounded-xl bg-white shadow-2xs shrink-0">{badge.icon}</div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-black text-sm leading-tight text-stone-900">{badge.title}</h2>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/80 border border-current">
              {badge.badgeText}
            </span>
          </div>
          <p className="text-xs mt-1.5 leading-relaxed text-stone-700 font-medium">{badge.desc}</p>
        </div>
      </div>

      {/* DETAIL PESANAN */}
      <div className="mt-4 bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 text-xs">
          <span className="text-stone-400 font-bold uppercase text-[10px]">Tipe Pesanan</span>
          <span className="font-bold text-stone-900">
            {order.order_type === 'reservation' ? `Reservasi (${order.reservation_date || '-'})` : 'Dine-In (Makan di Tempat)'}
          </span>
        </div>
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 text-xs">
          <span className="text-stone-400 font-bold uppercase text-[10px]">Metode Pembayaran</span>
          <span className="font-bold text-stone-900">
            {order.payment_method === 'qris' ? 'QRIS BRI Merchant' : 'Bayar Kasir Saat Tiba'}
          </span>
        </div>

        {/* LIST MENU */}
        <div className="pt-2 space-y-2.5">
          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
            Menu Dipesan ({order.items?.length || 0} item):
          </h4>
          <div className="divide-y divide-stone-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs py-2">
                <div>
                  <p className="font-bold text-stone-900">
                    <span className="text-[#c87a58] font-black mr-1">{item.quantity}x</span>
                    {item.item_name}
                  </p>
                  {item.selected_variants && item.selected_variants.length > 0 && (
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {item.selected_variants.map(v => `${v.chosen.name}`).join(', ')}
                    </p>
                  )}
                  {item.notes && <p className="text-[11px] text-amber-700 italic mt-0.5">Catatan: {item.notes}</p>}
                </div>
                <span className="font-mono font-bold text-stone-800 text-xs whitespace-nowrap">
                  Rp {item.subtotal.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 flex justify-between items-center text-sm font-bold border-t border-stone-200">
          <span className="text-stone-700">Total Tagihan</span>
          <span className="text-base font-serif font-black text-[#c87a58]">
            Rp {order.total_amount.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Tombol Pesan Menu Tambahan */}
      <div className="mt-5 text-center">
        <Link
          href={`/order?table=${encodeURIComponent(order.table_number)}`}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <UtensilsCrossed className="w-4 h-4 text-amber-400" />
          <span>Pesan Menu Tambahan</span>
        </Link>
      </div>

    </div>
  );
}

export default function OrderStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-4 text-xs text-stone-500">Memuat status pesanan...</div>}>
      <OrderStatusContent />
    </Suspense>
  );
}
