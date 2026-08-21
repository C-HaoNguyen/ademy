import { Outlet } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = () => {
    return (
        <div className="min-h-screen bg-legacy-surface">
            <div className="fixed top-0 left-0 right-0 h-16 z-50">
                <AdminHeader />
            </div>

            <div className="pt-16 flex">
                <aside className="w-48 fixed left-0 top-16 h-[calc(100vh-48px)] bg-white border-r">
                    <AdminSidebar />
                </aside>

                <main className="ml-48 flex-1 p-6 bg-legacy-surface min-h-[calc(100vh-48px)]">
                    <Outlet />
                </main>
            </div>
        </div>

    );
};

export default AdminLayout;
