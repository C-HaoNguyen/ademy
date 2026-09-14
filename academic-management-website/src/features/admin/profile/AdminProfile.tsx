// Hồ sơ Admin: cùng logic/UI với features/student/profile/Profile.tsx — trang này chỉ đọc/ghi
// /users/me (role-agnostic ở backend, không có field/validation riêng theo role) nên tái dùng thẳng
// thay vì copy-paste 3 bản giống hệt nhau (Student/Teacher/Admin) — tránh trùng lặp logic phải sửa
// 3 nơi mỗi khi đổi field. File riêng theo audience (thay vì import thẳng path Student ở AppRoutes)
// để giữ đúng quy ước "mỗi audience có page riêng trong features/<audience>/" của ARCHITECTURE.md.
export { default } from "@/features/student/profile/Profile";
