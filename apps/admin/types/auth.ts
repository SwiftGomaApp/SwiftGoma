export interface AuthUser {
  id: string;
  name: string;
  role: string;
  email: string | null;
  isEmailVerified: boolean;
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  isBlocked: boolean;
  [key: string]: unknown;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  connectionError: boolean;
  refetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}
