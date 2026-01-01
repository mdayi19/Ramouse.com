
import React from 'react';
import Icon from '../Icon';
import { StoreCategory } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface StoreFiltersProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
    selectedCategory: string;
    setSelectedCategory: (cat: string) => void;
    storeCategories: StoreCategory[];
    activeTab: string;
}

export const StoreFilters: React.FC<StoreFiltersProps> = ({
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    selectedCategory,
    setSelectedCategory,
    storeCategories,
    activeTab
}) => {
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = React.useState(false);

    return (
        <>
            {/* Sidebar Filters (Desktop) */}
            <div className="hidden lg:block w-72 flex-shrink-0 space-y-8 sticky top-24 h-fit">
                <div className="relative group">
                    <Input
                        placeholder="ابحث عن قطع الغيار..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        icon={<Icon name="Search" className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />}
                        className="py-7 rounded-[2rem] bg-white dark:bg-darkcard border-slate-200 dark:border-slate-700/50 focus:ring-primary/20 shadow-sm focus:shadow-xl transition-all duration-300 pr-14"
                    />
                </div>

                <div className="bg-white/80 dark:bg-darkcard/80 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b dark:border-slate-800">
                        <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl text-xl">
                                🔍
                            </div>
                            الفلاتر
                        </h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedCategory('all'); setSearchTerm(''); }}
                            className="text-primary text-xs font-bold hover:bg-primary/5 hover:text-primary-600"
                        >
                            تصفية الكل
                        </Button>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-4 block uppercase tracking-widest">ترتيب حسب</label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { value: 'default', label: 'الافتراضي', emoji: '🔖' },
                                    { value: 'price_asc', label: 'السعر: الأقل', emoji: '📉' },
                                    { value: 'price_desc', label: 'السعر: الأعلى', emoji: '📈' },
                                    { value: 'newest', label: 'الأحدث', emoji: '✨' },
                                    { value: 'rating', label: 'التقييم', emoji: '⭐' }
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSortBy(option.value)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${sortBy === option.value
                                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <span className="text-lg">{option.emoji}</span>
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-4 block uppercase tracking-widest">الأقسام</label>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 -mr-2">
                                <Button
                                    onClick={() => setSelectedCategory('all')}
                                    variant={selectedCategory === 'all' ? 'primary' : 'ghost'}
                                    className={`w-full justify-start gap-4 px-5 py-6 rounded-2xl text-sm font-bold transition-all duration-500 h-auto border-2 ${selectedCategory === 'all'
                                        ? 'bg-primary border-transparent text-white shadow-xl shadow-primary/20 scale-[1.02]'
                                        : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:translate-x-1'
                                        }`}
                                >
                                    <div className={`p-2 rounded-xl flex items-center justify-center ${selectedCategory === 'all' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                        <span className="text-lg">🛍️</span>
                                    </div>
                                    كل المنتجات
                                </Button>
                                {storeCategories.map(cat => (
                                    <Button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        variant={selectedCategory === cat.id ? 'primary' : 'ghost'}
                                        className={`w-full justify-start gap-4 px-5 py-6 rounded-2xl text-sm font-bold transition-all duration-500 h-auto border-2 ${selectedCategory === cat.id
                                            ? 'bg-primary border-transparent text-white shadow-xl shadow-primary/20 scale-[1.02]'
                                            : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:translate-x-1'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-xl flex items-center justify-center ${selectedCategory === cat.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            <Icon name={cat.icon as any} className="w-4 h-4" />
                                        </div>
                                        {cat.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Filters Header & Search */}
            <div className="lg:hidden w-full flex flex-col gap-4 mb-8">
                <div className="flex gap-3">
                    <div className="flex-grow relative group">
                        <Input
                            placeholder="ابحث..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            icon={<Icon name="Search" className="w-5 h-5 text-slate-400" />}
                            className="py-6 rounded-2xl bg-white dark:bg-darkcard border-slate-200 dark:border-slate-700/50 shadow-lg pr-12"
                        />
                    </div>
                    <Button
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="w-14 h-14 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center p-0"
                    >
                        <div className="relative">
                            <span className="text-2xl">🔍</span>
                            {(selectedCategory !== 'all' || sortBy !== 'default') && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                            )}
                        </div>
                    </Button>
                </div>
            </div>

            {/* Mobile Filters Drawer */}
            {isMobileFiltersOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden flex flex-col justify-end">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => setIsMobileFiltersOpen(false)}
                    />
                    <div className="relative bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-8 pb-safe shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8" />

                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">الفلاتر</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileFiltersOpen(false)}
                                className="rounded-full bg-slate-100 dark:bg-slate-800"
                            >
                                <Icon name="X" className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="space-y-10">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">الترتيب حسب</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'default', label: 'الافتراضي', emoji: '🔖' },
                                        { value: 'price_asc', label: 'الأقل سعراً', emoji: '📉' },
                                        { value: 'price_desc', label: 'الأعلى سعراً', emoji: '📈' },
                                        { value: 'newest', label: 'الأحدث', emoji: '✨' }
                                    ].map((option) => (
                                        <Button
                                            key={option.value}
                                            onClick={() => setSortBy(option.value)}
                                            className={`justify-center gap-2 py-4 rounded-xl text-sm font-bold h-auto border-2 ${sortBy === option.value
                                                ? 'bg-primary border-transparent text-white shadow-xl shadow-primary/20'
                                                : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                                }`}
                                        >
                                            <span className="text-lg">{option.emoji}</span>
                                            {option.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">الأقسام</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <Button
                                        onClick={() => setSelectedCategory('all')}
                                        className={`justify-start gap-4 px-6 py-5 rounded-2xl text-sm font-bold h-auto border-2 ${selectedCategory === 'all'
                                            ? 'bg-primary border-transparent text-white shadow-xl shadow-primary/20'
                                            : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-xl flex items-center justify-center ${selectedCategory === 'all' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            <span className="text-lg">🛍️</span>
                                        </div>
                                        كل المنتجات
                                    </Button>
                                    {storeCategories.map((cat) => (
                                        <Button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`justify-start gap-4 px-6 py-5 rounded-2xl text-sm font-bold h-auto border-2 ${selectedCategory === cat.id
                                                ? 'bg-primary border-transparent text-white shadow-xl shadow-primary/20'
                                                : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-xl flex items-center justify-center ${selectedCategory === cat.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                <Icon name={cat.icon as any} className="w-4 h-4" />
                                            </div>
                                            {cat.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex gap-4">
                            <Button
                                onClick={() => setIsMobileFiltersOpen(false)}
                                className="flex-grow py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg shadow-xl"
                            >
                                تطبيق الفلاتر
                            </Button>
                            <Button
                                onClick={() => { setSelectedCategory('all'); setSortBy('default'); setIsMobileFiltersOpen(false); }}
                                variant="outline"
                                className="px-6 py-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-bold"
                            >
                                مسح
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

