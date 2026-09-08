import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { TeacherCourse } from "@/shared/api/queries/useTeacherCoursesQuery";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import ConfirmDeleteModal from "@/shared/ui/ConfirmDeleteModal";
import { COURSE_STATUS_TONE, COURSE_STATUS_LABEL } from "@/shared/ui/courseStatus";

interface SettingsTabProps {
    course: TeacherCourse;
    changingStatus: boolean;
    onChangeStatus: (status: "draft" | "published" | "archived") => void;
    deleting: boolean;
    onDelete: () => void;
}

const SettingsTab = ({ course, changingStatus, onChangeStatus, deleting, onDelete }: SettingsTabProps) => {
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <div className="space-y-6">
            <Card variant="app">
                <h3 className="font-semibold text-primary mb-4">Trạng thái khóa học</h3>
                <div className="flex items-center gap-4">
                    <Badge variant="status" tone={COURSE_STATUS_TONE[course.status] ?? "info"}>
                        {COURSE_STATUS_LABEL[course.status] ?? course.status}
                    </Badge>
                    <div className="flex gap-2">
                        <Button
                            variant={course.status === "draft" ? "primary" : "secondary"}
                            size="sm"
                            loading={changingStatus}
                            disabled={course.status === "draft"}
                            onClick={() => onChangeStatus("draft")}
                        >
                            Draft
                        </Button>
                        <Button
                            variant={course.status === "published" ? "primary" : "secondary"}
                            size="sm"
                            loading={changingStatus}
                            disabled={course.status === "published"}
                            onClick={() => onChangeStatus("published")}
                        >
                            Publish
                        </Button>
                        <Button
                            variant={course.status === "archived" ? "primary" : "secondary"}
                            size="sm"
                            loading={changingStatus}
                            disabled={course.status === "archived"}
                            onClick={() => onChangeStatus("archived")}
                        >
                            Archive
                        </Button>
                    </div>
                </div>
            </Card>

            <Card variant="app">
                <h3 className="font-semibold text-primary mb-4">Vùng nguy hiểm</h3>
                <p className="text-body-sm text-secondary mb-4">
                    Xóa khóa học sẽ xóa toàn bộ dữ liệu liên quan. Hành động này không thể hoàn tác.
                </p>
                <Button variant="danger" iconLeft={Trash2} onClick={() => setConfirmDelete(true)}>
                    Xóa khóa học
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
