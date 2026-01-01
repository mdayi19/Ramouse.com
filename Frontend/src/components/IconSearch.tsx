import React, { useState, useMemo } from 'react';
import { lucideIconNames } from '../lucide-icon-list';
import Icon from './Icon';

interface IconSearchProps {
    value: string;
    onChange: (iconName: string) => void;
}

const IconSearch: React.FC<IconSearchProps> = ({ value, onChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredIcons = useMemo(() => {
        if (!searchTerm) {
            return lucideIconNames.slice(0, 100); // Show a subset initially
        }
        return lucideIconNames.filter(name =>
            name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 100); // Limit results for performance
    }, [searchTerm]);

    const handleSelect = (iconName: string) => {
        onChange(iconName);
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center">
                    {value && <Icon name={value as any} />}
                </div>
                <input
                    type="text"
                    value={value}
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Search for an icon..."
                    className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                />
            </div>
            {isOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white dark:bg-darkcard border dark:border-slate-600 rounded-md shadow-lg p-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Type to search..."
                        className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 mb-2"
                        autoFocus
                    />
                    <div className="max-h-60 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-1">
                        {filteredIcons.map(iconName => (
                            <button
                                key={iconName}
                                type="button"
                                onClick={() => handleSelect(iconName)}
                                className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 aspect-square"
                                title={iconName}
                            >
                                <Icon name={iconName as any} className="w-6 h-6" />
                                <span className="text-xs truncate text-slate-500 dark:text-slate-400 mt-1">{iconName}</span>
                            </button>
                        ))}
                    </div>
                     <button type="button" onClick={() => setIsOpen(false)} className="mt-2 w-full text-center text-sm text-slate-500 hover:text-primary">Close</button>
                </div>
            )}
        </div>
    );
};

export default IconSearch;
