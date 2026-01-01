import React, { useMemo } from 'react';
import { Order, Quote, Provider, Settings } from '../../types';
import QuoteCard from './QuoteCard';

const QuoteGrid: React.FC<{
    orderNumber: string,
    quotes: Quote[],
    providers?: Provider[],
    onAcceptOffer: (quote: Quote) => void,
    status: Order['status'],
    acceptedQuote?: Quote,
    settings: Settings,
    city: string
}> = ({ orderNumber, quotes, providers = [], onAcceptOffer, status, acceptedQuote, settings, city }) => {

    const sortedQuotes = useMemo(() => {
        return [...quotes].sort((a, b) => a.price - b.price);
    }, [quotes]);

    const isExpired = (quote: Quote) => {
        const daysSince = (Date.now() - new Date(quote.timestamp).getTime()) / (1000 * 3600 * 24);
        return daysSince > (settings.limitSettings.quoteValidityDays || 7);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {sortedQuotes.map((quote, index) => {
                const expired = isExpired(quote);
                const isAccepted = acceptedQuote?.timestamp === quote.timestamp;
                const canBeAccepted = (status === 'قيد المراجعة' || status === 'pending' || status === 'quoted') && !expired;
                // Safe access to provider rating even if providers list is empty or provider not found
                const provider = (providers || []).find(p => p.id === quote.providerId);
                const rating = provider?.averageRating;

                return (
                    <QuoteCard
                        key={`${quote.providerId}-${quote.timestamp}`}
                        quote={quote}
                        orderNumber={orderNumber}
                        providerRating={rating}
                        onAcceptOffer={() => onAcceptOffer(quote)}
                        canBeAccepted={canBeAccepted}
                        isAccepted={isAccepted}
                        isCheapest={index === 0 && sortedQuotes.length > 1}
                        settings={settings}
                        city={city}
                    />
                );
            })}
        </div>
    );
};

export default QuoteGrid;
