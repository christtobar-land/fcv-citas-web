import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { getTodayIso, formatDisplayDate } from '../utils/dateUtils';

interface CustomDatePickerProps {
  id?: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = 'Selecciona una fecha',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Parse initial view year and month from value or today
  const parseYearMonth = (isoDate: string) => {
    try {
      if (isoDate && isoDate.includes('-')) {
        const [y, m] = isoDate.split('-').map(Number);
        return { year: y, month: m - 1 };
      }
    } catch {}
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  };

  const [viewDate, setViewDate] = useState(() => parseYearMonth(value || getTodayIso()));

  // Keep viewDate updated if value changes from outside
  useEffect(() => {
    if (value) {
      setViewDate(parseYearMonth(value));
    }
  }, [value]);

  // Click outside to close
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

  const handlePrevMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  // Build calendar matrix (Monday-first)
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOffset = (year: number, month: number) => {
    // 0 is Sunday, 1 is Monday ... convert to Monday = 0, Sunday = 6
    const day = new Date(year, month, 1).getDay();
    return (day + 6) % 7;
  };

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDayOffset = getFirstDayOffset(viewDate.year, viewDate.month);

  const handleSelectDay = (day: number) => {
    const mm = String(viewDate.month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const isoString = `${viewDate.year}-${mm}-${dd}`;
    onChange(isoString);
    setIsOpen(false);
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = isoString;
      hiddenInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const handleTodayClick = () => {
    const today = getTodayIso();
    onChange(today);
    setViewDate(parseYearMonth(today));
    setIsOpen(false);
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = today;
      hiddenInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const isDayDisabled = (day: number) => {
    const mm = String(viewDate.month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const isoString = `${viewDate.year}-${mm}-${dd}`;
    if (min && isoString < min) return true;
    if (max && isoString > max) return true;
    return false;
  };

  const isDaySelected = (day: number) => {
    if (!value) return false;
    const mm = String(viewDate.month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const isoString = `${viewDate.year}-${mm}-${dd}`;
    return value === isoString;
  };

  const isToday = (day: number) => {
    const today = getTodayIso();
    const mm = String(viewDate.month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const isoString = `${viewDate.year}-${mm}-${dd}`;
    return today === isoString;
  };

  const displayFormattedText = value ? formatDisplayDate(value) : placeholder;

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-left ${className}`}>
      {/* Hidden input for test compatibility & HTML forms */}
      <input
        ref={hiddenInputRef}
        type="date"
        id={id}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        className="sr-only"
      />

      {/* Styled Custom Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-[42px] flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border transition-all text-xs font-bold shadow-2xs cursor-pointer ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-[#A3073B] ring-2 ring-[#A3073B]/20 text-slate-900'
            : 'bg-white hover:bg-slate-50/50 border-slate-200 text-slate-800 hover:border-slate-300'
        }`}
      >
        <span className="flex items-center gap-2.5 truncate">
          <Calendar className="w-4 h-4 text-[#A3073B] shrink-0" />
          <span className={value ? 'text-slate-800' : 'text-slate-400 font-medium'}>
            {displayFormattedText}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#A3073B]' : ''
          }`}
        />
      </button>

      {/* Custom Popover Calendar Dialog */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 z-50 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 w-72 sm:w-80 animate-fade-in">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <span className="text-xs font-extrabold text-slate-900">
              {MONTH_NAMES[viewDate.month]} {viewDate.year}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-xl hover:bg-slate-100 text-slate-600 flex items-center justify-center transition cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-xl hover:bg-slate-100 text-slate-600 flex items-center justify-center transition cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_LABELS.map((day) => (
              <span key={day} className="text-[10px] font-extrabold uppercase text-slate-400 py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Days Matrix */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOffset }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-8" />
            ))}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const disabledDay = isDayDisabled(day);
              const selected = isDaySelected(day);
              const today = isToday(day);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center text-xs font-bold rounded-xl transition-all ${
                    disabledDay
                      ? 'text-slate-300 cursor-not-allowed'
                      : selected
                      ? 'bg-[#A3073B] text-white shadow-sm font-black'
                      : today
                      ? 'text-[#A3073B] bg-[#FDF2F4] border border-[#A3073B]/30 hover:bg-[#FDF2F4]/80 cursor-pointer'
                      : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Shortcuts */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleTodayClick}
              className="text-[#A3073B] font-extrabold hover:underline cursor-pointer text-[11px]"
            >
              Seleccionar Hoy
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 font-semibold hover:text-slate-800 cursor-pointer text-[11px]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
