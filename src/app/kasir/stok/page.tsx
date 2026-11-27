'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CafeStore } from '@/lib/store';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminTopNav } from '@/components/AdminTopNav';
import { RawMaterial, RecipeItem, StockMutation, MenuItem, MenuCategory, MenuVariant } from '@/lib/types';
import {
  ArrowLeft,
  Layers,
  Plus,
  AlertTriangle,
  Clock,
  BookOpen,
  CheckCircle,
  RefreshCw,
  Package,
  UtensilsCrossed,
  QrCode,
  ExternalLink,
  ChevronRight,
  CreditCard,
  Trash2,
  X,
  Check,
  Coffee,
  AlertCircle,
  Edit3,
  Upload,
  Image as ImageIcon,
  Flame,
  ToggleLeft,
  ToggleRight,
  Settings2,
  Eye,
  EyeOff,
  Sparkles,
  Search,
  ChevronDown,
  CalendarDays
} from 'lucide-react';

interface SearchableMaterialSelectProps {
  materials: RawMaterial[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

function SearchableMaterialSelect({
  materials,
  value,
  onChange,
  placeholder = '-- Pilih Bahan Dari Stok --',
}: SearchableMaterialSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedMat = materials.find((m) => m.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredMaterials = materials.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || m.unit.toLowerCase().includes(q);
  });

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-50' : 'z-10'}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-xs font-bold text-stone-900 bg-stone-50 hover:bg-stone-100/90 border border-stone-300 rounded-xl px-3 py-2.5 focus:border-[#c87a58] focus:bg-white focus:ring-2 focus:ring-[#c87a58]/20 outline-none transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-2 truncate">
          <Package className="w-3.5 h-3.5 text-[#c87a58] shrink-0" />
          {selectedMat ? (
            <span className="truncate">
              <span className="text-stone-900">{selectedMat.name}</span>{' '}
              <span className="text-[10px] text-stone-500 font-normal">({selectedMat.unit})</span>
            </span>
          ) : (
            <span className="text-stone-400 font-normal truncate">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selectedMat && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-200/80 text-stone-700 font-mono font-semibold">
              Sisa: {selectedMat.current_stock.toLocaleString('id-ID')}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${isOpen ? 'rotate-180 text-[#c87a58]' : ''}`} />
        </div>
      </button>

      {/* Searchable Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-stone-300 shadow-[0_16px_36px_rgba(0,0,0,0.25)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search Header */}
          <div className="p-2 border-b border-stone-100 bg-stone-50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik cari bahan (kopi, susu, beras, telur)..."
              className="w-full text-xs bg-transparent outline-none font-bold text-stone-900 placeholder:text-stone-400 placeholder:font-normal"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filtered Material List */}
          <div className="max-h-52 overflow-y-auto divide-y divide-stone-100 text-xs">
            {filteredMaterials.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-stone-400 font-medium">
                Bahan &quot;{searchQuery}&quot; tidak ditemukan.
              </div>
            ) : (
              filteredMaterials.map((mat) => {
                const isSelected = mat.id === value;
                return (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => {
                      onChange(mat.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-amber-50/80 transition-colors cursor-pointer ${isSelected ? 'bg-amber-50 font-black text-[#c87a58]' : 'text-stone-800'
                      }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-bold text-xs">{mat.name}</span>
                      <span className="text-[10px] text-stone-400">
                        Satuan: <span className="font-mono text-stone-600 uppercase font-semibold">{mat.unit}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-md ${mat.current_stock <= mat.minimum_stock
                            ? 'bg-rose-100 text-rose-700 font-bold'
                            : 'bg-stone-100 text-stone-700 font-semibold'
                          }`}
                      >
                        Sisa: {mat.current_stock.toLocaleString('id-ID')} {mat.unit}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#c87a58]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StokManagementPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>(() => CafeStore.getInitialRawMaterials());
  const [recipes, setRecipes] = useState<RecipeItem[]>(() => CafeStore.getInitialRecipes());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => CafeStore.getInitialMenuItems());
  const [categories, setCategories] = useState<MenuCategory[]>(() => CafeStore.getInitialCategories());
  const [mutations, setMutations] = useState<StockMutation[]>(() => CafeStore.getInitialStockMutations());
  const [activeTab, setActiveTab] = useState<'stok' | 'resep' | 'mutasi'>('stok');

  // Modal 1: Restock Bahan
  const [restockMaterial, setRestockMaterial] = useState<RawMaterial | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(100);
  const [restockReason, setRestockReason] = useState<string>('Restock belanja harian');

  // Modal 2: Tambah Bahan Baku Baru
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState<boolean>(false);
  const [newMatName, setNewMatName] = useState<string>('');
  const [newMatUnit, setNewMatUnit] = useState<'gram' | 'ml' | 'pcs' | 'porsi'>('gram');
  const [newMatStock, setNewMatStock] = useState<number>(1000);
  const [newMatMinStock, setNewMatMinStock] = useState<number>(200);

  // Modal 3: Tambah Menu Baru (+ WAJIB INPUT RESEP DARI STOK BAKU + OPSI VARIAN)
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const [newMenuName, setNewMenuName] = useState<string>('');
  const [newMenuCatId, setNewMenuCatId] = useState<string>('cat-kopi');
  const [newMenuPrice, setNewMenuPrice] = useState<number>(25000);
  const [newMenuDesc, setNewMenuDesc] = useState<string>('');
  const [newMenuImage, setNewMenuImage] = useState<string>('https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80');
  const [newMenuRecipes, setNewMenuRecipes] = useState<{ raw_material_id: string; quantity_required: number }[]>([
    { raw_material_id: '', quantity_required: 15 }
  ]);
  // Varian Opsi untuk Tambah Menu
  const [addTempVariant, setAddTempVariant] = useState<boolean>(true); // Suhu (Hot/Ice)
  const [addSpicyVariant, setAddSpicyVariant] = useState<boolean>(false); // Level Pedas
  const [addSugarVariant, setAddSugarVariant] = useState<boolean>(false); // Level Gula
  const [menuFormError, setMenuFormError] = useState<string | null>(null);

  // Modal 4: Edit Resep Bahan Baku
  const [editingMenuForRecipe, setEditingMenuForRecipe] = useState<MenuItem | null>(null);
  const [editRecipeList, setEditRecipeList] = useState<{ raw_material_id: string; quantity_required: number }[]>([]);
  const [editMenuImage, setEditMenuImage] = useState<string>('');

  // Modal 5: Edit Menu & Opsi Varian Lengkap (CRUD)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [editMenuName, setEditMenuName] = useState<string>('');
  const [editMenuCatId, setEditMenuCatId] = useState<string>('cat-kopi');
  const [editMenuPrice, setEditMenuPrice] = useState<number>(25000);
  const [editMenuDesc, setEditMenuDesc] = useState<string>('');
  const [editMenuAvailable, setEditMenuAvailable] = useState<boolean>(true);
  const [editMenuImg, setEditMenuImg] = useState<string>('');
  const [editTempVariant, setEditTempVariant] = useState<boolean>(false);
  const [editSpicyVariant, setEditSpicyVariant] = useState<boolean>(false);
  const [editSugarVariant, setEditSugarVariant] = useState<boolean>(false);

  // Modal 6: Konfirmasi Hapus Menu
  const [deletingMenu, setDeletingMenu] = useState<MenuItem | null>(null);

  // Feedback Banner
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, mode: 'new' | 'edit-recipe' | 'edit-menu' = 'new') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (mode === 'edit-recipe') {
        setEditMenuImage(dataUrl);
      } else if (mode === 'edit-menu') {
        setEditMenuImg(dataUrl);
      } else {
        setNewMenuImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const buildVariants = (hasTemp: boolean, hasSpicy: boolean, hasSugar: boolean, existingOtherVariants: MenuVariant[] = [], menuItemId = ''): MenuVariant[] => {
    const vars: MenuVariant[] = [];
    if (hasTemp) {
      vars.push({
        id: `var-temp-${Date.now()}`,
        menu_item_id: menuItemId,
        group_name: 'Pilihan Suhu',
        is_required: true,
        options: [
          { name: 'Iced (Dingin)', extra_price: 0 },
          { name: 'Hot (Panas)', extra_price: 0 },
        ],
      });
    }
    if (hasSpicy) {
      vars.push({
        id: `var-spicy-${Date.now()}`,
        menu_item_id: menuItemId,
        group_name: 'Level Pedas',
        is_required: true,
        options: [
          { name: 'Tidak Pedas', extra_price: 0 },
          { name: 'Pedas Sedang', extra_price: 0 },
          { name: 'Extra Pedas (Level 3)', extra_price: 2000 },
        ],
      });
    }
    if (hasSugar) {
      vars.push({
        id: `var-sugar-${Date.now()}`,
        menu_item_id: menuItemId,
        group_name: 'Level Gula',
        is_required: true,
        options: [
          { name: 'Normal Sweet (100%)', extra_price: 0 },
          { name: 'Less Sweet (50%)', extra_price: 0 },
          { name: 'No Sugar (0%)', extra_price: 0 },
        ],
      });
    }
    return [...vars, ...existingOtherVariants];
  };

  const loadData = async () => {
    // 1. Prioritas utama: Bahan baku & Resep
    const [mats, recs] = await Promise.all([
      CafeStore.getRawMaterials(),
      CafeStore.getRecipes(),
    ]);
    setMaterials(mats);
    setRecipes(recs);

    // Default first material id for new menu recipe line
    if (mats.length > 0) {
      setNewMenuRecipes(prev => {
        if (prev.length === 1 && !prev[0].raw_material_id) {
          return [{ raw_material_id: mats[0].id, quantity_required: 15 }];
        }
        return prev;
      });
    }

    // 2. Load background items, mutasi & kategori secara non-blocking
    const [items, muts, cats] = await Promise.all([
      CafeStore.getMenuItems(),
      CafeStore.getStockMutations(),
      CafeStore.getCategories(),
    ]);
    setMenuItems(items);
    setMutations(muts);
    setCategories(cats);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('arjuna_store_updated', handleUpdate);
    return () => window.removeEventListener('arjuna_store_updated', handleUpdate);
  }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // 1. Submit Restock
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockMaterial || restockAmount <= 0) return;

