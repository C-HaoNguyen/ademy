const LearningProfile = () => {
    return (
        <div>
            <h1 className="text-2xl font-semibold mb-6">
                Hồ sơ học tập
            </h1>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border">
                    <h3 className="font-semibold mb-2">
                        Trình độ hiện tại
                    </h3>
                    <ul className="text-gray-600 space-y-1">
                        <li>Listening: Entry</li>
                        <li>Reading: Entry</li>
                        <li>Speaking: -</li>
                        <li>Writing: -</li>
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-xl border">
                    <h3 className="font-semibold mb-2">
                        Mục tiêu
                    </h3>
                    <p className="text-gray-600">
                        Hoàn thành lộ trình TOEIC 700+
                    </p>
                </div>
            </div>

            <div className="mt-6 bg-white p-6 rounded-xl border">
                <h3 className="font-semibold mb-3">
                    Thống kê học tập
                </h3>

                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xl font-bold text-blue-600">0</p>
                        <p className="text-gray-500 text-sm">Phút học</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-green-600">0</p>
                        <p className="text-gray-500 text-sm">Bài học</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-orange-600">0</p>
                        <p className="text-gray-500 text-sm">Bài test</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearningProfile;