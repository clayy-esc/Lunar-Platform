import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-full text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background active:scale-[0.98]';
    
    const variants = {
      primary: 'bg-slate-950 text-white hover:bg-slate-800 shadow-md shadow-slate-950/15 border border-slate-900',
      secondary: 'bg-white/90 text-slate-800 hover:bg-white border border-slate-200/80 shadow-xs hover:border-slate-300',
      ghost: 'hover:bg-slate-100/80 hover:text-slate-900 text-slate-600',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs',
      outline: 'border border-slate-200/90 bg-white/70 backdrop-blur-md hover:bg-white hover:border-slate-300 text-slate-800 shadow-xs'
    };

    const sizes = {
      sm: 'h-9 px-4 text-xs',
      md: 'h-10 py-2.5 px-5',
      lg: 'h-12 px-8 text-base shadow-lg shadow-slate-950/20',
      icon: 'h-10 w-10 p-0 rounded-full'
    };

    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button ref={ref} disabled={disabled || isLoading} className={classes} {...props}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
