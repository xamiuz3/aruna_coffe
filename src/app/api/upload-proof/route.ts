import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    // 1. Jika Supabase aktif, simpan ke Storage bucket 'payment_proofs'
    if (isSupabaseConfigured && supabase) {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { data, error } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('payment_proofs')
          .getPublicUrl(fileName);

        return NextResponse.json({
          url: publicUrlData.publicUrl,
        });
      }
    }

    // 2. Fallback jika Supabase belum dihubungkan: konversi ke base64 Data URL
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl,
    });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload gagal' },
      { status: 500 }
    );
  }
}
