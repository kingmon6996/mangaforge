import React, { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function OtpInput({ value, onChange, disabled = false, hasError = false }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const focusIndex = (idx: number) => {
    const el = inputRefs.current[Math.max(0, Math.min(5, idx))];
    el?.focus();
    el?.select();
  };

  const handleDigitChange = (idx: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      const next = digits.map((d, i) => (i === idx ? '' : d)).join('');
      onChange(next);
      return;
    }

    if (clean.length > 1) {
      const pasted = clean.slice(0, 6);
      onChange(pasted);
      focusIndex(Math.min(5, pasted.length - 1));
      return;
    }

    const nextDigits = [...digits];
    nextDigits[idx] = clean;
    onChange(nextDigits.join(''));
    if (idx < 5) {
      focusIndex(idx + 1);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      e.preventDefault();
      const nextDigits = [...digits];
      nextDigits[idx - 1] = '';
      onChange(nextDigits.join(''));
      focusIndex(idx - 1);
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      focusIndex(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < 5) {
      e.preventDefault();
      focusIndex(idx + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      e.preventDefault();
      onChange(pasted);
      focusIndex(Math.min(5, pasted.length - 1));
    }
  };

  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-3" role="group" aria-label="6-digit verification code">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          maxLength={6}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleDigitChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          aria-label={`Verification digit ${idx + 1}`}
          className={`h-13 sm:h-14 w-full text-center font-mono text-xl font-bold bg-white border-2 transition-colors focus:outline-none ${
            hasError
              ? 'border-[#E63946] text-[#E63946]'
              : 'border-[#222222] text-[#171717] focus:border-[#E63946]'
          } disabled:opacity-50`}
        />
      ))}
    </div>
  );
}
