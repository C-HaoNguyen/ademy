import { motion } from "framer-motion";

export type Teacher = {
    name: string;
    role: string;
    desc: string;
    avatar: string;
};

type TeacherCardProps = {
    teacher: Teacher;
    index?: number;
};

const TeacherCard = ({ teacher, index = 0 }: TeacherCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="
                bg-white rounded-2xl p-6
                shadow-sm hover:shadow-lg
                transition-all duration-300
                text-center
            "
        >
            <img
                src={teacher.avatar}
                alt={teacher.name}
                className="w-24 h-24 rounded-full mx-auto object-cover"
            />

            <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {teacher.name}
            </h3>

            <p className="mt-1 text-blue-600 text-sm font-medium">
                {teacher.role}
            </p>

            <p className="mt-3 text-sm text-gray-600">
                {teacher.desc}
            </p>
        </motion.div>
    );
};

export default TeacherCard;
