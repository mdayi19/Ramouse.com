import { useState, useEffect, useCallback } from 'react';
import { Category, Brand, PartType, TechnicianSpecialty, CarModel } from '../types';
import { AdminService } from '../services/admin.service';
import {
    DEFAULT_CAR_CATEGORIES, DEFAULT_ALL_BRANDS, DEFAULT_BRAND_MODELS, DEFAULT_PART_TYPES,
    DEFAULT_TECHNICIAN_SPECIALTIES
} from '../constants';

export const useVehicleData = (isAdmin: boolean, showToast: (msg: string, type: 'success' | 'error' | 'info') => void) => {
    const [carCategories, setCarCategories] = useState<Category[]>([]);
    const [allBrands, setAllBrands] = useState<Brand[]>([]);
    const [brandModels, setBrandModels] = useState<{ [key: string]: string[] }>({});
    const [partTypes, setPartTypes] = useState<PartType[]>([]);
    const [technicianSpecialties, setTechnicianSpecialties] = useState<TechnicianSpecialty[]>([]);
    const [allModels, setAllModels] = useState<{ [key: string]: CarModel[] }>({});

    // Helper to load data from localStorage fallback
    const loadData = <T,>(key: string, defaultValue: T): T => {
        const saved = localStorage.getItem(key);
        if (saved) {
            try { return JSON.parse(saved); }
            catch (e) { return defaultValue; }
        }
        return defaultValue;
    };

    // Initial Data Load
    useEffect(() => {
        const loadVehicleData = async () => {
            // Load from local storage first for immediate UI
            setCarCategories(loadData('app_car_categories', DEFAULT_CAR_CATEGORIES));
            setAllBrands(loadData('app_all_brands', DEFAULT_ALL_BRANDS));
            setBrandModels(loadData('app_brand_models', DEFAULT_BRAND_MODELS));
            setPartTypes(loadData('app_part_types', DEFAULT_PART_TYPES));
            setTechnicianSpecialties(loadData('app_technician_specialties', DEFAULT_TECHNICIAN_SPECIALTIES));
            setAllModels(loadData('app_all_models', {}));

            // Fetch fresh data from API for ALL users (not just admins)
            try {
                const response = await import('../lib/api').then(m => m.api.get('/vehicle/data'));
                const data = response.data;

                if (data) {
                    setCarCategories((data.categories || []).map((cat: any) => ({
                        ...cat,
                        telegramBotToken: cat.telegram_bot_token,
                        telegramChannelId: cat.telegram_channel_id,
                        telegramNotificationsEnabled: cat.telegram_notifications_enabled
                    })));
                    setAllBrands(data.brands || []);
                    setPartTypes(data.partTypes || []);
                    setTechnicianSpecialties(data.specialties || []);
                    setAllModels(data.models || {});

                    // Transform models: API returns { [brandName]: CarModel[] }, we need { [brandName]: string[] }
                    const transformedModels: { [key: string]: string[] } = {};
                    if (data.models) {
                        Object.keys(data.models).forEach(brand => {
                            // @ts-ignore
                            transformedModels[brand] = data.models[brand].map((m: any) => m.name);
                        });
                    }
                    setBrandModels(transformedModels);

                    // Update local storage cache
                    localStorage.setItem('app_car_categories', JSON.stringify(data.categories));
                    localStorage.setItem('app_all_brands', JSON.stringify(data.brands));
                    localStorage.setItem('app_brand_models', JSON.stringify(transformedModels));
                    localStorage.setItem('app_part_types', JSON.stringify(data.partTypes));
                    localStorage.setItem('app_technician_specialties', JSON.stringify(data.specialties));
                    localStorage.setItem('app_all_models', JSON.stringify(data.models));
                }
            } catch (error) {
                console.error('Failed to fetch vehicle data:', error);
                // Fallback to localStorage cache - already loaded above
                showToast('استخدام البيانات المحفوظة', 'info');
            }
        };
        loadVehicleData();
    }, [showToast]); // Removed isAdmin dependency - fetch for all users

    // Update Functions with API Integration

    const updateCarCategories = useCallback(async (newCategories: Category[]) => {
        // Optimistic Update
        setCarCategories(newCategories);
        localStorage.setItem('app_car_categories', JSON.stringify(newCategories));

        if (isAdmin) {
            // We need to determine if it's an add, update, or delete.
            // For simplicity in this refactor, we'll just save the *changed* item if possible, 
            // but the current UI passes the whole array.
            // Ideally, the UI should call addCategory, updateCategory, deleteCategory.
            // For now, we will rely on the UI calling this function after a single change.
            // BUT, `ModelManagementView` calls this with the *entire* new array.
            // This makes it hard to know what changed without diffing.

            // Strategy: The `ModelManagementView` will be refactored to call specific API methods.
            // But to maintain `useAppState` compatibility, we keep this signature.
            // We will NOT call the API here for bulk updates to avoid complexity.
            // Instead, we will expose specific CRUD methods that `ModelManagementView` can use directly,
            // OR we update `ModelManagementView` to use `AdminService` directly and just update local state here.

            // Let's go with: `ModelManagementView` will use `AdminService` for writes, 
            // and call these update functions to sync local state.
        }
    }, [isAdmin]);

    const updateAllBrands = useCallback((newBrands: Brand[]) => {
        setAllBrands(newBrands);
        localStorage.setItem('app_all_brands', JSON.stringify(newBrands));
    }, []);

    const updateBrandModels = useCallback((newModels: { [key: string]: string[] }) => {
        setBrandModels(newModels);
        localStorage.setItem('app_brand_models', JSON.stringify(newModels));
    }, []);

    const updatePartTypes = useCallback((newTypes: PartType[]) => {
        setPartTypes(newTypes);
        localStorage.setItem('app_part_types', JSON.stringify(newTypes));
    }, []);

    const updateTechnicianSpecialties = useCallback((newSpecialties: TechnicianSpecialty[]) => {
        setTechnicianSpecialties(newSpecialties);
        localStorage.setItem('app_technician_specialties', JSON.stringify(newSpecialties));
    }, []);

    return {
        carCategories, setCarCategories, updateCarCategories,
        allBrands, setAllBrands, updateAllBrands,
        brandModels, setBrandModels, updateBrandModels,
        partTypes, setPartTypes, updatePartTypes,
        technicianSpecialties, setTechnicianSpecialties, updateTechnicianSpecialties,
        allModels // Expose raw models for admin management (IDs)
    };
};
