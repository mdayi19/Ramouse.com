import React from 'react';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

/**
 * Skeleton loader for table rows
 * Used for loading states in order tables, request tables, etc.
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
    rows = 5,
    columns = 5
}) => {
    return (
        <div className="bg-white dark:bg-darkcard rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase">
                        <tr>
                            {[...Array(columns)].map((_, idx) => (
                                <th key={idx} className="p-3">
                                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {[...Array(rows)].map((_, rowIdx) => (
                            <tr key={rowIdx}>
                                {[...Array(columns)].map((_, colIdx) => (
                                    <td key={colIdx} className="p-3">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TableSkeleton;
