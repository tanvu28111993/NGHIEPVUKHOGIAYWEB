import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select: React.FC<SelectProps> = ({ 
  options, 
  placeholder, 
  className = '', 
  containerClassName = '',
  ...props 
}) => {
  return (
    <div className={`relative ${containerClassName}`}>
      <select
        className={`
          w-full bg-slate-800 text-gray-200 text-sm border border-slate-600 rounded-lg pl-3 pr-10 py-2.5
          focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red 
          appearance-none cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        aria-label={props['aria-label'] || "Selection"}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt, index) => (
          <option key={`${opt.value}-${index}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  );
};