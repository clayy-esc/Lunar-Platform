import React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  
  // Pagination
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  
  // Search
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  // Selection
  selectedIds?: Set<string>;
  onToggleSelectAll?: () => void;
  onToggleSelectRow?: (id: string) => void;

  isLoading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  page = 1,
  totalPages = 1,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  selectedIds,
  onToggleSelectAll,
  onToggleSelectRow,
  isLoading
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedIds?.size === data.length;
  const someSelected = data.length > 0 && (selectedIds?.size || 0) > 0 && (selectedIds?.size || 0) < data.length;

  return (
    <div className="space-y-4">
      {onSearchChange && (
        <div className="flex items-center w-full max-w-sm">
          <Input 
            placeholder={searchPlaceholder} 
            value={searchValue || ''} 
            onChange={(e) => onSearchChange(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      )}

      <div className="rounded-md border border-border overflow-x-auto bg-card">
        <table className="w-full text-sm text-left">
          <thead className="text-[13px] font-semibold text-muted-foreground bg-muted/50 border-b border-border">
            <tr>
              {onToggleSelectAll && (
                <th className="px-4 py-3 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-border text-primary focus:ring-primary"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={onToggleSelectAll}
                  />
                </th>
              )}
              {columns.map((col, i) => (
                <th key={i} className={`px-4 py-3 font-medium ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (onToggleSelectAll ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">
                  Loading data...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onToggleSelectAll ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">
                  No results found.
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const id = keyExtractor(row);
                const isSelected = selectedIds?.has(id);
                return (
                  <tr 
                    key={id} 
                    className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${isSelected ? 'bg-primary/5' : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {onToggleSelectRow && (
                      <td className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          className="rounded border-border text-primary focus:ring-primary"
                          checked={isSelected || false}
                          onChange={() => onToggleSelectRow(id)}
                        />
                      </td>
                    )}
                    {columns.map((col, i) => (
                      <td key={i} className={`px-4 py-3 ${col.className || ''}`}>
                        {typeof col.accessor === 'function' ? col.accessor(row) : (row as any)[col.accessor]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onPageChange(page - 1)} 
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onPageChange(page + 1)} 
              disabled={page >= totalPages}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
