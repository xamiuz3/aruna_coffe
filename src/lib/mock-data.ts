import { MenuItem, MenuCategory, TableItem, RawMaterial, RecipeItem, Order, PaymentSettings } from './types';

export const INITIAL_PAYMENT_SETTINGS: PaymentSettings = {
  qris_image_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226670016ID.CO.BRI.WWW0118936000020112345678021500000000000000051020002030035802ID5913ARUNA COFFEE6007JAKARTA5405880005802ID6304ABCD',
  qris_merchant_name: 'ARUNA COFFEE & KITCHEN',
  bank_name: 'Bank BRI',
  bank_account_number: '0123-01-000456-53-8',
  bank_account_holder: 'ARUNA COFFEE INDONESIA',
  payment_instructions: 'Silakan scan QRIS BRI Merchant atau transfer bank sesuai total pesanan. Upload bukti transfer atau langsung konfirmasi ke kasir saat pesanan diproses.',
};

export const INITIAL_TABLES: TableItem[] = [
  { id: 'tbl-01', table_number: 'Meja 01', capacity: 4, status: 'available' },
  { id: 'tbl-02', table_number: 'Meja 02', capacity: 4, status: 'available' },
  { id: 'tbl-03', table_number: 'Meja 03', capacity: 2, status: 'available' },
  { id: 'tbl-04', table_number: 'Meja 04', capacity: 6, status: 'available' },
  { id: 'tbl-05', table_number: 'Meja 05', capacity: 4, status: 'available' },
  { id: 'tbl-06', table_number: 'Meja 06', capacity: 4, status: 'available' },
  { id: 'tbl-07', table_number: 'Meja 07', capacity: 8, status: 'available' },
  { id: 'tbl-08', table_number: 'Meja 08', capacity: 4, status: 'available' },
  { id: 'tbl-09', table_number: 'Meja 09', capacity: 4, status: 'available' },
  { id: 'tbl-10', table_number: 'Meja 10', capacity: 6, status: 'available' },
  { id: 'tbl-11', table_number: 'Meja 11', capacity: 2, status: 'available' },
  { id: 'tbl-12', table_number: 'Meja 12', capacity: 4, status: 'available' },
  { id: 'tbl-13', table_number: 'Meja 13', capacity: 4, status: 'available' },
  { id: 'tbl-14', table_number: 'Meja 14', capacity: 4, status: 'available' },
];

export const INITIAL_CATEGORIES: MenuCategory[] = [
  { id: 'cat-all', name: 'Semua', slug: 'semua', display_order: 0 },
  { id: 'cat-kopi', name: 'Kopi', slug: 'kopi', display_order: 1 },
  { id: 'cat-nonkopi', name: 'Non-Kopi', slug: 'non-kopi', display_order: 2 },
  { id: 'cat-makanan', name: 'Makanan', slug: 'makanan', display_order: 3 },
  { id: 'cat-pastry', name: 'Pastry & Snack', slug: 'pastry', display_order: 4 },
];

