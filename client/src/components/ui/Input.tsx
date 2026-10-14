import React, { InputHTMLAttributes, forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  authStyle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, authStyle = false, ...props }, ref) => {
    const generatedId = useId();
    const inputId = props.id ?? generatedId;
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = props.type === 'password';
    const inputType = isPassword && showPassword ? 'text' : props.type;

    return (
      <div className="w-full">
        {label && !authStyle && (
          <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          {label && authStyle && (
            <label htmlFor={inputId} className="absolute left-5 top-3 z-10 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {label}
            </label>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`flex w-full border bg-white/75 backdrop-blur-md text-slate-900 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:bg-white focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-xs ${
              authStyle
                ? 'h-16 rounded-2xl border-slate-200/90 px-5 pb-1.5 pt-6 text-base placeholder:text-transparent'
                : 'h-11 rounded-2xl border-slate-200/90 px-4 py-2 text-sm'
            } ${icon ? 'pl-10' : ''} ${isPassword && authStyle ? 'pr-14' : ''} ${
              error ? 'border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-500/15' : ''
            } ${className}`}
            {...props}
            type={inputType}
          />
          {isPassword && authStyle && (
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs font-semibold text-rose-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
