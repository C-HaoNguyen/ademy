import { Users } from "lucide-react";
import { useTeacherStudentsQuery } from "@/shared/api/queries/useTeacherStudentsQuery";
import type { EnrolledStudent } from "@/shared/api/queries/useTeacherStudentsQuery";
import Table, { type TableColumn } from "@/shared/ui/Table";
import EmptyState from "@/shared/ui/EmptyState";

interface StudentsTabProps {
    courseId: number;
}

const StudentsTab = ({ courseId }: StudentsTabProps) => {
    const studentsQuery = useTeacherStudentsQuery(courseId);
    const students = studentsQuery.data ?? [];

    const columns: TableColumn<EnrolledStudent>[] = [
        {
            key: "studentFullName",
            header: "Học viên",
            render: (s) => (
                <div>
                    <p className="font-medium text-primary">{s.studentFullName}</p>
                    <p className="text-caption text-secondary">@{s.studentUsername}</p>
                </div>
            ),
        },
        {
            key: "progress",
            header: "Tiến độ",
            render: (s) => `${s.progressPercent}%`,
        },
        {
            key: "enrolledAt",
            header: "Ngày đăng ký",
            render: (s) => new Date(s.enrolledAt).toLocaleDateString("vi-VN"),
        },
    ];

    return (
        <Table
            columns={columns}
            data={students}
            rowKey={(s) => s.enrollmentId}
            loading={studentsQuery.isLoading}
            emptyState={<EmptyState icon={Users} title="Chưa có học viên đăng ký" />}
        />
    );
};

export default StudentsTab;
