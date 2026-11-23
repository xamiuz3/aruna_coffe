-- ============================================================
-- SKEMA DATABASE CAFE SELF-ORDER & INVENTORY (SUPABASE POSTGRESQL)
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
  CREATE TYPE order_status_type AS ENUM ('pending_payment', 'confirmed', 'processing', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_type AS ENUM ('cashier', 'qris');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_kind_type AS ENUM ('dine_in', 'reservation');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE mutation_kind_type AS ENUM ('order_deduction', 'manual_adjustment', 'restock');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABEL MEJA (TABLES)
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number VARCHAR(20) NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 4,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. KATEGORI MENU (MENU CATEGORIES)
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);

-- 6. VARIAN MENU (Level pedas, topping, dll)
CREATE TABLE IF NOT EXISTS public.menu_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  group_name VARCHAR(100) NOT NULL, -- e.g. "Level Pedas", "Pilihan Pangsit", "Suhu"
  is_required BOOLEAN NOT NULL DEFAULT true,
  options JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{"name": "Level 1", "extra_price": 0}, {"name": "Level 2", "extra_price": 1000}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_menu_variants_item ON public.menu_variants(menu_item_id);

-- 7. MASTER BAHAN BAKU (RAW MATERIALS)
CREATE TABLE IF NOT EXISTS public.raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL UNIQUE,
  unit VARCHAR(20) NOT NULL, -- 'gram', 'ml', 'pcs', 'porsi'
  current_stock NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  minimum_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. RESEP MENU (BILL OF MATERIALS)
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  quantity_required NUMERIC(12,3) NOT NULL CHECK (quantity_required > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(menu_item_id, raw_material_id)
);
CREATE INDEX IF NOT EXISTS idx_recipes_menu ON public.recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_material ON public.recipes(raw_material_id);

-- 9. TABEL ORDER (TRANSAKSI)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  table_number VARCHAR(20) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(30),
  order_type order_kind_type NOT NULL DEFAULT 'dine_in',
  reservation_date TIMESTAMPTZ,
  guest_count INT DEFAULT 1,
  status order_status_type NOT NULL DEFAULT 'pending_payment',
  payment_method payment_method_type NOT NULL,
  payment_proof_url TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  majoo_recorded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_table ON public.orders(table_number);

-- 10. ITEM DETAIL ORDER
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  item_name VARCHAR(150) NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(12,2) NOT NULL,
  selected_variants JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 11. MUTASI STOK BAHAN BAKU
