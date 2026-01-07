import React, { useEffect, useState } from 'react';
import { Car, Eye, Heart, TrendingUp } from 'lucide-react';
import { CarProviderService } from '../../../services/carprovider.service';
import { CarProvider } from '../../../types';

interface OverviewViewProps {
    provider: CarProvider;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ provider, showToast }) => {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const statsRes = await CarProviderService.getProviderStats();
                setStats(statsRes.stats);
            } catch (error) {
                console.error(error);
            }
        };
        loadStats();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">نظرة عامة</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">مرحباً {provider.name}، إليك ملخص نشاطك</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="إجمالي السيارات"
                    value={stats?.total_listings || 0}
                    icon={Car}
                    color="blue"
                />
                <StatsCard
                    title="إجمالي المشاهدات"
                    value={stats?.total_views || 0}
                    icon={Eye}
                    color="green"
                />
                <StatsCard
                    title="إجمالي الإعجابات"
                    value={stats?.total_favorites || 0}
                    icon={Heart}
                    color="red"
                />
            </div>

            {/* Additional Customer Sections like "Recent Orders" could go here if we fetch them */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                    <h3 className="font-bold text-lg mb-2 text-blue-900 dark:text-blue-100">المحفظة</h3>
                    <p className="text-blue-700 dark:text-blue-300">رصيدك الحالي: {provider.wallet_balance?.toLocaleString() || 0} ل.س</p>
                </div>
                {/* Placeholder for more widgets */}
            </div>
        </div>
    );
};

const StatsCard: React.FC<{
    title: string;
    value: number;
    icon: any;
    color: 'blue' | 'green' | 'red';
}> = ({ title, value, icon: Icon, color }) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/20',
        red: 'bg-red-100 text-red-600 dark:bg-red-900/20'
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        {title}
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {value.toLocaleString()}
                    </div>
                </div>
                <div className={`p-4 rounded-xl ${colors[color]}`}>
                    <Icon className="w-8 h-8" />
                </div>
            </div>
        </div>
    );
};
