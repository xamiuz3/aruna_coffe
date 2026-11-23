// src/app/api/orders/route.ts
// Server-Side Realtime Order Relay & Shared In-Memory / Supabase Sync
import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_ORDERS } from '@/lib/mock-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Order } from '@/lib/types';

// In-memory server state
declare global {
  // eslint-disable-next-line no-var
  var __aruna_server_orders__: Order[] | undefined;
}

function getServerOrders(): Order[] {
  if (!global.__aruna_server_orders__) {
    global.__aruna_server_orders__ = [...INITIAL_ORDERS];
  }
  return global.__aruna_server_orders__;
}

export async function GET() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return NextResponse.json({ success: true, orders: data }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        });
      }
    } catch (err) {
      console.warn('Supabase get orders server error:', err);
    }
  }

  const orders = getServerOrders();
  return NextResponse.json({ success: true, orders }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const newOrder: Order = await req.json();
    if (!newOrder || !newOrder.id) {
      return NextResponse.json({ success: false, error: 'Data pesanan tidak valid' }, { status: 400 });
    }

    const currentOrders = getServerOrders();
    // Tambahkan di urutan paling awal jika belum ada
    const existingIndex = currentOrders.findIndex(o => o.id === newOrder.id);
    if (existingIndex >= 0) {
      currentOrders[existingIndex] = { ...currentOrders[existingIndex], ...newOrder };
    } else {
      currentOrders.unshift(newOrder);
    }

    return NextResponse.json({ success: true, order: newOrder }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (err) {
    console.error('Error saving order to server relay:', err);
    return NextResponse.json({ success: false, error: 'Gagal memproses pesanan di server' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, majoo_recorded } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pesanan wajib disertakan' }, { status: 400 });
    }

    const currentOrders = getServerOrders();
    const index = currentOrders.findIndex(o => o.id === id);
    if (index >= 0) {
      if (status !== undefined) currentOrders[index].status = status;
      if (majoo_recorded !== undefined) currentOrders[index].majoo_recorded = majoo_recorded;
      currentOrders[index].updated_at = new Date().toISOString();
      return NextResponse.json({ success: true, order: currentOrders[index] });
    }

    return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
  } catch (err) {
    console.error('Error updating order on server relay:', err);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui status di server' }, { status: 500 });
  }
}
