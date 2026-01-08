import React, { useState, useEffect } from 'react';
import { comparisonService } from '../stores/comparisonStore';

export const useComparison = () => {
    const [items, setItems] = useState(comparisonService.getItems());

    useEffect(() => {
        const unsubscribe = comparisonService.subscribe(() => {
            setItems(comparisonService.getItems());
        });
        return unsubscribe;
    }, []);

    return {
        items,
        addItem: comparisonService.addItem.bind(comparisonService),
        removeItem: comparisonService.removeItem.bind(comparisonService),
        clearAll: comparisonService.clearAll.bind(comparisonService),
        isInComparison: comparisonService.isInComparison.bind(comparisonService),
    };
};
