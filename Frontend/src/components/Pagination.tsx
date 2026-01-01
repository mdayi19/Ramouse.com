import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const startItem = itemsPerPage && totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = itemsPerPage && totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

  const pageNumbers: (number | string)[] = [];
  const maxPagesToShow = 5;
  const halfMaxPages = Math.floor(maxPagesToShow / 2);

  let startPage = Math.max(1, currentPage - halfMaxPages);
  let endPage = Math.min(totalPages, currentPage + halfMaxPages);

  if (endPage - startPage + 1 < maxPagesToShow) {
    if (startPage === 1) {
      endPage = Math.min(totalPages, maxPagesToShow);
    } else if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - maxPagesToShow + 1);
    }
  }

  if (startPage > 1) {
    pageNumbers.push(1);
    if (startPage > 2) {
      pageNumbers.push('...');
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pageNumbers.push('...');
    }
    pageNumbers.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 px-4 py-3 bg-white dark:bg-darkcard border-t border-slate-200 dark:border-slate-700 sm:px-6 rounded-b-lg">
      <div className="text-sm text-slate-700 dark:text-slate-300 mb-2 sm:mb-0">
        {itemsPerPage && totalItems && totalItems > 0 && (
          <>
            عرض <span className="font-medium">{startItem}</span> إلى <span className="font-medium">{endItem}</span> من <span className="font-medium">{totalItems}</span> نتائج
          </>
        )}
         {totalItems === 0 && (
            <span>لا توجد نتائج</span>
        )}
      </div>
      <div className="flex items-center space-x-1 rtl:space-x-reverse">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          السابق
        </button>

        {pageNumbers.map((number, index) =>
          typeof number === 'string' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300">
              ...
            </span>
          ) : (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`relative inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md ${
                currentPage === number
                  ? 'z-10 bg-primary-50 border-primary text-primary dark:bg-primary-900/50 dark:border-primary-500'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {number}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          التالي
        </button>
      </div>
    </div>
  );
};

export default Pagination;