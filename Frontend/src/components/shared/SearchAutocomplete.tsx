import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SearchSuggestion {
    id: string;
    text: string;
    type: 'recent' | 'popular' | 'suggestion';
    count?: number;
}

export interface SearchAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: (query: string) => void;
    suggestions?: SearchSuggestion[];
    placeholder?: string;
    className?: string;
    recentSearches?: string[];
    onClearRecent?: () => void;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
    value,
    onChange,
    onSearch,
    suggestions = [],
    placeholder = 'ابحث عن سيارة...',
    className,
    recentSearches = [],
    onClearRecent,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !inputRef.current?.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const totalItems = suggestions.length + recentSearches.length;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < totalItems) {
                const allItems = [...recentSearches, ...suggestions.map((s) => s.text)];
                const selectedItem = allItems[highlightedIndex];
                onChange(selectedItem);
                onSearch(selectedItem);
                setIsOpen(false);
            } else {
                onSearch(value);
                setIsOpen(false);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleSuggestionClick = (text: string) => {
        onChange(text);
        onSearch(text);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setIsOpen(true);
        setHighlightedIndex(-1);
    };

    const handleClear = () => {
        onChange('');
        inputRef.current?.focus();
    };

    const showDropdown = isOpen && (value.length > 0 || recentSearches.length > 0);

    return (
        <div className={cn('relative', className)}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full pr-12 pl-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    aria-label="البحث"
                    aria-autocomplete="list"
                    aria-controls="search-suggestions"
                    aria-expanded={showDropdown}
                    role="combobox"
                />
                {value && (
                    <button
                        onClick={handleClear}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        aria-label="مسح البحث"
                        type="button"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    id="search-suggestions"
                    role="listbox"
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto z-50"
                >
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && value.length === 0 && (
                        <div className="p-2">
                            <div className="flex items-center justify-between px-3 py-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                    <Clock className="w-4 h-4" />
                                    <span>عمليات البحث الأخيرة</span>
                                </div>
                                {onClearRecent && (
                                    <button
                                        onClick={onClearRecent}
                                        className="text-xs text-primary hover:text-primary-700 transition-colors"
                                        type="button"
                                    >
                                        مسح الكل
                                    </button>
                                )}
                            </div>
                            {recentSearches.map((search, index) => (
                                <button
                                    key={`recent-${index}`}
                                    onClick={() => handleSuggestionClick(search)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2 text-right hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors',
                                        highlightedIndex === index && 'bg-slate-50 dark:bg-slate-700'
                                    )}
                                    role="option"
                                    aria-selected={highlightedIndex === index}
                                    type="button"
                                >
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                        {search}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Suggestions */}
                    {suggestions.length > 0 && value.length > 0 && (
                        <div className="p-2">
                            <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                <TrendingUp className="w-4 h-4" />
                                <span>اقتراحات</span>
                            </div>
                            {suggestions.map((suggestion, index) => {
                                const actualIndex = recentSearches.length + index;
                                return (
                                    <button
                                        key={suggestion.id}
                                        onClick={() => handleSuggestionClick(suggestion.text)}
                                        className={cn(
                                            'w-full flex items-center justify-between px-3 py-2 text-right hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors',
                                            highlightedIndex === actualIndex && 'bg-slate-50 dark:bg-slate-700'
                                        )}
                                        role="option"
                                        aria-selected={highlightedIndex === actualIndex}
                                        type="button"
                                    >
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            {suggestion.text}
                                        </span>
                                        {suggestion.count && (
                                            <span className="text-xs text-slate-400">
                                                {suggestion.count} نتيجة
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* No results */}
                    {suggestions.length === 0 && value.length > 0 && recentSearches.length === 0 && (
                        <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                            لا توجد اقتراحات
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

SearchAutocomplete.displayName = 'SearchAutocomplete';
