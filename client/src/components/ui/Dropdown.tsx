import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  width?: 'w-48' | 'w-56' | 'w-64' | 'w-auto';
  placement?: 'top' | 'bottom';
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, children, align = 'right', width = 'w-48', placement = 'bottom' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const alignmentClass = align === 'right' ? 'right-0' : 'left-0';
  const placementClass = placement === 'top'
    ? 'bottom-full mb-2 origin-bottom-right'
    : 'mt-2 origin-top-right';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div 
          className={`absolute z-40 ${placementClass} ${width} ${alignmentClass} max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white/90 backdrop-blur-2xl border border-white/90 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 focus:outline-none animate-in fade-in zoom-in-95 duration-100 p-1.5`}
          role="menu"
          aria-orientation="vertical"
          onClick={() => setIsOpen(false)} // Close on click inside
        >
          <div className="space-y-0.5" role="none">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export const DropdownItem: React.FC<React.HTMLAttributes<HTMLDivElement> & { disabled?: boolean; destructive?: boolean }> = ({ 
  children, 
  className = '', 
  disabled = false,
  destructive = false,
  ...props 
}) => {
  return (
    <div
      className={`block px-3.5 py-2 text-sm font-semibold rounded-xl cursor-pointer transition-colors ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : destructive
            ? 'text-rose-600 hover:bg-rose-50'
            : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
      } ${className}`}
      role="menuitem"
      {...props}
    >
      {children}
    </div>
  );
};

