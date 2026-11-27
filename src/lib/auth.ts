// src/lib/auth.ts
// Sistem Autentikasi & Keamanan Sesi Admin Aruna Cafe

export interface AdminSession {
  username: string;
  role: 'owner' | 'admin' | 'kasir';
  shift?: 'Shift Pagi' | 'Shift Malam' | 'Admin Owner';
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
  login(
    usernameInput: string, 
    passwordInput: string, 
    shiftChoice?: 'Shift Pagi' | 'Shift Malam' | 'Admin Owner'
  ): { success: boolean; error?: string; session?: AdminSession } {
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

    let matchedAccount: { username: string; role: 'owner' | 'admin' | 'kasir'; name: string; shift?: 'Shift Pagi' | 'Shift Malam' | 'Admin Owner' } | null = null;

    // Support direct shift login
    if (shiftChoice === 'Shift Pagi' || shiftChoice === 'Shift Malam') {
      const validPins = ['1234', '123456', '1988', 'kasir1988'];
      if (validPins.includes(cleanPassword)) {
        matchedAccount = {
          username: shiftChoice === 'Shift Pagi' ? 'kasir_pagi' : 'kasir_malam',
          role: 'kasir',
          name: shiftChoice === 'Shift Pagi' ? 'Aruna S. (Kasir Pagi)' : 'Aruna B. (Kasir Malam)',
          shift: shiftChoice,
        };
      }
    } else if (shiftChoice === 'Admin Owner') {
      const validOwnerPw = ['aruna1988', 'admin123', 'owner1988', '1988'];
      if (validOwnerPw.includes(cleanPassword)) {
        matchedAccount = {
          username: 'admin_owner',
          role: 'owner',
          name: 'Owner Aruna Cafe',
          shift: 'Admin Owner',
        };
      }
    }

    if (!matchedAccount) {
      if (customCreds && customCreds.username.toLowerCase() === cleanUsername && customCreds.passwordHash === cleanPassword) {
        matchedAccount = {
          username: customCreds.username,
          role: customCreds.role,
          name: customCreds.name,
          shift: shiftChoice,
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
            shift: shiftChoice || (found.role === 'owner' ? 'Admin Owner' : 'Shift Pagi'),
          };
        }
      }
    }

    if (!matchedAccount) {
      return { 
        success: false, 
        error: shiftChoice === 'Admin Owner' 
          ? 'Password Admin Owner salah. Silakan coba "aruna1988".' 
          : 'PIN shift salah. Silakan coba PIN "1234" atau "1988".' 
      };
    }

    // Buat token dan simpan sesi
    const token = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `adm-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const session: AdminSession = {
      username: matchedAccount.username,
      role: matchedAccount.role,
      shift: matchedAccount.shift || shiftChoice,
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
   * Perbarui shift kasir yang aktif tanpa perlu logout
   */
  updateShift(newShift: 'Shift Pagi' | 'Shift Malam' | 'Admin Owner'): void {
    if (typeof window === 'undefined') return;
    const session = this.getSession();
    if (!session) return;
    session.shift = newShift;
    if (newShift === 'Shift Pagi') {
      session.role = 'kasir';
      session.name = 'Aruna S. (Kasir Pagi)';
    } else if (newShift === 'Shift Malam') {
      session.role = 'kasir';
      session.name = 'Aruna B. (Kasir Malam)';
    } else {
      session.role = 'owner';
      session.name = 'Owner Aruna Cafe';
    }
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, JSON.stringify(session));
      window.dispatchEvent(new Event('aruna_admin_auth_changed'));
    } catch (e) {
      console.error('Update shift error:', e);
    }
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
