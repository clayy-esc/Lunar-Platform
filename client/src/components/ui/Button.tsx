import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'glass-button inline-flex items-center justify-center rounded-full text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background active:scale-[0.98]';
    
    const variants = {
      primary: 'bg-[#0077b6] text-white hover:bg-[#023e8a] shadow-md shadow-[#0077b6]/25 border border-[#0077b6]',
      secondary: 'bg-white/65 text-slate-800 hover:bg-white border border-white/80 shadow-xs hover:border-blue-200',
      ghost: 'hover:bg-white/60 hover:text-slate-900 text-slate-600',
      danger: 'bg-[#023e8a] text-white hover:bg-[#03045e] shadow-xs',
      outline: 'border border-white/80 bg-white/55 backdrop-blur-md hover:bg-white/85 hover:border-blue-200 text-slate-800 shadow-xs'
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
