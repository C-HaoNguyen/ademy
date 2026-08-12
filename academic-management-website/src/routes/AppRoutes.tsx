import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { ROLES } from "@/config/constants";

import HomePage from "@/pages/public/home/HomePage";
import LecturerPage from "@/pages/public/lecturer/LecturerPage";
import ContactPage from "@/pages/public/about/ContactPage";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import CourseList from "@/pages/public/courses/CourseListPage";
import CourseDetail from "@/pages/public/courses/CourseDetailPage";
import Checkout from "@/pages/public/payment/Checkout";

import PublicLayout from "@/components/public/PublicLayout";
import StudentLayout from "@/components/student/StudentLayout";
import AdminLayout from "@/components/admin/AdminLayout";

import Dashboard from "@/pages/student/dashboard/Dashboard";
import MyCourses from "@/pages/student/my-courses/MyCourses";
import LearningProfile from "@/pages/student/learning-profile/LearningProgress";
import TestPractice from "@/pages/student/test-practice/TestPractice";
import Profile from "@/pages/student/profile/Profile";

import AdminDashboard from "@/pages/admin/dashboard/AdminDashboard";
import AdminUsersList from "@/pages/admin/users/AdminUsersList";
import AdminCourses from "@/pages/admin/courses/AdminCourses";
import AdminCategories from "@/pages/admin/categories/AdminCategories";
import AdminOrders from "@/pages/admin/orders/AdminOrders";

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* ===== AUTH ===== */}
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />

                {/* ===== PUBLIC WEBSITE ===== */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/courses" element={<CourseList />} />
                    <Route path="/courses/:courseId" element={<CourseDetail />} />
                    <Route path="/lecturer" element={<LecturerPage />} />
                    <Route path="/contact" element={<ContactPage />} />

                    <Route
                        path="/checkout"
                        element={
                            <ProtectedRoute>
                                <Checkout />
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
                </Route>

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
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;
