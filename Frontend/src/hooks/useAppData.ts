import { useState, useCallback, useEffect } from 'react';
import { Customer, Technician, TowTruck, StoreCategory, Order, BlogPost, FaqItem, AdminFlashProduct, PartType } from '../types';
import { DEFAULT_STORE_CATEGORIES, DEFAULT_PART_TYPES } from '../constants';
import { ordersAPI } from '../lib/api';

export const useAppData = () => {
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [allTechnicians, setAllTechnicians] = useState<Technician[]>([]);
    const [allTowTrucks, setAllTowTrucks] = useState<TowTruck[]>([]);
    const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([]);
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
    const [adminFlashProducts, setAdminFlashProducts] = useState<AdminFlashProduct[]>([]);
    const [partTypes, setPartTypes] = useState<PartType[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]); // Using any for now as per original file

    // Helper to load data from localStorage fallback
    const loadData = <T,>(key: string, defaultValue: T): T => {
        const saved = localStorage.getItem(key);
        if (saved) {
            try { return JSON.parse(saved); }
            catch (e) { return defaultValue; }
        }
        return defaultValue;
    };

    useEffect(() => {
        setAllTechnicians(loadData('all_technicians', []));
        setAllCustomers(loadData('all_customers', []));
        setAllTowTrucks(loadData('all_tow_trucks', []));
        setStoreCategories(loadData('app_store_categories', DEFAULT_STORE_CATEGORIES));
        setBlogPosts(loadData('blog_posts', []));
        setFaqItems(loadData('faq_items', []));

        setAdminFlashProducts(loadData('admin_flash_products', []));
        setPartTypes(loadData('part_types', DEFAULT_PART_TYPES));

        // Only fetch orders if authenticated
        const token = localStorage.getItem('authToken');
        if (token) {
            ordersAPI.getOrders()
                .then(res => {
                    // Ensure data structure matches expected Order[]
                    const orders = Array.isArray(res.data.data) ? res.data.data : [];
                    setAllOrders(orders);
                })
                .catch(err => {
                    console.error('Failed to fetch orders:', err);
                    setAllOrders(loadData('all_orders', [])); // Fallback
                });
        } else {
            setAllOrders(loadData('all_orders', []));
        }
    }, []);

    const updateAllOrders = useCallback((newOrders: Order[]) => {
        // Optimistic update
        setAllOrders(newOrders);
        // Ideally we should refetch or update specific order via API
    }, []);

    const updateAllTechnicians = useCallback((newTechnicians: Technician[]) => {
        localStorage.setItem('all_technicians', JSON.stringify(newTechnicians));
        setAllTechnicians(newTechnicians);
    }, []);

    const updateAllTowTrucks = useCallback((newTowTrucks: TowTruck[]) => {
        localStorage.setItem('all_tow_trucks', JSON.stringify(newTowTrucks));
        setAllTowTrucks(newTowTrucks);
    }, []);

    const updateStoreCategories = useCallback((newCategories: StoreCategory[]) => {
        localStorage.setItem('app_store_categories', JSON.stringify(newCategories));
        setStoreCategories(newCategories);
    }, []);

    const updatePartTypes = useCallback((newPartTypes: PartType[]) => {
        localStorage.setItem('part_types', JSON.stringify(newPartTypes));
        setPartTypes(newPartTypes);
    }, []);

    const publishAnnouncement = useCallback((post: any) => {
        // API call needed here
        console.log('Publishing announcement:', post);
    }, []);

    const deleteAnnouncement = useCallback((id: string) => {
        // API call needed here
        console.log('Deleting announcement:', id);
    }, []);

    return {
        allCustomers, setAllCustomers,
        allTechnicians, setAllTechnicians, updateAllTechnicians,
        allTowTrucks, setAllTowTrucks, updateAllTowTrucks,
        storeCategories, setStoreCategories, updateStoreCategories,
        allOrders, setAllOrders, updateAllOrders,
        blogPosts, setBlogPosts,
        faqItems, setFaqItems,
        adminFlashProducts, setAdminFlashProducts,
        announcements, setAnnouncements,
        publishAnnouncement, deleteAnnouncement,
        partTypes, setPartTypes, updatePartTypes
    };
};
