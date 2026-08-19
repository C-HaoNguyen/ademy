import { motion } from "framer-motion";

const ContactPage = () => {
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
                        Liên hệ với chúng tôi
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
                    >
                        Có câu hỏi hoặc cần hỗ trợ? Đội ngũ Ademy luôn sẵn sàng
                        lắng nghe và đồng hành cùng bạn.
                    </motion.p>
                </div>
            </section>

            {/* CONTACT CONTENT */}
            <section className="pb-20">
                <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-2 gap-12">

                    {/* INFO */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-2xl font-semibold text-gray-900">
                            Thông tin liên hệ
                        </h2>

                        <p className="mt-4 text-gray-600">
                            Nếu bạn cần tư vấn khóa học, hỗ trợ kỹ thuật
                            hoặc hợp tác, hãy liên hệ với chúng tôi qua
                            các kênh sau.
                        </p>

                        <div className="mt-8 space-y-4 text-gray-700">
                            <div>
                                <span className="font-medium">📍 Địa chỉ:</span>{" "}
                                123 Nguyễn Văn Cừ, TP. Hồ Chí Minh
                            </div>
                            <div>
                                <span className="font-medium">📧 Email:</span>{" "}
                                support@ademy.edu.vn
                            </div>
                            <div>
                                <span className="font-medium">📞 Hotline:</span>{" "}
                                0123 456 789
                            </div>
                        </div>
                    </motion.div>

                    {/* FORM */}
                    <motion.form
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="bg-white p-8 rounded-2xl shadow-sm"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <h3 className="text-xl font-semibold text-gray-900">
                            Gửi tin nhắn cho chúng tôi
                        </h3>

                        <div className="mt-6 space-y-4">
                            <input
                                type="text"
                                placeholder="Họ và tên"
                                className="w-full px-4 py-3 border rounded-xl
                                           focus:outline-none focus:ring-2
                                           focus:ring-blue-500"
                            />

                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full px-4 py-3 border rounded-xl
                                           focus:outline-none focus:ring-2
                                           focus:ring-blue-500"
                            />

                            <textarea
                                rows={4}
                                placeholder="Nội dung liên hệ"
                                className="w-full px-4 py-3 border rounded-xl
                                           focus:outline-none focus:ring-2
                                           focus:ring-blue-500 resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            className="mt-6 w-full px-6 py-3 rounded-xl
                                       bg-blue-600 text-white font-medium
                                       hover:bg-blue-700 transition"
                        >
                            Gửi liên hệ
                        </button>
                    </motion.form>

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
                        Sẵn sàng bắt đầu học tập cùng Ademy?
                    </h2>
                    <p className="mt-4 text-gray-600">
                        Đăng ký tài khoản để trải nghiệm hệ thống học tập
                        và quản lý khóa học toàn diện.
                    </p>
                    <button
                        className="mt-8 px-8 py-3 rounded-xl bg-blue-600
                                   text-white font-medium
                                   hover:bg-blue-700 transition shadow-sm"
                    >
                        Đăng ký ngay
                    </button>
                </motion.div>
            </section>

        </div>
    );
};

export default ContactPage;