export const INITIAL_RAW_MATERIALS: RawMaterial[] = [
  { id: 'rm-espresso', name: 'Biji Kopi Arabika House Blend', unit: 'gram', current_stock: 3000, minimum_stock: 500 },
  { id: 'rm-freshmilk', name: 'Fresh Milk Pasteurisasi', unit: 'ml', current_stock: 8000, minimum_stock: 1500 },
  { id: 'rm-caramel', name: 'Sirup Salted Caramel', unit: 'ml', current_stock: 2000, minimum_stock: 300 },
  { id: 'rm-matcha', name: 'Matcha Ceremonial Powder', unit: 'gram', current_stock: 150, minimum_stock: 200 },
  { id: 'rm-beras', name: 'Beras Jasmine Organik', unit: 'gram', current_stock: 10000, minimum_stock: 2000 },
  { id: 'rm-telur', name: 'Telur Ayam Omega', unit: 'pcs', current_stock: 18, minimum_stock: 24 },
  { id: 'rm-croissant', name: 'Adonan Croissant Butter', unit: 'pcs', current_stock: 0, minimum_stock: 10 },
  { id: 'rm-mie', name: 'Porsi Mie Basah Homemade', unit: 'porsi', current_stock: 15, minimum_stock: 20 },
  { id: 'rm-cabai', name: 'Cabai Rawit Giling', unit: 'gram', current_stock: 2500, minimum_stock: 500 },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'menu-caramel-cloud',
    category_id: 'cat-kopi',
    name: 'Caramel Cloud',
    description: 'Espresso, susu & caramel sirup dengan foam lembut gurih manis.',
    price: 28000,
    image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    variants: [
      {
        id: 'var-temp-1',
        menu_item_id: 'menu-caramel-cloud',
        group_name: 'Pilihan Suhu',
        is_required: true,
        options: [
          { name: 'Iced (Dingin)', extra_price: 0 },
          { name: 'Hot (Panas)', extra_price: 0 },
        ],
      },
      {
        id: 'var-sweet-1',
        menu_item_id: 'menu-caramel-cloud',
        group_name: 'Level Gula',
        is_required: true,
        options: [
          { name: 'Normal Sweet', extra_price: 0 },
          { name: 'Less Sweet (50%)', extra_price: 0 },
        ],
      },
    ],
  },
  {
    id: 'menu-matcha-kyoto',
    category_id: 'cat-nonkopi',
    name: 'Matcha Kyoto',
    description: 'Matcha ceremonial murni dipadu susu creamy segar lembut.',
    price: 32000,
    image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    variants: [
      {
        id: 'var-temp-2',
        menu_item_id: 'menu-matcha-kyoto',
        group_name: 'Pilihan Suhu',
        is_required: true,
        options: [
          { name: 'Iced (Dingin)', extra_price: 0 },
          { name: 'Hot (Panas)', extra_price: 0 },
        ],
      },
    ],
  },
  {
    id: 'menu-nasgor-aruna',
    category_id: 'cat-makanan',
    name: 'Nasi Goreng Aruna',
    description: 'Nasi goreng racikan rempah istimewa, telur mata sapi & acar renyah.',
    price: 35000,
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    variants: [
      {
        id: 'var-pedas-nasgor',
        menu_item_id: 'menu-nasgor-aruna',
        group_name: 'Level Pedas',
        is_required: true,
        options: [
          { name: 'Tidak Pedas', extra_price: 0 },
          { name: 'Sedang', extra_price: 0 },
          { name: 'Pedas Nampol', extra_price: 2000 },
        ],
      },
      {
        id: 'var-telur-nasgor',
        menu_item_id: 'menu-nasgor-aruna',
        group_name: 'Tingkat Kematangan Telur',
        is_required: false,
        options: [
          { name: 'Setengah Matang', extra_price: 0 },
          { name: 'Matang Sempurna', extra_price: 0 },
        ],
      },
    ],
  },
  {
    id: 'menu-croissant',
    category_id: 'cat-pastry',
    name: 'Butter Croissant',
    description: 'French butter pastry renyah di luar, lembut berlapis di dalam.',
    price: 24000,
    image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
    is_available: false, // Ditampilkan segera hadir lagi seperti di gambar
  },
  {
    id: 'menu-mie-aruna',
    category_id: 'cat-makanan',
    name: 'Mie Pedas Aruna Special',
    description: 'Mie kenyal pedas gurih taburan ayam cincang & pangsit goreng.',
    price: 22000,
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    variants: [
      {
        id: 'var-mie-pedas',
        menu_item_id: 'menu-mie-aruna',
        group_name: 'Level Pedas',
        is_required: true,
        options: [
          { name: 'Level 1 (Santai)', extra_price: 0 },
          { name: 'Level 2 (Sedang)', extra_price: 0 },
          { name: 'Level 3 (Ekstrem)', extra_price: 2000 },
        ],
      },
    ],
  },
  {
    id: 'menu-dimsum-aruna',
    category_id: 'cat-pastry',
    name: 'Siomay Dimsum Ayam (4 pcs)',
    description: 'Siomay kukus daging ayam gurih lembut disajikan dengan chili oil.',
    price: 18000,
    image_url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&auto=format&fit=crop&q=80',
    is_available: true,
  },
  {
    id: 'menu-kopisusu-aruna',
    category_id: 'cat-kopi',
    name: 'Kopi Susu Gula Aren',
    description: 'Espresso blend house khas Aruna dipadu susu segar & legitnya gula aren organik.',
    price: 22000,
    image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    variants: [
      {
        id: 'var-temp-kopisusu',
        menu_item_id: 'menu-kopisusu-aruna',
        group_name: 'Pilihan Suhu',
        is_required: true,
        options: [
          { name: 'Iced (Dingin)', extra_price: 0 },
          { name: 'Hot (Panas)', extra_price: 0 },
        ],
      },
      {
        id: 'var-sweet-kopisusu',
        menu_item_id: 'menu-kopisusu-aruna',
        group_name: 'Level Gula',
        is_required: true,
        options: [
          { name: 'Normal Aren', extra_price: 0 },
          { name: 'Less Sugar (50%)', extra_price: 0 },
        ],
      },
    ],
  },
  {
    id: 'menu-americano-artisan',
    category_id: 'cat-kopi',
    name: 'Americano Double Shot',
    description: 'Double shot espresso arabika single origin dengan crema kaya dan aroma buah segar.',
    price: 20000,
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    variants: [
      {
        id: 'var-temp-americano',
        menu_item_id: 'menu-americano-artisan',
        group_name: 'Pilihan Suhu',
        is_required: true,
        options: [
          { name: 'Iced (Dingin)', extra_price: 0 },
          { name: 'Hot (Panas)', extra_price: 0 },
        ],
      },
    ],
  },
  {
    id: 'menu-berry-tea',
    category_id: 'cat-nonkopi',
    name: 'Berry Blossom Tea',
    description: 'Seduhan teh artisan bunga rosella, potongan buah strawberry dan mint segar.',
    price: 25000,
    image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    variants: [
      {
        id: 'var-sweet-berry',
        menu_item_id: 'menu-berry-tea',
        group_name: 'Level Gula',
        is_required: true,
        options: [
          { name: 'Normal Sweet', extra_price: 0 },
          { name: 'Less Sweet', extra_price: 0 },
        ],
      },
    ],
  },
  {
    id: 'menu-choco-lava',
    category_id: 'cat-nonkopi',
    name: 'Choco Hazelnut Velvet',
    description: 'Dark chocolate Belgia kental dipadu sirup hazelnut panggang dan foam susu lembut.',
    price: 28000,
    image_url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    variants: [
      {
        id: 'var-temp-choco',
        menu_item_id: 'menu-choco-lava',
        group_name: 'Pilihan Suhu',
        is_required: true,
        options: [
          { name: 'Iced (Dingin)', extra_price: 0 },
          { name: 'Hot (Panas)', extra_price: 0 },
        ],
      },
    ],
  },
  {
    id: 'menu-beef-teriyaki',
    category_id: 'cat-makanan',
    name: 'Rice Bowl Beef Teriyaki',
    description: 'Irisan daging sapi US shortplate saus teriyaki manis gurih dengan telur onsen.',
    price: 38000,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    is_available: true,
  },
  {
    id: 'menu-croffle-crunch',
    category_id: 'cat-pastry',
    name: 'Croffle Salted Caramel',
    description: 'Croissant press renyah wangi butter disiram salted caramel & taburan biskuit lotus.',
    price: 26000,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    is_available: true,
  },
];