    setIsSubmitting(true);
    await CafeStore.adjustMaterialStock(restockMaterial.id, restockAmount, restockReason);
    await loadData();
    setIsSubmitting(false);
    setRestockMaterial(null);
    showFeedback(`Berhasil restock ${restockAmount} ${restockMaterial.unit} untuk ${restockMaterial.name}!`);
  };

  // 2. Submit Tambah Bahan Baku Baru
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;

    setIsSubmitting(true);
    await CafeStore.addRawMaterial({
      name: newMatName.trim(),
      unit: newMatUnit,
      current_stock: Number(newMatStock) || 0,
      minimum_stock: Number(newMatMinStock) || 0,
    });

    await loadData();
    setIsSubmitting(false);
    setIsAddMaterialOpen(false);
    setNewMatName('');
    showFeedback(`Bahan baku baru "${newMatName}" berhasil ditambahkan ke inventaris!`);
  };

  // 3. Submit Tambah Menu Baru (+ Wajib Resep + Opsi Varian)
  const handleCreateMenuWithRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setMenuFormError(null);

    if (!newMenuName.trim()) {
      setMenuFormError('Nama menu wajib diisi.');
      return;
    }

    if (newMenuPrice <= 0) {
      setMenuFormError('Harga menu harus lebih dari 0.');
      return;
    }

    // Validasi Resep: WAJIB minimal 1 bahan baku yang valid
    if (newMenuRecipes.length === 0) {
      setMenuFormError('Wajib memasukkan minimal 1 bahan baku resep untuk menu ini!');
      return;
    }

    for (const r of newMenuRecipes) {
      if (!r.raw_material_id) {
        setMenuFormError('Pilih bahan baku untuk semua baris resep.');
        return;
      }
      if (r.quantity_required <= 0) {
        setMenuFormError('Takaran porsi bahan baku harus lebih dari 0.');
        return;
      }
    }

    // Cek bahan baku duplikat
    const materialIds = newMenuRecipes.map(r => r.raw_material_id);
    const hasDuplicate = new Set(materialIds).size !== materialIds.length;
    if (hasDuplicate) {
      setMenuFormError('Terdapat bahan baku yang sama di lebih dari satu baris. Gabungkan takarannya.');
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedVariants = buildVariants(addTempVariant, addSpicyVariant, addSugarVariant);
      await CafeStore.addMenuItemWithRecipe(
        {
          category_id: newMenuCatId,
          name: newMenuName.trim(),
          description: newMenuDesc.trim() || 'Menu spesial racikan artisan Aruna.',
          price: Number(newMenuPrice),
          image_url: newMenuImage.trim() || 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
          is_available: true,
          variants: generatedVariants,
        },
        newMenuRecipes
      );

      await loadData();
      setIsAddMenuOpen(false);
      setNewMenuName('');
      setNewMenuDesc('');
      showFeedback(`Menu "${newMenuName}" berhasil didaftarkan lengkap dengan opsi varian & resepnya!`);
    } catch (err: unknown) {
      setMenuFormError(err instanceof Error ? err.message : 'Gagal menyimpan menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Open & Submit Edit Resep Menu
  const handleOpenEditRecipe = (item: MenuItem) => {
    const existing = recipes.filter(r => r.menu_item_id === item.id);
    if (existing.length > 0) {
      setEditRecipeList(existing.map(r => ({ raw_material_id: r.raw_material_id, quantity_required: r.quantity_required })));
    } else {
      setEditRecipeList([{ raw_material_id: materials[0]?.id || '', quantity_required: 10 }]);
    }
    setEditMenuImage(item.image_url || '');
    setEditingMenuForRecipe(item);
  };

  const handleSaveEditRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuForRecipe) return;

    if (editRecipeList.length === 0) {
      alert('Resep wajib memiliki minimal 1 bahan baku!');
      return;
    }

    for (const r of editRecipeList) {
      if (!r.raw_material_id || r.quantity_required <= 0) {
        alert('Setiap bahan resep wajib dipilih dan takaran harus lebih dari 0.');
        return;
      }
    }

    setIsSubmitting(true);
    if (editMenuImage && editMenuImage !== editingMenuForRecipe.image_url) {
      await CafeStore.updateMenuItem({ ...editingMenuForRecipe, image_url: editMenuImage });
    }
    await CafeStore.updateMenuItemRecipe(editingMenuForRecipe.id, editRecipeList);
    await loadData();
    setIsSubmitting(false);
    setEditingMenuForRecipe(null);
    showFeedback(`Resep bahan baku "${editingMenuForRecipe.name}" berhasil diperbarui!`);
  };

  // 5. Open & Submit Edit Menu & Opsi Varian Lengkap
  const handleOpenEditMenu = (item: MenuItem) => {
    setEditingMenuItem(item);
    setEditMenuName(item.name);
    setEditMenuCatId(item.category_id);
    setEditMenuPrice(item.price);
    setEditMenuDesc(item.description);
    setEditMenuImg(item.image_url || '');
    setEditMenuAvailable(item.is_available);

    const hasTemp = !!item.variants?.some(v => v.group_name.toLowerCase().includes('suhu'));
    const hasSpicy = !!item.variants?.some(v => v.group_name.toLowerCase().includes('pedas'));
    const hasSugar = !!item.variants?.some(v => v.group_name.toLowerCase().includes('gula') || v.group_name.toLowerCase().includes('manis'));

    setEditTempVariant(hasTemp);
    setEditSpicyVariant(hasSpicy);
    setEditSugarVariant(hasSugar);
  };

  const handleSaveEditMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuItem) return;
    if (!editMenuName.trim()) {
      alert('Nama menu wajib diisi.');
      return;
    }
    if (editMenuPrice <= 0) {
      alert('Harga menu harus lebih dari 0.');
      return;
    }

    setIsSubmitting(true);
    const existingOtherVariants = editingMenuItem.variants?.filter(v =>
      !v.group_name.toLowerCase().includes('suhu') &&
      !v.group_name.toLowerCase().includes('pedas') &&
      !v.group_name.toLowerCase().includes('gula') &&
      !v.group_name.toLowerCase().includes('manis')
    ) || [];

    const generatedVariants = buildVariants(editTempVariant, editSpicyVariant, editSugarVariant, existingOtherVariants, editingMenuItem.id);

    const updated: MenuItem = {
      ...editingMenuItem,
      name: editMenuName.trim(),
      category_id: editMenuCatId,
      price: Number(editMenuPrice),
      description: editMenuDesc.trim(),
      image_url: editMenuImg.trim(),
      is_available: editMenuAvailable,
      variants: generatedVariants,
    };

    await CafeStore.updateMenuItem(updated);
    await loadData();
    setIsSubmitting(false);
    setEditingMenuItem(null);
    showFeedback(`Menu "${updated.name}" beserta opsi variannya berhasil diperbarui!`);
  };

  // 6. Quick Toggle Ketersediaan Menu (Tersedia / Habis)
  const handleToggleAvailability = async (item: MenuItem) => {
    const updated: MenuItem = { ...item, is_available: !item.is_available };
    await CafeStore.updateMenuItem(updated);
    await loadData();
    showFeedback(`Status "${item.name}" diubah menjadi: ${updated.is_available ? 'TERSEDIA' : 'HABIS'}`);
  };

  // 7. Delete Menu
  const handleConfirmDeleteMenu = async () => {
    if (!deletingMenu) return;
    setIsSubmitting(true);
    await CafeStore.deleteMenuItem(deletingMenu.id);
    await loadData();
    setIsSubmitting(false);
    showFeedback(`Menu "${deletingMenu.name}" dan resepnya berhasil dihapus dari sistem.`);
    setDeletingMenu(null);
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-stone-900 flex flex-col lg:flex-row items-start font-sans">

      {/* 1. SIDEBAR KASIR (BISA DI-MINIMIZE & RESPONSIF HP/TABLET) */}
      <AdminSidebar currentPath="/kasir/stok" />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">

          {/* Header & Aksi Cepat Tambah (Figma Style) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-stone-400 block">
                INVENTORI & RESEP · ARUNA CAFE
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                Stok Dessert & Bahan Baku
              </h1>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsAddMaterialOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#c87a58]" />
                <span>Tambah Bahan Baku</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuFormError(null);
                  if (materials.length === 0) {
                    alert('Harap tambahkan minimal 1 bahan baku terlebih dahulu sebelum mendaftarkan menu beresep.');
                    return;
                  }
                  setIsAddMenuOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#c87a58] hover:bg-[#b86948] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Menu & Resep</span>
              </button>

              <button
                onClick={loadData}
                className="p-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold flex items-center shadow-xs cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Feedback Success Notification */}
          {feedback && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold shadow-xs animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-2 bg-white p-2 rounded-2xl border border-stone-200 shadow-xs">
            <button
              onClick={() => setActiveTab('stok')}
              className={`flex-1 text-xs py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${activeTab === 'stok'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
            >
              <Package className="w-4 h-4" />
              <span>Stok Bahan Baku ({materials.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('resep')}
              className={`flex-1 text-xs py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${activeTab === 'resep'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Master Resep Menu ({menuItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('mutasi')}
              className={`flex-1 text-xs py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${activeTab === 'mutasi'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
            >
              <Clock className="w-4 h-4" />
              <span>Riwayat Pemotongan Stok</span>
            </button>
          </div>

          {/* TAB 1: STOK BAHAN BAKU */}
          {activeTab === 'stok' && (
            <div className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs space-y-0">
              <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-stone-900">Inventaris Bahan Baku Kafe</h3>
                  <p className="text-xs text-stone-500">Stok berkurang otomatis saat kasir klik &apos;Selesaikan & Potong Stok&apos;</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddMaterialOpen(true)}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#c87a58]" />
                  <span>Tambah Bahan Baru</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Nama Bahan Baku</th>
                      <th className="px-5 py-3.5">Satuan</th>
                      <th className="px-5 py-3.5">Sisa Stok Saat Ini</th>
                      <th className="px-5 py-3.5">Batas Minimum</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {materials.map(mat => {
                      const isLowStock = mat.current_stock <= mat.minimum_stock;
                      return (
                        <tr key={mat.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-stone-900">{mat.name}</td>
                          <td className="px-5 py-3.5 text-stone-600 uppercase font-mono">{mat.unit}</td>
                          <td className="px-5 py-3.5">
                            <span className={`font-black font-mono text-sm ${isLowStock ? 'text-red-600' : 'text-stone-900'}`}>
                              {mat.current_stock.toLocaleString('id-ID')} {mat.unit}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-stone-500 font-mono">
                            {mat.minimum_stock.toLocaleString('id-ID')} {mat.unit}
                          </td>
                          <td className="px-5 py-3.5">
                            {isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                <span>Stok Menipis</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Aman</span>
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => {
                                setRestockMaterial(mat);
                                setRestockAmount(mat.unit === 'pcs' || mat.unit === 'porsi' ? 20 : 1000);
                                setRestockReason('Restock belanja harian');
                              }}
                              className="bg-stone-900 hover:bg-stone-800 text-stone-50 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Restock</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER RESEP (BOM) */}
          {activeTab === 'resep' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
                <div>
                  <h3 className="font-bold text-sm text-stone-900">Pemetaan Resep Menu (Bill of Materials)</h3>
                  <p className="text-xs text-stone-500">Semua menu wajib memiliki resep bahan baku agar pemotongan stok otomatis berfungsi presisi.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddMenuOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#c87a58] hover:bg-[#b86948] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Menu & Resep</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {menuItems.map(item => {
                  const itemRecipes = recipes.filter(r => r.menu_item_id === item.id);
                  return (
                    <div key={item.id} className="bg-white rounded-2xl border border-stone-200/90 hover:border-stone-300 p-3.5 shadow-2xs flex flex-col justify-between transition-all">
                      <div>
                        {/* Header Card dengan Foto Menu & Status */}
                        <div className="pb-2.5 border-b border-stone-150 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 shrink-0 shadow-2xs relative">
                              {item.image_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-400">
                                  <Coffee className="w-5 h-5" />
                                </div>
                              )}
                              {!item.is_available && (
                                <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[1px] flex items-center justify-center text-[9px] font-black text-white uppercase">
                                  Habis
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider bg-stone-100 px-1.5 py-0.2 rounded">
                                  {categories.find(c => c.id === item.category_id)?.name || 'Menu'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAvailability(item)}
                                  className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border transition-all cursor-pointer ${item.is_available
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-stone-200 text-stone-600 border-stone-300 hover:bg-stone-300'
                                    }`}
                                  title="Klik untuk ubah status Tersedia / Habis"
                                >
                                  {item.is_available ? 'Tersedia' : 'Habis'}
                                </button>
                              </div>
                              <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate leading-tight">{item.name}</h4>
                              <p className="text-xs text-[#c87a58] font-black">Rp {item.price.toLocaleString('id-ID')}</p>
                            </div>
                          </div>

                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${itemRecipes.length > 0
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                            }`}>
                            {itemRecipes.length} Bahan
                          </span>
                        </div>

                        {/* Opsi / Varian Aktif Badges */}
                        <div className="py-2 border-b border-stone-100 flex items-center gap-1 flex-wrap">
                          <span className="text-[9px] font-bold text-stone-400 mr-0.5">Opsi:</span>
                          {item.variants && item.variants.length > 0 ? (
                            item.variants.map((v, i) => (
                              <span key={i} className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                                {v.group_name.toLowerCase().includes('suhu') && <Coffee className="w-2.5 h-2.5 text-[#c87a58]" />}
                                {v.group_name.toLowerCase().includes('pedas') && <Flame className="w-2.5 h-2.5 text-rose-500" />}
                                <span>{v.group_name}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-stone-400 italic">Tanpa opsi</span>
                          )}
                        </div>

                        {/* List Bahan Terpotong (Compact & Rapi) */}
                        <div className="pt-2 space-y-1">
                          <p className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">
                            Takaran per 1 Porsi:
                          </p>
                          {itemRecipes.length === 0 ? (
                            <p className="text-[11px] text-red-500 italic bg-red-50 p-2 rounded-lg border border-red-200">
                              ⚠️ Belum ada resep terhubung.
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {itemRecipes.map((r, idx) => {
                                const mat = materials.find(m => m.id === r.raw_material_id);
                                return (
                                  <div key={idx} className="flex justify-between items-center py-1 px-2.5 rounded-lg bg-stone-50 border border-stone-100/90 text-[11px]">
                                    <span className="font-medium text-stone-700 truncate pr-2">{mat?.name || r.raw_material_id}</span>
                                    <span className="font-mono font-bold text-rose-700 text-xs shrink-0">
                                      -{r.quantity_required} {mat?.unit || 'unit'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Tombol Aksi: Edit Menu & Opsi, Atur Resep, Hapus */}
                      <div className="pt-2.5 mt-2 border-t border-stone-100 flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDeletingMenu(item)}
                          className="p-1.5 rounded-lg bg-stone-50 hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-stone-200 transition-colors cursor-pointer"
                          title="Hapus Menu Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditMenu(item)}
                            className="px-2 py-1 rounded-lg bg-[#c87a58]/10 hover:bg-[#c87a58]/20 text-[#c87a58] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-[#c87a58]/20"
                          >
                            <Settings2 className="w-3 h-3" />
                            <span>Edit & Opsi</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditRecipe(item)}
                            className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-stone-500" />
                            <span>Resep</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: RIWAYAT MUTASI */}
          {activeTab === 'mutasi' && (
            <div className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 border-b border-stone-100">
                <h3 className="font-bold text-sm text-stone-900">Log Mutasi Bahan Baku Otomatis</h3>
                <p className="text-xs text-stone-500">Audit trail setiap kali ada pengurangan pesanan atau restock</p>
              </div>

              <div className="divide-y divide-stone-100">
                {mutations.length === 0 ? (
                  <div className="p-10 text-center text-xs text-stone-400">
                    Belum ada catatan mutasi stok
                  </div>
                ) : (
                  mutations.map(mut => {
                    const isDeduct = mut.change_amount < 0;
                    return (
                      <div key={mut.id} className="p-3.5 text-xs flex items-center justify-between hover:bg-stone-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-black ${isDeduct ? 'text-red-600' : 'text-emerald-600'}`}>
                              {mut.change_amount > 0 ? `+${mut.change_amount}` : mut.change_amount} {mut.raw_material?.unit || ''}
                            </span>
                            <span className="font-bold text-stone-900">{mut.raw_material?.name || 'Bahan Baku'}</span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">{mut.notes}</p>
                        </div>

                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(mut.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: RESTOCK BAHAN BAKU */}
      {restockMaterial && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3.5">
            <div className="border-b border-stone-200 pb-2 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900">Restock Bahan Baku</h3>
                <p className="text-xs text-stone-500">{restockMaterial.name} ({restockMaterial.unit})</p>
              </div>
              <button onClick={() => setRestockMaterial(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Jumlah Penambahan ({restockMaterial.unit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Keterangan / Alasan *
                </label>
                <input
                  type="text"
                  required
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRestockMaterial(null)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Tambah Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH BAHAN BAKU BARU */}
      {isAddMaterialOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-stone-900 uppercase tracking-tight">
                  Tambah Bahan Baku Baru
                </h3>
                <p className="text-xs text-stone-500">Daftarkan bahan baku ke sistem inventaris kafe.</p>
              </div>
              <button onClick={() => setIsAddMaterialOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Nama Bahan Baku *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Biji Kopi Robusta Blend / Sirup Vanilla"
                  value={newMatName}
                  onChange={(e) => setNewMatName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-300 focus:border-[#c87a58] focus:outline-none font-semibold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Satuan Takaran *</label>
                <select
                  value={newMatUnit}
                  onChange={(e) => setNewMatUnit(e.target.value as 'gram' | 'ml' | 'pcs' | 'porsi')}
                  className="w-full p-3 rounded-xl border border-stone-300 focus:border-[#c87a58] focus:outline-none font-bold text-stone-800 bg-white"
                >
                  <option value="gram">gram (Biji Kopi, Bubuk Matcha, Tepung, Beras, Cabai)</option>
                  <option value="ml">ml (Susu Fresh Milk, Sirup, Saus, Minyak)</option>
                  <option value="pcs">pcs (Telur, Croissant, Dimsum satuan)</option>
                  <option value="porsi">porsi (Porsi Mie, Porsi Nasi, Porsi Daging)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Stok Awal *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newMatStock}
                    onChange={(e) => setNewMatStock(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 rounded-xl border border-stone-300 focus:border-[#c87a58] focus:outline-none font-mono font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Batas Minimum Stok *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newMatMinStock}
                    onChange={(e) => setNewMatMinStock(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 rounded-xl border border-stone-300 focus:border-[#c87a58] focus:outline-none font-mono font-bold text-stone-900"
                  />
                  <span className="text-[10px] text-stone-400">Peringatan saat menipis</span>
                </div>
              </div>

              <div className="pt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddMaterialOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-[#c87a58] hover:bg-[#b86948] text-white font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Bahan Baku'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH MENU BARU (+ WAJIB INPUT RESEP DARI STOK BAKU) */}
      {isAddMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200">

            {/* 1. FIXED MODAL HEADER */}
            <div className="px-5 sm:px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#c87a58]/10 text-[#c87a58] flex items-center justify-center shrink-0 border border-[#c87a58]/20 shadow-2xs">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-stone-900 uppercase tracking-tight">
                    Tambah Menu & Resep (BOM)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500 font-medium">
                    Menu baru otomatis terhubung dengan bahan baku agar stok terpotong akurat.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. SCROLLABLE FORM BODY */}
            <form id="add-menu-form" onSubmit={handleCreateMenuWithRecipe} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-stone-50/60 pb-16">
              {menuFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{menuFormError}</span>
                </div>
              )}

              {/* Bagian A: Informasi Menu */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-2.5">
                  <span className="w-5 h-5 rounded-md bg-[#c87a58]/10 text-[#c87a58] font-black text-[11px] flex items-center justify-center">A</span>
                  <h4 className="text-xs font-black uppercase text-stone-900 tracking-wider">
                    Informasi & Harga Menu
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Nama Menu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Caramel Macchiato"
                      value={newMenuName}
                      onChange={(e) => setNewMenuName(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-stone-300 bg-stone-50/50 font-bold text-stone-900 focus:bg-white focus:border-[#c87a58] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Kategori Menu <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newMenuCatId}
                      onChange={(e) => setNewMenuCatId(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-stone-300 bg-stone-50/50 font-bold text-stone-800 focus:bg-white focus:border-[#c87a58] outline-none cursor-pointer"
                    >
                      {categories.filter(c => c.id !== 'cat-all').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Harga Menu (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-stone-400 select-none">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        required
                        placeholder="25000"
                        value={newMenuPrice || ''}
                        onChange={(e) => setNewMenuPrice(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs pl-10 pr-3 py-3 rounded-xl border border-stone-300 bg-stone-50/50 font-mono font-black text-stone-900 focus:bg-white focus:border-[#c87a58] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Deskripsi Singkat Menu
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Espresso ganda dengan karamel & susu segar"
                      value={newMenuDesc}
                      onChange={(e) => setNewMenuDesc(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-800 focus:bg-white focus:border-[#c87a58] outline-none"
                    />
                  </div>
                </div>

                {/* Upload Foto Menu */}
                <div className="pt-2 border-t border-stone-100">
                  <label className="block text-xs font-bold text-stone-700 mb-2">Foto Menu</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 shadow-2xs flex items-center justify-center">
                      {newMenuImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={newMenuImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-7 h-7 text-stone-400" />
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-[#c87a58]" />
                          <span>Pilih Foto dari Perangkat / HP</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(e, 'new')}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <input
                        type="url"
                        placeholder="Atau tempel URL gambar (https://...)"
                        value={newMenuImage}
                        onChange={(e) => setNewMenuImage(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 font-mono text-[11px] text-stone-700 focus:bg-white focus:border-[#c87a58] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bagian B: Opsi & Varian Pelanggan */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#c87a58]/10 text-[#c87a58] font-black text-[11px] flex items-center justify-center">B</span>
                    <h4 className="text-xs font-black uppercase text-stone-900 tracking-wider">
                      Opsi / Varian Pelanggan
                    </h4>
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium">Opsional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Opsi 1: Pilihan Suhu (Hot / Iced) */}
                  <label className={`flex flex-col justify-between p-3 rounded-2xl border transition-all cursor-pointer ${addTempVariant ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300' : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
                    }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Coffee className="w-4 h-4 text-[#c87a58]" />
                        <span className="font-bold text-xs text-stone-900">Suhu Menu</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={addTempVariant}
                        onChange={(e) => setAddTempVariant(e.target.checked)}
                        className="rounded text-[#c87a58] focus:ring-[#c87a58] w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-stone-500 leading-tight">
                      Pilihan Dingin (Iced) atau Panas (Hot).
                    </p>
                  </label>

                  {/* Opsi 2: Level Pedas */}
                  <label className={`flex flex-col justify-between p-3 rounded-2xl border transition-all cursor-pointer ${addSpicyVariant ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300' : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
                    }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-rose-600" />
                        <span className="font-bold text-xs text-stone-900">Level Pedas</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={addSpicyVariant}
                        onChange={(e) => setAddSpicyVariant(e.target.checked)}
                        className="rounded text-[#c87a58] focus:ring-[#c87a58] w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-stone-500 leading-tight">
                      Tidak Pedas, Sedang, atau Extra Pedas.
                    </p>
                  </label>

                  {/* Opsi 3: Level Gula */}
                  <label className={`flex flex-col justify-between p-3 rounded-2xl border transition-all cursor-pointer ${addSugarVariant ? 'bg-stone-100 border-stone-400 ring-1 ring-stone-400' : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
                    }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span className="font-bold text-xs text-stone-900">Level Manis</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={addSugarVariant}
                        onChange={(e) => setAddSugarVariant(e.target.checked)}
                        className="rounded text-[#c87a58] focus:ring-[#c87a58] w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-stone-500 leading-tight">
                      Normal Sweet (100%), Less (50%), No Sugar.
                    </p>
                  </label>
                </div>
              </div>

              {/* Bagian C: Resep Pemotongan Bahan Baku (WAJIB) */}
              <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-amber-600/20 text-amber-900 font-black text-[11px] flex items-center justify-center">C</span>
                    <div>
                      <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider">
                        Resep Bahan Baku (BOM) *
                      </h4>
                      <p className="text-[11px] text-amber-800">
                        Pilih bahan baku dan tentukan takaran per 1 porsi menu.
                      </p>
                    </div>
                  </div>

                  <span className="text-[9px] font-black text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full shrink-0">
                    Wajib Minimal 1 Bahan
                  </span>
                </div>

                {/* List Input Baris Resep */}
                <div className="space-y-3">
                  {newMenuRecipes.map((recipeLine, index) => {
                    const selectedMat = materials.find(m => m.id === recipeLine.raw_material_id);
                    return (
                      <div key={index} className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-stone-600 tracking-wider">
                            Bahan Baku #{index + 1}
                          </span>
                          {newMenuRecipes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewMenuRecipes(newMenuRecipes.filter((_, i) => i !== index));
                              }}
                              className="text-stone-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                              title="Hapus Bahan Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          {/* Searchable Bahan Baku Picker (7 Kolom) */}
                          <div className="sm:col-span-7">
                            <SearchableMaterialSelect
                              materials={materials}
                              value={recipeLine.raw_material_id}
                              onChange={(id) => {
                                const updated = [...newMenuRecipes];
                                updated[index].raw_material_id = id;
                                setNewMenuRecipes(updated);
                              }}
                              placeholder="-- Ketik / Pilih Bahan Baku --"
                            />
                          </div>

                          {/* Takaran dengan Satuan Suffix (5 Kolom) */}
                          <div className="sm:col-span-5">
                            <div className="flex items-center rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100/80 focus-within:bg-white focus-within:border-[#c87a58] focus-within:ring-2 focus-within:ring-[#c87a58]/20 overflow-hidden transition-all">
                              <span className="pl-3 pr-1 text-[10px] font-bold text-stone-400 uppercase select-none">
                                Takaran:
                              </span>
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                required
                                placeholder="15"
                                value={recipeLine.quantity_required}
                                onChange={(e) => {
                                  const updated = [...newMenuRecipes];
                                  updated[index].quantity_required = parseFloat(e.target.value) || 0;
                                  setNewMenuRecipes(updated);
                                }}
                                className="w-full py-2.5 pr-2 text-xs font-mono font-black text-[#c87a58] bg-transparent outline-none text-right"
                              />
                              <span className="px-3 py-2.5 bg-stone-200/80 text-[10px] font-black font-mono text-stone-800 border-l border-stone-300 shrink-0 uppercase">
                                {selectedMat?.unit || 'unit'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tombol Tambah Baris Bahan */}
                <button
                  type="button"
                  onClick={() => {
                    const firstAvail = materials.find(m => !newMenuRecipes.some(r => r.raw_material_id === m.id)) || materials[0];
                    setNewMenuRecipes([
                      ...newMenuRecipes,
                      { raw_material_id: firstAvail?.id || '', quantity_required: 10 }
                    ]);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                  <span>+ Tambah Bahan Resep Lain</span>
                </button>
              </div>

            </form>

            {/* 3. FIXED MODAL FOOTER */}
            <div className="px-5 sm:px-6 py-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="add-menu-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#c87a58] hover:bg-[#b86948] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Mendaftarkan Menu...' : 'Simpan Menu & Resep'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: EDIT / ATUR RESEP MENU */}
      {editingMenuForRecipe && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200">

            {/* 1. FIXED MODAL HEADER */}
            <div className="px-5 sm:px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-2xs">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-stone-900 uppercase tracking-tight">
                    Atur Resep & Foto: {editingMenuForRecipe.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500 font-medium">
                    Tentukan bahan baku yang otomatis terpotong saat menu ini dipesan tamu.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMenuForRecipe(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. SCROLLABLE FORM BODY */}
            <form id="edit-recipe-form" onSubmit={handleSaveEditRecipe} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-stone-50/60 pb-16">

              {/* Edit / Upload Foto Menu */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-2.5">
                  <ImageIcon className="w-4 h-4 text-[#c87a58]" />
                  <h4 className="text-xs font-black uppercase text-stone-900 tracking-wider">
                    Foto Menu
                  </h4>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 shadow-2xs flex items-center justify-center">
                    {editMenuImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={editMenuImage} alt="Menu" className="w-full h-full object-cover" />
                    ) : (
                      <Coffee className="w-7 h-7 text-stone-400" />
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-[#c87a58]" />
                        <span>Upload / Ganti Foto dari Perangkat</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, 'edit-recipe')}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <input
                      type="url"
                      placeholder="Atau masukkan URL foto (https://...)"
                      value={editMenuImage}
                      onChange={(e) => setEditMenuImage(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 font-mono text-[11px] text-stone-700 outline-none focus:bg-white focus:border-[#c87a58]"
                    />
                  </div>
                </div>
              </div>

              {/* Daftar Bahan Resep Pemotongan */}
              <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-amber-600/20 text-amber-900 font-black text-[11px] flex items-center justify-center">R</span>
                    <div>
                      <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider">
                        Daftar Bahan Resep Pemotongan (BOM)
                      </h4>
                      <p className="text-[11px] text-amber-800">
                        Bahan-bahan yang otomatis terpotong saat menu ini dipesan.
                      </p>
                    </div>
                  </div>

                  <span className="text-[9px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full shrink-0">
                    {editRecipeList.length} Bahan Terhubung
                  </span>
                </div>

                <div className="space-y-3">
                  {editRecipeList.map((rLine, idx) => {
                    const selMat = materials.find(m => m.id === rLine.raw_material_id);
                    return (
                      <div key={idx} className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-stone-600 tracking-wider">
                            Bahan Baku #{idx + 1}
                          </span>
                          {editRecipeList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setEditRecipeList(editRecipeList.filter((_, i) => i !== idx))}
                              className="text-stone-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                              title="Hapus Bahan Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          {/* Searchable Bahan Baku Picker (7 Kolom) */}
                          <div className="sm:col-span-7">
                            <SearchableMaterialSelect
                              materials={materials}
                              value={rLine.raw_material_id}
                              onChange={(id) => {
                                const updated = [...editRecipeList];
                                updated[idx].raw_material_id = id;
                                setEditRecipeList(updated);
                              }}
                              placeholder="-- Ketik / Pilih Bahan Baku --"
                            />
                          </div>

                          {/* Takaran dengan Satuan Suffix Terintegrasi (5 Kolom) */}
                          <div className="sm:col-span-5">
                            <div className="flex items-center rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100/80 focus-within:bg-white focus-within:border-[#c87a58] focus-within:ring-2 focus-within:ring-[#c87a58]/20 overflow-hidden transition-all">
                              <span className="pl-3 pr-1 text-[10px] font-bold text-stone-400 uppercase select-none">
                                Takaran:
                              </span>
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                required
                                value={rLine.quantity_required}
                                onChange={(e) => {
                                  const updated = [...editRecipeList];
                                  updated[idx].quantity_required = parseFloat(e.target.value) || 0;
                                  setEditRecipeList(updated);
                                }}
                                className="w-full py-2.5 pr-2 text-xs font-mono font-black text-[#c87a58] bg-transparent outline-none text-right"
                              />
                              <span className="px-3 py-2.5 bg-stone-200/80 text-[10px] font-black font-mono text-stone-800 border-l border-stone-300 shrink-0 uppercase">
                                {selMat?.unit || 'unit'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const firstUnused = materials.find(m => !editRecipeList.some(r => r.raw_material_id === m.id)) || materials[0];
                    setEditRecipeList([
                      ...editRecipeList,
                      { raw_material_id: firstUnused?.id || '', quantity_required: 10 }
                    ]);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                  <span>+ Tambah Bahan Resep Lain</span>
                </button>
              </div>

            </form>

            {/* 3. FIXED MODAL FOOTER */}
            <div className="px-5 sm:px-6 py-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingMenuForRecipe(null)}
                className="px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="edit-recipe-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#c87a58] hover:bg-[#b86948] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Perbarui Resep & Foto'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 5: EDIT MENU & OPSI VARIAN LENGKAP (CRUD) */}
      {editingMenuItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200">
            {/* Header Modal - Fixed */}
            <div className="px-5 sm:px-6 py-4 border-b border-stone-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#c87a58]/10 text-[#c87a58] flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-stone-900 uppercase tracking-tight">
                    Edit Menu: {editingMenuItem.name}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Ubah data produk, harga, ketersediaan, serta aktifkan opsi/varian pelanggan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingMenuItem(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 bg-stone-50/60 pb-12">
              <form id="edit-menu-form" onSubmit={handleSaveEditMenu} className="space-y-5 text-xs">

                {/* Info Produk */}
                <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="text-[11px] font-black uppercase text-[#c87a58] tracking-widest flex items-center gap-1.5">
                      <span>1.</span> Informasi Produk
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Nama Menu *</label>
                      <input
                        type="text"
                        required
                        value={editMenuName}
                        onChange={(e) => setEditMenuName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-semibold text-stone-900 focus:outline-none focus:border-[#c87a58] focus:ring-1 focus:ring-[#c87a58]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Kategori Menu *</label>
                      <select
                        value={editMenuCatId}
                        onChange={(e) => setEditMenuCatId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-bold text-stone-800 focus:outline-none focus:border-[#c87a58]"
                      >
                        {categories.filter(c => c.id !== 'cat-all').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Harga Menu (Rp) *</label>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        required
                        value={editMenuPrice}
                        onChange={(e) => setEditMenuPrice(parseFloat(e.target.value) || 0)}
                        className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-mono font-bold text-stone-900 focus:outline-none focus:border-[#c87a58]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Status Ketersediaan</label>
                      <button
                        type="button"
                        onClick={() => setEditMenuAvailable(!editMenuAvailable)}
                        className={`w-full p-2.5 rounded-xl border font-bold flex items-center justify-between transition-colors ${editMenuAvailable
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-stone-100 text-stone-600 border-stone-300'
                          }`}
                      >
                        <span>{editMenuAvailable ? '● Menu Tersedia (Bisa Dipesan)' : '○ Menu Habis (Nonaktif)'}</span>
                        <span className="text-[10px] underline">{editMenuAvailable ? 'Ubah ke Habis' : 'Ubah ke Tersedia'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Deskripsi Menu</label>
                    <input
                      type="text"
                      value={editMenuDesc}
                      onChange={(e) => setEditMenuDesc(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 focus:outline-none focus:border-[#c87a58]"
                    />
                  </div>

                  {/* Upload Foto Menu */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block font-bold text-stone-800">Foto Menu</label>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 shadow-2xs">
                        {editMenuImg ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={editMenuImg} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <Coffee className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <label className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold cursor-pointer transition-colors shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-[#c87a58]" />
                          <span>Upload Foto dari Perangkat</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(e, 'edit-menu')}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="url"
                          placeholder="Atau masukkan URL foto (https://...)"
                          value={editMenuImg}
                          onChange={(e) => setEditMenuImg(e.target.value)}
                          className="w-full p-2 rounded-lg border border-stone-300 bg-white font-mono text-[10px] text-stone-700 focus:outline-none focus:border-[#c87a58]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opsi & Varian Pelanggan */}
                <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
                  <div>
                    <span className="text-[11px] font-black uppercase text-[#c87a58] tracking-widest block">
                      2. Aktifkan Opsi / Varian Menu
                    </span>
                    <p className="text-[11px] text-stone-500">
                      Opsi ini otomatis muncul pada pop-up kustomisasi pesanan tamu.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Opsi 1: Pilihan Suhu (Hot / Iced) */}
                    <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${editTempVariant ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300' : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
                      }`}>
                      <input
                        type="checkbox"
                        checked={editTempVariant}
                        onChange={(e) => setEditTempVariant(e.target.checked)}
                        className="mt-0.5 rounded text-[#c87a58] focus:ring-[#c87a58] w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Coffee className="w-3.5 h-3.5 text-[#c87a58]" />
                          <span className="font-bold text-xs text-stone-900">Pilihan Suhu (Hot / Iced)</span>
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">Minuman</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Tamu dapat memilih antara <strong>Iced (Dingin)</strong> atau <strong>Hot (Panas)</strong>.
                        </p>
                      </div>
                    </label>

                    {/* Opsi 2: Level Pedas */}
                    <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${editSpicyVariant ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300' : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
                      }`}>
                      <input
                        type="checkbox"
                        checked={editSpicyVariant}
                        onChange={(e) => setEditSpicyVariant(e.target.checked)}
                        className="mt-0.5 rounded text-[#c87a58] focus:ring-[#c87a58] w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Flame className="w-3.5 h-3.5 text-rose-600" />
                          <span className="font-bold text-xs text-stone-900">Level Pedas (Pedas atau Tidak)</span>
                          <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">Makanan</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Tamu dapat memilih: <strong>Tidak Pedas</strong>, <strong>Pedas Sedang</strong>, atau <strong>Extra Pedas (+Rp 2.000)</strong>.
                        </p>
                      </div>
                    </label>

                    {/* Opsi 3: Level Gula */}
                    <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${editSugarVariant ? 'bg-stone-100 border-stone-400' : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
                      }`}>
                      <input
                        type="checkbox"
                        checked={editSugarVariant}
                        onChange={(e) => setEditSugarVariant(e.target.checked)}
                        className="mt-0.5 rounded text-[#c87a58] focus:ring-[#c87a58] w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-bold text-xs text-stone-900">Level Gula / Manis</span>
                          <span className="text-[9px] bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded font-bold">Kopi & Teh</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Tamu dapat memilih: <strong>Normal Sweet (100%)</strong>, <strong>Less Sweet (50%)</strong>, atau <strong>No Sugar (0%)</strong>.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer Action Bar - Fixed Bottom */}
            <div className="px-5 sm:px-6 py-4 bg-white border-t border-stone-200 flex items-center justify-end gap-3 shrink-0 shadow-lg">
              <button
                type="button"
                onClick={() => setEditingMenuItem(null)}
                className="px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="edit-menu-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#c87a58] hover:bg-[#b86948] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 6: KONFIRMASI HAPUS MENU */}
      {deletingMenu && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-black text-base text-stone-900">Hapus Menu Ini?</h3>
              <p className="text-xs text-stone-600 mt-1">
                Menu <strong>&quot;{deletingMenu.name}&quot;</strong> beserta seluruh data resep bahan bakunya akan dihapus permanen dari sistem.
              </p>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingMenu(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMenu}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
