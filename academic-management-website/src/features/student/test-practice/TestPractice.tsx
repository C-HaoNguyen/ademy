const TestPractice = () => {
    return (
        <div>
            <h1 className="text-2xl font-semibold mb-2">
                Luyện đề
            </h1>
            <p className="text-gray-600 mb-6">
                Luyện tập các đề thi theo cấp độ
            </p>

            <div className="grid grid-cols-3 gap-6">
                {["TOEIC Mini Test", "TOEIC Full Test", "Listening Practice"].map(
                    (test, index) => (
                        <div
                            key={index}
                            className="bg-white border rounded-xl p-6 hover:shadow-md transition"
                        >
                            <h3 className="font-semibold mb-2">{test}</h3>
                            <p className="text-gray-500 text-sm mb-4">
                                Thời gian: 30 – 120 phút
                            </p>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                                Bắt đầu
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default TestPractice;
