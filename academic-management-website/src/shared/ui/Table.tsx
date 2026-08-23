import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SkeletonTable } from "@/shared/ui/Skeleton";

export type SortDirection = "asc" | "desc";

export interface TableSort {
    key: string;
    direction: SortDirection;
}

export interface TableColumn<T> {
    key: string;
    header: string;
    render: (row: T) => ReactNode;
    sortable?: boolean;
}

interface TableProps<T> {
    columns: TableColumn<T>[];
    data: T[];
    rowKey: (row: T) => string | number;
    loading?: boolean;
    emptyState?: ReactNode;
    sortBy?: TableSort;
    onSortChange?: (sort: TableSort) => void;
    onRowClick?: (row: T) => void;
}

const ariaSortFor = <T,>(column: TableColumn<T>, sortBy?: TableSort): "ascending" | "descending" | "none" => {
    if (!column.sortable) return "none";
    if (sortBy?.key !== column.key) return "none";
    return sortBy.direction === "asc" ? "ascending" : "descending";
};

const Table = <T,>({
    columns,
    data,
    rowKey,
    loading = false,
    emptyState,
    sortBy,
    onSortChange,
    onRowClick,
}: TableProps<T>) => {
    const handleHeaderClick = (column: TableColumn<T>) => {
        if (!column.sortable || !onSortChange) return;
        const isSameColumn = sortBy?.key === column.key;
        const nextDirection: SortDirection = isSameColumn && sortBy?.direction === "asc" ? "desc" : "asc";
        onSortChange({ key: column.key, direction: nextDirection });
    };

    const isEmpty = !loading && data.length === 0;

    return (
        <div className="overflow-x-auto rounded-card border border-default bg-surface">
            <table className="w-full text-body-sm">
                <thead className="sticky top-0 z-sticky bg-surface-muted text-secondary">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                scope="col"
                                aria-sort={ariaSortFor(column, sortBy)}
                                className="border-b border-default px-4 py-2 text-left font-medium"
                            >
                                {column.sortable ? (
                                    <button
                                        type="button"
                                        onClick={() => handleHeaderClick(column)}
                                        className="inline-flex items-center gap-1"
                                    >
                                        {column.header}
                                        {sortBy?.key === column.key &&
                                            (sortBy.direction === "asc" ? (
                                                <ChevronUp size={14} aria-hidden="true" />
                                            ) : (
                                                <ChevronDown size={14} aria-hidden="true" />
                                            ))}
                                    </button>
                                ) : (
                                    column.header
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                {!isEmpty && (
                    <tbody>
                        {loading ? (
                            <SkeletonTable rows={5} columns={columns.length} />
                        ) : (
                            data.map((row) => (
                                <tr
                                    key={rowKey(row)}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                    className={`h-10 border-b border-default last:border-b-0 hover:bg-surface-muted ${
                                        onRowClick ? "cursor-pointer" : ""
                                    }`}
                                >
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-4 py-2 text-primary">
                                            {column.render(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                )}
            </table>
            {isEmpty && emptyState && <div className="p-8">{emptyState}</div>}
        </div>
    );
};

export default Table;
