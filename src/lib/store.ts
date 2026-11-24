import {
  MenuItem,
  MenuCategory,
  TableItem,
  RawMaterial,
  RecipeItem,
  Order,
  OrderStatus,
  StockMutation,
  CartItem,
  PaymentSettings
} from './types';
import {
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_RAW_MATERIALS,
  INITIAL_RECIPES,
  INITIAL_TABLES
} from './mock-data';
import { supabase, isSupabaseConfigured } from './supabase/client';
import { RealtimeOrders } from './realtime';

const STORAGE_KEY_ORDERS = 'aruna_cafe_orders';
const STORAGE_KEY_MENU = 'aruna_cafe_menu_items';
const STORAGE_KEY_RAW = 'aruna_cafe_raw_materials';
const STORAGE_KEY_MUTATIONS = 'aruna_cafe_mutations';
const STORAGE_KEY_RECIPES = 'aruna_cafe_recipes';
const STORAGE_KEY_TABLES = 'aruna_cafe_tables';
const STORAGE_KEY_PAYMENT_SETTINGS = 'aruna_cafe_payment_settings';
const STORAGE_KEY_CATEGORIES = 'aruna_cafe_categories';

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  qris_image_url: '',
  qris_merchant_name: 'ARUNA COFFEE & KITCHEN',
  bank_name: 'Bank BRI',
  bank_account_number: '0123-01-004567-50-8',
  bank_account_holder: 'ARUNA COFFEE & KITCHEN',
  payment_instructions: 'Silakan scan QRIS di atas atau transfer ke rekening bank. Cantumkan nama pemesan pada berita transfer.',
};

// ========================================================
// HIGH-PERFORMANCE IN-MEMORY & SWR CACHE
// ========================================================
let memoryCacheMenu: { data: MenuItem[]; timestamp: number } | null = null;
let memoryCacheCats: { data: MenuCategory[]; timestamp: number } | null = null;
let memoryCacheTables: { data: TableItem[]; timestamp: number } | null = null;
let memoryCacheSettings: { data: PaymentSettings; timestamp: number } | null = null;
let memoryCacheOrders: { data: Order[]; timestamp: number } | null = null;
let memoryCacheRaw: { data: RawMaterial[]; timestamp: number } | null = null;
let memoryCacheRecipes: { data: RecipeItem[]; timestamp: number } | null = null;
let memoryCacheMutations: { data: StockMutation[]; timestamp: number } | null = null;

const CACHE_TTL_MS = 60 * 1000; // 60 detik cache di memori

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('arjuna_store_updated'));
  } catch (e) {
    console.error('Storage set error:', e);
  }
}

