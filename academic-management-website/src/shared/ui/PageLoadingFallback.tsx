import Skeleton from "@/shared/ui/Skeleton";

const PageLoadingFallback = () => {
    return (
        <div className="flex min-h-[60vh] w-full items-center justify-center p-8">
            <div className="w-full max-w-sm space-y-3">
                <Skeleton className="h-4 w-2/3 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
        </div>
    );
};

export default PageLoadingFallback;
