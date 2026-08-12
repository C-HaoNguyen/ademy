interface SkeletonProps {
    className?: string;
}

const Skeleton = ({ className = "h-4 w-full" }: SkeletonProps) => {
    return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
};

export const SkeletonCard = () => {
    return (
        <div className="rounded-card border border-slate-200 bg-white p-4 space-y-3">
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
        </div>
    );
};

export const SkeletonCardGrid = ({ count = 6 }: { count?: number }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
};

export const SkeletonRow = ({ columns = 5 }: { columns?: number }) => {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-4">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
};

export const SkeletonTable = ({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonRow key={i} columns={columns} />
            ))}
        </>
    );
};

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
            ))}
        </div>
    );
};

export default Skeleton;
