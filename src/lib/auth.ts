// src/lib/auth.ts
// Sistem Autentikasi & Keamanan Sesi Admin Aruna Cafe

export interface AdminSession {
  username: string;
  role: 'owner' | 'admin' | 'kasir';
  name: string;
  token: string;
  loginAt: string;
  expiresAt: number; // Unix timestamp ms
}

const STORAGE_KEY_ADMIN_AUTH = 'aruna_admin_auth_session';
const STORAGE_KEY_ADMIN_CREDS = 'aruna_admin_custom_creds';

// Default kredensial resmi Aruna
const DEFAULT_ACCOUNTS = [
  {
    username: 'admin',
    passwordHash: 'aruna1988',
    altPins: ['1988', 'admin123'],
    role: 'owner' as const,
    name: 'Administrator Utama',
  },
  {
    username: 'kasir',
    passwordHash: 'kasir1988',
    altPins: ['1234', '1988'],
    role: 'kasir' as const,
    name: 'Kasir & Kitchen Dispatch',
  },
];

// Sesi berlaku 24 jam (86400000 ms)
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export const AdminAuth = {
  /**
   * Cek apakah admin sudah login dan sesi masih berlaku
   */
  isAuthenticated(): boolean {
    const session = this.getSession();
    return session !== null;
  },

  /**
   * Ambil data sesi admin aktif
   */
  getSession(): AdminSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADMIN_AUTH);
      if (!raw) return null;
      const session: AdminSession = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        // Sesi telah kedaluwarsa
        this.logout();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  /**
   * Proses login admin dengan username & password/PIN
   */
  login(usernameInput: string, passwordInput: string): { success: boolean; error?: string; session?: AdminSession } {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Lingkungan browser tidak tersedia' };
    }

    const cleanUsername = usernameInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanUsername || !cleanPassword) {
      return { success: false, error: 'Username dan Password / PIN wajib diisi' };
    }

    // Cek apakah ada custom kredensial yang tersimpan
    let customCreds: { username: string; passwordHash: string; role: 'owner' | 'admin' | 'kasir'; name: string } | null = null;
    try {
      const customRaw = localStorage.getItem(STORAGE_KEY_ADMIN_CREDS);
      if (customRaw) customCreds = JSON.parse(customRaw);
    } catch {}

    let matchedAccount: { username: string; role: 'owner' | 'admin' | 'kasir'; name: string } | null = null;

    if (customCreds && customCreds.username.toLowerCase() === cleanUsername && customCreds.passwordHash === cleanPassword) {
      matchedAccount = {
        username: customCreds.username,
        role: customCreds.role,
        name: customCreds.name,
      };
    } else {
      // Cek default akun
      const found = DEFAULT_ACCOUNTS.find(acc => 
        acc.username.toLowerCase() === cleanUsername && 
        (acc.passwordHash === cleanPassword || acc.altPins.includes(cleanPassword))
      );
      if (found) {
        matchedAccount = {
          username: found.username,
          role: found.role,
          name: found.name,
        };
      }
    }

    if (!matchedAccount) {
      return { 
        success: false, 
        error: 'Kombinasi Username dan Password/PIN salah. Silakan periksa kembali.' 
      };
    }

    // Buat token dan simpan sesi
    const token = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `adm-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const session: AdminSession = {
      username: matchedAccount.username,
      role: matchedAccount.role,
      name: matchedAccount.name,
      token,
      loginAt: new Date().toISOString(),
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };

    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, JSON.stringify(session));
      window.dispatchEvent(new Event('aruna_admin_auth_changed'));
    } catch (e) {
      console.error('Gagal menyimpan sesi auth:', e);
    }

    return { success: true, session };
  },

  /**
   * Logout dan hapus sesi admin
   */
  logout(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
      window.dispatchEvent(new Event('aruna_admin_auth_changed'));
    } catch (e) {
      console.error('Logout error:', e);
    }
  },

  /**
   * Perbarui password admin
   */
  changePassword(currentPassword: string, newPassword: string): { success: boolean; error?: string } {
    const session = this.getSession();
    if (!session) return { success: false, error: 'Anda harus login terlebih dahulu' };

    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'Password baru minimal 4 karakter' };
    }

    // Verifikasi password lama
    const loginCheck = this.login(session.username, currentPassword);
    if (!loginCheck.success) {
      return { success: false, error: 'Password lama tidak sesuai' };
    }

    try {
      const updatedCreds = {
        username: session.username,
        passwordHash: newPassword,
        role: session.role,
        name: session.name,
      };
      localStorage.setItem(STORAGE_KEY_ADMIN_CREDS, JSON.stringify(updatedCreds));
      return { success: true };
    } catch {
      return { success: false, error: 'Gagal menyimpan password baru' };
    }
  }
};
