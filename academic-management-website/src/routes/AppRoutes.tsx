import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { ROLES } from "@/config/constants";

import HomePage from "@/features/public/home/HomePage";
import LecturerPage from "@/features/public/lecturer/LecturerPage";
import ContactPage from "@/features/public/about/ContactPage";
import Login from "@/features/auth/Login";
import Signup from "@/features/auth/Signup";
import CourseList from "@/features/courses/CourseListPage";
import CourseDetail from "@/features/courses/CourseDetailPage";
import Checkout from "@/features/payment/Checkout";

import PublicLayout from "@/features/public/components/PublicLayout";
import StudentLayout from "@/features/student/components/StudentLayout";
import AdminLayout from "@/features/admin/components/AdminLayout";

import Dashboard from "@/features/student/dashboard/Dashboard";
import MyCourses from "@/features/student/my-courses/MyCourses";
import LearningProfile from "@/features/student/learning-profile/LearningProfile";
import TestPractice from "@/features/student/test-practice/TestPractice";
import Profile from "@/features/student/profile/Profile";

import AdminDashboard from "@/features/admin/dashboard/AdminDashboard";
import AdminUsersList from "@/features/admin/users/AdminUsersList";
import AdminCourses from "@/features/admin/courses/AdminCourses";
import AdminCategories from "@/features/admin/categories/AdminCategories";
import AdminOrders from "@/features/admin/orders/AdminOrders";

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
