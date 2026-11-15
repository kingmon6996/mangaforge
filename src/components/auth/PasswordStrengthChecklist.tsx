import { Check, Circle } from 'lucide-react';
import { evaluatePasswordStrength } from '../../utils/editorLogic';

export function PasswordStrengthChecklist({ password }: { password: string }) {
  const strength = evaluatePasswordStrength(password);

  const items = [
    { key: 'minLength', label: '8+ characters', met: strength.checks.minLength },
    { key: 'hasUpper', label: 'Uppercase (A-Z)', met: strength.checks.hasUpper },
    { key: 'hasLower', label: 'Lowercase (a-z)', met: strength.checks.hasLower },
    { key: 'hasNumber', label: 'Number (0-9)', met: strength.checks.hasNumber },
    { key: 'hasSpecial', label: 'Special (!@#$)', met: strength.checks.hasSpecial },
  ];

  const barColors = [
    'bg-[#E63946]',
    'bg-[#E63946]',
    'bg-[#FFB703]',
    'bg-[#FFB703]',
    'bg-[#16A34A]',
  ];

  return (
    <div className="mt-2.5 border border-[#222222]/25 bg-[#F1EFEA] p-3 space-y-2.5">
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="font-bold uppercase tracking-wider text-[#525252]">
          Password Strength
        </span>
        <span
          className={`font-bold uppercase ${
            strength.isStrong
              ? 'text-[#16A34A]'
              : strength.score >= 3
                ? 'text-[#B45309]'
                : 'text-[#E63946]'
          }`}
        >
          {strength.label}
        </span>
      </div>

      {/* 5-segment comic ink strength meter */}
      <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className={`h-1.5 border border-[#222222] transition-colors ${
              idx < strength.score ? barColors[Math.max(0, strength.score - 1)] : 'bg-white'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {items.map((item) => (
          <div
            key={item.key}
            className={`flex items-center gap-1.5 text-[11px] font-medium ${
              item.met ? 'text-[#171717]' : 'text-[#737373]'
            }`}
          >
            {item.met ? (
              <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
            ) : (
              <Circle className="w-3 h-3 text-[#737373]/60 shrink-0" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
