import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import TeacherCard, { type Teacher } from "../../../components/public/TeacherCard";

const lecturers: Teacher[] = [
    {
        name: "Nguyễn Văn A",
        role: "Giảng viên Front-end",
        desc: "5+ năm kinh nghiệm React, UI/UX và Web hiện đại.",
        avatar: "https://i.pravatar.cc/150?img=12",
    },
    {
        name: "Trần Thị B",
        role: "Giảng viên Back-end",
        desc: "Chuyên Java, Spring Boot và kiến trúc hệ thống.",
        avatar: "https://i.pravatar.cc/150?img=32",
    },
    {
        name: "Lê Văn C",
        role: "Giảng viên Data & AI",
        desc: "Dữ liệu, Machine Learning và ứng dụng AI thực tế.",
        avatar: "https://i.pravatar.cc/150?img=45",
    },
    {
        name: "Phạm Thị D",
        role: "Giảng viên Mobile",
        desc: "React Native, Flutter và ứng dụng đa nền tảng.",
        avatar: "https://i.pravatar.cc/150?img=56",
    },
];

const LecturerPage = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-gray-50">
            {/* HERO */}
            <section className="pt-24 pb-16">
                <div className="mx-auto max-w-7xl px-6 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl md:text-5xl font-bold text-gray-900"
                    >
                        Đội ngũ giảng viên
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
                    >
                        Những chuyên gia giàu kinh nghiệm, tận tâm đồng hành cùng bạn
                        trong hành trình học tập và phát triển.
                    </motion.p>
                </div>
            </section>

            {/* LECTURER LIST */}
            <section className="pb-20">
                <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    {lecturers.map((lec, index) => (
                        <TeacherCard
                            key={lec.name}
                            teacher={lec}
                            index={index}
                        />
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-white">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-3xl px-6 text-center"
                >
                    <h2 className="text-3xl font-bold text-gray-900">
                        Học cùng giảng viên hàng đầu
                    </h2>
                    <p className="mt-4 text-gray-600">
                        Khám phá các khóa học được thiết kế bài bản bởi đội ngũ giảng viên
                        giàu kinh nghiệm của Ademy.
                    </p>
                    <button
                        onClick={() => navigate("/courses")}
                        className="mt-8 px-8 py-3 rounded-xl bg-blue-600
                                   text-white font-medium
                                   hover:bg-blue-700 transition shadow-sm"
                    >
                        Xem khóa học
                    </button>
                </motion.div>
            </section>
        </div>
    );
};

export default LecturerPage;
