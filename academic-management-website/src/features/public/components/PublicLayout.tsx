import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import PageLoadingFallback from '@/shared/ui/PageLoadingFallback';

const PublicLayout = () => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <Header />

            {/* Body */}
            <main className="flex-1 bg-background p-6">
                <Suspense fallback={<PageLoadingFallback />}>
                    <Outlet />
                </Suspense>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default PublicLayout;
