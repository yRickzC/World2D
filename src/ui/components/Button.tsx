import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'emerald' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth = false,
  disabled = false,
  className = '',
  id,
  type = 'button',
  ...rest
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg min-h-[34px]',
    md: 'px-4 py-2 text-sm gap-2 rounded-xl min-h-[42px]',
    lg: 'px-6 py-3 text-base font-semibold gap-2.5 rounded-xl min-h-[48px]',
  }[size];

  const variantStyles = {
    primary:
      'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold shadow-sm hover:shadow-md border border-amber-400/40',
    secondary:
      'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-850 text-zinc-100 font-medium border border-zinc-700/80 shadow-sm',
    emerald:
      'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold shadow-sm hover:shadow-md border border-emerald-500/40',
    danger:
      'bg-rose-950/70 hover:bg-rose-900 active:bg-rose-950 text-rose-300 hover:text-rose-100 font-medium border border-rose-800/60 shadow-sm',
    ghost:
      'bg-transparent hover:bg-zinc-800/70 active:bg-zinc-800 text-zinc-300 hover:text-zinc-100 font-medium border border-transparent',
    outline:
      'bg-transparent hover:bg-zinc-800/60 active:bg-zinc-800 text-zinc-200 hover:text-white font-medium border border-zinc-600/80',
  }[variant];

  const disabledStyles = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer transition-all duration-150 active:scale-[0.98]';

  const widthStyle = fullWidth ? 'w-full justify-center' : '';

  return (
    <button
      id={id}
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center select-none ${sizeStyles} ${variantStyles} ${disabledStyles} ${widthStyle} ${className}`}
      {...rest}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children && <span className="truncate">{children}</span>}
      {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
};
