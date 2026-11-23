// src/lib/realtime.ts
// Sistem Sinkronisasi Pesanan Real-Time (Cross-Tab BroadcastChannel + Cross-Device Server Relay + Supabase Realtime)

import { Order } from './types';
import { supabase, isSupabaseConfigured } from './supabase/client';

export type RealtimeOrderEvent = 
  | { type: 'NEW_ORDER'; order: Order }
  | { type: 'UPDATE_ORDER'; order: Order }
  | { type: 'SYNC_ORDERS'; orders: Order[] };

type OrderListener = (event: RealtimeOrderEvent) => void;

class RealtimeOrderManager {
  private listeners: Set<OrderListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isSubscribedSupabase: boolean = false;
  private knownOrderIds: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel('aruna_realtime_orders');
          this.broadcastChannel.onmessage = (ev: MessageEvent<RealtimeOrderEvent>) => {
            if (ev.data && ev.data.type) {
              this.notifyListeners(ev.data);
            }
          };
        }
      } catch (err) {
        console.warn('BroadcastChannel not supported or error:', err);
      }
    }
  }

  /**
   * Broadcast pesanan baru ke seluruh tab dan server relay
   */
  broadcastNewOrder(order: Order): void {
    const event: RealtimeOrderEvent = { type: 'NEW_ORDER', order };
    this.knownOrderIds.add(order.id);
    this.notifyListeners(event);

    // Kirim ke tab lain di browser yang sama
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch {}
    }

    // Kirim ke server relay agar perangkat lain (misal kasir di PC/tablet) langsung tahu
    if (typeof window !== 'undefined') {
      try {
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        }).catch(err => console.warn('Relay post order error:', err));
      } catch {}
    }
  }

  /**
   * Broadcast pembaruan pesanan (misal konfirmasi status oleh kasir)
   */
  broadcastOrderUpdate(order: Order): void {
    const event: RealtimeOrderEvent = { type: 'UPDATE_ORDER', order };
    this.notifyListeners(event);

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch {}
    }

    if (typeof window !== 'undefined') {
      try {
        fetch('/api/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: order.id, status: order.status, majoo_recorded: order.majoo_recorded }),
        }).catch(err => console.warn('Relay patch order error:', err));
      } catch {}
    }
  }

  /**
   * Daftarkan listener notifikasi pesanan di komponen
   */
  subscribe(listener: OrderListener): () => void {
    this.listeners.add(listener);
    this.initSupabaseRealtime();

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: RealtimeOrderEvent) {
    this.listeners.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error('Error in order listener:', err);
      }
    });
  }

  /**
   * Inisialisasi Supabase Realtime jika Supabase telah dikonfigurasi
   */
  private initSupabaseRealtime() {
    if (this.isSubscribedSupabase || !isSupabaseConfigured || !supabase || typeof window === 'undefined') {
      return;
    }

    try {
      this.isSubscribedSupabase = true;
      const channel = supabase
        .channel('realtime_orders_channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            const newOrder = payload.new as Order;
            if (newOrder && !this.knownOrderIds.has(newOrder.id)) {
              this.knownOrderIds.add(newOrder.id);
              this.notifyListeners({ type: 'NEW_ORDER', order: newOrder });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            const updatedOrder = payload.new as Order;
            if (updatedOrder) {
              this.notifyListeners({ type: 'UPDATE_ORDER', order: updatedOrder });
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Failed to subscribe to Supabase Realtime channel:', err);
    }
  }
}

export const RealtimeOrders = new RealtimeOrderManager();
