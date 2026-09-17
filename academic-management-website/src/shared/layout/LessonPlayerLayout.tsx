import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Menu } from "lucide-react";
import ProgressBar from "@/shared/ui/ProgressBar";
import Modal from "@/shared/ui/Modal";

interface LessonPlayerLayoutProps {
    courseTitle: string;
    progressPercent: number;
    onExit: () => void;
    sidebar: ReactNode;
    children: ReactNode;
}

// UI_SPEC §3.3 — layout riêng khi Student đang học, ẩn hẳn AppShellLayout (sidebar toàn cục +
// header 64px) theo quyết định đã chốt ở COMPONENT_SYSTEM.md §5. Topbar 56px theo Design System §6
// (khác Header 64px của AppShellLayout — 2 ngữ cảnh khác nhau, không dùng chung).
const LessonPlayerLayout = ({ courseTitle, progressPercent, onExit, sidebar, children }: LessonPlayerLayoutProps) => {
    const { t } = useTranslation("student");
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-surface-muted">
            <header className="h-14 bg-surface border-b border-default px-4 flex items-center gap-4">
                <button
                    type="button"
                    onClick={onExit}
                    className="flex items-center gap-1.5 text-body-sm font-medium text-secondary hover:text-primary transition-colors cursor-pointer shrink-0"
                >
                    <ArrowLeft size={18} aria-hidden="true" />
                    {t("lessonPlayer.exit")}
                </button>

                <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-primary truncate">{courseTitle}</p>
                    <ProgressBar value={progressPercent} />
                </div>

                <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(true)}
                    aria-label={t("lessonPlayer.lessonListLabel")}
                    className="lg:hidden p-2 rounded-radius-md hover:bg-surface-muted text-secondary shrink-0"
                >
                    <Menu size={20} aria-hidden="true" />
                </button>
            </header>

            <div className="flex">
                <div className="hidden lg:block fixed left-0 top-14 h-[calc(100vh-56px)] w-sidebar bg-surface border-r border-default overflow-y-auto">
                    {sidebar}
                </div>

                <main className="flex-1 lg:ml-sidebar p-4 sm:p-6 min-h-[calc(100vh-56px)]">
                    {children}
                </main>
            </div>

            <Modal
                open={mobileSidebarOpen}
                onClose={() => setMobileSidebarOpen(false)}
                title={t("lessonPlayer.lessonListLabel")}
                size="sm"
            >
                <div onClick={() => setMobileSidebarOpen(false)}>{sidebar}</div>
            </Modal>
        </div>
    );
};

export default LessonPlayerLayout;
