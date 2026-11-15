import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  RotateCw,
  User,
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

interface AuthPageProps {
  mode: 'signup' | 'login';
}

const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your name (at least 2 characters).'),
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().refine(isStrongPassword, {
      message: STRONG_PASSWORD_REQUIREMENTS_TEXT,
    }),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
    acceptTerms: z.literal(true, {
      message: 'Please accept the Terms of Service and Privacy Policy.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});

type AuthFormValues = {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  acceptTerms?: boolean;
};

export default function AuthPage({ mode }: AuthPageProps) {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { requestSignupOtp, requestLoginOtp, verifyOtpCode } = useAuth();

  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [submittedPayload, setSubmittedPayload] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(isSignup ? signupSchema : loginSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const watchedPassword = watch('password') || '';

  useEffect(() => {
    setStep('credentials');
    setSubmittedPayload(null);
    setOtpValue('');
    setApiError(null);
    setStatusNote(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    reset({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    });
  }, [mode, reset]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const onSubmitCredentials = async (values: AuthFormValues) => {
    setSubmitting(true);
    setApiError(null);
    setStatusNote(null);

    const email = values.email.trim();
    const name = (values.name || '').trim();
    const password = values.password;

    try {
      const response = isSignup
        ? await requestSignupOtp({ name, email, password })
        : await requestLoginOtp({ email, password });

      setSubmittedPayload({ name, email, password });
      setCountdown(response.resendAvailableInSeconds || 120);
      setStatusNote(response.message);
      setOtpValue('');
      setStep('otp');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Unable to send verification code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || submitting || !submittedPayload) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const response = isSignup
        ? await requestSignupOtp(submittedPayload)
        : await requestLoginOtp({
            email: submittedPayload.email,
            password: submittedPayload.password,
          });
      setCountdown(response.resendAvailableInSeconds || 120);
      setStatusNote(`Fresh verification code sent to ${submittedPayload.email}.`);
      setOtpValue('');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittedPayload) return;

    setApiError(null);
    if (!isValidSixDigitOtp(otpValue)) {
      setApiError('Enter all 6 numeric digits from your verification email.');
      return;
    }

    setSubmitting(true);
    try {
      await verifyOtpCode(
        submittedPayload.email,
        otpValue,
        mode,
        isSignup ? submittedPayload.name : undefined
      );
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || '/dashboard', { replace: true });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] grid grid-cols-1 lg:grid-cols-12">
      {/* Left Split: Auth Form */}
      <div className="lg:col-span-6 flex flex-col justify-between px-6 sm:px-12 lg:px-16 py-8 border-b-2 lg:border-b-0 lg:border-r-2 border-[#222222]">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Back to MangaForge Landing">
            <MangaLogo size={30} />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#525252] hover:text-[#171717]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto my-10">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-3">
            {isSignup
              ? `Creator Onboarding · Step ${step === 'credentials' ? '01' : '02'} of 02`
              : `Creator Sign In · Step ${step === 'credentials' ? '01' : '02'} of 02`}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-normal text-[#171717] leading-tight">
            {isSignup ? 'Create Your Manga Studio.' : 'Welcome Back, Creator.'}
          </h1>
          <p className="text-sm text-[#525252] mt-2 mb-7">
            {step === 'otp'
              ? 'Verify the 6-digit code sent to your inbox to complete authentication.'
              : isSignup
                ? 'Set up your studio credentials, then verify your email via OTP.'
                : 'Sign in with your email and password, then verify via 6-digit OTP.'}
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
            {step === 'credentials' ? (
              <motion.form
                key={`credentials-${mode}`}
                initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit(onSubmitCredentials)}
                noValidate
                className="space-y-4"
              >
                {isSignup && (
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5"
                    >
                      Creator / Studio Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Kenji Takahashi"
                        {...register('name')}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#222222] text-sm text-[#171717] focus:outline-none focus:border-[#E63946]"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs font-semibold text-[#E63946] mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      placeholder="author@studio.jp"
                      {...register('email')}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#222222] text-sm text-[#171717] focus:outline-none focus:border-[#E63946]"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs font-semibold text-[#E63946] mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-bold uppercase tracking-wider text-[#171717]"
                    >
                      Password
                    </label>
                    {!isSignup && (
                      <Link
                        to="/forgot-password"
                        className="text-xs font-bold text-[#E63946] hover:underline"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      placeholder={isSignup ? 'Create a strong password' : 'Enter your password'}
                      {...register('password')}
                      className="w-full pl-10 pr-11 py-2.5 bg-white border-2 border-[#222222] text-sm text-[#171717] focus:outline-none focus:border-[#E63946]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#171717] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs font-semibold text-[#E63946] mt-1">
                      {errors.password.message}
                    </p>
                  )}
                  {isSignup && <PasswordStrengthChecklist password={watchedPassword} />}
                </div>

                {isSignup && (
                  <div>
                    <label
                      htmlFor="auth-confirm-password"
                      className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Re-enter your strong password"
                        {...register('confirmPassword')}
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
                    {errors.confirmPassword && (
                      <p className="text-xs font-semibold text-[#E63946] mt-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                )}

                {isSignup && (
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#525252]">
                      <input
                        type="checkbox"
                        {...register('acceptTerms')}
                        className="mt-0.5 w-4 h-4 accent-[#E63946] border-2 border-[#222222]"
                      />
                      <span>
                        I agree to the MangaForge Terms of Service and Privacy Policy for email OTP
                        verification.
                      </span>
                    </label>
                    {errors.acceptTerms && (
                      <p className="text-xs font-semibold text-[#E63946] mt-1">
                        {errors.acceptTerms.message}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#171717] text-white text-sm font-bold border-2 border-[#222222] manga-panel-shadow hover:bg-[#E63946] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Verification OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>{isSignup ? 'Continue to OTP Verification' : 'Sign In & Send OTP'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="otp-step"
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
                      Verification OTP sent to
                    </p>
                    <p className="text-sm font-bold text-[#171717] truncate">
                      {submittedPayload?.email}
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-[#737373]">
                      Not in your inbox? Check your spam or junk folder too.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setApiError(null);
                    }}
                    className="text-xs font-bold text-[#E63946] hover:underline shrink-0 cursor-pointer"
                  >
                    Edit Details
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
                      <span>{isSignup ? 'Verify & Create Account' : 'Verify & Sign In'}</span>
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
          </AnimatePresence>

          <p className="mt-7 pt-6 border-t border-[#222222]/15 text-sm text-[#525252]">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-bold text-[#171717] underline decoration-[#E63946] decoration-2 underline-offset-4 hover:text-[#E63946]"
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New to MangaForge?{' '}
                <Link
                  to="/signup"
                  className="font-bold text-[#171717] underline decoration-[#E63946] decoration-2 underline-offset-4 hover:text-[#E63946]"
                >
                  Create an account
                </Link>
              </>
            )}
          </p>
        </div>

        <p className="text-xs font-mono text-[#737373]">
          Two-factor email OTP protection · Encrypted studio credentials
        </p>
      </div>

      {/* Right Split: Full-Color Manga Editorial Illustration */}
      <div className="hidden lg:flex lg:col-span-6 relative bg-[#F1EFEA] manga-halftone-subtle items-center justify-center p-12 overflow-hidden">
        <SpeedLinesSvg className="absolute inset-0 w-full h-full" opacity={0.09} />

        <div className="relative max-w-md w-full">
          <div className="bg-white border-2 border-[#222222] p-4 manga-panel-shadow">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#737373] pb-2 mb-3 border-b border-[#222222]/15">
              <span>STUDIO EDITION · COLOR VOL. 01</span>
              <span className="text-[#E63946] font-bold">COLOR INK READY</span>
            </div>
            <div className="aspect-[3/4] border-2 border-[#222222] overflow-hidden bg-[#FAF9F6]">
              <MangaImage
                src={isSignup ? MANGA_ARTWORK.heroPage : MANGA_ARTWORK.seinen}
                alt="MangaForge Editorial Artwork"
                fallbackTitle="MangaForge Studio"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          <div className="absolute -bottom-6 -left-6 max-w-[235px]">
            <SpeechBubbleCallout tailSide="right">
              <p className="font-dialogue text-xs font-bold text-[#171717]">
                {isSignup
                  ? 'Every serialized chapter starts with a single vibrant frame.'
                  : 'Your storyboard panels and character sheets are synced.'}
              </p>
            </SpeechBubbleCallout>
          </div>
        </div>
      </div>
    </div>
  );
}
