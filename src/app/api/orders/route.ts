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
    global.__aruna_server_orders__ = isSupabaseConfigured ? [] : [...INITIAL_ORDERS];
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
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });
      }
    } catch (err) {
      console.warn('Supabase get orders server error:', err);
    }
    return NextResponse.json({ success: true, orders: [] }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  }

  const memoryOrders = getServerOrders();
  return NextResponse.json({ success: true, orders: memoryOrders }, {
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

    // Jika Supabase aktif, coba insert/upsert di Supabase juga
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('orders').upsert({
          id: newOrder.id,
          order_number: newOrder.order_number,
          table_number: newOrder.table_number,
          customer_name: newOrder.customer_name,
          customer_phone: newOrder.customer_phone,
          order_type: newOrder.order_type,
          reservation_date: newOrder.reservation_date,
          guest_count: newOrder.guest_count,
          status: newOrder.status,
          shift: newOrder.shift,
          payment_method: newOrder.payment_method,
          payment_proof_url: newOrder.payment_proof_url,
          subtotal: newOrder.subtotal,
          total_amount: newOrder.total_amount,
          notes: newOrder.notes,
          majoo_recorded: newOrder.majoo_recorded || false,
        });

        if (newOrder.items && newOrder.items.length > 0) {
          const itemsToInsert = newOrder.items.map(i => ({
            id: i.id,
            order_id: newOrder.id,
            menu_item_id: i.menu_item_id,
            item_name: i.item_name,
            price: i.price,
            quantity: i.quantity,
            subtotal: i.subtotal,
            notes: i.notes,
          }));
          await supabase.from('order_items').upsert(itemsToInsert);
        }
      } catch (sbErr) {
        console.warn('Supabase server relay sync error:', sbErr);
      }
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
