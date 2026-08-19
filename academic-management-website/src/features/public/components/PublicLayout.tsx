import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const PublicLayout = () => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <Header />

            {/* Body */}
            <main className="flex-1 bg-surface p-6">
                <Outlet />
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default PublicLayout;