CREATE TABLE IF NOT EXISTS public.stock_mutations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  change_amount NUMERIC(12,3) NOT NULL, -- negatif jika berkurang, positif jika bertambah
  mutation_type mutation_kind_type NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_stock_mutations_material ON public.stock_mutations(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_stock_mutations_order ON public.stock_mutations(order_id);

-- ============================================================
-- 12. FUNGSI STORED PROCEDURE: SELESAIKAN ORDER & POTONG STOK
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_and_deduct_stock(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_recipe RECORD;
  v_deduct_amount NUMERIC(12,3);
  v_already_completed BOOLEAN;
BEGIN
  -- Ambil data order
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan');
  END IF;

  IF v_order.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan sudah selesai sebelumnya');
  END IF;

  -- Update status order jadi 'completed'
  UPDATE public.orders 
  SET status = 'completed', updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id;

  -- Loop setiap item di pesanan
  FOR v_item IN 
    SELECT * FROM public.order_items WHERE order_id = p_order_id
  LOOP
    IF v_item.menu_item_id IS NOT NULL THEN
      -- Loop resep bahan baku untuk menu terkait
      FOR v_recipe IN 
        SELECT * FROM public.recipes WHERE menu_item_id = v_item.menu_item_id
      LOOP
        v_deduct_amount := (v_recipe.quantity_required * v_item.quantity);

        -- Kurangi stok bahan baku (mencegah minus di bawah 0 dengan GREATEST)
        UPDATE public.raw_materials
        SET current_stock = GREATEST(0, current_stock - v_deduct_amount),
            updated_at = timezone('utc'::text, now())
        WHERE id = v_recipe.raw_material_id;

        -- Catat riwayat mutasi
        INSERT INTO public.stock_mutations (
          raw_material_id,
          order_id,
          change_amount,
          mutation_type,
          notes
        ) VALUES (
          v_recipe.raw_material_id,
          p_order_id,
          -v_deduct_amount,
          'order_deduction',
          'Pemotongan otomatis order #' || v_order.order_number || ' (' || v_item.item_name || ' x' || v_item.quantity || ')'
        );
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Pesanan #' || v_order.order_number || ' berhasil diselesaikan dan stok bahan baku terpotong'
  );
END;
$$;

-- ============================================================
-- 13. ENABLE REALTIME
-- ============================================================
-- Mengaktifkan realtime agar tab kasir auto-update saat ada pesanan baru
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============================================================
-- 14. SEED DATA CONTOH
-- ============================================================
-- Data Meja
INSERT INTO public.tables (table_number, capacity, status) VALUES
  ('Meja 01', 4, 'available'),
  ('Meja 02', 4, 'available'),
  ('Meja 03', 2, 'available'),
  ('Meja 04', 6, 'available'),
  ('Meja 05', 4, 'available'),
  ('Meja 06', 4, 'available'),
  ('Meja 07', 8, 'available'),
  ('Meja 08', 4, 'available')
ON CONFLICT (table_number) DO NOTHING;

-- Data Kategori
INSERT INTO public.menu_categories (id, name, slug, display_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Mie & Makanan Utama', 'mie-utama', 1),
  ('22222222-2222-2222-2222-222222222222', 'Dimsum & Gorengan', 'dimsum-gorengan', 2),
  ('33333333-3333-3333-3333-333333333333', 'Minuman Segar', 'minuman', 3)
ON CONFLICT (slug) DO NOTHING;

-- Data Bahan Baku
INSERT INTO public.raw_materials (id, name, unit, current_stock, minimum_stock) VALUES
  ('a1111111-0000-0000-0000-000000000001', 'Porsi Mie Basah', 'porsi', 150, 20),
  ('a1111111-0000-0000-0000-000000000002', 'Cabai Rawit Giling', 'gram', 3000, 500),
  ('a1111111-0000-0000-0000-000000000003', 'Minyak Bumbu Gurih', 'ml', 5000, 1000),
  ('a1111111-0000-0000-0000-000000000004', 'Daging Ayam Cincang Tabur', 'gram', 2500, 300),
  ('a1111111-0000-0000-0000-000000000005', 'Kulit Pangsit Goreng', 'pcs', 400, 50),
  ('a1111111-0000-0000-0000-000000000006', 'Adonan Siomay Ayam', 'pcs', 180, 30),
  ('a1111111-0000-0000-0000-000000000007', 'Udang Keju Siap Goreng', 'pcs', 120, 20),
  ('a1111111-0000-0000-0000-000000000008', 'Sirup Teh Melati', 'ml', 4000, 500),
  ('a1111111-0000-0000-0000-000000000009', 'Susu Kental Manis', 'ml', 3000, 400)
ON CONFLICT (name) DO NOTHING;

-- Data Menu
INSERT INTO public.menu_items (id, category_id, name, description, price, is_available) VALUES
  ('m1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Mie Aruna Gurih (Asin)', 'Mie kenyal pedas asin khas dengan taburan ayam cincang dan 2 pangsit goreng renyah.', 12500, true),
  ('m1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Mie Aruna Manis (Kecap)', 'Mie kenyal bumbu pedas manis kecap istimewa, ayam tabur, dan pangsit renyah.', 12500, true),
  ('m1111111-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Udang Keju Goreng (3 pcs)', 'Olahan udang juicy dengan lelehan keju mozarella di tengah, digoreng garing emas.', 11000, true),
  ('m1111111-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Siomay Dimsum Ayam (3 pcs)', 'Siomay kukus lembut daging ayam asli dengan saus cocolan khas.', 10500, true),
  ('m1111111-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 'Es Teh Tarik Spesial', 'Teh racikan wangi dipadu susu lembut dan es batu segar.', 8500, true),
  ('m1111111-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', 'Es Teh Manis Jumbo', 'Es teh melati segar porsi jumbo pelepas dahaga pedas.', 6000, true)
ON CONFLICT (id) DO NOTHING;

-- Data Varian (Level Pedas)
INSERT INTO public.menu_variants (menu_item_id, group_name, is_required, options) VALUES
  ('m1111111-0000-0000-0000-000000000001', 'Level Pedas', true, '[
    {"name": "Level 0 (Tidak Pedas)", "extra_price": 0},
    {"name": "Level 1 (Pedas Santai)", "extra_price": 0},
    {"name": "Level 2 (Pedas Sedang)", "extra_price": 0},
    {"name": "Level 3 (Pedas Nampol)", "extra_price": 1000},
    {"name": "Level 4 (Pedas Ekstrem)", "extra_price": 2000}
  ]'::jsonb),
  ('m1111111-0000-0000-0000-000000000002', 'Level Pedas', true, '[
    {"name": "Level 0 (Tidak Pedas)", "extra_price": 0},
    {"name": "Level 1 (Pedas Santai)", "extra_price": 0},
    {"name": "Level 2 (Pedas Sedang)", "extra_price": 0},
    {"name": "Level 3 (Pedas Nampol)", "extra_price": 1000},
    {"name": "Level 4 (Pedas Ekstrem)", "extra_price": 2000}
  ]'::jsonb)
ON CONFLICT DO NOTHING;

-- Data Resep (BOM - Pemotongan Bahan Baku Otomatis)
-- Mie Asin butuh: 1 Porsi Mie, 15ml Minyak, 20g Ayam Tabur, 2 Kulit Pangsit, 10g Cabai Rawit
INSERT INTO public.recipes (menu_item_id, raw_material_id, quantity_required) VALUES
  ('m1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 1),    -- 1 Porsi Mie
  ('m1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000003', 15),   -- 15 ml Minyak Bumbu
  ('m1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000004', 20),   -- 20 gram Ayam Cincang
  ('m1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000005', 2),    -- 2 pcs Pangsit
  ('m1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000002', 12),   -- 12 gram Cabai
  -- Mie Manis
  ('m1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 1),
  ('m1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000003', 15),
  ('m1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000004', 20),
  ('m1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000005', 2),
  ('m1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000002', 12),
  -- Udang Keju (3 pcs)
  ('m1111111-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000007', 3),
  -- Siomay Dimsum (3 pcs)
  ('m1111111-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000006', 3),
  -- Es Teh Tarik Spesial (50ml Teh + 40ml Susu)
  ('m1111111-0000-0000-0000-000000000005', 'a1111111-0000-0000-0000-000000000008', 50),
  ('m1111111-0000-0000-0000-000000000005', 'a1111111-0000-0000-0000-000000000009', 40),
  -- Es Teh Manis Jumbo (80ml Teh)
  ('m1111111-0000-0000-0000-000000000006', 'a1111111-0000-0000-0000-000000000008', 80)
ON CONFLICT (menu_item_id, raw_material_id) DO NOTHING;
