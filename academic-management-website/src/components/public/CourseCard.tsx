import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export type Course = {
    courseId: number;
    title: string;
    description?: string | null;
    price?: number | null;
    thumbnail?: string | null;
    level?: string | null;
    instructor?: {
        username?: string;
        fullName?: string;
    };
    category?: {
        categoryId?: number;
        categoryName?: string;
    };
};

type CourseCardProps = {
    course: Course;
    index?: number;
};

const CourseCard = ({ course, index = 0 }: CourseCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -6 }}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden"
        >
            {/* Thumbnail */}
            <div className="h-44 overflow-hidden">
                <img
                    src={course.thumbnail || "/default-course.png"}
                    alt={course.title}
                    className="h-full w-full object-cover hover:scale-105 transition duration-300"
                />
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                    {course.title}
                </h3>

                <p className="text-sm text-gray-500 mb-2">
                    Giảng viên: {course.instructor?.fullName || "Đang cập nhật"}
                </p>

                {course.category && (
                    <span className="inline-block mb-3 px-3 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-full">
                        {course.category?.categoryName}
                    </span>
                )}

                {course.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {course.description}
                    </p>
                )}

                <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-indigo-600">
                        {course.price && course.price >0
                            ? `${course.price.toLocaleString()}₫`
                            : "Miễn phí"}
                    </span>

                    <Link to={`/courses/${course.courseId}`}>
                        <button
                            className="rounded-xl bg-blue-600 text-white px-4 py-2
                                       hover:bg-blue-700 transition font-medium text-sm"
                        >
                            Xem chi tiết
                        </button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default CourseCard;