
import React, { useMemo, useState, useEffect } from 'react';
import { AnnouncementPost, ApiResponse } from '../types';
import { api } from '../lib/api';

import { getImageUrl } from '../utils/helpers';
import EmptyState from './EmptyState';
import Icon from './Icon';
import SEO from './SEO';
import SeoSchema from './SeoSchema';
import { generateAnnouncementCollectionSchema } from '../utils/structuredData';

interface AnnouncementsScreenProps {
    onBack: () => void;
    // announcements prop removed as it is fetched internally
    isAuthenticated: boolean;
    isProvider: boolean;
    isTechnician: boolean;
    isTowTruck: boolean;
}

const AudienceBadge: React.FC<{ target: AnnouncementPost['target'] }> = ({ target }) => {
    const audienceMap = {
        all: { label: 'للجميع', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', icon: 'Globe' },
        customers: { label: 'للعملاء', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', icon: 'User' },
        providers: { label: 'للمزودين', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', icon: 'Building2' },
        technicians: { label: 'للفنيين', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300', icon: 'Wrench' },
        tow_trucks: { label: 'للسطحات', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300', icon: 'Truck' },
        car_providers: { label: 'لمعارض السيارات', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300', icon: 'Car' },
    };

    const info = audienceMap[target] || audienceMap.all;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${info.color}`}>
            <Icon name={info.icon as any} className="w-3.5 h-3.5" />
            {info.label}
        </span>
    );
};

const AnnouncementCard: React.FC<{ post: AnnouncementPost }> = ({ post }) => (
    <div className="bg-white dark:bg-darkcard rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-slate-200 dark:border-slate-700 flex flex-col">
        {post.imageUrl && (
            <img src={getImageUrl(post.imageUrl)} alt={post.title} className="w-full h-40 object-cover" />
        )}
        <div className="p-5 flex flex-col flex-grow">
            <div className="flex justify-between items-start mb-2">
                <AudienceBadge target={post.target} />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(post.timestamp).toLocaleDateString('ar-SY', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex-grow">{post.title}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed mt-2">
                {post.message}
            </p>
        </div>
    </div>
);

const FeaturedAnnouncementCard: React.FC<{ post: AnnouncementPost }> = ({ post }) => (
    <div className="relative bg-slate-800 rounded-xl shadow-2xl overflow-hidden text-white group border border-slate-200 dark:border-slate-700 min-h-[300px] flex flex-col justify-end">
        {post.imageUrl ? (
            <img src={getImageUrl(post.imageUrl)} alt={post.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-sky-700"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent"></div>
        <div className="relative p-6 z-10">
            <div className="flex justify-between items-center mb-2">
                <AudienceBadge target={post.target} />
                <p className="text-xs text-slate-300">
                    {new Date(post.timestamp).toLocaleString('ar-SY', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
            <h2 className="text-3xl font-extrabold mb-2">{post.title}</h2>
            <p className="text-slate-200 whitespace-pre-wrap leading-relaxed max-w-3xl">
                {post.message}
            </p>
        </div>
    </div>
);


const AnnouncementsScreen: React.FC<AnnouncementsScreenProps> = ({ onBack, isAuthenticated, isProvider, isTechnician, isTowTruck }) => {
    const [announcements, setAnnouncements] = useState<AnnouncementPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                setLoading(true);
                const response = await api.get<ApiResponse<AnnouncementPost[]>>('/announcements');
                if (response.data.success && response.data.data) {
                    setAnnouncements(response.data.data);
                } else {
                    setError('فشل في تحميل الإعلانات');
                }
            } catch (err) {
                console.error('Error fetching announcements:', err);
                setError('حدث خطأ أثناء تحميل الإعلانات');
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    const filteredAnnouncements = useMemo(() => {
        return announcements
            .filter(post => {
                if (post.target === 'all') return true;
                if (post.target === 'providers') return isProvider;
                if (post.target === 'technicians') return isTechnician;
                if (post.target === 'tow_trucks') return isTowTruck;
                if (post.target === 'customers') return !isProvider && !isTechnician && !isTowTruck;
                return false;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [announcements, isProvider, isTechnician, isTowTruck]);

    const featuredPost = filteredAnnouncements[0];
    const otherPosts = filteredAnnouncements.slice(1);

    const AnnouncementsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6" /></svg>;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-0 w-full">
                <div className="flex justify-between items-center mb-8">
                    <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-400 transition-colors">
                        <span>العودة</span>
                        <Icon name="ArrowLeft" className="h-4 w-4" />
                    </button>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                    <Icon name="AlertCircle" className="h-12 w-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-0 w-full">
            <SEO
                title="لوحة الإعلانات | راموسة"
                description="آخر الأخبار والتحديثات من فريق راموسة."
                canonical="/announcements"
            />
            <SeoSchema
                type="Blog"
                data={generateAnnouncementCollectionSchema(filteredAnnouncements)}
            />
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-primary dark:text-primary-400">لوحة الإعلانات</h1>
                    <p className="text-md text-slate-500 dark:text-slate-400 mt-1">آخر الأخبار والتحديثات من فريقنا.</p>
                </div>
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-400 transition-colors">
                    <span>العودة</span>
                    <Icon name="ArrowLeft" className="h-4 w-4" />
                </button>
            </div>

            {filteredAnnouncements.length > 0 ? (
                <div className="space-y-12">
                    {/* Featured Post */}
                    {featuredPost && <FeaturedAnnouncementCard post={featuredPost} />}

                    {/* Other Posts */}
                    {otherPosts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {otherPosts.map(post => (
                                <AnnouncementCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-darkcard rounded-xl shadow-lg p-8">
                    <EmptyState
                        icon={<AnnouncementsIcon />}
                        title="لا توجد إعلانات حالياً."
                        message="تحقق مرة أخرى قريباً!"
                    />
                </div>
            )}
        </div>
    );
};

export default AnnouncementsScreen;
