import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TeacherCourse } from "@/shared/api/queries/useTeacherCoursesQuery";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import ConfirmDeleteModal from "@/shared/ui/ConfirmDeleteModal";
import { COURSE_STATUS_TONE, getCourseStatusLabel } from "@/shared/ui/courseStatus";

interface SettingsTabProps {
    course: TeacherCourse;
    changingStatus: boolean;
    onChangeStatus: (status: "draft" | "published" | "archived") => void;
    deleting: boolean;
    onDelete: () => void;
}

const SettingsTab = ({ course, changingStatus, onChangeStatus, deleting, onDelete }: SettingsTabProps) => {
    const { t } = useTranslation(["teacher", "common"]);
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <div className="space-y-6">
            <Card variant="app">
                <h3 className="font-semibold text-primary mb-4">{t("settingsTab.statusTitle")}</h3>
                <div className="flex items-center gap-4">
                    <Badge variant="status" tone={COURSE_STATUS_TONE[course.status] ?? "info"}>
                        {getCourseStatusLabel(course.status, t)}
                    </Badge>
                    <div className="flex gap-2">
                        <Button
                            variant={course.status === "draft" ? "primary" : "secondary"}
                            size="sm"
                            loading={changingStatus}
                            disabled={course.status === "draft"}
                            onClick={() => onChangeStatus("draft")}
                        >
                            {t("common:courseStatus.draft")}
                        </Button>
                        <Button
                            variant={course.status === "published" ? "primary" : "secondary"}
                            size="sm"
                            loading={changingStatus}
                            disabled={course.status === "published"}
                            onClick={() => onChangeStatus("published")}
                        >
                            {t("common:courseStatus.published")}
                        </Button>
                        <Button
                            variant={course.status === "archived" ? "primary" : "secondary"}
                            size="sm"
                            loading={changingStatus}
                            disabled={course.status === "archived"}
                            onClick={() => onChangeStatus("archived")}
                        >
                            {t("common:courseStatus.archived")}
                        </Button>
                    </div>
                </div>
            </Card>

            <Card variant="app">
                <h3 className="font-semibold text-primary mb-4">{t("settingsTab.dangerZoneTitle")}</h3>
                <p className="text-body-sm text-secondary mb-4">
                    {t("settingsTab.deleteWarning")}
                </p>
                <Button variant="danger" iconLeft={Trash2} onClick={() => setConfirmDelete(true)}>
                    {t("settingsTab.deleteCourse")}
                </Button>
            </Card>

            <ConfirmDeleteModal
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => {
                    setConfirmDelete(false);
                    onDelete();
                }}
                itemName={course.title}
                loading={deleting}
            />
        </div>
    );
};

export default SettingsTab;
