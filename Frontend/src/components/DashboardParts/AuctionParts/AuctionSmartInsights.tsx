import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../Icon';

const AuctionSmartInsights: React.FC = () => {
    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-3xl p-6 border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center gap-2 mb-4">
                <Icon name="Sparkles" className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-indigo-900 dark:text-indigo-200">AI Insights</h3>
            </div>

            <div className="space-y-3">
                <InsightItem
                    icon="Flame"
                    color="text-orange-500"
                    title="Hot Auction Detected"
                    desc='Auction #129 has received 15 bids in the last 10 mins. Predicted to exceed reserve by 20%.'
                />

                <InsightItem
                    icon="TrendingDown"
                    color="text-blue-500"
                    title="Low Engagement Alert"
                    desc='3 scheduled auctions for tomorrow have 0 watchers. Consider boosting visibility.'
                />

                <InsightItem
                    icon="Target"
                    color="text-green-500"
                    title="Price Prediction"
                    desc='2022 BMW X5 is projected to sell for ~$45,000 based on current trajectory.'
                />
            </div>
        </div>
    );
};

const InsightItem: React.FC<{ icon: string, color: string, title: string, desc: string }> = ({ icon, color, title, desc }) => (
    <div className="bg-white dark:bg-darkcard p-3 rounded-xl shadow-sm border border-indigo-50 dark:border-indigo-900/10 flex gap-3">
        <div className={`mt-0.5 ${color}`}>
            <Icon name={icon as any} className="w-4 h-4" />
        </div>
        <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">{title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[250px]">
                {desc}
            </p>
        </div>
    </div>
);

export default AuctionSmartInsights;
