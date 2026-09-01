import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { User } from "lucide-react";
import Card from "@/shared/ui/Card";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";

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
        >
            <Card variant="marketing" padding="p-0" className="overflow-hidden h-full flex flex-col">
                {/* Thumbnail */}
                <div className="h-44 overflow-hidden">
                    <img
                        src={course.thumbnail || "/default-course.png"}
                        alt={course.title}
                        className="h-full w-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-h4 text-primary mb-1 line-clamp-2">
                        {course.title}
                    </h3>

                    <p className="inline-flex items-center gap-1.5 text-body-sm text-tertiary mb-2">
                        <User size={14} aria-hidden="true" />
                        Giảng viên: {course.instructor?.fullName || "Đang cập nhật"}
                    </p>

                    {course.category?.categoryName && (
                        <div className="mb-3">
                            <Badge variant="neutral">{course.category.categoryName}</Badge>
                        </div>
                    )}

                    {course.description && (
                        <p className="text-body-sm text-secondary line-clamp-2 mb-4">
                            {course.description}
                        </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-h4 text-brand">
                            {course.price && course.price > 0
                                ? `${course.price.toLocaleString()}₫`
                                : "Miễn phí"}
                        </span>

                        <Link to={`/courses/${course.courseId}`}>
                            <Button variant="primary" size="sm">
                                Xem chi tiết
                            </Button>
                        </Link>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

export default CourseCard;
