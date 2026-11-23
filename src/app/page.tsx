'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { CafeStore } from '@/lib/store';
import { MenuItem, MenuCategory, TableItem, CartItem, VariantOption, PaymentSettings, Order } from '@/lib/types';
import {
  Clock,
  MapPin,
  Search,
  Plus,
  Minus,
  Trash2,
  CalendarDays,
  Home,
  X,
  Check,
  QrCode,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Utensils,
  UtensilsCrossed,
  ShoppingBag,
  Coffee,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Banknote,
  ExternalLink,
  Building2,
  Copy,
  Upload,
  Users,
  Maximize2,
  FileText,
  Lock
} from 'lucide-react';

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function ArunaPochaStyleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tableQuery = searchParams.get('table') || 'Meja 01';
  const initialTabQuery = searchParams.get('tab') === 'reservation' ? 'reservation' : 'order';

  // Navigation mode: 'order' (pesan di meja) | 'reservation' (reservasi meja)
  const [mainTab, setMainTab] = useState<'order' | 'reservation'>(initialTabQuery);

  const [categories, setCategories] = useState<MenuCategory[]>(() => CafeStore.getInitialCategories());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => CafeStore.getInitialMenuItems());
  const [tables, setTables] = useState<TableItem[]>(() => CafeStore.getInitialTables());
  const [existingOrders, setExistingOrders] = useState<Order[]>(() => CafeStore.getInitialOrders());
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Table & Order Type (Terkunci Otomatis dari QR Code Meja untuk Dine-In)
  const [currentTable] = useState<string>(tableQuery);
  const [orderType, setOrderType] = useState<'dine_in' | 'reservation'>('dine_in');
  const [reservationDate, setReservationDate] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(2);

  // Cart & Drawer (Dine-In)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // RESERVATION STATE
  const todayStr = new Date().toISOString().split('T')[0];
  const [resDate, setResDate] = useState<string>(todayStr);
  const [resTime, setResTime] = useState<string>('19:00');
  const [resGuestCount, setResGuestCount] = useState<number>(4);
  const [selectedResTable, setSelectedResTable] = useState<string>('');
  const [resCart, setResCart] = useState<CartItem[]>([]);
  const [isResMenuPickerOpen, setIsResMenuPickerOpen] = useState<boolean>(false);
  const [resMenuCategory, setResMenuCategory] = useState<string>('cat-all');
  const [resMenuSearch, setResMenuSearch] = useState<string>('');
  const [resDpMethod, setResDpMethod] = useState<'qris' | 'cashier'>('qris');
  const [resCustomerName, setResCustomerName] = useState<string>('');
  const [resCustomerPhone, setResCustomerPhone] = useState<string>('');
  const [resNotes, setResNotes] = useState<string>('');
  const [resPaymentProofUrl, setResPaymentProofUrl] = useState<string>('');
  const [resPaymentProofName, setResPaymentProofName] = useState<string>('');
  const [isUploadingResProof, setIsUploadingResProof] = useState<boolean>(false);
  const [isSubmittingRes, setIsSubmittingRes] = useState<boolean>(false);
  const [resFormError, setResFormError] = useState<string>('');
  const [resSuccessData, setResSuccessData] = useState<Order | null>(null);

  // Customize Item Modal
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<{ [groupName: string]: VariantOption }>({});
  const [itemNote, setItemNote] = useState<string>('');
  const [itemQty, setItemQty] = useState<number>(1);

  // Checkout State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cashier' | 'qris'>('qris');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(() => CafeStore.getInitialPaymentSettings());
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [paymentProofName, setPaymentProofName] = useState<string>('');

  const isPdfUrl = (url?: string | null, name?: string) => {
    if (!url) return false;
    if (name && name.toLowerCase().endsWith('.pdf')) return true;
    return url.includes('application/pdf') || url.toLowerCase().includes('.pdf');
  };
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [activeCustomerOrder, setActiveCustomerOrder] = useState<Order | null>(null);

  // QRIS Display State
  const [qrisDataUrl, setQrisDataUrl] = useState<string>('');
  const [isQrisZoomOpen, setIsQrisZoomOpen] = useState<boolean>(false);

  // Pagination Menu State
  const [menuPage, setMenuPage] = useState<number>(1);
  const [menuPageSize, setMenuPageSize] = useState<number>(6);

  useEffect(() => {
    setMenuPage(1);
  }, [selectedCategory, searchQuery]);

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      // 1. Fetch menu & categories dengan prioritas tinggi (instant render dari memory cache / network)
      const [cats, items] = await Promise.all([
        CafeStore.getCategories(),
        CafeStore.getMenuItems(),
      ]);
      setCategories(cats);
      setMenuItems(items);

      // 2. Fetch tables, payment settings & orders di background tanpa memblokir tampilan menu
      const [tbls, paySet, ords] = await Promise.all([
        CafeStore.getTables(),
        CafeStore.getPaymentSettings(),
        CafeStore.getOrders(),
      ]);
      setTables(tbls);
      setPaymentSettings(paySet);
      setExistingOrders(ords);

      // Generate Data URL untuk QRIS agar selalu tajam, besar, dan tidak tergantung network eksternal
      if (paySet) {
        try {
          const rawQris = paySet.qris_image_url || '';
          let qrPayload = rawQris;
          if (rawQris.includes('data=')) {
            const parts = rawQris.split('data=');
            if (parts[1]) qrPayload = decodeURIComponent(parts[1]);
          }
          if (!qrPayload || qrPayload.startsWith('http')) {
            qrPayload = '00020101021226670016ID.CO.BRI.WWW0118936000020112345678021500000000000000051020002030035802ID5913ARUNA COFFEE6007JAKARTA5405880005802ID6304ABCD';
          }
          const generatedUrl = await QRCode.toDataURL(qrPayload, {
            width: 480,
            margin: 1,
            color: { dark: '#1c1917', light: '#ffffff' },
          });
          setQrisDataUrl(generatedUrl);
        } catch (err) {
          console.error('Failed to generate QRIS data URL:', err);
        }
      }

      // Cek apakah customer memiliki pesanan aktif yang sedang berjalan di sesi perangkat ini
      try {
        const myActive = await CafeStore.getCustomerActiveOrders();
        const pending = myActive.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
        if (pending.length > 0) {
          // Ambil pesanan aktif terbaru milik customer
          setActiveCustomerOrder(pending[0]);
        } else {
          setActiveCustomerOrder(null);
        }
      } catch { }
    } catch (e) {
      console.error('Error loading initial data:', e);
    }
  };

  useEffect(() => {
    loadData();

    // Muat keranjang yang tersimpan khusus untuk meja ini
    try {
      const savedCart = localStorage.getItem(`aruna_cart_${currentTable}`);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
        }
      }
    } catch { }

    const handleStoreUpdated = () => {
      loadData();
    };

    window.addEventListener('arjuna_store_updated', handleStoreUpdated);
    window.addEventListener('arjuna_customer_session_updated', handleStoreUpdated);
    return () => {
      window.removeEventListener('arjuna_store_updated', handleStoreUpdated);
      window.removeEventListener('arjuna_customer_session_updated', handleStoreUpdated);
    };
  }, [currentTable]);

  // Simpan keranjang otomatis per meja untuk sesi pengguna
  const isCartInitializedRef = useRef(false);
  useEffect(() => {
    if (!isCartInitializedRef.current) {
      isCartInitializedRef.current = true;
      return;
    }
    try {
      if (cart.length > 0) {
        localStorage.setItem(`aruna_cart_${currentTable}`, JSON.stringify(cart));
      } else {
        localStorage.removeItem(`aruna_cart_${currentTable}`);
      }
    } catch { }
  }, [cart, currentTable]);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPrice = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const getItemQuantityInCart = (menuItemId: string) => {
    return cart
      .filter(item => item.menu_item.id === menuItemId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const scrollCategoryBar = (direction: 'left' | 'right') => {
    if (!categoryScrollRef.current) return;
    const offset = direction === 'left' ? -200 : 200;
    categoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // ==========================================
  // TABLE STATUS & RESERVATION HELPERS
  // ==========================================
  const getTableArea = (tblNumber: string) => {
    const num = parseInt(tblNumber.replace(/\D/g, ''), 10) || 0;
    if (num >= 1 && num <= 4) return 'Dekat Jendela';
    if (num >= 5 && num <= 8) return 'Area Utama';
    if (num >= 9 && num <= 14) return 'Dekat Bar / Semi-Private';
    return 'Area Utama';
  };

  // Cek apakah meja tertentu sudah direservasi pada slot tanggal & jam yang dipilih
  const getReservationForTable = (tblNumber: string) => {
    return existingOrders.find(o => {
      if (o.status === 'cancelled') return false;
      if (o.order_type !== 'reservation') return false;
      if (o.table_number.toLowerCase() !== tblNumber.toLowerCase()) return false;
      if (!o.reservation_date) return false;

      const [oDate, oTimeFull] = o.reservation_date.split('T');
      if (oDate !== resDate) return false;

      if (resTime && oTimeFull) {
        const oTime = oTimeFull.substring(0, 5);
        const [oH, oM] = oTime.split(':').map(Number);
        const [selH, selM] = resTime.split(':').map(Number);
        // Overlap buffer 2 jam (120 menit)
        const diffMins = Math.abs((oH * 60 + oM) - (selH * 60 + selM));
        return diffMins < 120;
      }
      return false;
    });
  };

  const resCartTotal = resCart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleUpdateResCartQty = (cartId: string, delta: number) => {
    const existingIdx = resCart.findIndex(c => c.cart_id === cartId);
    if (existingIdx === -1) return;
    const updated = [...resCart];
    const newQty = updated[existingIdx].quantity + delta;
    if (newQty > 0) {
      updated[existingIdx].quantity = newQty;
      updated[existingIdx].subtotal = newQty * updated[existingIdx].unit_price;
      setResCart(updated);
    } else {
      updated.splice(existingIdx, 1);
      setResCart(updated);
    }
  };

  const handleRemoveResCartItem = (cartId: string) => {
    setResCart(resCart.filter(c => c.cart_id !== cartId));
  };

  const handleQuickAdd = (item: MenuItem, isForReservation = false) => {
    if (!item.is_available) return;

    if (item.variants && item.variants.length > 0) {
      handleOpenCustomize(item);
      return;
    }

    const cartId = `${item.id}_default_`;
    if (mainTab === 'reservation' || isForReservation) {
      const existingIdx = resCart.findIndex(c => c.cart_id === cartId);
      if (existingIdx !== -1) {
        const updated = [...resCart];
        updated[existingIdx].quantity += 1;
        updated[existingIdx].subtotal = updated[existingIdx].quantity * updated[existingIdx].unit_price;
        setResCart(updated);
      } else {
        const newItem: CartItem = {
          cart_id: cartId,
          menu_item: item,
          quantity: 1,
          selected_variants: [],
          unit_price: item.price,
          subtotal: item.price,
        };
        setResCart([...resCart, newItem]);
      }
    } else {
      const existingIdx = cart.findIndex(c => c.cart_id === cartId);
      if (existingIdx !== -1) {
        const updated = [...cart];
        updated[existingIdx].quantity += 1;
        updated[existingIdx].subtotal = updated[existingIdx].quantity * updated[existingIdx].unit_price;
        setCart(updated);
      } else {
        const newItem: CartItem = {
          cart_id: cartId,
          menu_item: item,
          quantity: 1,
          selected_variants: [],
          unit_price: item.price,
          subtotal: item.price,
        };
        setCart([...cart, newItem]);
      }
    }
  };

  const handleQuickDecrease = (menuItemId: string) => {
    const existingIdx = cart.findIndex(c => c.menu_item.id === menuItemId);
    if (existingIdx === -1) return;

    const updated = [...cart];
    if (updated[existingIdx].quantity > 1) {
      updated[existingIdx].quantity -= 1;
      updated[existingIdx].subtotal = updated[existingIdx].quantity * updated[existingIdx].unit_price;
      setCart(updated);
    } else {
      updated.splice(existingIdx, 1);
      setCart(updated);
    }
  };

  const handleOpenCustomize = (item: MenuItem) => {
    setCustomizingItem(item);
    setItemQty(1);
    setItemNote('');
    const defaults: { [group: string]: VariantOption } = {};
    if (item.variants) {
      item.variants.forEach(v => {
        if (v.options.length > 0) {
          defaults[v.group_name] = v.options[0];
        }
      });
    }
    setSelectedVariants(defaults);
  };

  const getQuickChips = (item: MenuItem | null) => {
    if (!item) return [];
    if (item.category_id === 'cat-kopi' || item.category_id === 'cat-nonkopi') {
      return ['Less Ice', 'Normal Ice', 'No Ice', 'Less Sugar', 'Normal Sugar', 'Pisah Es'];
    }
    if (item.category_id === 'cat-makanan') {
      return ['Tidak Pedas', 'Pedas Sedang', 'Extra Pedas', 'Pisah Sambal', 'Tanpa Bawang'];
    }
    return ['Hangatkan (Heated)', 'Sajikan Dingin', 'Pisah Saus'];
  };

  const calculateUnitPrice = (basePrice: number, variants: { [group: string]: VariantOption }) => {
    let price = basePrice;
    Object.values(variants).forEach(opt => {
      price += opt.extra_price || 0;
    });
    return price;
  };

  const handleSaveCustomize = () => {
    if (!customizingItem) return;

    const unitPrice = calculateUnitPrice(customizingItem.price, selectedVariants);
    const chosenList = Object.entries(selectedVariants).map(([group_name, chosen]) => ({
      group_name,
      chosen,
    }));

    const variantKey = chosenList.map(v => `${v.group_name}:${v.chosen.name}`).sort().join('|');
    const cartId = `${customizingItem.id}_${variantKey}_${itemNote}`;

    if (mainTab === 'reservation') {
      const existingIdx = resCart.findIndex(c => c.cart_id === cartId);
      if (existingIdx !== -1) {
        const updated = [...resCart];
        updated[existingIdx].quantity += itemQty;
        updated[existingIdx].subtotal = updated[existingIdx].quantity * updated[existingIdx].unit_price;
        setResCart(updated);
      } else {
        const newItem: CartItem = {
          cart_id: cartId,
          menu_item: customizingItem,
          quantity: itemQty,
          selected_variants: chosenList,
          notes: itemNote,
          unit_price: unitPrice,
          subtotal: unitPrice * itemQty,
        };
        setResCart([...resCart, newItem]);
      }
    } else {
      const existingIdx = cart.findIndex(c => c.cart_id === cartId);
      if (existingIdx !== -1) {
        const updated = [...cart];
        updated[existingIdx].quantity += itemQty;
        updated[existingIdx].subtotal = updated[existingIdx].quantity * updated[existingIdx].unit_price;
        setCart(updated);
      } else {
        const newItem: CartItem = {
          cart_id: cartId,
          menu_item: customizingItem,
          quantity: itemQty,
          selected_variants: chosenList,
          notes: itemNote,
          unit_price: unitPrice,
          subtotal: unitPrice * itemQty,
        };
        setCart([...cart, newItem]);
      }
    }

    setCustomizingItem(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFormError('');
    setPaymentProofName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-proof', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal upload file bukti transfer');

      setPaymentProofUrl(data.url);
    } catch (err: unknown) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : 'Gagal upload file bukti transfer');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingResProof(true);
    setResFormError('');
    setResPaymentProofName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-proof', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal upload file bukti transfer');

      setResPaymentProofUrl(data.url);
    } catch (err: unknown) {
      console.error(err);
      setResFormError(err instanceof Error ? err.message : 'Gagal upload file bukti transfer');
    } finally {
      setIsUploadingResProof(false);
    }
  };

  const handleCopyBank = () => {
    if (paymentSettings?.bank_account_number) {
      navigator.clipboard.writeText(paymentSettings.bank_account_number);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Nama pemesan wajib diisi.');
      return;
    }

    if (cart.length === 0) {
      setFormError('Keranjang pesanan masih kosong.');
      return;
    }

    if (orderType === 'reservation' && !reservationDate) {
      setFormError('Pilih tanggal dan jam reservasi.');
      return;
    }

    // Bukti bayar WAJIB untuk metode QRIS
    if (paymentMethod === 'qris' && (!paymentProofUrl || paymentProofUrl.trim() === '')) {
      setFormError('Wajib upload screenshot/foto bukti transfer QRIS atau Bank agar pesanan dapat di-ACC dan diproses oleh kasir.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newOrder = await CafeStore.createOrder({
        table_number: currentTable,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_session_id: CafeStore.getCustomerSessionId(),
        order_type: orderType,
        reservation_date: reservationDate || undefined,
        guest_count: guestCount,
        payment_method: paymentMethod,
        payment_proof_url: paymentProofUrl || '',
        cart: cart,
        notes: orderNotes,
      });

      CafeStore.addCustomerOrderId(newOrder.id);
      try {
        localStorage.removeItem(`aruna_cart_${currentTable}`);
      } catch { }

      setCart([]);
      setIsCartDrawerOpen(false);
      router.push(`/order/status/${newOrder.id}`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal mengirim pesanan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Konfirmasi Reservasi Meja dari Tab Reservasi
  const handleConfirmReservation = async () => {
    setResFormError('');

    if (!selectedResTable) {
      setResFormError('Silakan pilih salah satu meja yang tersedia di atas terlebih dahulu.');
      return;
    }

    // Double check apakah meja sudah terisi
    const alreadyReserved = getReservationForTable(selectedResTable);
    if (alreadyReserved) {
      setResFormError(`Maaf, ${selectedResTable} sudah direservasi untuk slot jam ini. Silakan pilih meja lainnya.`);
      return;
    }

    if (!resCustomerName.trim()) {
      setResFormError('Nama lengkap pemesan wajib diisi.');
      return;
    }

    if (!resCustomerPhone.trim()) {
      setResFormError('Nomor WhatsApp wajib diisi untuk konfirmasi kedatangan.');
      return;
    }

    if (resDpMethod === 'qris' && (!resPaymentProofUrl || resPaymentProofUrl.trim() === '')) {
      setResFormError('Wajib upload bukti transfer DP QRIS atau pilih opsi "Bayar Kasir Saat Tiba".');
      return;
    }

    setIsSubmittingRes(true);
    try {
      const fullReservationDate = `${resDate}T${resTime}`;
      const newOrder = await CafeStore.createOrder({
        table_number: selectedResTable,
        customer_name: resCustomerName.trim(),
        customer_phone: resCustomerPhone.trim(),
        customer_session_id: CafeStore.getCustomerSessionId(),
        order_type: 'reservation',
        reservation_date: fullReservationDate,
        guest_count: resGuestCount,
        payment_method: resDpMethod,
        payment_proof_url: resPaymentProofUrl || '',
        cart: resCart,
        notes: resNotes.trim(),
      });

      CafeStore.addCustomerOrderId(newOrder.id);

      // Refresh list existing orders
      const updatedOrders = await CafeStore.getOrders();
      setExistingOrders(updatedOrders);

      setResSuccessData(newOrder);
      setResCart([]);
      setSelectedResTable('');
      setResNotes('');
      setResPaymentProofUrl('');
    } catch (err: unknown) {
      setResFormError(err instanceof Error ? err.message : 'Gagal menyimpan reservasi meja');
    } finally {
      setIsSubmittingRes(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchCat = selectedCategory === 'cat-all' || item.category_id === selectedCategory;
    const matchSearch = !searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Kalkulasi Pagination Menu (Bagian 1, Bagian 2, dst)
  const totalMenuPages = Math.max(1, Math.ceil(filteredMenuItems.length / menuPageSize));
  const safeMenuPage = Math.min(Math.max(1, menuPage), totalMenuPages);
  const startMenuIdx = (safeMenuPage - 1) * menuPageSize;
  const paginatedMenuItems = filteredMenuItems.slice(startMenuIdx, startMenuIdx + menuPageSize);

  const filteredResMenuItems = menuItems.filter(item => {
    const matchCat = resMenuCategory === 'cat-all' || item.category_id === resMenuCategory;
    const matchSearch = !resMenuSearch.trim() || item.name.toLowerCase().includes(resMenuSearch.toLowerCase()) || item.description.toLowerCase().includes(resMenuSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#241e1b] flex flex-col font-sans selection:bg-[#c87a58] selection:text-white pb-20 md:pb-0">
      {/* ======================================================== */}
      {/* 1. TOP NAVBAR                                            */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-[#1c1917]/95 backdrop-blur-md border-b border-stone-800 text-stone-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0 border border-white/10 group-hover:scale-105 transition-transform bg-[#f7f5f0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/aruna-logo.jpg"
                  alt="Aruna Cafe Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-[0.2em] text-white uppercase group-hover:text-amber-300 transition-colors">
                    ARUNA
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                    BUKA
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
                  Coffee & Kitchen
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMainTab('order')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${mainTab === 'order'
                  ? 'bg-[#c87a58] text-white border-[#c87a58] shadow-xs'
                  : 'text-stone-300 hover:text-white border-transparent hover:bg-stone-800/60'
                  }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Daftar Menu</span>
              </button>
              <button
                type="button"
                onClick={() => setMainTab('reservation')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${mainTab === 'reservation'
                  ? 'bg-[#c87a58] text-white border-[#c87a58] shadow-xs'
                  : 'text-stone-300 hover:text-white border-transparent hover:bg-stone-800/60'
                  }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Reservasi Meja</span>
              </button>
              <a href="#tentang-kami" className="px-3 py-1.5 text-stone-400 hover:text-stone-200 transition-colors">Tentang Kami</a>
              <a href="#lokasi" className="px-3 py-1.5 text-stone-400 hover:text-stone-200 transition-colors">Lokasi & Jam</a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Instagram Official Link */}
              <a
                href="https://www.instagram.com/arunacafe.smd?jplx=aDI2aXMzZWlyd2Rt"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700/80 transition-colors"
                title="Instagram Resmi @arunacafe.smd"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                <span>@arunacafe.smd</span>
              </a>

              {/* Badge Nomor Meja Terkunci (Sesuai Scan QR di Meja) */}
              <div
                className="bg-stone-800/90 text-stone-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-700/80 flex items-center gap-1.5 shadow-2xs select-none"
                title={`Meja Anda terkunci pada ${currentTable} (Sesuai Scan QR)`}
              >
                <QrCode className="w-3.5 h-3.5 text-[#c87a58]" />
                <span>{currentTable}</span>
              </div>

              {/* Link Akses Staf Kasir POS */}
              <Link
                href="/kasir"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-stone-800/60 hover:bg-stone-700 text-stone-400 border border-stone-700/60 transition-all hover:text-white"
                title="Portal Akses Staf Kasir / POS"
              >
                <Lock className="w-3 h-3 text-stone-400" />
                <span className="text-[11px]">Kasir</span>
              </Link>

              {/* Tombol Keranjang Drawer */}
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#c87a58] hover:bg-[#b86948] text-white font-black text-xs transition-transform active:scale-95 shadow-md cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Keranjang</span>
                <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-md bg-stone-900 text-amber-300 text-[10px] font-black">
                  {totalCartCount}
                </span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Floating Banner Status Pesanan Aktif untuk Customer */}
      {activeCustomerOrder && (
        <div className="bg-[#181513] text-stone-100 px-4 py-2.5 text-xs border-b border-stone-800 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 max-w-[80%] truncate">
            <span className="w-2 h-2 rounded-full bg-[#c87a58] shrink-0" />
            <span className="truncate">
              Pesanan Anda ({activeCustomerOrder.table_number}):{' '}
              <strong className="text-amber-400 capitalize">
                {activeCustomerOrder.status === 'processing'
                  ? 'Sedang Dimasak di Dapur'
                  : activeCustomerOrder.status === 'confirmed'
                    ? 'Diterima Kasir & Siap Dimasak'
                    : 'Menunggu Verifikasi Kasir'}
              </strong>
            </span>
          </div>
          <Link
            href={`/order/status/${activeCustomerOrder.id}`}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1 shrink-0 ml-2"
          >
            <span>Live Status</span>
            <span>→</span>
          </Link>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONDITIONAL CONTENT: ORDER MODE VS RESERVATION MODE      */}
      {/* ======================================================== */}
      {mainTab === 'reservation' ? (
        /* ======================================================== */
        /* RESERVASI MEJA VIEW                                      */
        /* ======================================================== */
        <main className="max-w-3xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6 flex-1">
          {/* Back link */}
          <button
            type="button"
            onClick={() => setMainTab('order')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-xs font-bold text-stone-700 border border-stone-200 shadow-2xs transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#c87a58]" />
            <span>Kembali ke Menu Dine-In ({currentTable})</span>
          </button>

          {/* Heading */}
          <div>
            <span className="text-[11px] font-black uppercase text-[#c87a58] tracking-widest block mb-1">
              RESERVASI MEJA
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-serif tracking-tight">
              Simpan meja terbaikmu.
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
              Pilih jadwal dan meja untuk momen spesial di Aruna Coffee & Kitchen.
            </p>
          </div>

          {resFormError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{resFormError}</span>
            </div>
          )}

          {/* CARD 1: TANGGAL, WAKTU, JUMLAH TAMU & KOTAK-KOTAK MEJA */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-xs space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tanggal */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Tanggal Reservasi
                </label>
                <input
                  type="date"
                  value={resDate}
                  min={todayStr}
                  onChange={(e) => {
                    setResDate(e.target.value);
                    setSelectedResTable(''); // Reset pilihan meja untuk memicu kalkulasi ulang status
                  }}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-300 font-bold text-xs sm:text-sm text-stone-900 bg-stone-50/70 focus:bg-white focus:border-[#c87a58] focus:outline-none focus:ring-1 focus:ring-[#c87a58] transition-all cursor-pointer"
                />
              </div>

              {/* Waktu */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Jam Kedatangan
                </label>
                <select
                  value={resTime}
                  onChange={(e) => {
                    setResTime(e.target.value);
                    setSelectedResTable(''); // Reset pilihan meja
                  }}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-300 font-bold text-xs sm:text-sm text-stone-900 bg-stone-50/70 focus:bg-white focus:border-[#c87a58] focus:outline-none focus:ring-1 focus:ring-[#c87a58] transition-all cursor-pointer"
                >
                  {[
                    '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
                    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
                  ].map(t => (
                    <option key={t} value={t}>{t} WITA</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Jumlah Tamu */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Jumlah Tamu
              </label>
              <div className="flex items-center justify-between p-2 rounded-2xl border border-stone-200 bg-stone-50/80 max-w-xs">
                <button
                  type="button"
                  onClick={() => setResGuestCount(Math.max(1, resGuestCount - 1))}
                  className="w-9 h-9 rounded-xl bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-sm shadow-2xs transition active:scale-95 cursor-pointer"
                  aria-label="Kurangi tamu"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-black text-sm text-stone-900">
                  {resGuestCount} orang
                </span>
                <button
                  type="button"
                  onClick={() => setResGuestCount(Math.min(25, resGuestCount + 1))}
                  className="w-9 h-9 rounded-xl bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-sm shadow-2xs transition active:scale-95 cursor-pointer"
                  aria-label="Tambah tamu"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Kotak-Kotak Meja Interaktif */}
            <div className="space-y-3 pt-3 border-t border-stone-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black uppercase text-stone-900 tracking-wider">
                  Pilih Meja Tersedia
                </span>
                <span className="text-[11px] text-stone-500 font-medium">
                  Jadwal: {resDate} • {resTime} WITA
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {tables.map(tbl => {
                  const reservedOrder = getReservationForTable(tbl.table_number);
                  const isReserved = !!reservedOrder;
                  const isSelected = selectedResTable === tbl.table_number;
                  const area = getTableArea(tbl.table_number);

                  if (isReserved) {
                    return (
                      <div
                        key={tbl.id}
                        className="rounded-2xl border-2 border-stone-200 bg-stone-100/90 p-3.5 text-left opacity-75 cursor-not-allowed select-none relative overflow-hidden flex flex-col justify-between min-h-[115px]"
                        title={`${tbl.table_number} sudah direservasi pada slot ini`}
                      >
                        <div>
                          <Home className="w-4 h-4 text-stone-400 mb-1" />
                          <h4 className="font-black text-sm text-stone-500 uppercase leading-tight">
                            {tbl.table_number}
                          </h4>
                          <p className="text-[10px] text-stone-400 mt-0.5">{area}</p>
                        </div>
                        <div className="mt-2">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                            Sudah Direservasi
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={tbl.id}
                      type="button"
                      onClick={() => setSelectedResTable(tbl.table_number)}
                      className={`rounded-2xl p-3.5 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[115px] shadow-2xs border-2 ${isSelected
                        ? 'border-[#c87a58] bg-[#fcf8f5] ring-2 ring-[#c87a58]/30 shadow-xs scale-[1.02]'
                        : 'border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50/80'
                        }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div>
                          <Home className={`w-4 h-4 mb-1 ${isSelected ? 'text-[#c87a58]' : 'text-stone-700'}`} />
                          <h4 className={`font-black text-sm uppercase leading-tight ${isSelected ? 'text-[#c87a58]' : 'text-stone-900'}`}>
                            {tbl.table_number}
                          </h4>
                          <p className="text-[10px] text-stone-500 mt-0.5">{area}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#c87a58] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between w-full">
                        <span className="text-[10px] text-stone-500 font-semibold">
                          {tbl.capacity} Kursi
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${isSelected
                          ? 'bg-[#c87a58] text-white'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                          {isSelected ? 'Dipilih' : 'Tersedia'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CARD 2: PENGATURAN MENU RESERVASI ("mau menu apa saja") */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
              <div>
                <span className="text-xs font-black uppercase text-stone-900 tracking-wider block">
                  Pre-Order Menu Makanan & Minuman
                </span>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Tentukan hidangan yang ingin disiapkan saat Anda tiba (opsional).
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 shrink-0">
                {resCart.length} Menu Dipilih
              </span>
            </div>

            {resCart.length === 0 ? (
              <div className="p-6 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/70 text-center space-y-2">
                <Utensils className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-xs font-bold text-stone-700">Belum ada menu yang dipilih untuk reservasi ini</p>
                <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                  Ingin makanan atau kopi sudah siap saat Anda sampai? Klik tombol di bawah untuk memilih menu.
                </p>
                <button
                  type="button"
                  onClick={() => setIsResMenuPickerOpen(true)}
                  className="mt-2 px-4 py-2.5 rounded-xl bg-[#c87a58] hover:bg-[#b86948] text-white font-black text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Pilih Menu Hidangan</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/40">
                  {resCart.map(cItem => (
                    <div key={cItem.cart_id} className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-white">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={cItem.menu_item.image_url} alt={cItem.menu_item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-stone-900 truncate">{cItem.menu_item.name}</h4>
                          <p className="text-[10px] text-stone-500">
                            {cItem.selected_variants?.map(v => v.chosen.name).join(', ') || 'Standar'}
                          </p>
                          <p className="text-xs font-mono font-bold text-[#c87a58]">
                            Rp {cItem.subtotal.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-stone-100 rounded-xl border border-stone-200 p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateResCartQty(cItem.cart_id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 font-bold text-xs cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-black text-stone-900">
                            {cItem.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateResCartQty(cItem.cart_id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 font-bold text-xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveResCartItem(cItem.cart_id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResMenuPickerOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#c87a58]" />
                    <span>Tambah Menu Lain</span>
                  </button>

                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 uppercase font-black tracking-wider block">
                      Total Pre-Order:
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono text-stone-900">
                      Rp {resCartTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CARD 3: DP RESERVASI & PEMBAYARAN */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-xs font-black uppercase text-stone-900 tracking-wider block">
                  DP / Metode Pembayaran
                </span>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Amankan reservasi dengan DP via QRIS resmi Aruna atau bayar tunai di kasir.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Opsional
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResDpMethod('qris')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${resDpMethod === 'qris'
                  ? 'border-[#c87a58] bg-[#fcf8f5] ring-2 ring-[#c87a58]/20'
                  : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
              >
                <QrCode className="w-5 h-5 text-[#c87a58] mb-1.5" />
                <h4 className="text-xs font-black text-stone-900">DP QRIS BRI (Disarankan)</h4>
                <p className="text-[10px] text-stone-500 mt-0.5">Konfirmasi instan & meja diprioritaskan</p>
              </button>

              <button
                type="button"
                onClick={() => setResDpMethod('cashier')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${resDpMethod === 'cashier'
                  ? 'border-[#c87a58] bg-[#fcf8f5] ring-2 ring-[#c87a58]/20'
                  : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
              >
                <Banknote className="w-5 h-5 text-stone-700 mb-1.5" />
                <h4 className="text-xs font-black text-stone-900">Bayar Kasir Saat Tiba</h4>
                <p className="text-[10px] text-stone-500 mt-0.5">Bayar saat check-in di outlet Aruna</p>
              </button>
            </div>

            {/* Jika QRIS dipilih */}
            {resDpMethod === 'qris' && paymentSettings && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-44 h-44 sm:w-48 sm:h-48 bg-white p-2.5 rounded-2xl border-2 border-stone-300 shrink-0 shadow-xs flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrisDataUrl || paymentSettings.qris_image_url || '/qris-default.png'}
                      alt="QRIS Aruna"
                      className="w-full h-full object-contain cursor-pointer"
                      onClick={() => setIsQrisZoomOpen(true)}
                    />
                  </div>
                  <div className="text-xs space-y-1.5 text-center sm:text-left">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Transfer DP / Pre-Order:
                    </span>
                    <p className="font-black text-stone-900">{paymentSettings.qris_merchant_name}</p>
                    <p className="font-mono text-stone-600 font-bold">{paymentSettings.bank_name}: {paymentSettings.bank_account_number}</p>
                    <button
                      type="button"
                      onClick={handleCopyBank}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedAccount ? 'Tersalin!' : 'Salin Rekening'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQrisZoomOpen(true)}
                      className="block text-[11px] font-bold text-[#c87a58] hover:underline mt-1 cursor-pointer"
                    >
                      Perbesar QR Code
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Upload Bukti Transfer DP (Foto / PDF / Resi Bank) <span className="text-rose-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-stone-300 rounded-2xl p-4 text-center bg-white hover:bg-stone-50/50 transition-colors">
                    {resPaymentProofUrl ? (
                      <div className="space-y-2">
                        {isPdfUrl(resPaymentProofUrl, resPaymentProofName) ? (
                          <div className="flex items-center justify-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 max-w-sm mx-auto">
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <p className="text-xs font-bold text-stone-900 truncate">
                                {resPaymentProofName || 'Dokumen_Transfer_DP.pdf'}
                              </p>
                              <span className="text-[10px] text-emerald-600 font-semibold block">
                                ✓ File Dokumen PDF Siap
                              </span>
                            </div>
                            <a
                              href={resPaymentProofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[10px] font-bold"
                            >
                              Lihat
                            </a>
                          </div>
                        ) : (
                          <div className="w-28 h-28 mx-auto rounded-xl overflow-hidden border border-stone-200 shadow-2xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={resPaymentProofUrl} alt="Bukti Transfer" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setResPaymentProofUrl('');
                              setResPaymentProofName('');
                            }}
                            className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Ganti File Bukti
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer block space-y-1">
                        <Upload className="w-6 h-6 text-[#c87a58] mx-auto" />
                        <span className="text-xs font-bold text-stone-800 block">
                          {isUploadingResProof ? 'Mengunggah File...' : 'Pilih Bukti Transfer (Foto / PDF / File)'}
                        </span>
                        <span className="text-[10px] text-stone-400 block">Mendukung Foto JPG/PNG atau Dokumen PDF dari m-Banking</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf,.pdf"
                          onChange={handleResProofUpload}
                          className="hidden"
                          disabled={isUploadingResProof}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CARD 4: DATA PEMESAN & KONFIRMASI */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-xs space-y-4">
            <span className="text-xs font-black uppercase text-stone-900 tracking-wider block pb-2 border-b border-stone-100">
              Informasi Pemesan
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nama Pemesan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dimas Setiawan"
                  value={resCustomerName}
                  onChange={(e) => setResCustomerName(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl border border-stone-300 font-bold text-stone-900 bg-stone-50/60 focus:bg-white focus:border-[#c87a58] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nomor WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={resCustomerPhone}
                  onChange={(e) => setResCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl border border-stone-300 font-bold text-stone-900 bg-stone-50/60 focus:bg-white focus:border-[#c87a58] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1 text-xs">
                Catatan Khusus (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Meja untuk perayaan ulang tahun, minta tambahan stopkontak, dll."
                value={resNotes}
                onChange={(e) => setResNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 text-xs text-stone-900 bg-stone-50/60 focus:bg-white focus:border-[#c87a58] focus:outline-none transition-all"
              />
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleConfirmReservation}
                disabled={isSubmittingRes}
                className="w-full py-4 rounded-2xl bg-[#c87a58] hover:bg-[#b86948] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#c87a58]/30 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <CalendarDays className="w-5 h-5" />
                <span>
                  {isSubmittingRes
                    ? 'Menyimpan Reservasi...'
                    : `Konfirmasi Reservasi Meja ${selectedResTable ? `(${selectedResTable})` : ''}`
                  }
                </span>
              </button>
            </div>
          </div>
        </main>
      ) : (
        /* ======================================================== */
        /* REGULAR ORDER DINE-IN VIEW                               */
        /* ======================================================== */
        <>
          {/* 2. HERO BANNER EDGE-TO-EDGE */}
          <section className="relative w-full bg-[#181513] text-stone-100 overflow-hidden border-b border-stone-800">
            <div className="md:absolute md:top-0 md:bottom-0 md:right-0 md:w-[48%] lg:w-[50%] w-full h-64 sm:h-80 md:h-full relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80"
                alt="Aruna Coffee & Kitchen Atmosphere"
                className="w-full h-full object-cover object-center filter contrast-105 brightness-90 hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#181513] via-[#181513]/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] md:min-h-[440px] items-center">
                <div className="md:col-span-7 lg:col-span-6 py-10 md:py-14 pr-0 md:pr-8 flex flex-col justify-center space-y-4 text-left">

                  <div className="inline-flex items-center gap-2 bg-[#c87a58]/20 border border-[#c87a58]/40 px-3 py-1 rounded-full text-[11px] font-bold text-amber-300 tracking-wider uppercase w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Specialty Coffee & Artisan Kitchen</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black font-serif tracking-tight leading-[1.1] text-white">
                    Temukan rasa favoritmu.
                  </h1>

                  <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-lg font-medium">
                    Diracik hangat, disajikan dengan sepenuh hati. Nikmati self-order langsung dari meja dengan pembayaran QRIS BRI Merchant & Kasir tanpa antre.
                  </p>

                  <div className="pt-2 flex items-center gap-3 flex-wrap">
                    <a
                      href="#menu"
                      className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#c87a58] to-[#b86948] hover:from-[#b86948] hover:to-[#a25938] text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-orange-900/30 hover:scale-[1.02] active:scale-95 cursor-pointer border border-white/20"
                    >
                      <span>PESAN SEKARANG!</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setMainTab('reservation');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all border border-white/20 cursor-pointer backdrop-blur-xs"
                    >
                      <CalendarDays className="w-4 h-4" />
                      <span>Reservasi Meja</span>
                    </button>
                  </div>

                  {/* Populer Quick Tags */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs pt-1">
                    <span className="text-stone-400 font-bold shrink-0 text-[11px]">Populer:</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('Mie Aruna')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 border border-white/15 transition text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      <span>Mie Aruna Gurih</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('Udang Keju')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 border border-white/15 transition text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      <span>Udang Keju Goreng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('Es Teh')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 border border-white/15 transition text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      <span>Es Teh Tarik</span>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </section>

          {/* 3. STICKY CATEGORY NAV & INSTANT SEARCH */}
          <section className="py-2.5 bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-16 z-30 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4">

                {/* Category Buttons */}
                <div className="flex items-center flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => scrollCategoryBar('left')}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 shadow-2xs shrink-0 mr-1.5 transition-all active:scale-95 cursor-pointer"
                    aria-label="Geser kiri"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div
                    ref={categoryScrollRef}
                    className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar flex-1 min-w-0 scroll-smooth"
                  >
                    {/* Semua Menu Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('cat-all')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 whitespace-nowrap transition-all cursor-pointer border ${selectedCategory === 'cat-all'
                        ? 'bg-[#c87a58] text-white border-[#c87a58] shadow-xs'
                        : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200/90 shadow-2xs'
                        }`}
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>Semua Menu</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${selectedCategory === 'cat-all' ? 'bg-black/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                        {menuItems.length}
                      </span>
                    </button>

                    {/* Kategori Dinamis */}
                    {categories.filter(c => c.id !== 'cat-all').map(cat => {
                      const isActive = selectedCategory === cat.id;
                      const catCount = menuItems.filter(m => m.category_id === cat.id).length;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-tight whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer border ${isActive
                            ? 'bg-[#c87a58] text-white border-[#c87a58] shadow-xs'
                            : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200/90 shadow-2xs'
                            }`}
                        >
                          <span>{cat.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-black/20 text-white' : 'bg-stone-100 text-stone-500'
                            }`}>
                            {catCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollCategoryBar('right')}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 shadow-2xs shrink-0 ml-1.5 transition-all active:scale-95 cursor-pointer"
                    aria-label="Geser kanan"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-64 shrink-0">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kopi, mie, matcha..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium bg-stone-100 hover:bg-stone-200/60 focus:bg-white border border-stone-200 focus:border-[#c87a58] focus:outline-none focus:ring-1 focus:ring-[#c87a58] transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            </div>
          </section>

          {/* 4. MAIN MENU GRID */}
          <section id="menu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1 w-full">
            <div className="flex items-center justify-between border-b border-stone-200/90 pb-3 flex-wrap gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight uppercase">
                  Menu Pilihan Aruna
                </h2>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Otentik Specialty Coffee & Artisan Kitchen
                </p>
              </div>
              <div className="flex items-center gap-2">
                {totalMenuPages > 1 && (
                  <span className="text-[11px] font-bold text-[#c87a58] bg-[#c87a58]/10 px-2.5 py-1 rounded-lg border border-[#c87a58]/20">
                    Bagian {safeMenuPage} dari {totalMenuPages}
                  </span>
                )}
                <span className="text-xs font-mono font-bold text-stone-600 bg-stone-200/80 px-2.5 py-1 rounded-lg">
                  {filteredMenuItems.length} Menu
                </span>
              </div>
            </div>

            {/* EMPTY STATE JIKA TIDAK ADA MENU */}
            {filteredMenuItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200/80 p-10 sm:p-14 text-center space-y-3 shadow-2xs">
                <Search className="w-10 h-10 text-stone-300 mx-auto" />
                <h3 className="text-sm font-bold text-stone-800">Menu tidak ditemukan</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Coba cari dengan kata kunci lain atau pilih kategori &quot;Semua Menu&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('cat-all');
                  }}
                  className="px-4 py-2 bg-[#c87a58] text-white hover:bg-[#b86948] text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
                >
                  Tampilkan Semua Menu
                </button>
              </div>
            ) : (
              <>
                {/* MENU GRID: KOTAK-KOTAK 2 KOLOM DI ANDROID / MOBILE SEPERTI MIE GACOAN */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                  {paginatedMenuItems.map(item => {
                    const qtyInCart = getItemQuantityInCart(item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                      >
                        <div>
                          {/* Image Container - Kotak Persegi Ringkas */}
                          <div className="aspect-square sm:aspect-[4/3] h-28 sm:h-36 md:h-44 w-full relative overflow-hidden bg-stone-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'}
                              alt={item.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80';
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 left-2">
                              <span className={`px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${item.is_available
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-stone-800 text-stone-200'
                                }`}>
                                {item.is_available ? 'Tersedia' : 'Habis'}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-2 sm:p-3 space-y-0.5 sm:space-y-1">
                            <h3 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-tight group-hover:text-[#c87a58] transition-colors line-clamp-1 sm:line-clamp-2">
                              {item.name}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-stone-500 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Price & Add */}
                        <div className="p-2 sm:p-3 pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-t border-stone-100 mt-1">
                          <div>
                            <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase font-bold block leading-none">Harga</span>
                            <span className="text-xs sm:text-sm font-black font-mono text-stone-900 mt-0.5 block">
                              Rp {item.price.toLocaleString('id-ID')}
                            </span>
                          </div>

                          {item.is_available && (
                            <div className="w-full sm:w-auto">
                              {qtyInCart === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdd(item)}
                                  className="w-full sm:w-auto px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#c87a58] hover:bg-[#b86948] text-white text-[11px] sm:text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Tambah</span>
                                </button>
                              ) : (
                                <div className="w-full sm:w-auto flex items-center justify-center gap-1 bg-stone-100 rounded-xl border border-stone-200 p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickDecrease(item.id)}
                                    className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 font-bold text-xs cursor-pointer"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-5 text-center text-xs font-mono font-black text-stone-900">
                                    {qtyInCart}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAdd(item)}
                                    className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 font-bold text-xs cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINATION / PEMBAGIAN HALAMAN (BAGIAN 1, BAGIAN 2, ...) UNTUK SEMUA TAMPILAN */}
                <div className="pt-6 pb-2 border-t border-stone-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start text-xs text-stone-500 font-medium">
                    <span>
                      Menampilkan <strong className="text-stone-900 font-bold">{startMenuIdx + 1}–{Math.min(startMenuIdx + menuPageSize, filteredMenuItems.length)}</strong> dari <strong className="text-stone-900 font-bold">{filteredMenuItems.length}</strong> menu
                    </span>
                    {totalMenuPages > 1 && (
                      <span className="px-2 py-0.5 rounded-md bg-[#c87a58]/10 text-[#c87a58] font-bold text-[11px] border border-[#c87a58]/20">
                        Bagian {safeMenuPage} dari {totalMenuPages}
                      </span>
                    )}
                  </div>

                  {totalMenuPages > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      {/* Tombol Sebelumnya */}
                      <button
                        type="button"
                        disabled={safeMenuPage <= 1}
                        onClick={() => {
                          setMenuPage(prev => Math.max(1, prev - 1));
                          document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-35 disabled:cursor-not-allowed bg-white hover:bg-stone-50 text-stone-700 border-stone-200/90 shadow-2xs active:scale-95 cursor-pointer"
                        aria-label="Bagian sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden xs:inline">Sebelumnya</span>
                      </button>

                      {/* Pill Tombol Bagian 1, Bagian 2, dst */}
                      {Array.from({ length: totalMenuPages }, (_, i) => i + 1).map(pageNum => {
                        const isActive = pageNum === safeMenuPage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => {
                              setMenuPage(pageNum);
                              document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${isActive
                              ? 'bg-[#c87a58] text-white border-[#c87a58] shadow-xs scale-102 ring-2 ring-[#c87a58]/20'
                              : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200/90 shadow-2xs hover:border-stone-300'
                              }`}
                          >
                            Bagian {pageNum}
                          </button>
                        );
                      })}

                      {/* Tombol Berikutnya */}
                      <button
                        type="button"
                        disabled={safeMenuPage >= totalMenuPages}
                        onClick={() => {
                          setMenuPage(prev => Math.min(totalMenuPages, prev + 1));
                          document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-35 disabled:cursor-not-allowed bg-white hover:bg-stone-50 text-stone-700 border-stone-200/90 shadow-2xs active:scale-95 cursor-pointer"
                        aria-label="Bagian berikutnya"
                      >
                        <span className="hidden xs:inline">Berikutnya</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </>
      )}

      {/* ======================================================== */}
      {/* 5. SLIDE-OUT CART DRAWER (STYLE POCHA PREMIUM)           */}
      {/* ======================================================== */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setIsCartDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col h-full max-h-screen animate-in slide-in-from-right duration-300 overflow-hidden">

              {/* Header Drawer */}
              <div className="p-4 sm:p-5 bg-[#181513] text-white flex items-center justify-between shrink-0 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#c87a58] flex items-center justify-center text-white shadow-xs">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wide">Keranjang Pesanan</h3>
                    <p className="text-[11px] text-stone-400">{currentTable} | Dine In</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCartDrawerOpen(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>+ Tambah Menu</span>
                  </button>
                  <button
                    onClick={() => setIsCartDrawerOpen(false)}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                    title="Tutup Keranjang"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body Drawer */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
                    <p className="text-sm font-bold text-stone-700">Keranjang Masih Kosong</p>
                    <p className="text-xs text-stone-400">Silakan pilih menu favorit Anda terlebih dahulu.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Item List */}
                    <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50">
                      {cart.map((item) => (
                        <div key={item.cart_id} className="p-3.5 bg-white flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.menu_item.image_url} alt={item.menu_item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-stone-900 truncate">{item.menu_item.name}</h4>
                              <p className="text-[10px] text-stone-500">
                                {item.selected_variants?.map(v => v.chosen.name).join(', ') || 'Standar'}
                              </p>
                              {item.notes && (
                                <p className="text-[10px] text-stone-400 italic truncate">Note: {item.notes}</p>
                              )}
                              <p className="text-xs font-mono font-bold text-[#c87a58]">
                                Rp {item.subtotal.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center bg-stone-100 rounded-xl border border-stone-200 p-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const idx = cart.findIndex(c => c.cart_id === item.cart_id);
                                  if (idx !== -1) {
                                    const upd = [...cart];
                                    if (upd[idx].quantity > 1) {
                                      upd[idx].quantity -= 1;
                                      upd[idx].subtotal = upd[idx].quantity * upd[idx].unit_price;
                                      setCart(upd);
                                    } else {
                                      upd.splice(idx, 1);
                                      setCart(upd);
                                    }
                                  }
                                }}
                                className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 font-bold text-xs"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center text-xs font-mono font-black text-stone-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const idx = cart.findIndex(c => c.cart_id === item.cart_id);
                                  if (idx !== -1) {
                                    const upd = [...cart];
                                    upd[idx].quantity += 1;
                                    upd[idx].subtotal = upd[idx].quantity * upd[idx].unit_price;
                                    setCart(upd);
                                  }
                                }}
                                className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 font-bold text-xs"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => setCart(cart.filter(c => c.cart_id !== item.cart_id))}
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick Action: Tambah Menu Lain / Bersihkan */}
                    <div className="flex items-center justify-between px-1 py-0.5">
                      <button
                        type="button"
                        onClick={() => setIsCartDrawerOpen(false)}
                        className="text-xs font-bold text-[#c87a58] hover:text-[#b86948] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Menu Lainnya</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Kosongkan semua pesanan di keranjang?')) {
                            setCart([]);
                            setIsCartDrawerOpen(false);
                          }
                        }}
                        className="text-[11px] font-medium text-stone-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        Kosongkan Keranjang
                      </button>
                    </div>

                    {/* Form Checkout */}
                    <form onSubmit={handleSubmitOrder} className="space-y-4 pt-2">
                      <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs">
                        <div>
                          <label className="block font-bold text-stone-700 mb-1">
                            Nama Pemesan <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Dimas Setiawan"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900 bg-white focus:outline-none focus:border-[#c87a58]"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">
                            Nomor WhatsApp (Opsional)
                          </label>
                          <input
                            type="tel"
                            placeholder="Contoh: 081234567890"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900 bg-white focus:outline-none focus:border-[#c87a58]"
                          />
                        </div>

                        {/* Metode Pembayaran */}
                        <div>
                          <label className="block font-bold text-stone-700 mb-1.5">
                            Metode Pembayaran
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('qris')}
                              className={`p-2.5 rounded-xl border-2 text-center font-bold transition-all cursor-pointer ${paymentMethod === 'qris'
                                ? 'border-[#c87a58] bg-[#fcf8f5] text-[#c87a58]'
                                : 'border-stone-200 bg-white text-stone-700'
                                }`}
                            >
                              QRIS BRI
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('cashier')}
                              className={`p-2.5 rounded-xl border-2 text-center font-bold transition-all cursor-pointer ${paymentMethod === 'cashier'
                                ? 'border-[#c87a58] bg-[#fcf8f5] text-[#c87a58]'
                                : 'border-stone-200 bg-white text-stone-700'
                                }`}
                            >
                              Bayar Kasir
                            </button>
                          </div>
                        </div>

                        {/* Detail QRIS & Upload Proof */}
                        {paymentMethod === 'qris' && paymentSettings && (
                          <div className="space-y-3 pt-3 border-t border-stone-200">
                            {/* KARTU QRIS RESMI YANG BESAR & JELAS */}
                            <div className="bg-white rounded-2xl border-2 border-stone-800 p-4 shadow-sm text-center space-y-3">
                              {/* Header QRIS */}
                              <div className="border-b border-dashed border-stone-200 pb-2">
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-2xs">
                                  QRIS
                                </div>
                                <h4 className="font-black text-xs text-stone-900 uppercase mt-1">
                                  {paymentSettings.qris_merchant_name}
                                </h4>
                                <p className="text-[10px] text-stone-500 font-medium">
                                  Standar Pembayaran Digital Indonesia (NMID BRI Merchant)
                                </p>
                              </div>

                              {/* Gambar QR Code Besar & Terbaca Jelas */}
                              <div className="py-1">
                                <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto bg-white p-2.5 rounded-2xl border-2 border-stone-300 shadow-xs flex items-center justify-center overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={qrisDataUrl || paymentSettings.qris_image_url || '/qris-default.png'}
                                    alt="QRIS Pembayaran Aruna Coffee"
                                    className="w-full h-full object-contain"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setIsQrisZoomOpen(true)}
                                  className="mt-2 text-[11px] font-bold text-[#c87a58] hover:text-[#b86948] inline-flex items-center gap-1 cursor-pointer hover:underline"
                                >
                                  <Maximize2 className="w-3.5 h-3.5" />
                                  <span>Ketuk untuk Memperbesar QRIS</span>
                                </button>
                              </div>

                              {/* Total Nominal yang Harus Dibayar */}
                              <div className="bg-[#fcf8f5] p-2.5 rounded-xl border border-[#c87a58]/20 text-center space-y-0.5">
                                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Total yang Harus Dibayar</span>
                                <span className="text-base font-black font-mono text-[#c87a58] block">
                                  Rp {totalCartPrice.toLocaleString('id-ID')}
                                </span>
                              </div>

                              {/* Info Alternatif Transfer Manual */}
                              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-left">
                                <div className="min-w-0 pr-2">
                                  <span className="text-[9px] text-stone-400 font-bold block uppercase">Atau Transfer Manual:</span>
                                  <p className="font-mono font-bold text-stone-800 truncate">{paymentSettings.bank_name}: {paymentSettings.bank_account_number}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleCopyBank}
                                  className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                                >
                                  <Copy className="w-3 h-3 text-[#c87a58]" />
                                  <span>{copiedAccount ? 'Tersalin!' : 'Salin Rekening'}</span>
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block font-bold text-stone-700 mb-1">
                                Upload Bukti Bayar (Foto / PDF / File) <span className="text-rose-500">*</span>
                              </label>
                              <div className="border border-dashed border-stone-300 rounded-xl p-3 text-center bg-white">
                                {paymentProofUrl ? (
                                  <div className="space-y-2">
                                    {isPdfUrl(paymentProofUrl, paymentProofName) ? (
                                      <div className="flex items-center justify-between gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4" />
                                          </div>
                                          <div className="text-left min-w-0">
                                            <p className="text-[11px] font-bold text-stone-900 truncate">
                                              {paymentProofName || 'Bukti_Transfer_Bank.pdf'}
                                            </p>
                                            <span className="text-[10px] text-emerald-600 font-semibold block">
                                              ✓ Dokumen PDF Siap
                                            </span>
                                          </div>
                                        </div>
                                        <a
                                          href={paymentProofUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="px-2 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[10px] font-bold shrink-0"
                                        >
                                          Buka
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between gap-2 p-2 bg-stone-50 rounded-xl border border-stone-200">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={paymentProofUrl} alt="Bukti" className="w-full h-full object-cover" />
                                          </div>
                                          <div className="text-left min-w-0">
                                            <p className="text-[11px] font-bold text-stone-900 truncate">
                                              {paymentProofName || 'Foto_Bukti_Transfer.jpg'}
                                            </p>
                                            <span className="text-[10px] text-emerald-600 font-semibold block">
                                              ✓ Foto Bukti Siap
                                            </span>
                                          </div>
                                        </div>
                                        <a
                                          href={paymentProofUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="px-2 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[10px] font-bold shrink-0"
                                        >
                                          Lihat
                                        </a>
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPaymentProofUrl('');
                                        setPaymentProofName('');
                                      }}
                                      className="text-[10px] text-rose-500 underline cursor-pointer"
                                    >
                                      Ganti File Bukti
                                    </button>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer block space-y-1.5 py-1">
                                    <Upload className="w-5 h-5 text-[#c87a58] mx-auto" />
                                    <div>
                                      <span className="text-[11px] font-bold text-stone-800 block">
                                        {isUploading ? 'Mengunggah File...' : 'Pilih Bukti Transfer (Foto / PDF / File)'}
                                      </span>
                                      <span className="text-[10px] text-stone-400 block mt-0.5">
                                        Mendukung Screenshot Foto atau Dokumen PDF dari m-Banking
                                      </span>
                                    </div>
                                    <input
                                      type="file"
                                      accept="image/*,application/pdf,.pdf"
                                      onChange={handleFileUpload}
                                      className="hidden"
                                      disabled={isUploading}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {formError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{formError}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-stone-200">
                        <div className="flex items-center justify-between mb-3 text-xs">
                          <span className="font-bold text-stone-500">Total Pembayaran:</span>
                          <span className="font-mono text-base font-black text-stone-900">
                            Rp {totalCartPrice.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3.5 rounded-xl bg-[#c87a58] hover:bg-[#b86948] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Memproses Pesanan...' : 'Kirim Pesanan Sekarang'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL CUSTOMIZE MENU (PILIH VARIAN, SUHU, PEDAS)      */}
      {/* ======================================================== */}
      {customizingItem && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setCustomizingItem(null)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-[26px] sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border-t sm:border border-stone-200 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={customizingItem.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'}
                    alt={customizingItem.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-black text-sm text-stone-900 uppercase leading-tight">
                    {customizingItem.name}
                  </h3>
                  <p className="text-xs font-mono font-bold text-[#c87a58] mt-0.5">
                    Rp {customizingItem.price.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomizingItem(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Variants */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {customizingItem.variants && customizingItem.variants.length > 0 && (
                <div className="space-y-4">
                  {customizingItem.variants.map((vGroup) => (
                    <div key={vGroup.group_name} className="space-y-2">
                      <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                        {vGroup.group_name}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {vGroup.options.map((opt) => {
                          const isChosen = selectedVariants[vGroup.group_name]?.name === opt.name;
                          return (
                            <button
                              key={opt.name}
                              type="button"
                              onClick={() => {
                                setSelectedVariants({
                                  ...selectedVariants,
                                  [vGroup.group_name]: opt,
                                });
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${isChosen
                                ? 'border-[#c87a58] bg-[#fcf8f5] ring-1 ring-[#c87a58]'
                                : 'border-stone-200 bg-white hover:bg-stone-50'
                                }`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className={isChosen ? 'text-[#c87a58]' : 'text-stone-900'}>{opt.name}</span>
                                {isChosen && <Check className="w-3.5 h-3.5 text-[#c87a58]" />}
                              </div>
                              <span className="text-[10px] text-stone-500 font-medium">
                                {opt.extra_price > 0 ? `+Rp ${opt.extra_price.toLocaleString('id-ID')}` : 'Termasuk'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Catatan Khusus */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <label className="text-xs font-bold text-stone-800 block">
                  Catatan Khusus (Opsional)
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {getQuickChips(customizingItem).map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setItemNote(prev => prev ? `${prev}, ${chip}` : chip)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Contoh: Less ice, gula sedikit..."
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-[#c87a58] transition-colors"
                />
              </div>
            </div>

            {/* Footer Stepper & Save */}
            <div className="p-3 sm:p-4 border-t border-stone-200 bg-white flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-black text-xs w-5 text-center text-stone-900">
                  {itemQty}
                </span>
                <button
                  type="button"
                  onClick={() => setItemQty(itemQty + 1)}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveCustomize}
                className="flex-1 bg-[#c87a58] hover:bg-[#b86948] text-white font-black text-xs sm:text-sm py-2.5 px-3.5 rounded-xl transition-all shadow-md flex items-center justify-between cursor-pointer"
              >
                <span>Tambahkan Pesanan</span>
                <span className="bg-black/20 px-2 py-0.5 rounded-lg text-xs font-mono">
                  Rp {(calculateUnitPrice(customizingItem.price, selectedVariants) * itemQty).toLocaleString('id-ID')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL MENU PICKER UNTUK PRE-ORDER RESERVASI           */}
      {/* ======================================================== */}
      {isResMenuPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between shrink-0 bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#c87a58]/10 text-[#c87a58] flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase text-stone-900">
                    Pilih Menu Untuk Reservasi
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Menu akan disiapkan hangat saat Anda tiba di Aruna.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResMenuPickerOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search */}
            <div className="p-3.5 border-b border-stone-100 space-y-2.5 bg-white shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari menu hidangan (kopi, matcha, nasi goreng)..."
                  value={resMenuSearch}
                  onChange={(e) => setResMenuSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-bold text-stone-900 bg-stone-50 focus:bg-white border border-stone-200 focus:border-[#c87a58] outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setResMenuCategory(cat.id)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-black whitespace-nowrap transition-colors cursor-pointer border ${resMenuCategory === cat.id
                      ? 'bg-[#c87a58] text-white border-[#c87a58]'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* List Menu Picker */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-stone-100">
              {filteredResMenuItems.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs font-bold">
                  Menu tidak ditemukan.
                </div>
              ) : (
                filteredResMenuItems.map(m => {
                  const inResCart = resCart.filter(c => c.menu_item.id === m.id).reduce((s, i) => s + i.quantity, 0);
                  return (
                    <div key={m.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-stone-900 uppercase truncate">{m.name}</h4>
                          <p className="text-[10px] text-stone-500 line-clamp-1">{m.description}</p>
                          <p className="text-xs font-mono font-bold text-[#c87a58] mt-0.5">
                            Rp {m.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {inResCart > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {inResCart}x di reservasi
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            handleQuickAdd(m, true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#c87a58] hover:bg-[#b86948] text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs active:scale-95 transition-all"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Modal Picker */}
            <div className="p-3.5 sm:p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
              <div className="text-xs">
                <span className="text-stone-500">Terpilih: </span>
                <span className="font-black text-stone-900">{resCart.length} Menu</span>
                <span className="text-stone-400 font-mono ml-2">
                  (Rp {resCartTotal.toLocaleString('id-ID')})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsResMenuPickerOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Selesai Memilih
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. MODAL SUKSES RESERVASI MEJA                           */}
      {/* ======================================================== */}
      {resSuccessData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#c87a58] font-bold block mb-1">
                KODE: {resSuccessData.order_number}
              </span>
              <h3 className="text-xl font-black text-stone-900 uppercase">
                Reservasi Meja Berhasil!
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Terima kasih, <strong className="text-stone-800">{resSuccessData.customer_name}</strong>. Jadwal meja Anda telah tersimpan di sistem Aruna Coffee & Kitchen.
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Nomor Meja:</span>
                <span className="font-black text-stone-900">{resSuccessData.table_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Jadwal Kedatangan:</span>
                <span className="font-black text-stone-900">{resSuccessData.reservation_date?.replace('T', ' ')} WITA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Jumlah Tamu:</span>
                <span className="font-bold text-stone-800">{resSuccessData.guest_count} Orang</span>
              </div>
              {resSuccessData.items && resSuccessData.items.length > 0 && (
                <div className="flex justify-between pt-1 border-t border-stone-200">
                  <span className="text-stone-500">Pre-Order Menu:</span>
                  <span className="font-bold text-stone-800">{resSuccessData.items.length} Hidangan</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href={`/order/status/${resSuccessData.id}`}
                className="w-full py-3 rounded-xl bg-[#c87a58] hover:bg-[#b86948] text-white font-black text-xs uppercase tracking-wider block transition-colors"
              >
                Lihat Status Reservasi
              </Link>
              <button
                type="button"
                onClick={() => {
                  setResSuccessData(null);
                  setMainTab('order');
                }}
                className="w-full py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs transition-colors cursor-pointer"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. FOOTER BERSIH (STYLE POCHA)                           */}
      {/* ======================================================== */}
      <footer id="tentang-kami" className="bg-[#1c1917] text-stone-400 py-10 border-t border-stone-800 mt-auto text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <h4 className="font-black text-sm text-white uppercase tracking-widest">ARUNA COFFEE & KITCHEN</h4>
            <p className="text-stone-400 leading-relaxed text-[11px]">
              Menghadirkan specialty coffee, hidangan hangat artisan kitchen, dan pastry segar setiap hari di Samarinda.
            </p>
          </div>

          <div id="lokasi" className="space-y-2">
            <h4 className="font-black text-sm text-white uppercase tracking-widest">Lokasi Outlet</h4>
            <p className="text-stone-400 leading-relaxed text-[11px] flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#c87a58] shrink-0 mt-0.5" />
              <span>Jl. Pangeran Hidayatullah, Samarinda, Kalimantan Timur</span>
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-black text-sm text-white uppercase tracking-widest">Jam Operasional</h4>
            <p className="text-stone-400 leading-relaxed text-[11px] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Setiap Hari: 10:00 - 23:00 WITA</span>
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-black text-sm text-white uppercase tracking-widest">Media Sosial</h4>
            <a
              href="https://www.instagram.com/arunacafe.smd?jplx=aDI2aXMzZWlyd2Rt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-stone-300 hover:text-white transition-colors"
            >
              <InstagramIcon className="w-4 h-4 text-pink-400" />
              <span>@arunacafe.smd</span>
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-stone-800/80 text-center text-stone-500 text-[10px]">
          &copy; {new Date().getFullYear()} Aruna Coffee & Kitchen. Self-Order & Reservation POS System.
        </div>
      </footer>

      {/* ======================================================== */}
      {/* 9. FLOATING BOTTOM CART BAR (PILL ACTION BAR)            */}
      {/* ======================================================== */}
      {totalCartCount > 0 && !isCartDrawerOpen && (
        <div className="fixed z-40 bottom-18 md:bottom-6 left-0 right-0 px-3 sm:px-4 pointer-events-none transition-all duration-300">
          <div className="max-w-md mx-auto pointer-events-auto">
            <div
              onClick={() => setIsCartDrawerOpen(true)}
              className="bg-[#1f1b18] text-white px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl sm:rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.35)] border border-stone-800 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300 hover:scale-[1.01] transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-stone-800/90 text-stone-200 flex items-center justify-center shrink-0 border border-stone-700/60 shadow-inner">
                  <ShoppingBag className="w-5 h-5 text-stone-200" />
                </div>
                <div className="min-w-0 text-left">
                  <span className="text-[11px] sm:text-xs font-medium text-stone-300 block leading-tight">
                    {totalCartCount} Menu
                  </span>
                  <span className="text-sm sm:text-base font-black font-mono text-white block leading-tight mt-0.5 tracking-tight">
                    Rp {totalCartPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCartDrawerOpen(true);
                }}
                className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-[#c87a58] hover:bg-[#b86948] active:scale-95 text-white font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
              >
                <span>Checkout</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. BOTTOM NAVIGATION BAR UNTUK ANDROID / HP (< md)      */}
      {/* ======================================================== */}
      <nav className="block md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-3 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 items-center">

          {/* 1. Tab Menu */}
          <button
            type="button"
            onClick={() => {
              setMainTab('order');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${mainTab === 'order' ? 'text-[#c87a58]' : 'text-stone-400 hover:text-stone-700'
              }`}
          >
            <div className={`p-1 rounded-xl transition-all ${mainTab === 'order' ? 'bg-[#c87a58]/10' : ''}`}>
              <Utensils className="w-5 h-5" />
            </div>
            <span className={`text-[10px] tracking-tight ${mainTab === 'order' ? 'font-black' : 'font-medium'}`}>
              Menu
            </span>
          </button>

          {/* 2. Tab Reservasi */}
          <button
            type="button"
            onClick={() => {
              setMainTab('reservation');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${mainTab === 'reservation' ? 'text-[#c87a58]' : 'text-stone-400 hover:text-stone-700'
              }`}
          >
            <div className={`p-1 rounded-xl transition-all ${mainTab === 'reservation' ? 'bg-[#c87a58]/10' : ''}`}>
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className={`text-[10px] tracking-tight ${mainTab === 'reservation' ? 'font-black' : 'font-medium'}`}>
              Reservasi
            </span>
          </button>

          {/* 3. Tab Keranjang */}
          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer relative"
          >
            <div className="relative p-1">
              <ShoppingBag className="w-5 h-5 text-stone-600" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#c87a58] text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-in zoom-in-50">
                  {totalCartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight">
              Keranjang
            </span>
          </button>

          {/* 4. Tab Status Pesanan */}
          {activeCustomerOrder ? (
            <Link
              href={`/order/status/${activeCustomerOrder.id}`}
              className="flex flex-col items-center justify-center gap-1 text-emerald-600 transition-colors"
            >
              <div className="p-1 rounded-xl bg-emerald-50 relative">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] font-black tracking-tight text-emerald-700">
                Pesanan
              </span>
            </Link>
          ) : (
            <Link
              href="/kasir"
              className="flex flex-col items-center justify-center gap-1 text-stone-400 hover:text-stone-700 transition-colors"
            >
              <div className="p-1">
                <QrCode className="w-5 h-5 text-stone-600" />
              </div>
              <span className="text-[10px] font-medium tracking-tight">
                Admin
              </span>
            </Link>
          )}

        </div>
      </nav>

      {/* MODAL ZOOM / PERBESAR QRIS UNTUK CUSTOMER */}
      {isQrisZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="text-left">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                  QRIS BRI
                </span>
                <h3 className="font-black text-sm text-stone-900 uppercase mt-0.5">
                  {paymentSettings?.qris_merchant_name || 'ARUNA COFFEE & KITCHEN'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrisZoomOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border-2 border-stone-900 shadow-md inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrisDataUrl || paymentSettings?.qris_image_url || '/qris-default.png'}
                alt="QRIS Aruna"
                className="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-stone-500 font-medium">Bisa di-scan dengan BCA, BRImo, Livin, GoPay, OVO, ShopeePay atau DANA</p>
              {mainTab === 'reservation' ? (
                <p className="text-sm font-mono font-black text-[#c87a58]">
                  Transfer DP / Pre-Order: {paymentSettings?.bank_name} {paymentSettings?.bank_account_number}
                </p>
              ) : (
                <p className="text-sm font-mono font-black text-[#c87a58]">
                  Total Pembayaran: Rp {totalCartPrice.toLocaleString('id-ID')}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsQrisZoomOpen(false)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
            >
              Tutup Tampilan QRIS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center font-bold text-xs text-stone-500">Memuat Aruna Cafe...</div>}>
      <ArunaPochaStyleContent />
    </Suspense>
  );
}
