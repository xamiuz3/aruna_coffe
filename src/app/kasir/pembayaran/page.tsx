'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CafeStore, DEFAULT_PAYMENT_SETTINGS } from '@/lib/store';
import { PaymentSettings } from '@/lib/types';
import { AdminAuth, AdminSession } from '@/lib/auth';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminTopNav } from '@/components/AdminTopNav';
import { 
  CreditCard, 
  UtensilsCrossed, 
  CalendarDays,
  Layers, 
  QrCode, 
  ExternalLink, 
  Upload, 
  Save, 
  Check, 
  AlertCircle, 
  Building2, 
  Sparkles,
  RotateCcw,
  Copy,
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  LogOut,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';

export default function PengaturanPembayaranPage() {
  const [settings, setSettings] = useState<PaymentSettings>(() => CafeStore.getInitialPaymentSettings());
  const [loading, setLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Tab Navigasi Halaman
  const [activeTab, setActiveTab] = useState<'all' | 'payment' | 'security'>('all');

  // State Keamanan Password Admin
  const [session, setSession] = useState<AdminSession | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await CafeStore.getPaymentSettings();
        setSettings(data);
        const currSession = AdminAuth.getSession();
        setSession(currSession);
      } catch (err) {
        console.error('Gagal memuat pengaturan:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword.length < 4) {
      setPwdMsg({ text: 'Password baru minimal 4 karakter', isError: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'Konfirmasi password baru tidak cocok', isError: true });
      return;
    }

    setIsChangingPwd(true);
    setTimeout(() => {
      const res = AdminAuth.changePassword(oldPassword, newPassword);
      if (res.success) {
        setPwdMsg({ text: 'Password / PIN admin berhasil diperbarui!', isError: false });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMsg({ text: res.error || 'Gagal mengubah password', isError: true });
      }
      setIsChangingPwd(false);
    }, 400);
  };

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sesi admin?')) {
      AdminAuth.logout();
      window.location.href = '/kasir/login';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSettings(prev => ({ ...prev, qris_image_url: result }));
    };
    reader.onerror = () => {
      setUploadError('Gagal membaca file gambar.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await CafeStore.updatePaymentSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Gagal menyimpan:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = () => {
    if (confirm('Kembalikan ke pengaturan default Aruna Coffee?')) {
      setSettings(DEFAULT_PAYMENT_SETTINGS);
    }
  };

  const handleCopyTest = () => {
    if (typeof navigator !== 'undefined' && settings.bank_account_number) {
      navigator.clipboard.writeText(settings.bank_account_number);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  // Helper indikator kekuatan password
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return null;
    if (pwd.length < 4) return { label: 'Terlalu Pendek', color: 'bg-rose-500', width: 'w-1/4' };
    if (pwd.length < 6) return { label: 'Cukup', color: 'bg-amber-500', width: 'w-2/4' };
    if (/^[0-9]+$/.test(pwd)) return { label: 'PIN Angka', color: 'bg-blue-500', width: 'w-3/4' };
    return { label: 'Kuat (Kombinasi)', color: 'bg-emerald-500', width: 'w-full' };
  };

  const pwdStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-stone-900 flex flex-col lg:flex-row items-start font-sans">
      
      {/* 1. SIDEBAR KASIR (BISA DI-MINIMIZE & RESPONSIF HP/TABLET) */}
      <AdminSidebar currentPath="/kasir/pembayaran" />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* TOP NAVBAR (JAM, TANGGAL & PEMBERITAHUAN PESANAN / BAHAN HABIS) */}
        <AdminTopNav />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-300">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 uppercase tracking-tight">
                Pengaturan Pembayaran & Keamanan
              </h1>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Atur barcode QRIS, rekening bank toko, serta kredensial password dan PIN otorisasi staf admin.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefault}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default QRIS</span>
              </button>
            </div>
          </div>

          {/* Tab Selector Navigasi */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Semua Pengaturan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'payment'
                  ? 'bg-[#c87a58] text-white shadow-sm'
                  : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QRIS & Bank Toko</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Keamanan & Password Admin</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </button>
          </div>

          {/* Feedback Success Alert */}
          {savedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-xs animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pengaturan pembayaran berhasil disimpan! Tamu yang memesan sekarang akan melihat QRIS dan nomor rekening terbaru.</span>
            </div>
          )}

          {/* TAB 1 & SEMUA: GRID UTAMA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* KOLOM KIRI (7 Kolom): Form Pembayaran atau Form Keamanan Fokus */}
            {(activeTab === 'all' || activeTab === 'payment') && (
              <form onSubmit={handleSave} className={`${activeTab === 'payment' ? 'lg:col-span-7' : 'lg:col-span-7'} space-y-5`}>
                
                {/* Card 1: Upload QRIS Barcode */}
                <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
                    <QrCode className="w-5 h-5 text-[#c87a58]" />
                    <div>
                      <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider">
                        1. Upload Barcode QRIS Toko
                      </h2>
                      <p className="text-[11px] text-stone-400">Barcode ini ditampilkan saat tamu checkout via QRIS</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Nama Merchant QRIS *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: ARUNA COFFEE & KITCHEN"
                        value={settings.qris_merchant_name}
                        onChange={(e) => setSettings({ ...settings, qris_merchant_name: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:border-[#c87a58] focus:ring-2 focus:ring-[#c87a58]/20 outline-none font-semibold text-stone-900 bg-stone-50/50"
                      />
                    </div>

                    {/* Dropzone Upload */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        File Gambar Barcode QRIS Toko *
                      </label>
                      <div className="border-2 border-dashed border-stone-300 hover:border-[#c87a58] rounded-2xl p-4 text-center bg-stone-50/50 transition-colors flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[#c87a58] shadow-2xs">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-xs font-bold text-[#c87a58] hover:underline cursor-pointer">
                            Klik untuk pilih gambar QRIS
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[11px] text-stone-400">
                            Format PNG, JPG, atau WEBP (Maksimal 5 MB)
                          </p>
                        </div>
                      </div>
                      {uploadError && (
                        <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{uploadError}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 mb-1">
                        Atau Masukkan URL Gambar QRIS Langsung:
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={settings.qris_image_url}
                        onChange={(e) => setSettings({ ...settings, qris_image_url: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-[#c87a58] outline-none font-mono text-stone-700 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Pengaturan Bank Transfer */}
                <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
                    <Building2 className="w-5 h-5 text-[#c87a58]" />
                    <div>
                      <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider">
                        2. Detail Rekening Bank
                      </h2>
                      <p className="text-[11px] text-stone-400">Rekening tujuan untuk transfer langsung</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Nama Bank *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Bank BRI / BCA / Mandiri"
                          value={settings.bank_name}
                          onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                          className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:border-[#c87a58] outline-none font-semibold text-stone-900 bg-stone-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Nomor Rekening *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: 0123-01-000456-53-8"
                          value={settings.bank_account_number}
                          onChange={(e) => setSettings({ ...settings, bank_account_number: e.target.value })}
                          className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:border-[#c87a58] outline-none font-mono font-bold text-stone-900 bg-stone-50/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Atas Nama Pemilik Rekening *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: ARUNA COFFEE INDONESIA"
                        value={settings.bank_account_holder}
                        onChange={(e) => setSettings({ ...settings, bank_account_holder: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:border-[#c87a58] outline-none font-semibold text-stone-900 bg-stone-50/50 uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 3: Petunjuk Pembayaran Pelanggan */}
                <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
                    <Sparkles className="w-5 h-5 text-[#c87a58]" />
                    <div>
                      <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider">
                        3. Catatan / Petunjuk Pembayaran Tamu
                      </h2>
                      <p className="text-[11px] text-stone-400">Instruksi ramah saat tamu menyelesaikan pembayaran</p>
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={3}
                      placeholder="Instruksi pembayaran yang tampil di layar tamu..."
                      value={settings.payment_instructions}
                      onChange={(e) => setSettings({ ...settings, payment_instructions: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:border-[#c87a58] outline-none text-stone-800 bg-stone-50/50 resize-none"
                    />
                    <p className="text-[11px] text-stone-400 mt-1">
                      Teks ini akan muncul tepat di bawah barcode QRIS pada keranjang belanja pelanggan.
                    </p>
                  </div>
                </div>

                {/* Tombol Simpan */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#c87a58] hover:bg-[#b86948] disabled:bg-stone-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Pembayaran'}</span>
                  </button>
                </div>

              </form>
            )}

            {/* KOLOM KANAN: Berisi Keamanan & Preview Layar Tamu */}
            {(activeTab === 'all' || activeTab === 'payment') && (
              <div className="lg:col-span-5 space-y-6 w-full">
                
                {/* CARD KEAMANAN & PASSWORD ADMIN (Hadir Luas & Proporsional di Tab 'All') */}
                {activeTab === 'all' && (
                  <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4 w-full">
                    <div className="flex items-center justify-between border-b border-stone-150 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-stone-900 uppercase tracking-tight">
                            Keamanan & Password Admin
                          </h2>
                          <p className="text-[11px] text-stone-400">Ganti password akun atau PIN kasir</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Terproteksi
                      </span>
                    </div>

                    {pwdMsg && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        pwdMsg.isError 
                          ? 'bg-rose-50 border border-rose-200 text-rose-700' 
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      }`}>
                        {pwdMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
                        <span className="font-semibold">{pwdMsg.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Password / PIN Saat Ini *
                        </label>
                        <div className="relative">
                          <input
                            type={showOldPwd ? "text" : "password"}
                            required
                            placeholder="Password aktif (Default: 1988)"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full text-xs p-3 pr-10 rounded-xl border border-stone-300 focus:border-[#c87a58] outline-none text-stone-900 bg-stone-50/50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPwd(!showOldPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                          >
                            {showOldPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            Password / PIN Baru *
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPwd ? "text" : "password"}
                              required
                              placeholder="Minimal 4 digit"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full text-xs p-3 pr-10 rounded-xl border border-stone-300 focus:border-[#c87a58] outline-none text-stone-900 bg-stone-50/50"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPwd(!showNewPwd)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                            >
                              {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            Ulangi Password Baru *
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPwd ? "text" : "password"}
                              required
                              placeholder="Ketik ulang"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full text-xs p-3 pr-10 rounded-xl border border-stone-300 focus:border-[#c87a58] outline-none text-stone-900 bg-stone-50/50"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                            >
                              {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Indikator Kekuatan Password */}
                      {pwdStrength && (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-center justify-between text-[10px] text-stone-500">
                            <span>Kekuatan: <strong className="text-stone-800">{pwdStrength.label}</strong></span>
                            <span>Minimal 4 Karakter</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <div className={`h-full ${pwdStrength.color} ${pwdStrength.width} transition-all duration-300`}></div>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isChangingPwd}
                        className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{isChangingPwd ? 'Memperbarui Password...' : 'Ubah Password / PIN Admin'}</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* PRATINJAU TAMPILAN CHECKOUT TAMU */}
                <div className="space-y-3 w-full">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Pratinjau Layar Tamu
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                      Live Preview
                    </span>
                  </div>

                  {/* Card Simulasi Layar Checkout Tamu */}
                  <div className="bg-white rounded-3xl border-2 border-stone-800 p-5 shadow-xl space-y-4">
                    <div className="border-b border-stone-150 pb-2 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-xs text-stone-900">QRIS & Transfer Bank</h3>
                        <p className="text-[10px] text-stone-400">Tampilan saat tamu memilih metode ini</p>
                      </div>
                      <span className="text-[10px] font-black text-[#c87a58] bg-[#c87a58]/10 px-2 py-0.5 rounded-md">
                        ARUNA
                      </span>
                    </div>

                    {/* Box Barcode QRIS */}
                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-center space-y-2">
                      <p className="text-[11px] font-black uppercase text-stone-800 tracking-wide">
                        {settings.qris_merchant_name || 'NAMA MERCHANT QRIS'}
                      </p>

                      <div className="w-44 h-44 mx-auto bg-white p-2 rounded-xl border border-stone-200 flex items-center justify-center shadow-2xs">
                        {settings.qris_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={settings.qris_image_url}
                            alt="QRIS Merchant"
                            className="w-full h-full object-contain rounded"
                          />
                        ) : (
                          <div className="text-stone-300 flex flex-col items-center">
                            <QrCode className="w-16 h-16" />
                            <span className="text-[10px] text-stone-400">Belum ada QRIS</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-stone-400 block">
                        NMID: ID1029384756 (QRIS Nasional)
                      </span>
                    </div>

                    {/* Detail Rekening Bank dengan Tombol Salin */}
                    <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-stone-400">Transfer Bank:</span>
                        <span className="font-black text-[#c87a58] text-[11px]">{settings.bank_name || 'Bank BRI'}</span>
                      </div>

                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-stone-400 uppercase font-bold block">No. Rekening:</span>
                          <span className="font-mono font-bold text-stone-900 text-xs">
                            {settings.bank_account_number || '-'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyTest}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedAccount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedAccount ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-stone-600">
                        <span className="text-stone-400 text-[10px] block">Atas Nama:</span>
                        <span className="font-bold text-stone-800">{settings.bank_account_holder || '-'}</span>
                      </div>
                    </div>

                    {/* Petunjuk */}
                    {settings.payment_instructions && (
                      <p className="text-[10px] text-stone-500 italic bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                        💡 &quot;{settings.payment_instructions}&quot;
                      </p>
                    )}

                    {/* Simulasi Upload Bukti Tamu (Wajib 100%) */}
                    <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200 text-center space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-black text-stone-800">
                          Upload Bukti Transfer *
                        </span>
                        <span className="font-bold text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.2 rounded">
                          Wajib 100%
                        </span>
                      </div>
                      <div className="w-full py-2 bg-stone-900 text-white rounded-xl text-[10px] font-bold">
                        Pilih Screenshot / File Transfer
                      </div>
                      <p className="text-[9px] text-stone-500 leading-tight">
                        Tamu dapat melampirkan screenshot atau file bukti bayar agar pesanan masuk ke kitchen kasir.
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* TAB KHUSUS KEAMANAN (Jika user memilih tab 'security') */}
            {activeTab === 'security' && (
              <>
                {/* Kolom Kiri: Form Ganti Password Lengkap */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-stone-150 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-black text-stone-900 uppercase tracking-tight">
                            Ubah Password & PIN Admin
                          </h2>
                          <p className="text-xs text-stone-500">
                            Perbarui kata sandi untuk melindungi dashboard kasir dan pengaturan sensitif.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Aktif
                      </span>
                    </div>

                    {pwdMsg && (
                      <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 font-bold ${
                        pwdMsg.isError 
                          ? 'bg-rose-50 border border-rose-200 text-rose-800' 
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      }`}>
                        {pwdMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> : <Check className="w-4 h-4 shrink-0 text-emerald-600" />}
                        <span>{pwdMsg.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-800 mb-1.5">
                          Password / PIN Saat Ini *
                        </label>
                        <div className="relative">
                          <input
                            type={showOldPwd ? "text" : "password"}
                            required
                            placeholder="Masukkan password saat ini (Default: 1988)"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full text-xs p-3.5 pr-11 rounded-xl border border-stone-300 focus:border-[#c87a58] focus:ring-2 focus:ring-[#c87a58]/20 outline-none text-stone-900 bg-stone-50/50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPwd(!showOldPwd)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                          >
                            {showOldPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-stone-800 mb-1.5">
                            Password / PIN Baru *
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPwd ? "text" : "password"}
                              required
                              placeholder="Minimal 4 digit angka/huruf"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full text-xs p-3.5 pr-11 rounded-xl border border-stone-300 focus:border-[#c87a58] focus:ring-2 focus:ring-[#c87a58]/20 outline-none text-stone-900 bg-stone-50/50"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPwd(!showNewPwd)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                            >
                              {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-800 mb-1.5">
                            Ulangi Password Baru *
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPwd ? "text" : "password"}
                              required
                              placeholder="Ketik ulang password baru"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full text-xs p-3.5 pr-11 rounded-xl border border-stone-300 focus:border-[#c87a58] focus:ring-2 focus:ring-[#c87a58]/20 outline-none text-stone-900 bg-stone-50/50"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                            >
                              {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Indikator Kekuatan */}
                      {pwdStrength && (
                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-stone-600">
                            <span>Tingkat Keamanan: <strong className="text-stone-900">{pwdStrength.label}</strong></span>
                            <span className="text-[11px] text-stone-400">Minimal 4 digit</span>
                          </div>
                          <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                            <div className={`h-full ${pwdStrength.color} ${pwdStrength.width} transition-all duration-300`}></div>
                          </div>
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isChangingPwd}
                          className="w-full py-3.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-98"
                        >
                          <KeyRound className="w-4 h-4 text-emerald-400" />
                          <span>{isChangingPwd ? 'Menyimpan Password Baru...' : 'Simpan Password / PIN Baru'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Kredensial Default Toko Card */}
                  <div className="bg-amber-50/70 rounded-2xl border border-amber-200/80 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-amber-900">
                      <ShieldAlert className="w-4 h-4 text-amber-700" />
                      <h3 className="text-xs font-black uppercase tracking-wider">
                        Informasi Kredensial Standar Aruna
                      </h3>
                    </div>
                    <p className="text-xs text-amber-900/80 leading-relaxed">
                      Sistem login POS mendukung akun Owner dan Kasir. Jika lupa password yang baru dibuat, Anda dapat menggunakan kredensial bawaan berikut:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                        <span className="text-[10px] font-bold text-stone-400 uppercase block">Akun Owner / Admin:</span>
                        <p className="text-xs font-mono font-bold text-stone-900">User: admin</p>
                        <p className="text-xs font-mono text-stone-600">Default PIN: 1988</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                        <span className="text-[10px] font-bold text-stone-400 uppercase block">Akun Kasir Dispatch:</span>
                        <p className="text-xs font-mono font-bold text-stone-900">User: kasir</p>
                        <p className="text-xs font-mono text-stone-600">Default PIN: 1234</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Sesi Aktif & Otorisasi */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-150 pb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-[#c87a58]" />
                        <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider">
                          Sesi Staf Aktif
                        </h3>
                      </div>
                      <span className="text-[10px] bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded-full">
                        Browser POS
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 text-[11px]">Nama Staf:</span>
                          <span className="font-black text-stone-900">{session?.name || 'Administrator Utama'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 text-[11px]">Username:</span>
                          <span className="font-mono font-bold text-stone-800">{session?.username || 'admin'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 text-[11px]">Tingkat Akses:</span>
                          <span className="font-bold text-[#c87a58] uppercase text-[10px] bg-[#c87a58]/10 px-2 py-0.5 rounded">
                            {session?.role === 'owner' ? 'Owner / Penuh' : session?.role || 'Admin'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 text-[11px]">Status Sesi:</span>
                          <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Terotentikasi (24 Jam)
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-200 space-y-1 text-[11px] text-stone-600">
                        <span className="font-bold text-stone-800 block">Hak Akses Tersedia:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-stone-500">
                          <li>Pemrosesan pesanan tamu & notifikasi bel</li>
                          <li>Manajemen resep bahan baku & stok (BOM)</li>
                          <li>Pengaturan QR meja & cetak stiker</li>
                          <li>Pengaturan QRIS & rekening pembayaran</li>
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full py-2.5 px-4 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar / Logout Sesi Admin</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>

        </main>
      </div>

    </div>
  );
}
