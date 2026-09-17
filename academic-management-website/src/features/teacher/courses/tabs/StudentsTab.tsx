import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTeacherStudentsQuery } from "@/shared/api/queries/useTeacherStudentsQuery";
import type { EnrolledStudent } from "@/shared/api/queries/useTeacherStudentsQuery";
import Table, { type TableColumn } from "@/shared/ui/Table";
import EmptyState from "@/shared/ui/EmptyState";

interface StudentsTabProps {
    courseId: number;
}

const StudentsTab = ({ courseId }: StudentsTabProps) => {
    const { t } = useTranslation("teacher");
    const studentsQuery = useTeacherStudentsQuery(courseId);
    const students = studentsQuery.data ?? [];

    const columns: TableColumn<EnrolledStudent>[] = [
        {
            key: "studentFullName",
            header: t("studentsTab.columnStudent"),
            render: (s) => (
                <div>
                    <p className="font-medium text-primary">{s.studentFullName}</p>
                    <p className="text-caption text-secondary">@{s.studentUsername}</p>
                </div>
            ),
        },
        {
            key: "progress",
            header: t("studentsTab.columnProgress"),
            render: (s) => `${s.progressPercent}%`,
        },
        {
            key: "enrolledAt",
            header: t("studentsTab.columnEnrolledAt"),
            render: (s) => new Date(s.enrolledAt).toLocaleDateString("vi-VN"),
        },
    ];

    return (
        <Table
            columns={columns}
            data={students}
            rowKey={(s) => s.enrollmentId}
            loading={studentsQuery.isLoading}
            emptyState={<EmptyState icon={Users} title={t("studentsTab.emptyTitle")} />}
        />
    );
};

export default StudentsTab;
