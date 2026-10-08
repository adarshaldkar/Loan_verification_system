"use client";

import React from "react";
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { cn } from "@/lib/utils";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  pageSize,
  onPageChange,
  onItemsPerPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemName = "items",
  className,
}: PaginationControlsProps) {
  const currentSize = pageSize || itemsPerPage || 10;
  const handleSizeChange = onPageSizeChange || onItemsPerPageChange;

  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * currentSize + 1;
  const endItem = Math.min(currentPage * currentSize, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={cn("px-5 py-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/10", className)}>
      {/* Items Count & Page Size Selector */}
      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
        <span>
          Showing <strong className="text-slate-900 dark:text-slate-100 font-bold">{startItem}</strong> - <strong className="text-slate-900 dark:text-slate-100 font-bold">{endItem}</strong> of <strong className="text-slate-900 dark:text-slate-100 font-bold">{totalItems}</strong> {itemName}
        </span>

        {handleSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px]">Rows:</span>
            <select
              value={currentSize}
              onChange={(e) => {
                handleSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1 self-center sm:self-auto">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="First Page"
        >
          <FiChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Prev Page */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Previous Page"
        >
          <FiChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`dots-${idx}`} className="px-1.5 text-slate-400 font-bold">
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(Number(p))}
                className={cn(
                  "min-w-[28px] h-7 px-1.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center cursor-pointer",
                  isCurrent
                    ? "bg-[#1E3A5F] text-white shadow-xs"
                    : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800"
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Next Page"
        >
          <FiChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Last Page"
        >
          <FiChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default PaginationControls;
