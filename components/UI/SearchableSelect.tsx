
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SearchableOption {
  value: string | number;
  label: string;
  code?: string; // Mã ký hiệu hiển thị bên phải
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
}

export const SearchableSelect = forwardRef<HTMLInputElement, SearchableSelectProps>(({
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  className = '',
  containerClassName = '',
  onKeyDown,
  autoFocus
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<SearchableOption[]>(options);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Expose internal input ref to parent
  useImperativeHandle(ref, () => inputRef.current!);

  // Sync value with display text
  useEffect(() => {
    const selected = options.find(opt => opt.value === value);
    if (selected) {
      setSearchTerm(selected.label);
    } else if (!value) {
      setSearchTerm('');
    } else {
       // Nếu value có giá trị nhưng không tìm thấy trong options (ví dụ data cũ hoặc chưa load xong)
       // Để đảm bảo tính nhất quán "chỉ chọn trong list", ta có thể để trống hoặc hiển thị raw value.
       // Ở đây hiển thị rỗng để người dùng buộc phải chọn lại từ list nếu data không hợp lệ.
       setSearchTerm('');
    }
  }, [value, options]);

  // Filter logic
  useEffect(() => {
    if (!isOpen) return;
    
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = options.filter(opt => 
      opt.label.toLowerCase().includes(lowerTerm) || 
      (opt.code && opt.code.toLowerCase().includes(lowerTerm))
    );
    setFilteredOptions(filtered);
    setHighlightedIndex(0);
  }, [searchTerm, options, isOpen]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeAndReset();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options]);

  // Helper: Đóng dropdown và reset text về giá trị đã chọn hợp lệ
  const closeAndReset = () => {
    setIsOpen(false);
    const selected = options.find(opt => opt.value === value);
    setSearchTerm(selected ? selected.label : '');
  };

  const handleSelect = (option: SearchableOption) => {
    onChange(String(option.value));
    setSearchTerm(option.label);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
    // Nếu xóa rỗng, trigger change empty (cho phép bỏ chọn)
    if (e.target.value === '') {
        onChange('');
    }
  };

  // Logic quan trọng: Khi blur (tab out hoặc click ra ngoài), reset text nếu chưa chọn
  const handleBlur = (e: React.FocusEvent) => {
      // Nếu focus chuyển sang element con của container (ví dụ click vào scrollbar hoặc item), không reset
      if (containerRef.current && containerRef.current.contains(e.relatedTarget as Node)) {
          return;
      }
      closeAndReset();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (isOpen && filteredOptions.length > 0) {
        e.preventDefault(); // Prevent form submit if selecting
        handleSelect(filteredOptions[highlightedIndex]);
      } else {
        // Nếu nhấn Enter mà không chọn được gì (không có trong list), hành vi mặc định sẽ xảy ra (Submit form hoặc Next input)
        // Nhưng giá trị text rác sẽ bị reset bởi onBlur hoặc closeAndReset sau đó.
        if (onKeyDown) onKeyDown(e);
      }
    } else if (e.key === 'Escape') {
      closeAndReset();
    } else if (e.key === 'Tab') {
       closeAndReset();
       // Allow default Tab behavior to move focus
    } else {
       // Allow ArrowLeft and ArrowRight to propagate to onKeyDown for navigation
       if (onKeyDown) {
           onKeyDown(e);
       }
    }
  };

  const handleFocus = () => {
     inputRef.current?.select();
     setIsOpen(true);
  };

  return (
    <div className={`relative ${containerClassName}`} ref={containerRef}>
      <div className="relative group">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`
            block w-full bg-slate-800 border border-slate-600 rounded-lg text-white 
            placeholder-gray-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red 
            transition-all sm:text-sm pl-3 pr-8 py-2.5 truncate
            ${className}
          `}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
           {isOpen ? <Search className="w-4 h-4 text-brand-red" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
            className="absolute z-50 w-full mt-1 bg-slate-900 border border-gray-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto custom-scrollbar animate-fade-in"
            onMouseDown={(e) => e.preventDefault()} // Ngăn chặn sự kiện blur khi click vào dropdown
        >
          {filteredOptions.length > 0 ? (
            <ul className="py-1">
              {filteredOptions.map((option, index) => (
                <li
                  key={`${option.value}-${index}`}
                  onClick={() => handleSelect(option)}
                  // Thêm onMouseDown preventDefault để đảm bảo click event được thực thi trước khi input bị blur
                  onMouseDown={(e) => e.preventDefault()} 
                  className={`
                    px-3 py-2 text-sm cursor-pointer flex justify-between items-center group transition-colors
                    ${index === highlightedIndex ? 'bg-brand-red text-white' : 'text-gray-300 hover:bg-slate-800'}
                    ${option.value === value ? 'bg-blue-900/30' : ''}
                  `}
                >
                  <span className="truncate font-medium flex-1 mr-2">{option.label}</span>
                  {option.code && (
                    <span className={`
                        font-mono text-xs px-1.5 py-0.5 rounded border
                        ${index === highlightedIndex 
                            ? 'bg-white/20 border-white/30 text-white' 
                            : 'bg-slate-950 border-gray-700 text-gray-500 group-hover:text-gray-400'}
                    `}>
                      {option.code}
                    </span>
                  )}
                  {option.value === value && index !== highlightedIndex && (
                     <Check className="w-3 h-3 text-blue-500 ml-2" />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-4 text-center text-sm text-gray-500 italic">
              Không tìm thấy kết quả "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SearchableSelect.displayName = 'SearchableSelect';
