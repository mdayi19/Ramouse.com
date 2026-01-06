import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Provider, Technician, TowTruck, Customer, CarProvider } from '../types';
import { Settings } from '../types';

export const useAuth = (settings: Settings, allCustomers: Customer[]) => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isAuthenticated') === 'true');
    const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');
    const [isProvider, setIsProvider] = useState(() => localStorage.getItem('userType') === 'provider');
    const [isTechnician, setIsTechnician] = useState(() => localStorage.getItem('userType') === 'technician');
    const [isTowTruck, setIsTowTruck] = useState(() => localStorage.getItem('userType') === 'tow_truck');
    const [isCarProvider, setIsCarProvider] = useState(() => localStorage.getItem('userType') === 'car_provider');

    // Helper to load data from localStorage fallback
    const loadData = <T,>(key: string, defaultValue: T): T => {
        const saved = localStorage.getItem(key);
        if (saved) {
            try { return JSON.parse(saved); }
            catch (e) { return defaultValue; }
        }
        return defaultValue;
    };

    const [loggedInProvider, setLoggedInProvider] = useState<Provider | null>(() => {
        if (localStorage.getItem('userType') === 'provider') {
            const saved = localStorage.getItem('currentUser');
            if (saved) {
                try { return JSON.parse(saved); }
                catch (e) { return null; }
            }
        }
        return null;
    });

    const [loggedInTechnician, setLoggedInTechnician] = useState<Technician | null>(() => {
        if (localStorage.getItem('userType') === 'technician') {
            const saved = localStorage.getItem('currentUser');
            if (saved) {
                try { return JSON.parse(saved); }
                catch (e) { return null; }
            }
        }
        return null;
    });

    const [loggedInTowTruck, setLoggedInTowTruck] = useState<TowTruck | null>(() => {
        if (localStorage.getItem('userType') === 'tow_truck') {
            const saved = localStorage.getItem('currentUser');
            if (saved) {
                try { return JSON.parse(saved); }
                catch (e) { return null; }
            }
        }
        return null;
    });

    const [loggedInCustomer, setLoggedInCustomer] = useState<Customer | null>(() => {
        if (localStorage.getItem('userType') === 'customer') {
            const saved = localStorage.getItem('currentUser');
            if (saved) {
                try { return JSON.parse(saved); }
                catch (e) { return null; }
            }
        }
        return null;
    });

    const [loggedInCarProvider, setLoggedInCarProvider] = useState<CarProvider | null>(() => {
        if (localStorage.getItem('userType') === 'car_provider') {
            const saved = localStorage.getItem('currentUser');
            if (saved) {
                try { return JSON.parse(saved); }
                catch (e) { return null; }
            }
        }
        return null;
    });

    const [userPhone, setUserPhone] = useState(() => localStorage.getItem('userPhone') || '');
    const [showLogin, setShowLogin] = useState(false);
    const [postLoginAction, setPostLoginAction] = useState<(() => void) | null>(null);



    useEffect(() => {
        // Check Auth Status
        const loggedIn = localStorage.getItem('isAuthenticated');
        const phone = localStorage.getItem('userPhone');

        if (loggedIn === 'true' && phone) {
            setIsAuthenticated(true);
            setUserPhone(phone);

            // Check stored role first (from API login)
            const storedIsAdmin = localStorage.getItem('isAdmin');
            const storedUserType = localStorage.getItem('userType');

            if (storedIsAdmin === 'true' || phone === settings.adminPhone) {
                setIsAdmin(true);
            }

            if (storedUserType === 'provider') {
                setIsProvider(true);
                const allProviders = loadData<Provider[]>('all_providers', []);
                const foundProvider = allProviders.find(p => p.id === phone);
                if (foundProvider) setLoggedInProvider(foundProvider);
            } else if (storedUserType === 'technician') {
                setIsTechnician(true);
                const allTechnicians = loadData<Technician[]>('all_technicians', []);
                const foundTechnician = allTechnicians.find(t => t.id === phone);
                if (foundTechnician) setLoggedInTechnician(foundTechnician);
            } else if (storedUserType === 'tow_truck') {
                setIsTowTruck(true);
                const allTowTrucks = loadData<TowTruck[]>('all_tow_trucks', []);
                const foundTowTruck = allTowTrucks.find(t => t.id === phone);

                if (foundTowTruck) setLoggedInTowTruck(foundTowTruck);
            } else if (storedUserType === 'car_provider') {
                setIsCarProvider(true);
                const saved = localStorage.getItem('currentUser');
                if (saved) {
                    try { setLoggedInCarProvider(JSON.parse(saved)); }
                    catch (e) { }
                }
            } else {
                // Default to customer
                // Note: We don't load customer from local storage here because we want to rely on API
                // But for initial render before API call, we might want to try finding it in allCustomers if available
                // However, allCustomers is also empty initially.
                // We rely on App.tsx to call AuthService.getProfile() and update us.
            }
        }
    }, [settings.adminPhone]);

    const handleLoginSuccess = useCallback((phone: string, rememberMe: boolean, provider?: Provider, technician?: Technician, towTruck?: TowTruck, isAdminUser?: boolean, customer?: Customer, carProvider?: CarProvider) => {
        setIsAuthenticated(true);
        setUserPhone(phone);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userPhone', phone);

        if (rememberMe) localStorage.setItem('savedUserPhone', phone);
        else localStorage.removeItem('savedUserPhone');

        let targetPath = '/dashboard'; // Default to customer dashboard

        if (isAdminUser || phone === settings.adminPhone) {
            setIsAdmin(true);
            targetPath = '/admin';
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('currentUser', JSON.stringify({ name: 'مدير النظام', phone }));
        } else if (provider) {
            setIsProvider(true);
            setLoggedInProvider(provider);
            targetPath = '/provider';
            localStorage.setItem('userType', 'provider');
            localStorage.setItem('currentUser', JSON.stringify(provider));
        } else if (technician) {
            setIsTechnician(true);
            setLoggedInTechnician(technician);
            targetPath = '/technician';
            localStorage.setItem('userType', 'technician');
            localStorage.setItem('currentUser', JSON.stringify(technician));
        } else if (towTruck) {
            setIsTowTruck(true);
            setLoggedInTowTruck(towTruck);
            targetPath = '/tow-truck-dashboard';
            localStorage.setItem('userType', 'tow_truck');
            localStorage.setItem('currentUser', JSON.stringify(towTruck));
        } else if (carProvider) {
            setIsCarProvider(true);
            setLoggedInCarProvider(carProvider);
            targetPath = '/car-provider-dashboard';
            localStorage.setItem('userType', 'car_provider');
            localStorage.setItem('currentUser', JSON.stringify(carProvider));
        } else {
            // Customer
            if (customer) {
                setLoggedInCustomer(customer);
                localStorage.setItem('currentUser', JSON.stringify(customer));
            }
            localStorage.setItem('userType', 'customer');
        }

        setShowLogin(false);
        navigate(targetPath);
    }, [settings.adminPhone, navigate]);

    const handleLogout = useCallback(() => {
        setIsAuthenticated(false);
        setUserPhone('');
        setIsAdmin(false);
        setIsProvider(false);
        setIsTechnician(false);

        setIsTowTruck(false);
        setIsCarProvider(false);
        setLoggedInProvider(null);
        setLoggedInTechnician(null);
        setLoggedInTowTruck(null);
        setLoggedInCarProvider(null);
        setLoggedInCustomer(null);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userType');
        localStorage.removeItem('currentUser');
        navigate('/');
    }, [navigate]);

    const userName = useCallback(() => {
        if (isAdmin) return 'مدير النظام';
        if (loggedInProvider) return loggedInProvider.name;
        if (loggedInTechnician) return loggedInTechnician.name;

        if (loggedInTowTruck) return loggedInTowTruck.name;
        if (loggedInCarProvider) return loggedInCarProvider.name;
        if (loggedInCustomer) return loggedInCustomer.name;

        // Fallback to finding in allCustomers (legacy/backup)
        const customer = allCustomers.find(c => c.id === userPhone);
        return customer?.name;
    }, [isAdmin, loggedInProvider, loggedInTechnician, loggedInTowTruck, loggedInCustomer, allCustomers, userPhone])();

    return {
        isAuthenticated, setIsAuthenticated,
        isAdmin, setIsAdmin,
        isProvider, setIsProvider,
        isTechnician, setIsTechnician,

        isTowTruck, setIsTowTruck,
        isCarProvider, setIsCarProvider,
        loggedInProvider, setLoggedInProvider,
        loggedInTechnician, setLoggedInTechnician,
        loggedInTowTruck, setLoggedInTowTruck,
        loggedInCarProvider, setLoggedInCarProvider,
        loggedInCustomer, setLoggedInCustomer,
        userPhone, setUserPhone,
        showLogin, setShowLogin,
        postLoginAction, setPostLoginAction,
        handleLoginSuccess,
        handleLogout,
        userName
    };
};
