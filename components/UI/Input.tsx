
import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  containerClassName?: string;
  fullWidth?: boolean;
  prefixText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ 
  icon: Icon, 
  className = '', 
  containerClassName = '', 
  fullWidth = true,
  prefixText,
  ...props 
}, ref) => {
  return (
    <div className={`group relative ${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <Icon className={`h-5 w-5 text-gray-500 group-focus-within:text-brand-red transition-colors ${prefixText ? 'opacity-70' : ''}`} />
        </div>
      )}
      
      <div className="flex w-full">
         {prefixText && (
             <div className={`
                flex items-center bg-slate-900 border border-slate-600 border-r-0 rounded-l-lg 
                text-gray-400 font-mono text-sm px-3 select-none whitespace-nowrap
                ${Icon ? 'pl-10' : ''}
             `}>
                 {prefixText}
             </div>
         )}
         
         <input
            ref={ref}
            className={`
              block w-full bg-slate-800 border border-slate-600 text-white 
              placeholder-gray-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red 
              transition-all sm:text-sm py-2.5
              ${prefixText ? 'rounded-l-none rounded-r-lg border-l-slate-700' : 'rounded-lg'}
              ${Icon && !prefixText ? 'pl-10' : 'pl-3'} 
              pr-3
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
      </div>
    </div>
  );
});

Input.displayName = 'Input';
