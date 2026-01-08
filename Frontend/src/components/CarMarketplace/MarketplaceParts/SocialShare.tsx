import React from 'react';
import { Share2, Facebook, Twitter, Linkedin, Link, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface SocialShareProps {
    url: string;
    title: string;
    description?: string;
    image?: string;
    className?: string;
}

/**
 * Social sharing component with multiple platform support
 * Supports Facebook, Twitter, LinkedIn, WhatsApp, and copy link
 * @param url - URL to share
 * @param title - Title of the listing
 * @param description - Optional description
 * @param image - Optional image URL for rich previews
 */
export const SocialShare: React.FC<SocialShareProps> = ({
    url,
    title,
    description = '',
    image,
    className
}) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDesc = encodeURIComponent(description);

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    };

    const handleShare = (platform: keyof typeof shareLinks) => {
        const width = 600;
        const height = 400;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        window.open(
            shareLinks[platform],
            'share',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        // Track share analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'share', {
                method: platform,
                content_type: 'listing',
                item_id: url
            });
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url);
            // You can add a toast notification here
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const shareButtons = [
        { icon: Facebook, color: 'hover:bg-blue-600', platform: 'facebook' as const, label: 'Facebook' },
        { icon: Twitter, color: 'hover:bg-sky-500', platform: 'twitter' as const, label: 'Twitter' },
        { icon: Linkedin, color: 'hover:bg-blue-700', platform: 'linkedin' as const, label: 'LinkedIn' },
        { icon: MessageCircle, color: 'hover:bg-green-600', platform: 'whatsapp' as const, label: 'WhatsApp' },
    ];

    return (
        <div className={cn('flex flex-wrap items-center gap-2', className)}>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mr-2">
                مشاركة:
            </span>

            {shareButtons.map(({ icon: Icon, color, platform, label }) => (
                <motion.button
                    key={platform}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare(platform)}
                    className={cn(
                        'w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-colors',
                        color,
                        'hover:text-white'
                    )}
                    aria-label={`Share on ${label}`}
                >
                    <Icon className="w-4 h-4" />
                </motion.button>
            ))}

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyToClipboard}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                aria-label="Copy link"
            >
                <Link className="w-4 h-4" />
            </motion.button>
        </div>
    );
};

export default SocialShare;
