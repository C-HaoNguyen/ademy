type EditUserProps = {
    show: boolean;
    editUser: {
        fullName: string;
        email: string;
        role: string;
    };
    setEditUser: React.Dispatch<
        React.SetStateAction<{
            fullName: string;
            email: string;
            role: string;
        }>
    >;
    onClose: () => void;
    onSubmit: () => void;
};

const EditUserOverlay = ({
    show,
    editUser,
    setEditUser,
    onClose,
    onSubmit,
}: EditUserProps) => {
    if (!show) return null;

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm
                       flex items-center justify-center z-50 animate-overlayFade"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-card shadow-xl w-[500px] p-6 animate-modalPop"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-semibold text-primary mb-6">
                    Sửa người dùng
                </h2>

                <div className="space-y-4 text-sm">
                    <div>
                        <label className="block mb-1 text-slate-600 font-medium">
                            Họ và tên
                        </label>
                        <input
                            type="text"
                            value={editUser.fullName}
                            onChange={(e) =>
                                setEditUser({ ...editUser, fullName: e.target.value })
                            }
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300
                                       focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors duration-200"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-slate-600 font-medium">
                            Email
                        </label>
                        <input
                            type="email"
                            value={editUser.email}
                            onChange={(e) =>
                                setEditUser({ ...editUser, email: e.target.value })
                            }
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300
                                       focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors duration-200"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-slate-600 font-medium">
                            Quyền
                        </label>
                        <select
                            value={editUser.role}
                            onChange={(e) =>
                                setEditUser({ ...editUser, role: e.target.value })
                            }
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white
                                       focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors duration-200"
                        >
                            <option value="STUDENT">STUDENT</option>
                            <option value="INSTRUCTOR">INSTRUCTOR</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-5 mt-6 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600
                                   hover:bg-slate-50 transition-colors duration-200"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        className="cursor-pointer px-5 py-2.5 rounded-lg bg-primary text-white
                                   hover:bg-primary-dark transition-colors duration-200"
                    >
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditUserOverlay;
