import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';

interface SearchableSelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  options: string[] | { value: string; label: string; logoUrl?: string; logoText?: string }[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export const SearchableSelect = forwardRef<any, SearchableSelectProps>(({
  label,
  error,
  placeholder = 'Select option...',
  options = [],
  value = '',
  onChange,
  disabled = false,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize options to objects
  const normalizedOptions = React.useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt, logoUrl: undefined, logoText: undefined };
      }
      return {
        value: opt.value,
        label: opt.label,
        logoUrl: opt.logoUrl,
        logoText: opt.logoText
      };
    });
  }, [options]);

  const filteredOptions = React.useMemo(() => {
    if (!search) return normalizedOptions;
    const query = search.toLowerCase();
    return normalizedOptions.filter(opt => 
      opt.label.toLowerCase().includes(query) || 
      opt.value.toLowerCase().includes(query)
    );
  }, [normalizedOptions, search]);

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  // Reset active index on search change
  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  // Handle outside click to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % Math.max(1, filteredOptions.length));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filteredOptions.length) % Math.max(1, filteredOptions.length));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[activeIndex]) {
          handleSelect(filteredOptions[activeIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current && activeIndex >= 0) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, isOpen]);

  const handleSelect = (val: string) => {
    if (onChange) onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="w-full relative space-y-1">
      {label && <label className="label text-sm font-semibold">{label}</label>}
      
      <div
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "input flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-primary-500/20",
          isOpen && "ring-2 ring-primary-500/20 border-primary-500",
          error && "border-red-400 focus:ring-red-400/20",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800"
        )}
      >
        <span className={cn("truncate text-sm flex items-center gap-2", !selectedOption && "text-slate-400")}>
          {selectedOption ? (
            <>
              {selectedOption.logoUrl && (
                <img 
                  src={selectedOption.logoUrl} 
                  alt={selectedOption.label} 
                  className="w-5 h-5 object-contain shrink-0 bg-white dark:bg-slate-900 rounded p-0.5"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const nextSibling = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                    if (nextSibling) nextSibling.style.display = 'flex';
                  }}
                />
              )}
              <span 
                className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-350 text-[10px] font-bold items-center justify-center shrink-0"
                style={{ display: selectedOption.logoUrl ? 'none' : 'flex' }}
              >
                {selectedOption.logoText || selectedOption.label.charAt(0)}
              </span>
              {selectedOption.label}
            </>
          ) : placeholder}
        </span>
        <ChevronDown size={16} className={cn("text-slate-400 transition-transform duration-200", isOpen && "transform rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-2 p-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-850/50">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent border-0 p-0 text-xs focus:ring-0 text-slate-700 dark:text-slate-200"
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSearch(''); }}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* List options */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto py-1.5 custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isActive = idx === activeIndex;

                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 text-sm cursor-pointer transition-colors",
                        isActive && "bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400",
                        isSelected && "font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {opt.logoUrl && (
                          <img 
                            src={opt.logoUrl} 
                            alt={opt.label} 
                            className="w-6 h-6 object-contain shrink-0 bg-white dark:bg-slate-900 rounded p-0.5"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const nextSibling = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                              if (nextSibling) nextSibling.style.display = 'flex';
                            }}
                          />
                        )}
                        <span 
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-350 text-xs font-bold items-center justify-center shrink-0"
                          style={{ display: opt.logoUrl ? 'none' : 'flex' }}
                        >
                          {opt.logoText || opt.label.charAt(0)}
                        </span>
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-primary-600 dark:text-primary-400" />}
                    </div>
                  );
                })
              ) : (
                <div className="px-3.5 py-4 text-xs text-center text-slate-400">
                  No matching options found.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
});

SearchableSelect.displayName = 'SearchableSelect';
