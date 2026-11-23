'use client';

import React from 'react';
import { Order } from '@/lib/types';

interface ReceiptPrintProps {
  order: Order;
  cafeName?: string;
}

export const ReceiptPrint: React.FC<ReceiptPrintProps> = ({
  order,
  cafeName = 'ARUNA CAFEE'
}) => {
  return (
    <div id={`receipt-print-${order.id}`} className="hidden print:block print:w-[58mm] print:max-w-[80mm] print:p-2 print:text-black print:bg-white text-xs font-mono leading-tight">
      <div className="text-center pb-2 border-b border-dashed border-black">
        <h2 className="text-sm font-bold uppercase">{cafeName}</h2>
        <p className="text-[10px]">Aruna Cafee Self-Order</p>
        <p className="text-[10px]">Self-Order & Reservation</p>
      </div>

      <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span>No:</span>
          <span className="font-bold">{order.order_number}</span>
        </div>
        <div className="flex justify-between">
          <span>Meja:</span>
          <span className="font-bold text-sm uppercase">{order.table_number}</span>
        </div>
        <div className="flex justify-between">
          <span>Waktu:</span>
          <span>{new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
        </div>
        <div className="flex justify-between">
          <span>Tamu:</span>
          <span>{order.customer_name}</span>
        </div>
        <div className="flex justify-between">
          <span>Tipe:</span>
          <span className="uppercase">{order.order_type === 'reservation' ? 'Reservasi' : 'Dine In'}</span>
        </div>
      </div>

      {/* ITEMS */}
      <div className="py-2 border-b border-dashed border-black space-y-1.5 text-[11px]">
        {order.items?.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex justify-between font-semibold">
              <span className="truncate pr-1">{item.item_name}</span>
              <span>Rp{item.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-700">
              <span>{item.quantity} x Rp{item.price.toLocaleString('id-ID')}</span>
            </div>
            {item.selected_variants && item.selected_variants.length > 0 && (
              <div className="text-[10px] text-gray-600 pl-1">
                {item.selected_variants.map(v => `${v.group_name}: ${v.chosen.name}`).join(', ')}
              </div>
            )}
            {item.notes && (
              <div className="text-[10px] italic text-gray-600 pl-1">
                Catatan: {item.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* TOTAL & PAYMENT */}
      <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
        <div className="flex justify-between font-bold text-xs">
          <span>TOTAL:</span>
          <span>Rp{order.total_amount.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between">
          <span>Metode:</span>
          <span className="uppercase font-semibold">
            {order.payment_method === 'qris' ? 'QRIS BRI' : 'BAYAR KASIR'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="uppercase font-semibold">{order.status}</span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="pt-2 text-center text-[10px] space-y-1">
        {order.notes && (
          <p className="italic text-left bg-gray-100 p-1 mb-1">
            Note: {order.notes}
          </p>
        )}
        <p className="font-semibold">Terima Kasih atas Kunjungan Anda!</p>
        <p className="text-[9px]">Simpan struk ini sebagai bukti pemesanan.</p>
        <p className="text-[8px] pt-1">*** PRINTER IWARE THERMAL ***</p>
      </div>
    </div>
  );
};
