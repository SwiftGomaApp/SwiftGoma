export interface AuthUser {
  id: string;
  name: string;
  role: string;
  email: string | null;
  isEmailVerified: boolean;
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  isBlocked: boolean;
  googleId?: string | null;
  passkeys?: Passkey[];
  [key: string]: unknown;
}

export interface Passkey {
  id: string;
  deviceName: string | null;
  createdAt: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isCompletingLogin: boolean;
  isAuthenticated: boolean;
  connectionError: boolean;
  refetchUser: () => Promise<AuthUser | null>;
  completeLogin: (sessionUser?: AuthUser | null) => Promise<void>;
  logout: () => Promise<void>;
}
