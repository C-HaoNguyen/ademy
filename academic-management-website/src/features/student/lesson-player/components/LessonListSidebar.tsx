import { CheckCircle2, FileText, HelpCircle, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StudentLesson } from "@/shared/api/queries/useLessonPlayerQuery";

const contentTypeIcon = { video: Video, document: FileText, quiz: HelpCircle } as const;

interface LessonListSidebarProps {
    lessons: StudentLesson[];
    selectedLessonId: number | undefined;
    onSelect: (lessonId: number) => void;
}

// UI_SPEC §3.3 mục 2 — không bắt buộc tuần tự, Student chọn lesson bất kỳ trong sidebar.
const LessonListSidebar = ({ lessons, selectedLessonId, onSelect }: LessonListSidebarProps) => {
    const { t } = useTranslation("student");
    return (
        <nav className="flex flex-col gap-1 p-3" aria-label={t("lessonPlayer.lessonListLabel")}>
            {lessons.map((lesson) => {
                const Icon = contentTypeIcon[lesson.contentType];
                const isSelected = lesson.lessonId === selectedLessonId;
                return (
                    <button
                        key={lesson.lessonId}
                        type="button"
                        onClick={() => onSelect(lesson.lessonId)}
                        aria-current={isSelected ? "true" : undefined}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-radius-md text-body-sm text-left transition-colors cursor-pointer ${
                            isSelected
                                ? "bg-nav-selected-bg text-nav-selected-text font-medium"
                                : "text-secondary hover:bg-surface-muted"
                        }`}
                    >
                        <Icon size={16} className="shrink-0" aria-hidden="true" />
                        <span className="flex-1 truncate">{lesson.title}</span>
                        {lesson.completed && (
                            <CheckCircle2 size={16} className="shrink-0 text-status-success-icon" aria-hidden="true" />
                        )}
                    </button>
                );
            })}
        </nav>
    );
};

export default LessonListSidebar;
