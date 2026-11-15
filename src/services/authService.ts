import { API_ENDPOINTS, IS_PREVIEW_MODE } from '../config/api';
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
  OtpPurpose,
  OtpRequestResponse,
  ResetOtpVerifyResponse,
  SignupPayload,
} from '../types/manga';
import { isStrongPassword, STRONG_PASSWORD_REQUIREMENTS_TEXT } from '../utils/editorLogic';
import { ApiError, apiRequest, getStoredToken, setStoredToken } from './apiClient';
import { PREVIEW_USER } from './mockData';

const PREVIEW_USER_KEY = 'mangaforge_preview_user';
const PREVIEW_ACCOUNTS_KEY = 'mangaforge_preview_accounts';

interface StoredPreviewAccount {
  name: string;
  email: string;
  password: string;
}

const pendingSignups = new Map<string, StoredPreviewAccount>();

function readPreviewAccounts(): Record<string, StoredPreviewAccount> {
  try {
    const raw = window.localStorage.getItem(PREVIEW_ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredPreviewAccount>) : {};
  } catch {
    return {};
  }
}

function writePreviewAccounts(accounts: Record<string, StoredPreviewAccount>): void {
  try {
    window.localStorage.setItem(PREVIEW_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage quota errors
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const authService = {
  async signup(payload: SignupPayload): Promise<OtpRequestResponse> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<OtpRequestResponse>(API_ENDPOINTS.auth.signup, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    await wait(350);
    if (!payload.name.trim()) {
      throw new ApiError('Please enter your creator or studio name.', 400, 'INVALID_NAME');
    }
    if (!isStrongPassword(payload.password)) {
      throw new ApiError(STRONG_PASSWORD_REQUIREMENTS_TEXT, 400, 'WEAK_PASSWORD');
    }

    const normalizedEmail = payload.email.trim().toLowerCase();
    pendingSignups.set(normalizedEmail, {
      name: payload.name.trim(),
      email: normalizedEmail,
      password: payload.password,
    });

    return {
      success: true,
      message: `Verification code sent to ${payload.email.trim()} via SMTP.`,
      expiresInSeconds: 300,
      resendAvailableInSeconds: 120,
    };
  },

  async sendLoginOtp(payload: LoginPayload): Promise<OtpRequestResponse> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<OtpRequestResponse>(API_ENDPOINTS.auth.loginOtp, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    await wait(350);
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (!payload.password) {
      throw new ApiError('Please enter your password.', 400, 'PASSWORD_REQUIRED');
    }

    const accounts = readPreviewAccounts();
    const existing = accounts[normalizedEmail];
    if (existing && existing.password !== payload.password) {
      throw new ApiError(
        'Incorrect email or password. Please verify your credentials or reset your password.',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    return {
      success: true,
      message: `Sign-in verification code sent to ${payload.email.trim()}.`,
      expiresInSeconds: 300,
      resendAvailableInSeconds: 120,
    };
  },

  async verifyOtp(
    email: string,
    otp: string,
    purpose: OtpPurpose,
    pendingName?: string
  ): Promise<AuthSession> {
    if (!IS_PREVIEW_MODE) {
      const session = await apiRequest<AuthSession>(API_ENDPOINTS.auth.verifyOtp, {
        method: 'POST',
        body: JSON.stringify({ email, otp, purpose }),
      });
      setStoredToken(session.accessToken);
      return session;
    }

    await wait(450);
    const trimmed = otp.trim();

    if (trimmed === '999999') {
      throw new ApiError(
        'This verification code has expired. Request a new 6-digit code.',
        410,
        'OTP_EXPIRED'
      );
    }

    if (trimmed !== '123456') {
      throw new ApiError(
        'Invalid verification code. Please check the 6-digit code sent to your email.',
        401,
        'INVALID_OTP'
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const accounts = readPreviewAccounts();
    const pending = pendingSignups.get(normalizedEmail);
    if (purpose === 'signup' && pending) {
      accounts[normalizedEmail] = pending;
      writePreviewAccounts(accounts);
      pendingSignups.delete(normalizedEmail);
    }

    const resolvedName =
      pendingName?.trim() ||
      pending?.name ||
      accounts[normalizedEmail]?.name ||
      (email.split('@')[0] ? email.split('@')[0].replace(/[._-]/g, ' ') : PREVIEW_USER.name);

    const user: AuthUser = {
      ...PREVIEW_USER,
      email: email.trim(),
      name: resolvedName,
    };

    const session: AuthSession = {
      accessToken: `preview-session-${Date.now()}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      user,
    };

    setStoredToken(session.accessToken);
    try {
      window.localStorage.setItem(PREVIEW_USER_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage error
    }
    return session;
  },

  async requestPasswordResetOtp(email: string): Promise<OtpRequestResponse> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<OtpRequestResponse>(API_ENDPOINTS.auth.forgotPassword, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    }

    await wait(350);
    return {
      success: true,
      message: `Password recovery code sent to ${email.trim()}.`,
      expiresInSeconds: 300,
      resendAvailableInSeconds: 120,
    };
  },

  async verifyPasswordResetOtp(email: string, otp: string): Promise<ResetOtpVerifyResponse> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<ResetOtpVerifyResponse>(API_ENDPOINTS.auth.verifyResetOtp, {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
    }

    await wait(400);
    const trimmed = otp.trim();
    if (trimmed === '999999') {
      throw new ApiError(
        'This verification code has expired. Request a new 6-digit code.',
        410,
        'OTP_EXPIRED'
      );
    }
    if (trimmed !== '123456') {
      throw new ApiError(
        'Invalid verification code. Please enter the 6-digit code sent to your email.',
        401,
        'INVALID_OTP'
      );
    }

    return {
      verified: true,
      resetToken: `preview-reset-${Date.now()}`,
    };
  },

  async resetPassword(
    email: string,
    resetToken: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<{ success: boolean; message: string }>(API_ENDPOINTS.auth.resetPassword, {
        method: 'POST',
        body: JSON.stringify({ email, resetToken, newPassword }),
      });
    }

    await wait(400);
    if (!resetToken) {
      throw new ApiError('Verification session expired. Request a fresh code.', 401, 'RESET_REQUIRED');
    }
    if (!isStrongPassword(newPassword)) {
      throw new ApiError(STRONG_PASSWORD_REQUIREMENTS_TEXT, 400, 'WEAK_PASSWORD');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const accounts = readPreviewAccounts();
    const existing = accounts[normalizedEmail];
    accounts[normalizedEmail] = {
      name:
        existing?.name ||
        (normalizedEmail.split('@')[0]
          ? normalizedEmail.split('@')[0].replace(/[._-]/g, ' ')
          : PREVIEW_USER.name),
      email: normalizedEmail,
      password: newPassword,
    };
    writePreviewAccounts(accounts);

    return {
      success: true,
      message: 'Your password has been updated. Sign in with your new password.',
    };
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const token = getStoredToken();
    if (!token) return null;

    if (!IS_PREVIEW_MODE) {
      try {
        return await apiRequest<AuthUser>(API_ENDPOINTS.auth.me, { method: 'GET' });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setStoredToken(null);
          return null;
        }
        throw err;
      }
    }

    try {
      const raw = window.localStorage.getItem(PREVIEW_USER_KEY);
      if (raw) return JSON.parse(raw) as AuthUser;
    } catch {
      // Ignore parse error
    }
    return PREVIEW_USER;
  },

  activatePreviewSession(): AuthUser {
    const sessionToken = `preview-session-${Date.now()}`;
    setStoredToken(sessionToken);
    try {
      window.localStorage.setItem(PREVIEW_USER_KEY, JSON.stringify(PREVIEW_USER));
    } catch {
      // Ignore storage error
    }
    return PREVIEW_USER;
  },

  async logout(): Promise<void> {
    if (!IS_PREVIEW_MODE && getStoredToken()) {
      try {
        await apiRequest<void>(API_ENDPOINTS.auth.logout, { method: 'POST' });
      } catch {
        // Proceed clearing client token
      }
    }
    setStoredToken(null);
    try {
      window.localStorage.removeItem(PREVIEW_USER_KEY);
    } catch {
      // Ignore
    }
  },
};