export const INITIAL_RECIPES: RecipeItem[] = [
  // Caramel Cloud
  { id: 'rec-1', menu_item_id: 'menu-caramel-cloud', raw_material_id: 'rm-espresso', quantity_required: 18 }, // 18g kopi
  { id: 'rec-2', menu_item_id: 'menu-caramel-cloud', raw_material_id: 'rm-freshmilk', quantity_required: 150 }, // 150ml susu
  { id: 'rec-3', menu_item_id: 'menu-caramel-cloud', raw_material_id: 'rm-caramel', quantity_required: 20 }, // 20ml sirup
  // Matcha Kyoto
  { id: 'rec-4', menu_item_id: 'menu-matcha-kyoto', raw_material_id: 'rm-matcha', quantity_required: 12 }, // 12g matcha
  { id: 'rec-5', menu_item_id: 'menu-matcha-kyoto', raw_material_id: 'rm-freshmilk', quantity_required: 180 }, // 180ml susu
  // Nasi Goreng Aruna
  { id: 'rec-6', menu_item_id: 'menu-nasgor-aruna', raw_material_id: 'rm-beras', quantity_required: 150 }, // 150g beras
  { id: 'rec-7', menu_item_id: 'menu-nasgor-aruna', raw_material_id: 'rm-telur', quantity_required: 1 }, // 1 butir telur
  // Croissant
  { id: 'rec-8', menu_item_id: 'menu-croissant', raw_material_id: 'rm-croissant', quantity_required: 1 },
  // Mie Pedas Aruna
  { id: 'rec-9', menu_item_id: 'menu-mie-aruna', raw_material_id: 'rm-mie', quantity_required: 1 },
  { id: 'rec-10', menu_item_id: 'menu-mie-aruna', raw_material_id: 'rm-cabai', quantity_required: 15 },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    order_number: 'ORD-20261123-014',
    table_number: 'Meja 14',
    customer_name: 'Pandu Wirayuda',
    customer_phone: '081234567890',
    order_type: 'dine_in',
    guest_count: 2,
    status: 'pending_payment',
    payment_method: 'qris',
    payment_proof_url: '', // Belum upload bukti untuk pengujian
    subtotal: 88000,
    total_amount: 88000,
    notes: 'Kopi less sugar ya kak',
    majoo_recorded: false,
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    items: [
      {
        id: 'item-1',
        order_id: 'ord-101',
        menu_item_id: 'menu-caramel-cloud',
        item_name: 'Caramel Cloud',
        price: 28000,
        quantity: 2,
        subtotal: 56000,
        selected_variants: [
          { group_name: 'Pilihan Suhu', chosen: { name: 'Iced (Dingin)', extra_price: 0 } },
        ],
      },
      {
        id: 'item-2',
        order_id: 'ord-101',
        menu_item_id: 'menu-matcha-kyoto',
        item_name: 'Matcha Kyoto',
        price: 32000,
        quantity: 1,
        subtotal: 32000,
      },
    ],
  },
  {
    id: 'res-201',
    order_number: 'RSV-20261123-001',
    table_number: 'Meja 02',
    customer_name: 'Budi Santoso',
    customer_phone: '081298765432',
    order_type: 'reservation',
    reservation_date: `${new Date().toISOString().split('T')[0]}T19:00`,
    guest_count: 4,
    status: 'confirmed',
    payment_method: 'qris',
    payment_proof_url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500',
    subtotal: 70000,
    total_amount: 70000,
    notes: 'Reservasi makan malam keluarga, tolong siapkan di meja tengah.',
    majoo_recorded: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    items: [
      {
        id: 'item-res-1',
        order_id: 'res-201',
        menu_item_id: 'menu-nasgor-aruna',
        item_name: 'Nasi Goreng Aruna',
        price: 35000,
        quantity: 2,
        subtotal: 70000,
      }
    ],
  },
  // ==========================================
  // ARSIP / HISTORI TRANSAKSI HARI-HARI SEBELUMNYA
  // ==========================================
  {
    id: 'ord-hist-101',
    order_number: 'ORD-20261122-045',
    table_number: 'Meja 08',
    customer_name: 'Raka Mahendra',
    customer_phone: '081234567891',
    order_type: 'dine_in',
    guest_count: 3,
    status: 'completed',
    payment_method: 'cashier',
    subtotal: 126000,
    total_amount: 126000,
    notes: 'Pedes sedang semua',
    majoo_recorded: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // Kemarin
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    items: [
      {
        id: 'item-hist-1',
        order_id: 'ord-hist-101',
        menu_item_id: 'menu-mie-aruna',
        item_name: 'Mie Pedas Aruna Special',
        price: 22000,
        quantity: 3,
        subtotal: 66000,
      },
      {
        id: 'item-hist-2',
        order_id: 'ord-hist-101',
        menu_item_id: 'menu-caramel-cloud',
        item_name: 'Caramel Cloud',
        price: 28000,
        quantity: 2,
        subtotal: 56000,
      },
      {
        id: 'item-hist-3',
        order_id: 'ord-hist-101',
        menu_item_id: 'menu-dimsum-aruna',
        item_name: 'Dimsum Mentai',
        price: 24000,
        quantity: 1,
        subtotal: 24000,
      }
    ],
  },
  {
    id: 'res-hist-102',
    order_number: 'RSV-20261122-008',
    table_number: 'Meja 12',
    customer_name: 'Citra & Keluarga',
    customer_phone: '081298765439',
    order_type: 'reservation',
    reservation_date: '2026-11-22T19:00',
    guest_count: 6,
    status: 'completed',
    payment_method: 'qris',
    payment_proof_url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500',
    subtotal: 140000,
    total_amount: 140000,
    down_payment: 100000,
    notes: 'Dekat colokan listrik, acara ulang tahun santai',
    majoo_recorded: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1 - 1000 * 60 * 120).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    items: [
      {
        id: 'item-hist-4',
        order_id: 'res-hist-102',
        menu_item_id: 'menu-nasgor-aruna',
        item_name: 'Nasi Goreng Aruna',
        price: 35000,
        quantity: 4,
        subtotal: 140000,
      }
    ],
  },
  {
    id: 'ord-hist-103',
    order_number: 'ORD-20261121-022',
    table_number: 'Meja 03',
    customer_name: 'Bima Arya',
    customer_phone: '081298765421',
    order_type: 'dine_in',
    guest_count: 2,
    status: 'completed',
    payment_method: 'qris',
    payment_proof_url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500',
    subtotal: 58000,
    total_amount: 58000,
    notes: 'Kopi less sweet ya',
    majoo_recorded: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 hari lalu
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    items: [
      {
        id: 'item-hist-5',
        order_id: 'ord-hist-103',
        menu_item_id: 'menu-kopi-susu-aruna',
        item_name: 'Kopi Susu Gula Aren',
        price: 24000,
        quantity: 1,
        subtotal: 24000,
      },
      {
        id: 'item-hist-6',
        order_id: 'ord-hist-103',
        menu_item_id: 'menu-matcha-kyoto',
        item_name: 'Matcha Kyoto',
        price: 32000,
        quantity: 1,
        subtotal: 32000,
      }
    ],
  },
  {
    id: 'ord-hist-104',
    order_number: 'ORD-20261120-089',
    table_number: 'Meja 05',
    customer_name: 'Nadya Putri',
    customer_phone: '081298765444',
    order_type: 'dine_in',
    guest_count: 2,
    status: 'completed',
    payment_method: 'qris',
    payment_proof_url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500',
    subtotal: 75000,
    total_amount: 75000,
    notes: '',
    majoo_recorded: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 hari lalu
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    items: [
      {
        id: 'item-hist-7',
        order_id: 'ord-hist-104',
        menu_item_id: 'menu-kopi-susu-aruna',
        item_name: 'Kopi Susu Gula Aren',
        price: 24000,
        quantity: 2,
        subtotal: 48000,
      },
      {
        id: 'item-hist-8',
        order_id: 'ord-hist-104',
        menu_item_id: 'menu-croissant',
        item_name: 'Butter Croissant',
        price: 27000,
        quantity: 1,
        subtotal: 27000,
      }
    ],
  },
  {
    id: 'res-hist-105',
    order_number: 'RSV-20261118-004',
    table_number: 'Meja 18',
    customer_name: 'Dinda Maharani',
    customer_phone: '081399887766',
    order_type: 'reservation',
    reservation_date: '2026-11-18T18:30',
    guest_count: 6,
    status: 'completed',
    payment_method: 'qris',
    payment_proof_url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500',
    subtotal: 210000,
    total_amount: 210000,
    down_payment: 100000,
    notes: 'Meja smoking area dekat taman',
    majoo_recorded: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 hari lalu
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    items: [
      {
        id: 'item-hist-9',
        order_id: 'res-hist-105',
        menu_item_id: 'menu-nasgor-aruna',
        item_name: 'Nasi Goreng Aruna',
        price: 35000,
        quantity: 3,
        subtotal: 105000,
      },
      {
        id: 'item-hist-10',
        order_id: 'res-hist-105',
        menu_item_id: 'menu-mie-aruna',
        item_name: 'Mie Pedas Aruna Special',
        price: 22000,
        quantity: 3,
        subtotal: 66000,
      },
      {
        id: 'item-hist-11',
        order_id: 'res-hist-105',
        menu_item_id: 'menu-dimsum-aruna',
        item_name: 'Dimsum Mentai',
        price: 24000,
        quantity: 1,
        subtotal: 24000,
      }
    ],
  },
  {
    id: 'ord-hist-106',
    order_number: 'ORD-20261115-031',
    table_number: 'Meja 07',
    customer_name: 'Hendra Gunawan',
    customer_phone: '081722334455',
    order_type: 'dine_in',
    guest_count: 2,
    status: 'completed',
    payment_method: 'cashier',
    subtotal: 95000,
    total_amount: 95000,
    notes: 'Bayar tunai di kasir',
    majoo_recorded: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), // 8 hari lalu
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    items: [
      {
        id: 'item-hist-12',
        order_id: 'ord-hist-106',
        menu_item_id: 'menu-caramel-cloud',
        item_name: 'Caramel Cloud',
        price: 28000,
        quantity: 2,
        subtotal: 56000,
      },
      {
        id: 'item-hist-13',
        order_id: 'ord-hist-106',
        menu_item_id: 'menu-dimsum-aruna',
        item_name: 'Dimsum Mentai',
        price: 24000,
        quantity: 1,
        subtotal: 24000,
      }
    ],
  }
];
