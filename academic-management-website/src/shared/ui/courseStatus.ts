// Badge tone/label dùng chung cho mọi nơi hiển thị CourseStatus (draft/published/archived) —
// trước Phase 31 bị định nghĩa lặp lại y hệt ở CourseEditor.tsx, SettingsTab.tsx,
// TeacherCoursesList.tsx (Teacher) và AdminCourses.tsx (Admin); gộp về đây để tránh lệch nhau khi
// có CourseStatus mới hoặc đổi màu/nhãn.
export const COURSE_STATUS_TONE: Record<string, "success" | "warning" | "danger"> = {
    published: "success",
    draft: "warning",
    archived: "danger",
};

// Label đi qua i18n (namespace "common") thay vì map string tĩnh — nhãn hiển thị (Phase 38).
export const getCourseStatusLabel = (status: string, t: (key: string, opts?: Record<string, unknown>) => string) =>
    t(`common:courseStatus.${status}`, { defaultValue: status });
