import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type {
  AuthUser,
  LoginPayload,
  OtpPurpose,
  OtpRequestResponse,
  ResetOtpVerifyResponse,
  SignupPayload,
} from '../types/manga';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requestSignupOtp: (payload: SignupPayload) => Promise<OtpRequestResponse>;
  requestLoginOtp: (payload: LoginPayload) => Promise<OtpRequestResponse>;
  verifyOtpCode: (
    email: string,
    otp: string,
    purpose: OtpPurpose,
    pendingName?: string
  ) => Promise<AuthUser>;
  requestPasswordResetOtp: (email: string) => Promise<OtpRequestResponse>;
  verifyPasswordResetOtp: (email: string, otp: string) => Promise<ResetOtpVerifyResponse>;
  resetPassword: (
    email: string,
    resetToken: string,
    newPassword: string
  ) => Promise<{ success: boolean; message: string }>;
  enterPreviewSession: () => AuthUser;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const current = await authService.getCurrentUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const requestSignupOtp = useCallback(async (payload: SignupPayload) => {
    return authService.signup(payload);
  }, []);

  const requestLoginOtp = useCallback(async (payload: LoginPayload) => {
    return authService.sendLoginOtp(payload);
  }, []);

  const verifyOtpCode = useCallback(
    async (email: string, otp: string, purpose: OtpPurpose, pendingName?: string) => {
      const session = await authService.verifyOtp(email, otp, purpose, pendingName);
      setUser(session.user);
      return session.user;
    },
    []
  );

  const requestPasswordResetOtp = useCallback(async (email: string) => {
    return authService.requestPasswordResetOtp(email);
  }, []);

  const verifyPasswordResetOtp = useCallback(async (email: string, otp: string) => {
    return authService.verifyPasswordResetOtp(email, otp);
  }, []);

  const resetPassword = useCallback(
    async (email: string, resetToken: string, newPassword: string) => {
      return authService.resetPassword(email, resetToken, newPassword);
    },
    []
  );

  const enterPreviewSession = useCallback(() => {
    const previewUser = authService.activatePreviewSession();
    setUser(previewUser);
    setIsLoading(false);
    return previewUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        requestSignupOtp,
        requestLoginOtp,
        verifyOtpCode,
        requestPasswordResetOtp,
        verifyPasswordResetOtp,
        resetPassword,
        enterPreviewSession,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