export const CafeStore = {
  // SYNC INITIALIZERS UNTUK 0-MILLISECOND INITIAL RENDER
  getInitialMenuItems(): MenuItem[] {
    if (memoryCacheMenu) return memoryCacheMenu.data;
    const stored = getStorage<MenuItem[] | null>(STORAGE_KEY_MENU, null);
    if (stored && stored.length > 0) return stored;
    return INITIAL_MENU_ITEMS;
  },

  getInitialCategories(): MenuCategory[] {
    if (memoryCacheCats) return memoryCacheCats.data;
    const stored = getStorage<MenuCategory[] | null>(STORAGE_KEY_CATEGORIES, null);
    if (stored && stored.length > 0) return stored;
    return INITIAL_CATEGORIES;
  },

  getInitialOrders(): Order[] {
    if (memoryCacheOrders) return memoryCacheOrders.data;
    return getStorage<Order[]>(STORAGE_KEY_ORDERS, []);
  },

  getInitialTables(): TableItem[] {
    if (memoryCacheTables) return memoryCacheTables.data;
    return getStorage<TableItem[]>(STORAGE_KEY_TABLES, INITIAL_TABLES);
  },

  getInitialPaymentSettings(): PaymentSettings {
    if (memoryCacheSettings) return memoryCacheSettings.data;
    return getStorage<PaymentSettings>(STORAGE_KEY_PAYMENT_SETTINGS, DEFAULT_PAYMENT_SETTINGS);
  },

  getInitialRawMaterials(): RawMaterial[] {
    if (memoryCacheRaw) return memoryCacheRaw.data;
    const stored = getStorage<RawMaterial[] | null>(STORAGE_KEY_RAW, null);
    if (stored && stored.length > 0) return stored;
    return INITIAL_RAW_MATERIALS;
  },

  getInitialRecipes(): RecipeItem[] {
    if (memoryCacheRecipes) return memoryCacheRecipes.data;
    const stored = getStorage<RecipeItem[] | null>(STORAGE_KEY_RECIPES, null);
    if (stored && stored.length > 0) return stored;
    return INITIAL_RECIPES;
  },

  getInitialStockMutations(): StockMutation[] {
    if (memoryCacheMutations) return memoryCacheMutations.data;
    return getStorage<StockMutation[]>(STORAGE_KEY_MUTATIONS, []);
  },

  // 0. PENGATURAN PEMBAYARAN (QRIS & BANK)
  async getPaymentSettings(forceRefresh = false): Promise<PaymentSettings> {
    const now = Date.now();
    if (!forceRefresh && memoryCacheSettings && (now - memoryCacheSettings.timestamp < CACHE_TTL_MS)) {
      return memoryCacheSettings.data;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('payment_settings').select('*').limit(1).single();
        if (!error && data) {
          const settings = data as PaymentSettings;
          memoryCacheSettings = { data: settings, timestamp: now };
          setStorage(STORAGE_KEY_PAYMENT_SETTINGS, settings);
          return settings;
        }
      } catch (err) {
        console.warn('Supabase getPaymentSettings error:', err);
      }
    }
    const fallback = getStorage<PaymentSettings>(STORAGE_KEY_PAYMENT_SETTINGS, DEFAULT_PAYMENT_SETTINGS);
    memoryCacheSettings = { data: fallback, timestamp: now };
    return fallback;
  },

  async updatePaymentSettings(settings: PaymentSettings): Promise<boolean> {
    memoryCacheSettings = { data: settings, timestamp: Date.now() };
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('payment_settings').upsert({ id: 'default', ...settings });
      } catch (err) {
        console.warn('Supabase update payment error:', err);
      }
    }
    setStorage(STORAGE_KEY_PAYMENT_SETTINGS, settings);
    return true;
  },

  // 1. MEJA
  async getTables(forceRefresh = false): Promise<TableItem[]> {
    const now = Date.now();
    if (!forceRefresh && memoryCacheTables && (now - memoryCacheTables.timestamp < CACHE_TTL_MS)) {
      return memoryCacheTables.data;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('tables').select('*');
        if (!error && data && data.length > 0) {
          const sorted = (data as TableItem[]).sort((a, b) => {
            const numA = parseInt(a.table_number.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.table_number.replace(/\D/g, ''), 10) || 0;
            if (numA !== numB) return numA - numB;
            return a.table_number.localeCompare(b.table_number, undefined, { numeric: true });
          });
          memoryCacheTables = { data: sorted, timestamp: now };
          setStorage(STORAGE_KEY_TABLES, sorted);
          return sorted;
        }
      } catch (err) {
        console.warn('Supabase getTables error:', err);
      }
    }
    const stored = getStorage<TableItem[]>(STORAGE_KEY_TABLES, INITIAL_TABLES);
    memoryCacheTables = { data: stored, timestamp: now };
    return stored;
  },

  async addTable(table: Omit<TableItem, 'id'>): Promise<TableItem> {
    const id = `tbl-${Date.now()}`;
    const newTable: TableItem = { id, ...table };
    memoryCacheTables = null;
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('tables').insert(newTable);
      } catch (err) {
        console.warn('Supabase insert table error:', err);
      }
    }
    const tables = getStorage<TableItem[]>(STORAGE_KEY_TABLES, INITIAL_TABLES);
    const updated = [...tables, newTable];
    setStorage(STORAGE_KEY_TABLES, updated);
    return newTable;
  },

  async deleteTable(tableId: string): Promise<boolean> {
    memoryCacheTables = null;
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('tables').delete().eq('id', tableId);
      } catch (err) {
        console.warn('Supabase delete table error:', err);
      }
    }
    const tables = getStorage<TableItem[]>(STORAGE_KEY_TABLES, INITIAL_TABLES);
    const updated = tables.filter(t => t.id !== tableId);
    setStorage(STORAGE_KEY_TABLES, updated);
    return true;
  },

  // 2. KATEGORI & MENU
  async getCategories(forceRefresh = false): Promise<MenuCategory[]> {
    const now = Date.now();
    if (!forceRefresh && memoryCacheCats && (now - memoryCacheCats.timestamp < CACHE_TTL_MS)) {
      return memoryCacheCats.data;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('menu_categories').select('*').order('display_order');
        if (!error && data && data.length > 0) {
          const cats = data as MenuCategory[];
          memoryCacheCats = { data: cats, timestamp: now };
          setStorage(STORAGE_KEY_CATEGORIES, cats);
          return cats;
        }
      } catch (err) {
        console.warn('Supabase getCategories error:', err);
      }
    }
    const fallback = getStorage<MenuCategory[]>(STORAGE_KEY_CATEGORIES, INITIAL_CATEGORIES);
    memoryCacheCats = { data: fallback, timestamp: now };
    return fallback;
  },

  async getMenuItems(forceRefresh = false): Promise<MenuItem[]> {
    const now = Date.now();
    if (!forceRefresh && memoryCacheMenu && (now - memoryCacheMenu.timestamp < CACHE_TTL_MS)) {
      return memoryCacheMenu.data;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*, variants:menu_variants(*)')
          .order('name');
        if (!error && data && data.length > 0) {
          const items = data as MenuItem[];
          memoryCacheMenu = { data: items, timestamp: now };
          setStorage(STORAGE_KEY_MENU, items);
          return items;
        }
      } catch (err) {
        console.warn('Supabase getMenuItems error, falling back to cache:', err);
      }
    }
    const stored = getStorage<MenuItem[]>(STORAGE_KEY_MENU, INITIAL_MENU_ITEMS);
    memoryCacheMenu = { data: stored, timestamp: now };
    return stored;
  },

  // 3. BAHAN BAKU & RESEP
  async getRawMaterials(forceRefresh = false): Promise<RawMaterial[]> {
    const now = Date.now();
    if (!forceRefresh && memoryCacheRaw && (now - memoryCacheRaw.timestamp < CACHE_TTL_MS)) {
      return memoryCacheRaw.data;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const queryPromise = supabase.from('raw_materials').select('*').order('name');
        const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error('timeout') }), 2500)
        );
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
        if (!error && data && data.length > 0) {
          const list = data as RawMaterial[];
          memoryCacheRaw = { data: list, timestamp: now };
          setStorage(STORAGE_KEY_RAW, list);
          return list;
        }
      } catch (err) {
        console.warn('Supabase getRawMaterials error:', err);
      }
    }
    const fallback = getStorage<RawMaterial[]>(STORAGE_KEY_RAW, INITIAL_RAW_MATERIALS);
    memoryCacheRaw = { data: fallback, timestamp: now };
    return fallback;
  },

  async addRawMaterial(material: Omit<RawMaterial, 'id'>): Promise<RawMaterial> {
    const id = `rm-${Date.now()}`;
    const created: RawMaterial = { id, ...material, updated_at: new Date().toISOString() };
    memoryCacheRaw = null;
    memoryCacheMutations = null;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('raw_materials').insert(created);
      } catch (err) {
        console.warn('Supabase insert raw material error:', err);
      }
    }

    const materials = getStorage<RawMaterial[]>(STORAGE_KEY_RAW, INITIAL_RAW_MATERIALS);
    const updated = [created, ...materials];
    setStorage(STORAGE_KEY_RAW, updated);

    // Catat log mutasi stok awal
    const currentMutations = getStorage<StockMutation[]>(STORAGE_KEY_MUTATIONS, []);
    const newMut: StockMutation = {
      id: `mut-${Date.now()}`,
      raw_material_id: id,
      change_amount: material.current_stock,
      mutation_type: 'restock',
      notes: `Pendaftaran bahan baku baru (${material.name})`,
      created_at: new Date().toISOString(),
      raw_material: created,
    };
    setStorage(STORAGE_KEY_MUTATIONS, [newMut, ...currentMutations]);

    return created;
  },

  async getRecipes(forceRefresh = false): Promise<RecipeItem[]> {
    const now = Date.now();
    if (!forceRefresh && memoryCacheRecipes && (now - memoryCacheRecipes.timestamp < CACHE_TTL_MS)) {
      return memoryCacheRecipes.data;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const queryPromise = supabase.from('recipes').select('*, raw_material:raw_materials(*)');
        const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error('timeout') }), 2500)
        );
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
        if (!error && data && data.length > 0) {
          const list = data as RecipeItem[];
          memoryCacheRecipes = { data: list, timestamp: now };
          setStorage(STORAGE_KEY_RECIPES, list);
          return list;
        }
      } catch (err) {
        console.warn('Supabase getRecipes error:', err);
      }
    }
    const recipes = getStorage<RecipeItem[]>(STORAGE_KEY_RECIPES, INITIAL_RECIPES);
    const materials = this.getInitialRawMaterials();
    const mapped = recipes.map(r => ({
      ...r,
      raw_material: materials.find(m => m.id === r.raw_material_id)
    }));
    memoryCacheRecipes = { data: mapped, timestamp: now };
    return mapped;
  },

  async addMenuItemWithRecipe(
    item: Omit<MenuItem, 'id'>,
    recipeInputs: { raw_material_id: string; quantity_required: number }[]
  ): Promise<MenuItem> {
    const menuId = `menu-${Date.now()}`;
    const newMenuItem: MenuItem = {
      id: menuId,
      ...item,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('menu_items').insert(newMenuItem);
      } catch (err) {
        console.warn('Supabase insert menu error:', err);
      }
    }

    memoryCacheMenu = null;
    const currentMenuItems = getStorage<MenuItem[]>(STORAGE_KEY_MENU, INITIAL_MENU_ITEMS);
    setStorage(STORAGE_KEY_MENU, [newMenuItem, ...currentMenuItems]);

    // Simpan resep BOM (wajib minimal 1 bahan)
    const newRecipes: RecipeItem[] = recipeInputs.map((r, i) => ({
      id: `rec-${Date.now()}-${i}`,
      menu_item_id: menuId,
      raw_material_id: r.raw_material_id,
      quantity_required: r.quantity_required,
    }));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('recipes').insert(newRecipes);
      } catch (err) {
        console.warn('Supabase insert recipes error:', err);
      }
    }

    memoryCacheMenu = null;
    memoryCacheRecipes = null;
    const currentRecipes = getStorage<RecipeItem[]>(STORAGE_KEY_RECIPES, INITIAL_RECIPES);
    setStorage(STORAGE_KEY_RECIPES, [...currentRecipes, ...newRecipes]);

    return newMenuItem;
  },

  async updateMenuItem(updatedItem: MenuItem): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('menu_items').update(updatedItem).eq('id', updatedItem.id);
      } catch (err) {
        console.warn('Supabase update menu error:', err);
      }
    }
    memoryCacheMenu = null;
    const currentMenuItems = getStorage<MenuItem[]>(STORAGE_KEY_MENU, INITIAL_MENU_ITEMS);
    const updatedList = currentMenuItems.map(m => m.id === updatedItem.id ? { ...m, ...updatedItem } : m);
    setStorage(STORAGE_KEY_MENU, updatedList);
    return true;
  },

  async deleteMenuItem(menuItemId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('recipes').delete().eq('menu_item_id', menuItemId);
        await supabase.from('menu_items').delete().eq('id', menuItemId);
      } catch (err) {
        console.warn('Supabase delete menu error:', err);
      }
    }
    memoryCacheMenu = null;
    const currentMenuItems = getStorage<MenuItem[]>(STORAGE_KEY_MENU, INITIAL_MENU_ITEMS);
    const updatedMenu = currentMenuItems.filter(m => m.id !== menuItemId);
    setStorage(STORAGE_KEY_MENU, updatedMenu);

    memoryCacheMenu = null;
    memoryCacheRecipes = null;
    const currentRecipes = getStorage<RecipeItem[]>(STORAGE_KEY_RECIPES, INITIAL_RECIPES);
    const updatedRecipes = currentRecipes.filter(r => r.menu_item_id !== menuItemId);
    setStorage(STORAGE_KEY_RECIPES, updatedRecipes);

    return true;
  },

  async updateMenuItemRecipe(
    menuItemId: string,
    recipeInputs: { raw_material_id: string; quantity_required: number }[]
  ): Promise<boolean> {
    const currentRecipes = getStorage<RecipeItem[]>(STORAGE_KEY_RECIPES, INITIAL_RECIPES);
    const filtered = currentRecipes.filter(r => r.menu_item_id !== menuItemId);

    const newRecipes: RecipeItem[] = recipeInputs.map((r, i) => ({
      id: `rec-${Date.now()}-${i}`,
      menu_item_id: menuItemId,
      raw_material_id: r.raw_material_id,
      quantity_required: r.quantity_required,
    }));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('recipes').delete().eq('menu_item_id', menuItemId);
        await supabase.from('recipes').insert(newRecipes);
      } catch (err) {
        console.warn('Supabase update recipes error:', err);
      }
    }

    memoryCacheRecipes = null;
    setStorage(STORAGE_KEY_RECIPES, [...filtered, ...newRecipes]);
    return true;
  },

  async getStockMutations(forceRefresh = false): Promise<StockMutation[]> {
    const now = Date.now();
    if (!forceRefresh && memoryCacheMutations && (now - memoryCacheMutations.timestamp < CACHE_TTL_MS)) {
      return memoryCacheMutations.data;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const queryPromise = supabase
          .from('stock_mutations')
          .select('*, raw_material:raw_materials(*)')
          .order('created_at', { ascending: false })
          .limit(100);
        const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error('timeout') }), 2500)
        );
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
        if (!error && data) {
          const list = data as StockMutation[];
          memoryCacheMutations = { data: list, timestamp: now };
          setStorage(STORAGE_KEY_MUTATIONS, list);
          return list;
        }
      } catch (err) {
        console.warn('Supabase getStockMutations error:', err);
      }
    }
    const fallback = getStorage<StockMutation[]>(STORAGE_KEY_MUTATIONS, []);
    memoryCacheMutations = { data: fallback, timestamp: now };
    return fallback;
  },

  // 4. ORDERS
  async getOrders(forceRefresh = false): Promise<Order[]> {
    const now = Date.now();
    if (!forceRefresh && memoryCacheOrders && (now - memoryCacheOrders.timestamp < 3500)) {
      return memoryCacheOrders.data;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, items:order_items(*)')
          .order('created_at', { ascending: false });
        if (!error && data) {
          const list = data as Order[];
          memoryCacheOrders = { data: list, timestamp: now };
          setStorage(STORAGE_KEY_ORDERS, list);
          return list;
        }
      } catch (err) {
        console.warn('Supabase getOrders error:', err);
      }
    }

    const stored = getStorage<Order[]>(STORAGE_KEY_ORDERS, INITIAL_ORDERS);
    memoryCacheOrders = { data: stored, timestamp: now };

    // Sinkronisasi server relay /api/orders secara non-blocking di background (0ms render time)
    if (typeof window !== 'undefined') {
      fetch('/api/orders', { cache: 'no-store' })
        .then(res => res.json())
        .then(json => {
          if (json.success && Array.isArray(json.orders)) {
            const serverOrders = json.orders as Order[];
            const idMap = new Map<string, Order>();
            stored.forEach(o => idMap.set(o.id, o));
            serverOrders.forEach(o => idMap.set(o.id, o));
            const merged = Array.from(idMap.values()).sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            if (merged.length !== stored.length) {
              setStorage(STORAGE_KEY_ORDERS, merged);
              memoryCacheOrders = { data: merged, timestamp: Date.now() };
            }
          }
        })
        .catch(() => {});
    }

    return stored;
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find(o => o.id === orderId || o.order_number === orderId) || null;
  },

  async createOrder(params: {
    table_number: string;
    customer_name: string;
    customer_phone?: string;
    customer_session_id?: string;
    order_type: 'dine_in' | 'reservation';
    reservation_date?: string;
    guest_count: number;
    payment_method: 'cashier' | 'qris';
    payment_proof_url?: string;
    cart: CartItem[];
    notes?: string;
  }): Promise<Order> {
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const subtotal = params.cart.reduce((acc, item) => acc + item.subtotal, 0);
    const totalAmount = subtotal;

    const initialStatus: OrderStatus = params.payment_method === 'qris'
      ? 'pending_payment'
      : 'confirmed';

    const newOrder: Order = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ord-${Date.now()}`,
      order_number: orderNumber,
      table_number: params.table_number,
      customer_name: params.customer_name,
      customer_phone: params.customer_phone || '',
      customer_session_id: params.customer_session_id || '',
      order_type: params.order_type,
      reservation_date: params.reservation_date,
      guest_count: params.guest_count,
      status: initialStatus,
      payment_method: params.payment_method,
      payment_proof_url: params.payment_proof_url || '',
      subtotal,
      total_amount: totalAmount,
      notes: params.notes || '',
      majoo_recorded: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: params.cart.map(item => ({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random()}`,
        order_id: '',
        menu_item_id: item.menu_item.id,
        item_name: item.menu_item.name,
        price: item.unit_price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        selected_variants: item.selected_variants,
        notes: item.notes,
      })),
    };

    if (isSupabaseConfigured && supabase) {
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: newOrder.order_number,
          table_number: newOrder.table_number,
          customer_name: newOrder.customer_name,
          customer_phone: newOrder.customer_phone,
          order_type: newOrder.order_type,
          reservation_date: newOrder.reservation_date,
          guest_count: newOrder.guest_count,
          status: newOrder.status,
          payment_method: newOrder.payment_method,
          payment_proof_url: newOrder.payment_proof_url,
          subtotal: newOrder.subtotal,
          total_amount: newOrder.total_amount,
          notes: newOrder.notes,
          majoo_recorded: false,
        })
        .select()
        .single();

      if (!orderErr && orderData) {
        newOrder.id = orderData.id;
        const itemsToInsert = (newOrder.items || []).map(i => ({
          order_id: orderData.id,
          menu_item_id: i.menu_item_id,
          item_name: i.item_name,
          price: i.price,
          quantity: i.quantity,
          subtotal: i.subtotal,
          selected_variants: i.selected_variants,
          notes: i.notes,
        }));
        await supabase.from('order_items').insert(itemsToInsert);
      }
    }

    const currentOrders = getStorage<Order[]>(STORAGE_KEY_ORDERS, INITIAL_ORDERS);
    const updatedOrders = [newOrder, ...currentOrders];
    setStorage(STORAGE_KEY_ORDERS, updatedOrders);
    memoryCacheOrders = { data: updatedOrders, timestamp: Date.now() };

    // Broadcast secara real-time ke semua tab & server relay
    RealtimeOrders.broadcastNewOrder(newOrder);

    this.triggerWhatsAppNotification(newOrder);

    return newOrder;
  },

  // 5. UPDATE STATUS & POTONG STOK OTOMATIS
  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<boolean> {
    if (newStatus === 'completed') {
      return this.completeOrderAndDeductStock(orderId);
    }

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    }

    const orders = getStorage<Order[]>(STORAGE_KEY_ORDERS, INITIAL_ORDERS);
    let targetOrder: Order | null = null;
    const updated = orders.map(o => {
      if (o.id === orderId) {
        targetOrder = { ...o, status: newStatus, updated_at: new Date().toISOString() };
        return targetOrder;
      }
      return o;
    });
    setStorage(STORAGE_KEY_ORDERS, updated);
    memoryCacheOrders = { data: updated, timestamp: Date.now() };

    if (targetOrder) {
      RealtimeOrders.broadcastOrderUpdate(targetOrder);
    }
    return true;
  },

  async completeOrderAndDeductStock(orderId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('complete_and_deduct_stock', { p_order_id: orderId });
      if (!error && data?.success) {
        return true;
      }
    }

    const orders = getStorage<Order[]>(STORAGE_KEY_ORDERS, INITIAL_ORDERS);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return false;

    const order = orders[orderIndex];
    if (order.status === 'completed') return true;

    const materials = getStorage<RawMaterial[]>(STORAGE_KEY_RAW, INITIAL_RAW_MATERIALS);
    const recipes = getStorage<RecipeItem[]>(STORAGE_KEY_RECIPES, INITIAL_RECIPES);
    const currentMutations = getStorage<StockMutation[]>(STORAGE_KEY_MUTATIONS, []);
    const newMutations: StockMutation[] = [];

    for (const item of order.items || []) {
      const itemRecipes = recipes.filter(r => r.menu_item_id === item.menu_item_id);
      for (const recipe of itemRecipes) {
        const matIndex = materials.findIndex(m => m.id === recipe.raw_material_id);
        if (matIndex !== -1) {
          const deductAmount = recipe.quantity_required * item.quantity;
          materials[matIndex].current_stock = Math.max(0, materials[matIndex].current_stock - deductAmount);

          newMutations.push({
            id: `mut-${Date.now()}-${Math.random()}`,
            raw_material_id: materials[matIndex].id,
            order_id: order.id,
            change_amount: -deductAmount,
            mutation_type: 'order_deduction',
            notes: `Auto potong order #${order.order_number} (${item.item_name} x${item.quantity})`,
            created_at: new Date().toISOString(),
            raw_material: materials[matIndex],
          });
        }
      }
    }

    orders[orderIndex] = {
      ...order,
      status: 'completed',
      updated_at: new Date().toISOString(),
    };

    setStorage(STORAGE_KEY_RAW, materials);
    setStorage(STORAGE_KEY_ORDERS, orders);
    memoryCacheOrders = { data: orders, timestamp: Date.now() };
    setStorage(STORAGE_KEY_MUTATIONS, [...newMutations, ...currentMutations]);

    return true;
  },

  // 6. TOGGLE CATAT KE MAJOO
  async toggleMajooRecorded(orderId: string, value: boolean): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('orders')
        .update({ majoo_recorded: value, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    }

    const orders = getStorage<Order[]>(STORAGE_KEY_ORDERS, INITIAL_ORDERS);
    const updated = orders.map(o => o.id === orderId ? { ...o, majoo_recorded: value } : o);
    setStorage(STORAGE_KEY_ORDERS, updated);
    memoryCacheOrders = { data: updated, timestamp: Date.now() };
    return true;
  },

  // 7. RESTOCK
  async adjustMaterialStock(materialId: string, addAmount: number, reason: string): Promise<boolean> {
    const materials = getStorage<RawMaterial[]>(STORAGE_KEY_RAW, INITIAL_RAW_MATERIALS);
    const matIndex = materials.findIndex(m => m.id === materialId);
    if (matIndex === -1) return false;

    materials[matIndex].current_stock = Math.max(0, materials[matIndex].current_stock + addAmount);
    setStorage(STORAGE_KEY_RAW, materials);
    memoryCacheRaw = null;
    memoryCacheMutations = null;

    const currentMutations = getStorage<StockMutation[]>(STORAGE_KEY_MUTATIONS, []);
    const newMut: StockMutation = {
      id: `mut-${Date.now()}`,
      raw_material_id: materialId,
      change_amount: addAmount,
      mutation_type: addAmount > 0 ? 'restock' : 'manual_adjustment',
      notes: reason || (addAmount > 0 ? 'Restock bahan baku' : 'Penyesuaian manual'),
      created_at: new Date().toISOString(),
      raw_material: materials[matIndex],
    };
    setStorage(STORAGE_KEY_MUTATIONS, [newMut, ...currentMutations]);
    return true;
  },

  // 8. NOTIFIKASI WHATSAPP
  async triggerWhatsAppNotification(order: Order) {
    try {
      fetch('/api/notify-wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      }).catch(err => {
        console.warn('WA webhook trigger error:', err);
      });
    } catch {
      // offline fallback
    }
  },

  // 9. SESI PENGGUNA / PELANGGAN ISOLASI
  getCustomerSessionId(): string {
    if (typeof window === 'undefined') return '';
    try {
      let sessId = localStorage.getItem('aruna_customer_session_id');
      if (!sessId) {
        sessId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? `csess_${crypto.randomUUID()}`
          : `csess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('aruna_customer_session_id', sessId);
      }
      return sessId;
    } catch {
      return '';
    }
  },

  getCustomerOrderIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('aruna_customer_order_ids');
      const list: string[] = raw ? JSON.parse(raw) : [];
      // backward compatibility check with old single order key
      const legacyId = localStorage.getItem('aruna_last_order_id');
      if (legacyId && !list.includes(legacyId)) {
        list.unshift(legacyId);
        localStorage.setItem('aruna_customer_order_ids', JSON.stringify(list));
      }
      return list;
    } catch {
      return [];
    }
  },

  addCustomerOrderId(orderId: string): void {
    if (typeof window === 'undefined' || !orderId) return;
    try {
      const list = this.getCustomerOrderIds();
      if (!list.includes(orderId)) {
        list.unshift(orderId);
        localStorage.setItem('aruna_customer_order_ids', JSON.stringify(list));
      }
      localStorage.setItem('aruna_last_order_id', orderId);
      window.dispatchEvent(new Event('arjuna_customer_session_updated'));
    } catch (e) {
      console.error('Save customer order ID error:', e);
    }
  },

  async getCustomerActiveOrders(): Promise<Order[]> {
    const allOrders = await this.getOrders();
    const myIds = new Set(this.getCustomerOrderIds());
    const sessId = this.getCustomerSessionId();

    return allOrders.filter(o => 
      myIds.has(o.id) || (sessId && o.customer_session_id === sessId)
    );
  }
};
