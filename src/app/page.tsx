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
  CheckCircle2,
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
  Lock,
  ShieldCheck
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

  const hasTableParam = !!searchParams.get('table');
  const tableQuery = searchParams.get('table') || 'Meja 01';
  const initialTabQuery = searchParams.get('tab');

  const getInitialMode = (): 'home' | 'order' | 'reservation' => {
    if (initialTabQuery === 'reservation') return 'reservation';
    if (hasTableParam || initialTabQuery === 'order') return 'order';
    return 'home';
  };

  // Navigation mode: 'home' (landing page) | 'order' (pesan di meja) | 'reservation' (reservasi meja)
  const [mainTab, setMainTab] = useState<'home' | 'order' | 'reservation'>(getInitialMode);

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
  const [resTime, setResTime] = useState<string>('18:00');
  const [resTimeSlot, setResTimeSlot] = useState<string>('18.00 – 21.00');
  const [resFloor, setResFloor] = useState<'Lantai 1' | 'Lantai 2'>('Lantai 1');
  const [resAllowBackupFloor, setResAllowBackupFloor] = useState<boolean>(true);
  const [resStep, setResStep] = useState<1 | 2>(1);
  const [resGuestCount, setResGuestCount] = useState<number>(4);
  const [selectedResTable, setSelectedResTable] = useState<string>('Area Bebas');
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
  const [cartCheckoutStep, setCartCheckoutStep] = useState<1 | 2>(1);
  const [copiedNominal, setCopiedNominal] = useState<boolean>(false);
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
  const cartSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const cartTax = Math.round(cartSubtotal * 0.1);
  const totalCartPrice = Math.ceil((cartSubtotal + cartTax) / 1000) * 1000;

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

    if (!resCustomerName.trim()) {
      setResFormError('Nama lengkap pemesan wajib diisi.');
      return;
    }

    if (!resCustomerPhone.trim()) {
      setResFormError('Nomor WhatsApp wajib diisi untuk konfirmasi kedatangan.');
      return;
    }

    if (!resDate) {
      setResFormError('Tanggal reservasi wajib dipilih.');
      return;
    }

    if (resStep === 1) {
      setResStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (resDpMethod === 'qris' && (!resPaymentProofUrl || resPaymentProofUrl.trim() === '')) {
      setResFormError('Silakan unggah bukti transfer pembayaran DP QRIS terlebih dahulu.');
      return;
    }

    setIsSubmittingRes(true);
    try {
      const fullReservationDate = `${resDate}T${resTime || '18:00'}`;
      const backupNote = resAllowBackupFloor ? ' [Opsi cadangan: Izinkan lantai lain]' : '';
      const floorNote = `Area: ${resFloor} (${resTimeSlot})${backupNote}`;
      const combinedNotes = resNotes.trim() ? `${floorNote}. Catatan: ${resNotes.trim()}` : floorNote;

      const newOrder = await CafeStore.createOrder({
        table_number: resFloor || 'Lantai 1',
        customer_name: resCustomerName.trim(),
        customer_phone: resCustomerPhone.trim(),
        customer_session_id: CafeStore.getCustomerSessionId(),
        order_type: 'reservation',
        reservation_date: fullReservationDate,
        guest_count: resGuestCount,
        payment_method: resDpMethod,
        payment_proof_url: resPaymentProofUrl || '',
        cart: resCart,
        notes: combinedNotes,
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
      <header className="sticky top-0 z-40 bg-[#faf8f5]/95 backdrop-blur-md border-b border-stone-200 text-stone-900 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">

            {/* Brand Logo - Matching Figma */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="w-10 h-10 rounded-2xl border border-stone-300 flex items-center justify-center bg-white shadow-2xs group-hover:border-stone-400 transition-colors">
                <Coffee className="w-5 h-5 text-stone-800" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold tracking-[0.22em] text-stone-900 uppercase font-serif">
                  ARUNA
                </span>
                <span className="text-[9px] font-semibold text-stone-500 uppercase tracking-[0.25em]">
                  CAFE & SPACE
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Switcher: Beranda, Dine In & Reservasi */}
            <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-stone-200/50 border border-stone-300/60 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMainTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                  mainTab === 'home'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Beranda</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMainTab('order');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                  mainTab === 'order'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Dine In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMainTab('reservation');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                  mainTab === 'reservation'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Reservasi</span>
              </button>
            </nav>

            {/* Actions: Akses Staf, Table, Cart */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {/* Instagram link */}
              <a
                href="https://www.instagram.com/arunacafe.smd?jplx=aDI2aXMzZWlyd2Rt"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-200/50 text-stone-600 hover:text-stone-900 text-xs font-medium transition-colors"
                title="Instagram Resmi @arunacafe.smd"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-stone-500" />
                <span>@arunacafe.smd</span>
              </a>

              {/* Akses staf - Matching Figma top right */}
              <Link
                href="/kasir"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-stone-700 hover:text-stone-950 hover:bg-stone-200/60 border border-transparent hover:border-stone-300 transition-all"
                title="Portal Akses Staf / Kasir POS"
              >
                <ShieldCheck className="w-4 h-4 text-stone-600" />
                <span>Akses staf</span>
              </Link>

              {/* Locked Table Pill */}
              <div
                className="bg-stone-100 text-stone-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-stone-200 flex items-center gap-1.5 shadow-2xs select-none"
                title={`Meja Anda terkunci pada ${currentTable} (Sesuai Scan QR)`}
              >
                <QrCode className="w-3.5 h-3.5 text-stone-500" />
                <span>{currentTable}</span>
              </div>

              {/* Keranjang Drawer Button */}
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-transform active:scale-95 shadow-xs cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keranjang</span>
                <span className="min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-stone-100 text-stone-900 text-[10px] font-black">
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
        /* RESERVASI RUANG VIEW - EXACT FIGMA DESIGN (IMAGE 1)     */
        /* ======================================================== */
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 flex items-center justify-center">
          <div className="w-full bg-white rounded-3xl sm:rounded-4xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-stone-200/80">
            
            {/* Left Column: Forest Green (#1b3728) with Editorial Typography */}
            <div className="md:col-span-5 bg-[#1b3728] text-white p-6 sm:p-9 flex flex-col justify-between relative overflow-hidden">
              {/* Background subtle leaf / arc illustration */}
              <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full border border-white/10 pointer-events-none" />
              <div className="absolute -bottom-8 -right-8 w-48 h-48 rounded-full border border-white/10 pointer-events-none" />

              <div>
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => {
                    setMainTab('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-100 hover:text-white transition-colors cursor-pointer group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Kembali</span>
                </button>

                <div className="mt-8 sm:mt-12 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300/80 block">
                    RESERVASI RUANG
                  </span>
                  <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold font-serif tracking-tight leading-[1.18] text-white">
                    Sisakan tempat untuk cerita yang penting.
                  </h1>
                  <p className="text-xs sm:text-sm text-emerald-100/75 leading-relaxed pt-1 font-sans">
                    Pilih waktu dan suasana yang sesuai. Kami akan menyiapkan ruang terbaik untukmu.
                  </p>
                </div>
              </div>

              {/* Bottom Feature Badges */}
              <div className="pt-8 sm:pt-12 space-y-4 border-t border-white/15 mt-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300/70 block">
                      Kapasitas nyaman
                    </span>
                    <span className="text-xs font-semibold text-white">
                      2–12 orang
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300/70 block">
                      Batas reservasi
                    </span>
                    <span className="text-xs font-semibold text-white">
                      Min. 6 jam sebelumnya
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Clean Reservation Form */}
            <div className="md:col-span-7 bg-white p-6 sm:p-9 flex flex-col justify-between">
              {resStep === 1 ? (
                /* LANGKAH 1: DETAIL RESERVASI */
                <div className="space-y-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-1">
                      LANGKAH 1 DARI 2
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 tracking-tight">
                      Detail reservasi
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Semua data diperlukan untuk mengonfirmasi reservasi.
                    </p>
                  </div>

                  {resFormError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{resFormError}</span>
                    </div>
                  )}

                  {/* Row 1: Nama & WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">
                        Nama lengkap *
                      </label>
                      <input
                        type="text"
                        value={resCustomerName}
                        onChange={(e) => setResCustomerName(e.target.value)}
                        placeholder="Nama kamu"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 bg-stone-50/50 focus:bg-white focus:border-stone-400 focus:outline-none transition-all placeholder:text-stone-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">
                        Nomor WhatsApp *
                      </label>
                      <input
                        type="tel"
                        value={resCustomerPhone}
                        onChange={(e) => setResCustomerPhone(e.target.value)}
                        placeholder="08xx xxxx xxxx"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 bg-stone-50/50 focus:bg-white focus:border-stone-400 focus:outline-none transition-all placeholder:text-stone-400"
                      />
                    </div>
                  </div>

                  {/* Row 2: Tanggal Reservasi */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      Tanggal reservasi *
                    </label>
                    <input
                      type="date"
                      value={resDate}
                      min={todayStr}
                      onChange={(e) => setResDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 bg-stone-50/50 focus:bg-white focus:border-stone-400 focus:outline-none transition-all cursor-pointer"
                    />
                    <span className="text-[11px] text-stone-400 font-medium mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>Reservasi paling lambat 6 jam sebelum kedatangan.</span>
                    </span>
                  </div>

                  {/* Row 3: 4 Rentang Waktu (Image 1) */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-2">
                      Pilih rentang waktu *
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        '12.00 – 15.00',
                        '15.00 – 18.00',
                        '18.00 – 21.00',
                        '21.00 – 00.00',
                      ].map((slot) => {
                        const isSelected = resTimeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setResTimeSlot(slot);
                              setResTime(slot.split(' – ')[0].replace('.', ':'));
                            }}
                            className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                                : 'bg-stone-50/60 hover:bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-stone-400'}`} />
                            <span>{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 4: Pilih Lantai (Image 1) */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-2">
                      Pilih lantai *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Lantai 1 */}
                      <div
                        onClick={() => setResFloor('Lantai 1')}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          resFloor === 'Lantai 1'
                            ? 'bg-[#f4f7f4] border-[#1b3728] ring-1 ring-[#1b3728] shadow-xs'
                            : 'bg-stone-50/60 hover:bg-stone-100/80 border-stone-200'
                        }`}
                      >
                        <Building2 className={`w-5 h-5 shrink-0 mt-0.5 ${resFloor === 'Lantai 1' ? 'text-[#1b3728]' : 'text-stone-400'}`} />
                        <div>
                          <h4 className="text-xs font-bold text-stone-900">Lantai 1</h4>
                          <p className="text-[10px] text-stone-500 mt-0.5">Dekat bar • lively</p>
                        </div>
                      </div>

                      {/* Lantai 2 */}
                      <div
                        onClick={() => setResFloor('Lantai 2')}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          resFloor === 'Lantai 2'
                            ? 'bg-[#f4f7f4] border-[#1b3728] ring-1 ring-[#1b3728] shadow-xs'
                            : 'bg-stone-50/60 hover:bg-stone-100/80 border-stone-200'
                        }`}
                      >
                        <Maximize2 className={`w-5 h-5 shrink-0 mt-0.5 ${resFloor === 'Lantai 2' ? 'text-[#1b3728]' : 'text-stone-400'}`} />
                        <div>
                          <h4 className="text-xs font-bold text-stone-900">Lantai 2</h4>
                          <p className="text-[10px] text-stone-500 mt-0.5">Lebih tenang • spacious</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Izinkan Opsi Lantai Cadangan (Checkbox) */}
                  <label className="p-3 rounded-xl border border-stone-200 bg-stone-50/40 flex items-start gap-3 cursor-pointer hover:bg-stone-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={resAllowBackupFloor}
                      onChange={(e) => setResAllowBackupFloor(e.target.checked)}
                      className="mt-0.5 rounded text-stone-900 focus:ring-stone-800 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 block leading-tight">
                        Izinkan opsi lantai cadangan
                      </span>
                      <span className="text-[11px] text-stone-500 mt-0.5 block">
                        Jika lantai pilihan penuh, kami akan menghubungimu
                      </span>
                    </div>
                  </label>

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!resCustomerName.trim() || !resCustomerPhone.trim() || !resDate) {
                          setResFormError('Harap lengkapi nama, nomor WhatsApp, dan tanggal reservasi.');
                          return;
                        }
                        setResFormError('');
                        setResStep(2);
                      }}
                      className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                        resCustomerName.trim() && resCustomerPhone.trim() && resDate
                          ? 'bg-[#1b3728] hover:bg-[#152c20] text-white'
                          : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      <span>
                        {resCustomerName.trim() && resCustomerPhone.trim() && resDate
                          ? 'Lanjut ke Pembayaran DP (QRIS) →'
                          : 'Lengkapi data reservasi →'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* LANGKAH 2: PEMBAYARAN DP QRIS */
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-1">
                        LANGKAH 2 DARI 2
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 tracking-tight">
                        Pembayaran DP
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResStep(1)}
                      className="text-xs font-semibold text-stone-600 hover:text-stone-900 underline cursor-pointer"
                    >
                      Ubah Data
                    </button>
                  </div>

                  {resFormError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{resFormError}</span>
                    </div>
                  )}

                  {/* Ringkasan Booking */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs text-stone-700">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Pemesan:</span>
                      <strong className="text-stone-900">{resCustomerName} ({resCustomerPhone})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Jadwal:</span>
                      <strong className="text-stone-900">{resDate} • {resTimeSlot}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Area:</span>
                      <strong className="text-stone-900">{resFloor}</strong>
                    </div>
                  </div>

                  {/* QRIS DP Card */}
                  <div className="p-4 rounded-2xl border border-stone-200 text-center space-y-3 bg-[#faf8f5]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                      Transfer DP Reservasi
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-serif font-black text-stone-900">
                        Rp 50.000
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('50000');
                          setCopiedAccount(true);
                          setTimeout(() => setCopiedAccount(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-50 text-[10px] font-bold text-stone-700 flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-stone-600" />
                        <span>{copiedAccount ? 'Tersalin!' : 'Salin'}</span>
                      </button>
                    </div>

                    <div className="w-48 h-48 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-xs mx-auto">
                      <img
                        src={qrisDataUrl || paymentSettings?.qris_image_url || '/qris-default.png'}
                        alt="QRIS DP Aruna"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Scan QRIS dengan BCA, BRImo, Livin, GoPay, OVO, ShopeePay atau DANA.
                    </p>
                  </div>

                  {/* Upload Bukti Transfer DP */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      Unggah Bukti Transfer DP *
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingResProof(true);
                        setResFormError('');
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          const res = await fetch('/api/upload-proof', {
                            method: 'POST',
                            body: formData,
                          });
                          const json = await res.json();
                          if (json.url) {
                            setResPaymentProofUrl(json.url);
                            setResPaymentProofName(file.name);
                          } else {
                            throw new Error(json.error || 'Gagal mengunggah');
                          }
                        } catch (err) {
                          setResFormError(err instanceof Error ? err.message : 'Gagal mengunggah bukti');
                        } finally {
                          setIsUploadingResProof(false);
                        }
                      }}
                      className="block w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-stone-800 cursor-pointer"
                    />
                    {isUploadingResProof && (
                      <span className="text-[11px] text-amber-600 font-medium mt-1 block">
                        Mengunggah bukti transfer...
                      </span>
                    )}
                    {resPaymentProofName && (
                      <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
                        ✓ Bukti terpilih: {resPaymentProofName}
                      </span>
                    )}
                  </div>

                  {/* Konfirmasi Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmReservation}
                      disabled={isSubmittingRes || isUploadingResProof || !resPaymentProofUrl}
                      className="w-full py-3.5 rounded-xl bg-[#1b3728] hover:bg-[#152c20] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <CalendarDays className="w-4 h-4" />
                      <span>{isSubmittingRes ? 'Memproses Reservasi...' : 'Konfirmasi Reservasi Ruang →'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      ) : mainTab === 'home' ? (
        /* ======================================================== */
        /* 2. HOME LANDING VIEW (FIGMA DESIGN - MENU TERSEMBUNYI)   */
        /* ======================================================== */
        <main className="flex-1 flex flex-col justify-center">
          {/* 2. HERO BANNER - EXACT FIGMA DESIGN */}
          <section className="relative w-full bg-[#faf8f5] text-stone-900 overflow-hidden">
            {/* Concentric Decorative Rings on the Left (Figma) */}
            <div className="absolute -left-56 sm:-left-44 top-1/2 -translate-y-1/2 w-[460px] h-[460px] sm:w-[600px] sm:h-[600px] rounded-full border border-stone-300/50 pointer-events-none" />
            <div className="absolute -left-40 sm:-left-28 top-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] rounded-full border border-stone-300/50 pointer-events-none" />
            <div className="absolute -left-24 sm:-left-14 top-1/2 -translate-y-1/2 w-[220px] h-[220px] sm:w-[320px] sm:h-[320px] rounded-full border border-stone-300/50 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-12 sm:pt-16 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
                
                {/* Left Column: Heading & Description */}
                <div className="lg:col-span-6 flex flex-col justify-center text-left space-y-4">
                  {/* Eyebrow */}
                  <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-stone-600">
                    <Sparkles className="w-3.5 h-3.5 text-stone-500" />
                    <span>Selamat datang di Aruna</span>
                  </div>

                  {/* Serif Heading */}
                  <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-bold font-serif tracking-tight leading-[1.12] text-stone-900">
                    Waktu yang<br />
                    baik,<br />
                    <span className="italic font-normal">dimulai di sini.</span>
                  </h1>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-md pt-1">
                    Nikmati kopi, makanan, dan ruang nyaman di tengah Samarinda Seberang. Pilih kebutuhanmu untuk memulai.
                  </p>
                </div>

                {/* Right Column: Two Interactive Cards (Figma) */}
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  
                  {/* Card 01 - Dine In */}
                  <div
                    onClick={() => {
                      setMainTab('order');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group relative bg-[#dce7de] hover:bg-[#d4e2d7] rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md border border-stone-300/40 overflow-hidden min-h-[340px] sm:min-h-[380px]"
                  >
                    {/* Background subtle curve */}
                    <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/20 pointer-events-none transition-transform group-hover:scale-110 duration-500" />

                    <div>
                      <span className="text-xs font-mono font-medium text-stone-500 tracking-widest block mb-8">
                        01
                      </span>
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-xs text-stone-800 mb-8 group-hover:scale-105 transition-transform">
                        <UtensilsCrossed className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 tracking-tight">
                        Dine In
                      </h2>
                      <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed mt-2.5 max-w-[220px]">
                        Pesan langsung dari meja, tanpa perlu antre.
                      </p>
                    </div>

                    <div className="border-t border-stone-400/30 pt-4 mt-8 flex items-center justify-between text-xs sm:text-sm font-semibold text-stone-900">
                      <span>Mulai pesan</span>
                      <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
                    </div>
                  </div>

                  {/* Card 02 - Reservasi */}
                  <div
                    onClick={() => {
                      setMainTab('reservation');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group relative bg-[#ece0cf] hover:bg-[#e6d8c4] rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md border border-stone-300/40 overflow-hidden min-h-[340px] sm:min-h-[380px]"
                  >
                    {/* Background subtle curve */}
                    <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-white/20 pointer-events-none transition-transform group-hover:scale-110 duration-500" />

                    <div>
                      <span className="text-xs font-mono font-medium text-stone-500 tracking-widest block mb-8">
                        02
                      </span>
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-xs text-stone-800 mb-8 group-hover:scale-105 transition-transform">
                        <CalendarDays className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 tracking-tight">
                        Reservasi
                      </h2>
                      <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed mt-2.5 max-w-[220px]">
                        Amankan tempat untuk momen spesialmu.
                      </p>
                    </div>

                    <div className="border-t border-stone-400/30 pt-4 mt-8 flex items-center justify-between text-xs sm:text-sm font-semibold text-stone-900">
                      <span>Pilih jadwal</span>
                      <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Operational Info Bar - Matching Figma */}
              <div className="border-t border-stone-300/70 pt-8 mt-12 sm:mt-16">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12">
                    {/* Jam Operasional */}
                    <div className="flex items-start gap-3">
                      <div className="p-1 text-stone-700">
                        <Clock className="w-5 h-5 stroke-[1.75]" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                          JAM OPERASIONAL
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-stone-800">
                          Weekdays 09.00 – 01.00
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-stone-800">
                          Weekend 09.00 – 02.00
                        </p>
                      </div>
                    </div>

                    {/* Lokasi */}
                    <div className="flex items-start gap-3">
                      <div className="p-1 text-stone-700">
                        <MapPin className="w-5 h-5 stroke-[1.75]" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                          LOKASI KAMI
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-stone-800">
                          Jl. Bung Tomo
                        </p>
                        <p className="text-xs sm:text-sm text-stone-600">
                          Samarinda Seberang
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Pill: Buka Sekarang */}
                  <div className="self-start md:self-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#dce7de] text-[#1e5631] text-xs font-semibold shadow-2xs border border-[#cfe0d2]">
                      <span className="w-2 h-2 rounded-full bg-[#1e5631]" />
                      <span>Buka sekarang</span>
                    </div>
                  </div>

                </div>

                {/* Footer Copyright */}
                <div className="text-center text-[11px] text-stone-400 pt-8 pb-2">
                  © 2025 Aruna Cafe • Samarinda, Kalimantan Timur
                </div>
              </div>

            </div>
          </section>
        </main>
      ) : (
        /* ======================================================== */
        /* 3. DINE-IN MENU ORDER VIEW (EXACT FIGMA DESIGN) */
        <main className="flex-1 flex flex-col bg-[#faf8f5] min-h-screen pb-28">
          {/* Top Header Bar */}
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-4">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  setMainTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Kembali</span>
              </button>

              {/* Table Pill top right (Figma) */}
              <div className="border border-stone-200/90 bg-white rounded-2xl px-4 py-1.5 text-center shadow-2xs select-none">
                <span className="text-[8px] font-bold text-stone-400 tracking-widest uppercase block leading-none">
                  MEJA
                </span>
                <span className="text-base sm:text-lg font-serif font-black text-stone-900 leading-tight block">
                  {currentTable.replace(/[^0-9]/g, '') || '14'}
                </span>
              </div>
            </div>

            {/* Main Title & Subtitle */}
            <div className="mt-4 space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-stone-900 tracking-tight">
                Mau pesan apa hari ini?
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 font-medium">
                Semua diracik segar saat kamu pesan.
              </p>
            </div>
          </div>

          {/* Clean Horizontal Category Tabs (Figma) */}
          <div className="sticky top-16 z-20 bg-[#faf8f5]/95 backdrop-blur-md border-b border-stone-200/80 mb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`pb-2.5 pt-1 text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer relative ${
                        isActive
                          ? 'text-stone-900 font-bold border-b-2 border-[#1b3728]'
                          : 'text-stone-500 hover:text-stone-800 font-medium'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              {/* Search input in category bar */}
              <div className="relative hidden sm:block w-52 shrink-0 py-1.5">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kopi, mie..."
                  className="w-full pl-8 pr-6 py-1.5 rounded-xl text-xs bg-white border border-stone-200 focus:outline-none focus:border-[#1b3728]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product Cards Grid (3 Columns Desktop, 1-2 Columns Mobile) */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
            {filteredMenuItems.length === 0 ? (
              <div className="text-center py-16 space-y-3 bg-white rounded-3xl border border-stone-200/80 p-8">
                <Coffee className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="text-sm font-bold text-stone-700">Menu tidak ditemukan</p>
                <p className="text-xs text-stone-400">Coba kata kunci pencarian lain atau pilih kategori lain.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedMenuItems.map((item, idx) => {
                  const qtyInCart = getItemQuantityInCart(item.id);
                  // Pastel backgrounds matching Figma cards
                  const pastelColors = [
                    'bg-[#cfbeb0]', // warm beige
                    'bg-[#c6b49e]', // cafe latte
                    'bg-[#bec7b4]', // matcha green
                    'bg-[#d5c3b9]', // soft mocca
                    'bg-[#c2b9a7]', // warm ivory
                    'bg-[#b6c4b2]', // sage
                  ];
                  const bgColor = pastelColors[idx % pastelColors.length];

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                    >
                      {/* Top Pastel Container with centered drink visual */}
                      <div className={`${bgColor} h-52 w-full flex items-center justify-center p-6 relative overflow-hidden`}>
                        {/* Realistic Image with smooth styling */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80'}
                          alt={item.name}
                          className="h-36 w-36 object-cover rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Bottom White Container */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          {/* Badge Tag (BEST SELLER / SIGNATURE / NEW) */}
                          {item.badge ? (
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider block ${
                                item.badge === 'BEST SELLER'
                                  ? 'text-[#c85a32]'
                                  : item.badge === 'SIGNATURE'
                                  ? 'text-[#8d5b36]'
                                  : 'text-[#c87a20]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                              ARUNA SPECIAL
                            </span>
                          )}

                          {/* Item Title in Serif */}
                          <h3 className="text-lg font-serif font-bold text-stone-900 group-hover:text-[#1b3728] transition-colors leading-snug">
                            {item.name}
                          </h3>

                          {/* Description */}
                          <p className="text-xs text-stone-500 font-normal line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Price & Action Row */}
                        <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                          <span className="text-sm font-bold font-mono text-stone-900">
                            Rp {item.price.toLocaleString('id-ID')}
                          </span>

                          <div>
                            {qtyInCart === 0 ? (
                              <button
                                type="button"
                                onClick={() => handleQuickAdd(item)}
                                className="w-8 h-8 rounded-full bg-[#edf2ee] hover:bg-[#dfeade] text-stone-800 flex items-center justify-center font-bold text-base transition-transform active:scale-90 cursor-pointer shadow-2xs"
                                title="Tambah ke Keranjang"
                              >
                                +
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 bg-[#edf2ee] text-stone-900 rounded-full px-2.5 py-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuickDecrease(item.id)}
                                  className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-stone-900 font-bold text-xs cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-mono font-black w-4 text-center">
                                  {qtyInCart}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdd(item)}
                                  className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-stone-900 font-bold text-xs cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      )}

      {/* 5. SLIDE-OUT CART DRAWER (2-STEP CHECKOUT DINE IN) */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setIsCartDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col h-full max-h-screen animate-in slide-in-from-right duration-300 overflow-hidden">

              {/* Drawer Header */}
              <div className="p-4 sm:p-5 bg-[#162a1f] text-white flex items-center justify-between shrink-0 border-b border-emerald-950">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <ShoppingBag className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm tracking-wide">
                      {cartCheckoutStep === 1 ? 'Pesanan Dine-In' : 'Pembayaran Pesanan'}
                    </h3>
                    <p className="text-[11px] text-stone-300">
                      {currentTable} • Langkah {cartCheckoutStep} dari 2
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
                    <p className="text-sm font-bold text-stone-700">Keranjang Masih Kosong</p>
                    <p className="text-xs text-stone-400">Silakan pilih menu favorit Anda di katalog terlebih dahulu.</p>
                  </div>
                ) : cartCheckoutStep === 1 ? (
                  /* STEP 1: REVIEW MENU & MANDATORY DATA */
                  <div className="space-y-5">
                    {/* Items List */}
                    <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50">
                      {cart.map((item) => (
                        <div key={item.cart_id} className="p-3.5 bg-white flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.menu_item.image_url} alt={item.menu_item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-stone-900 truncate font-serif">{item.menu_item.name}</h4>
                              <p className="text-[10px] text-stone-500">
                                {item.selected_variants?.map(v => v.chosen.name).join(', ') || 'Standar'}
                              </p>
                              {item.notes && (
                                <p className="text-[10px] text-stone-400 italic truncate">Note: {item.notes}</p>
                              )}
                              <p className="text-xs font-mono font-bold text-stone-900 mt-0.5">
                                Rp {item.subtotal.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center bg-[#edf2ee] rounded-full p-0.5 px-1.5">
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
                                className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-stone-900 font-bold text-xs"
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
                                className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-stone-900 font-bold text-xs"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => setCart(cart.filter(c => c.cart_id !== item.cart_id))}
                              className="p-1 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Form Identitas Pelanggan (SEMUA WAJIB SESUAI PRD) */}
                    <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 space-y-3.5">
                      <div className="border-b border-stone-200 pb-2">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                          Data Pelanggan (Wajib Diisi)
                        </span>
                        <p className="text-[11px] text-stone-500 font-medium">
                          Diperlukan untuk konfirmasi meja & pengiriman notifikasi pesanan selesai.
                        </p>
                      </div>

                      {formError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                          <span>{formError}</span>
                        </div>
                      )}

                      {/* Nama Pemesan */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-stone-800">
                          Nama Pemesan <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Contoh: Rina / Dimas"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium text-stone-900 bg-white focus:outline-none focus:border-[#1b3728]"
                        />
                      </div>

                      {/* Nomor WhatsApp Aktif */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-stone-800">
                          Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Contoh: 083152076304"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium text-stone-900 bg-white focus:outline-none focus:border-[#1b3728]"
                        />
                        <span className="text-[10px] text-stone-400 block">
                          Bot Aruna akan mengirimkan notifikasi saat pesanan selesai.
                        </span>
                      </div>

                      {/* Catatan Pesanan */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-stone-800">
                          Catatan Pesanan <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          placeholder="Contoh: Less ice, sambal dipisah / Tidak ada catatan khusus"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium text-stone-900 bg-white focus:outline-none focus:border-[#1b3728]"
                        />
                      </div>
                    </div>

                    {/* Tombol Next Slide Payment */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!customerName.trim() || !customerPhone.trim() || !orderNotes.trim()) {
                          setFormError('Nama lengkap, nomor WhatsApp aktif, dan catatan pesanan wajib diisi!');
                          return;
                        }
                        setFormError('');
                        setCartCheckoutStep(2);
                      }}
                      className="w-full py-3.5 rounded-xl bg-[#1b3728] hover:bg-[#152c20] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-98"
                    >
                      <span>Lanjut ke Pembayaran →</span>
                    </button>
                  </div>
                ) : (
                  /* STEP 2: NEXT SLIDE PAYMENT (2 OPSI: BAYAR DI KASIR / QRIS) */
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <button
                      type="button"
                      onClick={() => setCartCheckoutStep(1)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Data Pesanan</span>
                    </button>

                    {/* Rincian Biaya (Pajak 10% & Pembulatan 1000 Sesuai PRD) */}
                    <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Subtotal ({totalCartCount} item)</span>
                        <span className="font-mono font-medium">Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Pajak Restoran (10%)</span>
                        <span className="font-mono font-medium">Rp {cartTax.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="border-t border-stone-200 pt-2 flex justify-between items-baseline">
                        <div>
                          <span className="font-bold text-stone-900 block">Total Pembayaran</span>
                          <span className="text-[10px] text-stone-400">Termasuk pembulatan ke Rp 1.000</span>
                        </div>
                        <span className="text-base font-black font-mono text-[#1b3728]">
                          Rp {totalCartPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Pilihan Metode Pembayaran (2 opsi: Kasir / QRIS) */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-stone-800">
                        Pilih Metode Pembayaran
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cashier')}
                          className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                            paymentMethod === 'cashier'
                              ? 'border-[#1b3728] bg-[#f2f7f3] text-[#1b3728] font-bold'
                              : 'border-stone-200 bg-white text-stone-600 font-medium hover:border-stone-300'
                          }`}
                        >
                          <UtensilsCrossed className="w-4 h-4 mx-auto mb-1 opacity-80" />
                          <span className="text-xs block">Bayar di Kasir</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('qris')}
                          className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                            paymentMethod === 'qris'
                              ? 'border-[#1b3728] bg-[#f2f7f3] text-[#1b3728] font-bold'
                              : 'border-stone-200 bg-white text-stone-600 font-medium hover:border-stone-300'
                          }`}
                        >
                          <QrCode className="w-4 h-4 mx-auto mb-1 opacity-80" />
                          <span className="text-xs block">QRIS (Scan Barcode)</span>
                        </button>
                      </div>
                    </div>

                    {/* Jika QRIS dipilih: Barcode QRIS Otomatis Muncul */}
                    {paymentMethod === 'qris' && (
                      <div className="bg-white rounded-2xl border-2 border-stone-800 p-4 shadow-sm text-center space-y-3 animate-in zoom-in-95 duration-200">
                        <div className="border-b border-dashed border-stone-200 pb-2">
                          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-2xs">
                            QRIS
                          </div>
                          <h4 className="font-bold text-xs text-stone-900 uppercase mt-1">
                            {paymentSettings?.qris_merchant_name || 'ARUNA CAFE & SPACE'}
                          </h4>
                          <p className="text-[10px] text-stone-500">
                            Scan langsung melalui BCA, Mandiri, BRImo, GoPay, OVO, ShopeePay
                          </p>
                        </div>

                        {/* QR Code Container */}
                        <div className="w-44 h-44 mx-auto bg-white p-2 rounded-xl border border-stone-300 shadow-2xs flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={qrisDataUrl || paymentSettings?.qris_image_url || '/qris-default.png'}
                            alt="QRIS Aruna Cafe"
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {/* Nominal yang Harus Dibayar & Fitur Copy Sesuai PRD */}
                        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex items-center justify-between gap-2">
                          <div className="text-left">
                            <span className="text-[9px] text-stone-400 font-bold uppercase block">Nominal Pembayaran</span>
                            <span className="text-sm font-mono font-black text-stone-900">
                              Rp {totalCartPrice.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(String(totalCartPrice));
                              setCopiedNominal(true);
                              setTimeout(() => setCopiedNominal(false), 2000);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedNominal ? 'Tersalin!' : 'Salin Nominal'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Jika Bayar di Kasir: Barcode Otomatis Tertutup */}
                    {paymentMethod === 'cashier' && (
                      <div className="bg-[#f7f9f7] border border-emerald-900/20 rounded-2xl p-4 text-center space-y-1 animate-in fade-in duration-200">
                        <UtensilsCrossed className="w-6 h-6 text-[#1b3728] mx-auto opacity-80" />
                        <h4 className="text-xs font-bold text-stone-900">Bayar di Kasir</h4>
                        <p className="text-[11px] text-stone-500 leading-relaxed max-w-xs mx-auto">
                          Setelah menekan konfirmasi, silakan tunjukkan nomor <strong>{currentTable}</strong> ke kasir untuk menyelesaikan pembayaran.
                        </p>
                      </div>
                    )}

                    {/* Tombol Konfirmasi Pesanan */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={(e) => handleSubmitOrder(e as any)}
                      className="w-full py-3.5 rounded-xl bg-[#1b3728] hover:bg-[#152c20] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{isSubmitting ? 'Memproses Pesanan...' : 'Konfirmasi Pesanan →'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 6. MODAL CUSTOMIZE MENU (PILIH VARIAN, SUHU, PEDAS) */}
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
      {/* 9. FLOATING BOTTOM CART BAR (EXACT FIGMA DESIGN) */}
      {totalCartCount > 0 && !isCartDrawerOpen && (
        <div className="fixed z-40 bottom-6 left-0 right-0 px-4 pointer-events-none transition-all duration-300">
          <div className="max-w-xl mx-auto pointer-events-auto">
            <div
              onClick={() => {
                setCartCheckoutStep(1);
                setIsCartDrawerOpen(true);
              }}
              className="bg-[#162a1f] text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-900/40 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300 hover:scale-[1.01] transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                  <ShoppingBag className="w-4 h-4 text-amber-300" />
                </div>
                <div className="text-left">
                  <span className="text-xs sm:text-sm font-semibold text-white tracking-tight block">
                    {totalCartCount} item • Rp {totalCartPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCartCheckoutStep(1);
                  setIsCartDrawerOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#dfb489] hover:bg-[#d0a579] text-stone-900 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
              >
                <span>Lihat pesanan</span>
                <span className="font-bold">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 10. BOTTOM NAVIGATION BAR UNTUK ANDROID / HP */}
      {/* ======================================================== */}
      <nav className="block md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-3 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 items-center">

          {/* 1. Tab Beranda */}
          <button
            type="button"
            onClick={() => {
              setMainTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              mainTab === 'home' ? 'text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-700 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${mainTab === 'home' ? 'bg-stone-100 text-stone-900' : ''}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">
              Beranda
            </span>
          </button>

          {/* 2. Tab Dine In */}
          <button
            type="button"
            onClick={() => {
              setMainTab('order');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              mainTab === 'order' ? 'text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-700 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${mainTab === 'order' ? 'bg-stone-100 text-stone-900' : ''}`}>
              <Utensils className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">
              Dine In
            </span>
          </button>

          {/* 3. Tab Reservasi */}
          <button
            type="button"
            onClick={() => {
              setMainTab('reservation');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              mainTab === 'reservation' ? 'text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-700 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${mainTab === 'reservation' ? 'bg-stone-100 text-stone-900' : ''}`}>
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">
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
