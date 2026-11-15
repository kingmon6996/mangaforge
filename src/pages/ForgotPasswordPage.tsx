import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  RotateCw,
} from 'lucide-react';
import { IS_PREVIEW_MODE } from '../config/api';
import { MANGA_ARTWORK } from '../config/media';
import { useAuth } from '../store/AuthContext';
import {
  isStrongPassword,
  isValidSixDigitOtp,
  STRONG_PASSWORD_REQUIREMENTS_TEXT,
} from '../utils/editorLogic';
import { OtpInput } from '../components/auth/OtpInput';
import { PasswordStrengthChecklist } from '../components/auth/PasswordStrengthChecklist';
import {
  MangaImage,
  SpeechBubbleCallout,
  SpeedLinesSvg,
} from '../components/manga/MangaDecorations';
import { MangaLogo } from '../components/manga/MangaLogo';

const emailSchema = z.object({
  email: z.string().email('Please enter the valid email address linked to your account.'),
});

const resetPasswordSchema = z
  .object({
    newPassword: z.string().refine(isStrongPassword, {
      message: STRONG_PASSWORD_REQUIREMENTS_TEXT,
    }),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type EmailValues = z.infer<typeof emailSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
  const prefersReducedMotion = useReducedMotion();
  const { requestPasswordResetOtp, verifyPasswordResetOtp, resetPassword } = useAuth();

  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'done'>('email');
  const [targetEmail, setTargetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const passwordForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const watchedNewPassword = passwordForm.watch('newPassword') || '';

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const onSubmitEmail = async (values: EmailValues) => {
    setSubmitting(true);
    setApiError(null);
    setStatusNote(null);
    try {
      const cleanEmail = values.email.trim();
      const res = await requestPasswordResetOtp(cleanEmail);
      setTargetEmail(cleanEmail);
      setCountdown(res.resendAvailableInSeconds || 120);
      setStatusNote(res.message);
      setOtpValue('');
      setStep('otp');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Unable to send recovery code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || submitting || !targetEmail) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const res = await requestPasswordResetOtp(targetEmail);
      setCountdown(res.resendAvailableInSeconds || 120);
      setStatusNote(`Fresh recovery code sent to ${targetEmail}.`);
      setOtpValue('');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to resend recovery code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!isValidSixDigitOtp(otpValue)) {
      setApiError('Enter all 6 numeric digits from your recovery email.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await verifyPasswordResetOtp(targetEmail, otpValue);
      if (!res.verified || !res.resetToken) {
        throw new Error('Verification code could not be confirmed.');
      }
      setResetToken(res.resetToken);
      setStep('reset');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitNewPassword = async (values: ResetPasswordValues) => {
    setSubmitting(true);
    setApiError(null);
    try {
      const res = await resetPassword(targetEmail, resetToken, values.newPassword);
      setStatusNote(res.message);
      setStep('done');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabel =
    step === 'email'
      ? 'Step 01 of 03 · Account Email'
      : step === 'otp'
        ? 'Step 02 of 03 · Verification Code'
        : step === 'reset'
          ? 'Step 03 of 03 · New Strong Password'
          : 'Recovery Complete';

  return (
    <div className="min-h-screen bg-[#FAF9F6] grid grid-cols-1 lg:grid-cols-12">
      {/* Left Split: Recovery Flow */}
      <div className="lg:col-span-6 flex flex-col justify-between px-6 sm:px-12 lg:px-16 py-8 border-b-2 lg:border-b-0 lg:border-r-2 border-[#222222]">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Back to MangaForge Landing">
            <MangaLogo size={30} />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#525252] hover:text-[#171717]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto my-10">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-3">
            Password Recovery · {stepLabel}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-normal text-[#171717] leading-tight">
            {step === 'done'
              ? 'Password Reset Complete.'
              : step === 'reset'
                ? 'Set a New Strong Password.'
                : 'Reset Your Studio Password.'}
          </h1>
          <p className="text-sm text-[#525252] mt-2 mb-7">
            {step === 'email'
              ? 'Enter your creator email address and we will send a 6-digit verification code.'
              : step === 'otp'
                ? 'Confirm the 6-digit code sent to your inbox before choosing a new password.'
                : step === 'reset'
                  ? 'Choose a strong new password that satisfies all security rules below.'
                  : 'Your account credentials are updated. Return to Sign In whenever you are ready.'}
          </p>

          {apiError && (
            <div
              role="alert"
              className="mb-5 border-2 border-[#E63946] bg-white p-3.5 flex items-start gap-2.5 text-sm text-[#E63946]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{apiError}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.form
                key="forgot-email"
                initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                onSubmit={emailForm.handleSubmit(onSubmitEmail)}
                noValidate
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      placeholder="author@studio.jp"
                      {...emailForm.register('email')}
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-[#222222] text-sm text-[#171717] focus:outline-none focus:border-[#E63946]"
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-xs font-semibold text-[#E63946] mt-1.5">
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#171717] text-white text-sm font-bold border-2 border-[#222222] manga-panel-shadow hover:bg-[#E63946] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Recovery Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.form
                key="forgot-otp"
                initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleVerifyOtp}
                className="space-y-5"
              >
                <div className="bg-[#F1EFEA] border-2 border-[#222222] p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono uppercase text-[#737373]">
                      Recovery code sent to
                    </p>
                    <p className="text-sm font-bold text-[#171717] truncate">{targetEmail}</p>
                    <p className="mt-1 text-[11px] leading-4 text-[#737373]">
                      Not in your inbox? Check your spam or junk folder too.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setApiError(null);
                    }}
                    className="text-xs font-bold text-[#E63946] hover:underline shrink-0 cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                {statusNote && <p className="text-xs text-[#525252]">{statusNote}</p>}

                {IS_PREVIEW_MODE && (
                  <div className="border border-dashed border-[#222222] bg-white px-3 py-2 text-xs text-[#525252]">
                    Preview Mode OTP: enter{' '}
                    <span className="font-mono font-bold text-[#171717]">123456</span> to verify,
                    or <span className="font-mono font-bold text-[#171717]">999999</span> to inspect
                    expired-code handling.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-2">
                    6-Digit Verification Code
                  </label>
                  <OtpInput
                    value={otpValue}
                    onChange={setOtpValue}
                    disabled={submitting}
                    hasError={Boolean(apiError)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#E63946] text-white text-sm font-bold border-2 border-[#222222] manga-panel-shadow hover:bg-[#171717] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Code & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    disabled={countdown > 0 || submitting}
                    onClick={handleResend}
                    className="inline-flex items-center gap-1.5 font-bold text-[#171717] hover:text-[#E63946] disabled:text-[#737373] cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>
                      {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend verification code'}
                    </span>
                  </button>
                  <span className="font-mono text-[#737373] tabular-nums">Expires in 5m</span>
                </div>
              </motion.form>
            )}

            {step === 'reset' && (
              <motion.form
                key="forgot-reset"
                initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={passwordForm.handleSubmit(onSubmitNewPassword)}
                noValidate
                className="space-y-4"
              >
                <div className="bg-[#F1EFEA] border-2 border-[#222222] px-3.5 py-2.5 flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span className="font-semibold text-[#171717] truncate">
                    Code verified for {targetEmail}
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="reset-new-password"
                    className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reset-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Create a strong new password"
                      {...passwordForm.register('newPassword')}
                      className="w-full pl-10 pr-11 py-2.5 bg-white border-2 border-[#222222] text-sm text-[#171717] focus:outline-none focus:border-[#E63946]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#171717] cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs font-semibold text-[#E63946] mt-1">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                  <PasswordStrengthChecklist password={watchedNewPassword} />
                </div>

                <div>
                  <label
                    htmlFor="reset-confirm-password"
                    className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reset-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter your new password"
                      {...passwordForm.register('confirmPassword')}
                      className="w-full pl-10 pr-11 py-2.5 bg-white border-2 border-[#222222] text-sm text-[#171717] focus:outline-none focus:border-[#E63946]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#171717] cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs font-semibold text-[#E63946] mt-1">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#E63946] text-white text-sm font-bold border-2 border-[#222222] manga-panel-shadow hover:bg-[#171717] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {step === 'done' && (
              <motion.div
                key="forgot-done"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="border-2 border-[#222222] bg-white p-6 manga-panel-shadow space-y-5"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-[#171717]">
                      Password updated for {targetEmail}
                    </p>
                    <p className="text-xs text-[#525252] mt-1">
                      {statusNote ||
                        'Your new strong password is active. Sign in with your email, new password, and OTP verification.'}
                    </p>
                  </div>
                </div>

                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#171717] text-white text-sm font-bold border-2 border-[#222222] manga-panel-shadow hover:bg-[#E63946] transition-colors"
                >
                  <span>Continue to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-7 pt-6 border-t border-[#222222]/15 text-sm text-[#525252]">
            Remembered your password?{' '}
            <Link
              to="/login"
              className="font-bold text-[#171717] underline decoration-[#E63946] decoration-2 underline-offset-4 hover:text-[#E63946]"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-xs font-mono text-[#737373]">
          Verified email OTP recovery · Strong password policy enforced
        </p>
      </div>

      {/* Right Split: Full-Color Manga Illustration */}
      <div className="hidden lg:flex lg:col-span-6 relative bg-[#F1EFEA] manga-halftone-subtle items-center justify-center p-12 overflow-hidden">
        <SpeedLinesSvg className="absolute inset-0 w-full h-full" opacity={0.09} />

        <div className="relative max-w-md w-full">
          <div className="bg-white border-2 border-[#222222] p-4 manga-panel-shadow">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#737373] pb-2 mb-3 border-b border-[#222222]/15">
              <span>STUDIO VAULT · ACCESS RECOVERY</span>
              <span className="text-[#E63946] font-bold">OTP GUARDED</span>
            </div>
            <div className="aspect-[3/4] border-2 border-[#222222] overflow-hidden bg-[#FAF9F6]">
              <MangaImage
                src={MANGA_ARTWORK.fantasy}
                alt="MangaForge Vault Artwork"
                fallbackTitle="MangaForge Vault"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          <div className="absolute -bottom-6 -left-6 max-w-[235px]">
            <SpeechBubbleCallout tailSide="right">
              <p className="font-dialogue text-xs font-bold text-[#171717]">
                Verify your inbox code to unlock a fresh studio key.
              </p>
            </SpeechBubbleCallout>
          </div>
        </div>
      </div>
    </div>
  );
}
