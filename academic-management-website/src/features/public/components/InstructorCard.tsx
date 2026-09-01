import { motion } from "framer-motion";
import Card from "@/shared/ui/Card";

export type Instructor = {
    username: string;
    fullName: string;
    courseCount: number;
};

type InstructorCardProps = {
    instructor: Instructor;
    index?: number;
    onClick?: () => void;
};

const InstructorCard = ({ instructor, index = 0, onClick }: InstructorCardProps) => {
    const initials = instructor.fullName
        .split(" ")
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
        >
            <Card
                variant="marketing"
                className="text-center cursor-pointer transition-shadow hover:shadow-elevated"
            >
                <button type="button" onClick={onClick} className="w-full cursor-pointer">
                    <div
                        className="w-20 h-20 rounded-radius-full mx-auto flex items-center justify-center bg-surface-brand-muted text-brand text-h3"
                        aria-hidden="true"
                    >
                        {initials || instructor.fullName.slice(0, 2).toUpperCase()}
                    </div>

                    <h3 className="mt-4 text-h4 text-primary">
                        {instructor.fullName}
                    </h3>

                    <p className="mt-1 text-body-sm text-brand">
                        {instructor.courseCount} khóa học đang dạy
                    </p>
                </button>
            </Card>
        </motion.div>
    );
};

export default InstructorCard;
