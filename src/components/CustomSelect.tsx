import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  id?: string;
  value: string | number | undefined | null;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  name?: string;
  'aria-label'?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'Selecciona una opción...',
  className = '',
  buttonClassName = '',
  disabled = false,
  name,
  'aria-label': ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenSelectRef = useRef<HTMLSelectElement>(null);

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value)
  );

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optValue: string | number) => {
    onChange(optValue);
    setIsOpen(false);
    if (hiddenSelectRef.current) {
      hiddenSelectRef.current.value = String(optValue);
      hiddenSelectRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rawVal = e.target.value;
    const found = options.find((o) => String(o.value) === rawVal);
    onChange(found ? found.value : rawVal);
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-left ${className}`}>
      {/* Hidden native select for test runners and accessibility engines */}
      <select
        ref={hiddenSelectRef}
        id={id}
        name={name}
        aria-label={ariaLabel}
        value={value ?? ''}
        disabled={disabled}
        onChange={handleNativeChange}
        tabIndex={-1}
        className="sr-only"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Styled Custom Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 border transition-all text-xs font-bold cursor-pointer ${
          buttonClassName || 'h-[42px] px-3.5 py-2.5 rounded-xl shadow-2xs'
        } ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-[#A3073B] ring-2 ring-[#A3073B]/20 text-slate-900'
            : buttonClassName
            ? ''
            : 'bg-white hover:bg-slate-50/50 border-slate-200 text-slate-800 hover:border-slate-300'
        }`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.icon}
              <span>{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-slate-400 font-medium">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#A3073B]' : ''
          }`}
        />
      </button>

      {/* Styled Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 max-h-60 overflow-y-auto custom-scroll animate-fade-in">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 text-center">
              No hay opciones disponibles
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#FDF2F4] text-[#870530] font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon}
                    <div className="truncate">
                      <div className="truncate">{opt.label}</div>
                      {opt.subtitle && (
                        <div className="text-[10px] text-slate-400 font-normal truncate">
                          {opt.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#A3073B] shrink-0 ml-2" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
