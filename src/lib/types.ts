export type OrderStatus = 'pending_payment' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
export type PaymentMethod = 'cashier' | 'qris';
export type OrderKind = 'dine_in' | 'reservation';
export type ShiftType = 'Shift Pagi' | 'Shift Malam';
export type MutationType = 'order_deduction' | 'manual_adjustment' | 'restock';

export interface PaymentSettings {
  qris_image_url: string;
  qris_merchant_name: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  payment_instructions: string;
}

export interface TableItem {
  id: string;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  created_at?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

export interface VariantOption {
  name: string;
  extra_price: number;
}

export interface MenuVariant {
  id: string;
  menu_item_id: string;
  group_name: string;
  is_required: boolean;
  options: VariantOption[];
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  badge?: 'BEST SELLER' | 'SIGNATURE' | 'NEW' | string;
  is_available: boolean;
  estimated_time?: string;
  variants?: MenuVariant[];
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: 'gram' | 'ml' | 'pcs' | 'porsi';
  current_stock: number;
  minimum_stock: number;
  updated_at?: string;
}

export interface RecipeItem {
  id: string;
  menu_item_id: string;
  raw_material_id: string;
  quantity_required: number;
  raw_material?: RawMaterial;
}

export interface CartItem {
  cart_id: string;
  menu_item: MenuItem;
  quantity: number;
  selected_variants: {
    group_name: string;
    chosen: VariantOption;
  }[];
  notes?: string;
  unit_price: number;
  subtotal: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  selected_variants?: {
    group_name: string;
    chosen: VariantOption;
  }[];
  notes?: string;
  checked?: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  table_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_session_id?: string;
  order_type: OrderKind;
  reservation_date?: string;
  guest_count: number;
  status: OrderStatus;
  shift?: ShiftType;
  payment_method: PaymentMethod;
  payment_proof_url?: string;
  subtotal: number;
  total_amount: number;
  down_payment?: number;
  notes?: string;
  majoo_recorded: boolean;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface StockMutation {
  id: string;
  raw_material_id: string;
  order_id?: string;
  change_amount: number;
  mutation_type: MutationType;
  notes?: string;
  created_at: string;
  raw_material?: RawMaterial;
}
