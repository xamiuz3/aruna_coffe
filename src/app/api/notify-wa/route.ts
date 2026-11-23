import { NextResponse } from 'next/server';
import { Order } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const order: Order = await req.json();

    const waApiUrl = process.env.WA_GATEWAY_API_URL;
    const waApiKey = process.env.WA_GATEWAY_API_KEY;
    const waGroupId = process.env.WA_KASIR_GROUP_ID;

    // Susun pesan WhatsApp ramah kasir
    const itemList = (order.items || [])
      .map((item, idx) => {
        const variants = item.selected_variants?.map(v => `${v.chosen.name}`).join(', ');
        const notes = item.notes ? ` (Catatan: ${item.notes})` : '';
        return `${idx + 1}. *${item.item_name}* x${item.quantity}${variants ? ` [${variants}]` : ''}${notes} - Rp${item.subtotal.toLocaleString('id-ID')}`;
      })
      .join('\n');

    const paymentText = order.payment_method === 'qris' 
      ? `*QRIS BRI Statis* ${order.payment_proof_url ? '(Bukti sudah diupload)' : '(Menunggu upload)'}`
      : `*Bayar di Kasir* (Tunai / EDC)`;

    const orderTypeText = order.order_type === 'reservation' 
      ? `🗓️ *RESERVASI MEJA* (${order.reservation_date || 'Jadwal belum ditentukan'}, ${order.guest_count} Tamu)` 
      : `🍽️ *DINE-IN LANGSUNG*`;

    const message = `🔔 *ORDER BARU MASUK!* 🔔
-----------------------------------------
No Order : *#${order.order_number}*
Tipe     : ${orderTypeText}
Lokasi   : *${order.table_number}*
Pemesan  : *${order.customer_name}* ${order.customer_phone ? `(${order.customer_phone})` : ''}
Metode   : ${paymentText}
-----------------------------------------
*Rincian Menu:*
${itemList}

-----------------------------------------
*TOTAL BAYAR : Rp${order.total_amount.toLocaleString('id-ID')}*
${order.notes ? `📝 Catatan Tamu: _${order.notes}_\n` : ''}
⚠️ *Kasir:* Mohon verifikasi & catat manual ke POS Majoo.`;

    if (!waApiUrl || !waApiKey || !waGroupId) {
      // Jika kredensial belum diisi, kita log di console server
      console.log('--- SIMULASI NOTIFIKASI WA KASIR ---');
      console.log(message);
      return NextResponse.json({
        success: true,
        mode: 'simulated',
        message: 'WA credentials not configured, simulated in server logs.',
        preview: message,
      });
    }

    // Request ke provider WhatsApp (Contoh implementasi standar Fonnte)
    const response = await fetch(waApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': waApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: waGroupId,
        message: message,
        url: order.payment_proof_url || undefined,
      }),
    });

    const result = await response.json().catch(() => ({}));

    return NextResponse.json({
      success: response.ok,
      result,
    });
  } catch (error: unknown) {
    console.error('WhatsApp notify error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
