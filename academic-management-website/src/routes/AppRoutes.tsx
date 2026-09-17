import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { ROLES } from "@/config/constants";
import PageLoadingFallback from "@/shared/ui/PageLoadingFallback";

// Layouts render immediately (shell chrome) — not lazy-loaded. Each layout wraps its own
// <Outlet/> in a <Suspense> (see AppShellLayout.tsx / PublicLayout.tsx) so only the content
// area shows the loading fallback on a first visit to a lazy page — the shell chrome
// (sidebar/header) stays mounted instead of the whole route tree flashing to fallback.
import PublicLayout from "@/features/public/components/PublicLayout";
import StudentLayout from "@/features/student/components/StudentLayout";
import AdminLayout from "@/features/admin/components/AdminLayout";
import TeacherLayout from "@/features/teacher/components/TeacherLayout";

// ===== PUBLIC =====
const HomePage = lazy(() => import("@/features/public/home/HomePage"));
const LecturerPage = lazy(() => import("@/features/public/lecturer/LecturerPage"));
const ContactPage = lazy(() => import("@/features/public/about/ContactPage"));
const Login = lazy(() => import("@/features/auth/Login"));
const Signup = lazy(() => import("@/features/auth/Signup"));
const CourseList = lazy(() => import("@/features/courses/CourseListPage"));
const CourseDetail = lazy(() => import("@/features/courses/CourseDetailPage"));
const Checkout = lazy(() => import("@/features/payment/Checkout"));
const CheckoutPayment = lazy(() => import("@/features/payment/CheckoutPayment"));
const CheckoutResult = lazy(() => import("@/features/payment/CheckoutResult"));

// ===== STUDENT =====
const Dashboard = lazy(() => import("@/features/student/dashboard/Dashboard"));
const MyCourses = lazy(() => import("@/features/student/my-courses/MyCourses"));
const LearningProfile = lazy(() => import("@/features/student/learning-profile/LearningProfile"));
const TestPractice = lazy(() => import("@/features/student/test-practice/TestPractice"));
const QuizAttempt = lazy(() => import("@/features/student/quiz-attempt/QuizAttempt"));
const Profile = lazy(() => import("@/features/student/profile/Profile"));
const LessonPlayer = lazy(() => import("@/features/student/lesson-player/LessonPlayer"));

// ===== ADMIN =====
const AdminDashboard = lazy(() => import("@/features/admin/dashboard/AdminDashboard"));
const AdminUsersList = lazy(() => import("@/features/admin/users/AdminUsersList"));
const AdminCourses = lazy(() => import("@/features/admin/courses/AdminCourses"));
const AdminCategories = lazy(() => import("@/features/admin/categories/AdminCategories"));
const AdminOrders = lazy(() => import("@/features/admin/orders/AdminOrders"));
const AdminCoupons = lazy(() => import("@/features/admin/coupons/AdminCoupons"));
const AdminRefunds = lazy(() => import("@/features/admin/refunds/AdminRefunds"));
const AdminAuditLog = lazy(() => import("@/features/admin/audit-log/AdminAuditLog"));
const AdminProfile = lazy(() => import("@/features/admin/profile/AdminProfile"));

// ===== TEACHER =====
const TeacherDashboard = lazy(() => import("@/features/teacher/dashboard/TeacherDashboard"));
const TeacherCoursesList = lazy(() => import("@/features/teacher/courses/TeacherCoursesList"));
const CourseEditor = lazy(() => import("@/features/teacher/courses/CourseEditor"));
const TeacherProfile = lazy(() => import("@/features/teacher/profile/TeacherProfile"));

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* ===== PUBLIC WEBSITE ===== */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/courses" element={<CourseList />} />
                    <Route path="/courses/:courseId" element={<CourseDetail />} />
                    <Route path="/lecturer" element={<LecturerPage />} />
                    <Route path="/contact" element={<ContactPage />} />

                    {/* ===== AUTH ===== */}
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/login" element={<Login />} />

                    <Route
                        path="/checkout"
                        element={
                            <ProtectedRoute>
                                <Checkout />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/checkout/payment"
                        element={
                            <ProtectedRoute>
                                <CheckoutPayment />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/checkout/result"
                        element={
                            <ProtectedRoute>
                                <CheckoutResult />
                            </ProtectedRoute>
                        }
                    />
                </Route>

                {/* ===== STUDENT (PRIVATE) ===== */}
                <Route
                    path="/student"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                            <StudentLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="my-courses" element={<MyCourses />} />
                    <Route path="learning-profile" element={<LearningProfile />} />
                    <Route path="test-practice" element={<TestPractice />} />
                    <Route path="quiz/course/:courseId" element={<QuizAttempt />} />
                </Route>

                {/* Lesson Player (Phase 35) — layout riêng (LessonPlayerLayout), KHÔNG lồng trong
                    StudentLayout/AppShellLayout (sidebar toàn cục ẩn theo UI_SPEC §3.3). Không có
                    layout Outlet nào bọc sẵn Suspense cho route này nên tự bọc riêng ở đây. */}
                <Route
                    path="/student/learn/:courseId"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                            <Suspense fallback={<PageLoadingFallback />}>
                                <LessonPlayer />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                {/* ===== ADMIN (PRIVATE) ===== */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsersList />} />
                    <Route path="courses" element={<AdminCourses />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="refunds" element={<AdminRefunds />} />
                    <Route path="audit-log" element={<AdminAuditLog />} />
                    <Route path="profile" element={<AdminProfile />} />
                </Route>

                {/* ===== TEACHER (PRIVATE) ===== */}
                <Route
                    path="/teacher"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
                            <TeacherLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<TeacherDashboard />} />
                    <Route path="courses" element={<TeacherCoursesList />} />
                    <Route path="courses/new" element={<CourseEditor />} />
                    <Route path="courses/:courseId/edit" element={<CourseEditor />} />
                    <Route path="profile" element={<TeacherProfile />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;
