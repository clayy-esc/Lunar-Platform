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
      primary: 'bg-[#fdb92b] text-[#14214a] hover:bg-[#ffc84d] shadow-md shadow-[#fdb92b]/25 border border-[#fdb92b] ',
      secondary: 'bg-white text-[#14214a] hover:bg-[#f4f6fd] border border-[#e3e8f6] shadow-xs',
      ghost: 'hover:bg-[#eef1fa] hover:text-[#14214a] text-[#5d6985]',
      danger: 'bg-[#d9534f] text-white hover:bg-[#bd4541] shadow-xs',
      outline: 'border border-[#e3e8f6] bg-white hover:bg-[#f4f6fd] hover:border-[#b7c8f4] text-[#14214a] shadow-xs'
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
