import StudentHeader from "./StudentHeader";
import Sidebar from "./StudentSidebar";
import { Outlet } from "react-router-dom";

const StudentLayout = () => {
    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 h-16 z-50">
                <StudentHeader />
            </div>

            {/* Body */}
            <div className="pt-16">
                <aside className="w-64 bg-white border-r flex flex-col fixed top-16 left-0 h-[calc(100vh-64px)]">
                    <Sidebar />
                </aside>

                <main className="ml-64 h-[calc(100vh-64px)] overflow-y-auto p-6 bg-surface">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;