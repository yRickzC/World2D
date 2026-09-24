import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  icon,
  actionButton,
  id,
  className = '',
  disabled = false,
  ...rest
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-zinc-300 flex items-center justify-between"
        >
          <span>{label}</span>
          {error && <span className="text-rose-400 font-normal text-[11px]">{error}</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-zinc-400">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          disabled={disabled}
          className={`w-full bg-zinc-900 border rounded-xl py-2 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none ${
            icon ? 'pl-9' : 'pl-3.5'
          } ${actionButton ? 'pr-28' : 'pr-3.5'} ${
            error
              ? 'border-rose-500/80 focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
              : 'border-zinc-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-zinc-950' : ''} ${className}`}
          {...rest}
        />

        {actionButton && (
          <div className="absolute right-1.5 flex items-center">{actionButton}</div>
        )}
      </div>

      {helper && !error && <p className="text-[11px] text-zinc-400 leading-tight">{helper}</p>}
    </div>
  );
};
