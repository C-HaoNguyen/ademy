import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CourseCard from "./components/CourseCard";
import { getAccessToken } from "../../utils/AuthUtils";
import { API_URL } from "@/config/constants";
import { SkeletonCardGrid } from "@/shared/ui/Skeleton";
import EmptyState from "@/shared/ui/EmptyState";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search, SearchX } from "lucide-react";

const toggleValue = (
    value: string,
    _list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
) => {
    setList((prev) =>
        prev.includes(value)
            ? prev.filter((item) => item !== value)
            : [...prev, value]
    );
};

type Course = {
    courseId: number;
    title: string;
    description?: string;
    price?: number;
    thumbnail?: string;
    level?: string;
    instructor?: {
        username?: string;
        fullName?: string;
    };
    category?: {
        categoryId: number;
        categoryName?: string;
    };
};

type RawCourse = {
    courseId: number;
    title: string;
    description?: string;
    price?: number;
    thumbnail?: string;
    level?: string;
    instructor?: {
        username?: string;
        fullName?: string;
    };
    category?: {
        categoryId: number;
        categoryName?: string;
    };
};

const CourseList = () => {

    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [filterValue, setFilterValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const ITEMS_PER_PAGE = 9;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE));
    const paginatedCourses = filteredCourses.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
    const [levelOptions, setLevelOptions] = useState<string[]>([]);
    type DropdownType = "category" | "level" | null;
    const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [levels, setLevels] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<"popular" | "newest" | "price-asc" | "price-desc">("popular");

    useEffect(() => {
        fetchCategories();
        refreshCourseList();
    }, []);

    useEffect(() => {
        let result = [...allCourses];

        // Search
        if (filterValue.trim()) {
            const keyword = filterValue.toLowerCase();
            result = result.filter((c) =>
                c.title.toLowerCase().includes(keyword) ||
                c.description?.toLowerCase().includes(keyword) ||
                c.instructor?.fullName?.toLowerCase().includes(keyword)
            );
        }

        // Category
        if (categories.length > 0) {
            result = result.filter(
                (c) =>
                    c.category?.categoryName &&
                    categories.includes(c.category.categoryName)
            );
        }

        // Level
        if (levels.length > 0) {
            result = result.filter(
                (c) =>
                    c.level &&
                    levels.includes(c.level)
            );
        }

        // Sort
        if (sortBy === "newest") {
            result = [...result].sort((a, b) => b.courseId - a.courseId);
        } else if (sortBy === "price-asc") {
            result = [...result].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        } else if (sortBy === "price-desc") {
            result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        }

        setFilteredCourses(result);
        setCurrentPage(1);
    }, [filterValue, categories, levels, allCourses, sortBy]);

    async function fetchCategories() {
        try {
            const token = getAccessToken();

            const res = await fetch(`${API_URL}/admin/categories`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) return;

            const data: { categoryName?: string }[] = await res.json();
            const names: string[] = data
                .map((item) => item.categoryName?.toLowerCase())
                .filter((name): name is string => typeof name === "string");

            setCategoryOptions((prev) => Array.from(new Set([...prev, ...names])));
        } catch (err) {
            console.error("Failed to load categories", err);
        }
    }

    async function refreshCourseList() {
        setLoading(true);
        setLoadError(false);
        try {
            const response = await fetch(`${API_URL}/courses`, {
                headers: {
                    Authorization: `Bearer ${getAccessToken()}`,
                },
            });

            if (!response.ok) {
                setLoadError(true);
                return;
            }

            const data: RawCourse[] = await response.json();
            const mappedCourses: Course[] = data.map((item) => ({
                courseId: item.courseId,
                title: item.title,
                description: item.description,
                price: item.price,
                thumbnail: item.thumbnail,
                level: item.level,
                instructor: {
                    username: item.instructor?.username,
                    fullName: item.instructor?.fullName,
                },
                category: item.category
                    ? {
                        categoryId: item.category.categoryId,
                        categoryName: item.category.categoryName?.toLowerCase(),
                    }
                    : undefined,
            }));
            const sortedCourses = [...mappedCourses].sort((a, b) =>
                a.title.localeCompare(b.title)
            );
            const derivedCategories = Array.from(
                new Set(
                    mappedCourses
                        .map((c) => c.category?.categoryName)
                        .filter((name): name is string => typeof name === "string")
                )
            );
            const derivedLevels = Array.from(
                new Set(
                    mappedCourses
                        .map((c) => c.level)
                        .filter((level): level is string => typeof level === "string")
                )
            );
            setAllCourses(sortedCourses);
            setFilteredCourses(sortedCourses);
            setCategoryOptions((prev) => Array.from(new Set([...prev, ...derivedCategories])));
            setLevelOptions(derivedLevels);
        } catch (err) {
            console.error("Failed to load courses", err);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    }

    const clearFilters = () => {
        setFilterValue("");
        setCategories([]);
        setLevels([]);
    };

    const hasActiveFilters = filterValue.trim() !== "" || categories.length > 0 || levels.length > 0;

    return (
        <div className="min-h-screen bg-surface px-6 py-12">
            {/* ===== Hero Section ===== */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-6xl mx-auto mb-10"
            >
                <h1 className="text-4xl font-bold text-primary mb-3">
                    Khám phá khóa học của chúng tôi!
                </h1>
                <p className="text-slate-600 text-lg">
                    Học hỏi kỹ năng mới, nâng cấp bản thân và phát triển sự nghiệp
                </p>
            </motion.div>

            {/* ===== Filter Bar ===== */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-6xl mx-auto mb-8 flex flex-wrap md:flex-nowrap items-center justify-between gap-4"
            >
                {/* ===== Search (LEFT) ===== */}
                <div className="w-full md:max-w-md relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm khóa học..."
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 pl-11 pr-5 py-3
                                    focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-200"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4 justify-end">
                    {/* Label */}
                    <div className="flex items-center text-sm text-slate-600">
                        Lọc:
                    </div>

                    {/* ===== Category Multi Select ===== */}
                    <div className="relative w-56">
                        <button
                            type="button"
                            onClick={() =>
                                setActiveDropdown(
                                    activeDropdown === "category" ? null : "category"
                                )
                            }
                            className="cursor-pointer flex min-h-[40px] w-full flex-wrap items-center gap-2
                                    rounded-xl border border-slate-200 bg-white
                                    px-3 py-2 text-sm text-slate-700
                                    hover:bg-slate-50 transition-colors duration-200"
                        >
                            {categories.length === 0 ? (
                                <span className="text-slate-400">Phân loại</span>
                            ) : (
                                categories.map((item) => (
                                    <span
                                        key={item}
                                        className="rounded-lg bg-primary/10 px-2 py-1
                                   text-xs text-primary"
                                    >
                                        {item}
                                    </span>
                                ))
                            )}
                            <ChevronDown className="ml-auto text-slate-400" size={16} aria-hidden="true" />
                        </button>

                        {activeDropdown === "category" && (
                            <ul className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                                {categoryOptions.length === 0 ? (
                                    <li className="px-4 py-2 text-sm text-slate-400">Không có danh mục</li>
                                ) : (
                                    categoryOptions.map((item) => {
                                        const active = categories.includes(item);
                                        return (
                                            <li
                                                key={item}
                                                onClick={() =>
                                                    toggleValue(item, categories, setCategories)
                                                }
                                                className={`flex cursor-pointer items-center justify-between
                                        px-4 py-2 text-sm transition-colors duration-200
                                        ${active
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {item}
                                                {active && <Check size={14} aria-hidden="true" />}
                                            </li>
                                        );
                                    })
                                )}
                            </ul>
                        )}
                    </div>

                    {/* ===== Level Multi Select ===== */}
                    <div className="relative w-56">
                        <button
                            type="button"
                            onClick={() =>
                                setActiveDropdown(
                                    activeDropdown === "level" ? null : "level"
                                )
                            }
                            className="cursor-pointer flex min-h-[40px] w-full flex-wrap items-center gap-2
                                    rounded-xl border border-slate-200 bg-white
                                    px-3 py-2 text-sm text-slate-700
                                    hover:bg-slate-50 transition-colors duration-200"
                        >
                            {levels.length === 0 ? (
                                <span className="text-slate-400">Trình độ</span>
                            ) : (
                                levels.map((item) => (
                                    <span
                                        key={item}
                                        className="rounded-lg bg-primary-light/10 px-2 py-1
                                   text-xs text-primary-dark"
                                    >
                                        {item}
                                    </span>
                                ))
                            )}
                            <ChevronDown className="ml-auto text-slate-400" size={16} aria-hidden="true" />
                        </button>

                        {activeDropdown === "level" && (
                            <ul className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                                {levelOptions.length === 0 ? (
                                    <li className="px-4 py-2 text-sm text-slate-400">Không có trình độ</li>
                                ) : (
                                    levelOptions.map((item) => {
                                        const active = levels.includes(item);
                                        return (
                                            <li
                                                key={item}
                                                onClick={() =>
                                                    toggleValue(item, levels, setLevels)
                                                }
                                                className={`flex cursor-pointer items-center justify-between
                                        px-4 py-2 text-sm transition-colors duration-200
                                        ${active
                                                        ? "bg-primary-light/10 text-primary-dark"
                                                        : "text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {item}
                                                {active && <Check size={14} aria-hidden="true" />}
                                            </li>
                                        );
                                    })
                                )}
                            </ul>
                        )}
                    </div>

                    {/* ===== Sort ===== */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            className="appearance-none cursor-pointer rounded-xl border border-slate-200 bg-white
                                        px-3 py-2 pr-10 text-sm text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20
                                        hover:bg-slate-50 transition-colors duration-200"
                        >
                            <option value="popular">Phổ biến nhất</option>
                            <option value="newest">Mới nhất</option>
                            <option value="price-asc">Giá tăng dần</option>
                            <option value="price-desc">Giá giảm dần</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
                    </div>
                </div>
            </motion.div>

            {/* ===== Course Grid ===== */}
            <div className="max-w-6xl mx-auto">
                {loading ? (
                    <SkeletonCardGrid count={9} />
                ) : loadError ? (
                    <EmptyState
                        icon={SearchX}
                        title="Không thể tải danh sách khóa học"
                        description="Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại."
                        action={
                            <button
                                type="button"
                                onClick={refreshCourseList}
                                className="cursor-pointer px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors duration-200"
                            >
                                Thử lại
                            </button>
                        }
                    />
                ) : filteredCourses.length === 0 ? (
                    <EmptyState
                        icon={SearchX}
                        title="Không tìm thấy khóa học phù hợp"
                        description="Hãy thử điều chỉnh từ khóa hoặc bộ lọc để xem thêm kết quả."
                        action={
                            hasActiveFilters ? (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="cursor-pointer px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors duration-200"
                                >
                                    Xóa bộ lọc
                                </button>
                            ) : undefined
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {paginatedCourses.map((course, index) => (
                            <CourseCard
                                key={course.courseId}
                                course={course}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ===== Pagination ===== */}
            {!loading && !loadError && filteredCourses.length > 0 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                    {/* Prev */}
                    <button
                        type="button"
                        aria-label="Trang trước"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200
            ${currentPage === 1
                                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                : "cursor-pointer bg-white border border-slate-300 hover:bg-slate-50"
                            }`}
                    >
                        <ChevronLeft size={16} aria-hidden="true" />
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }).map((_, i) => {
                        const page = i + 1;
                        const active = page === currentPage;

                        return (
                            <button
                                type="button"
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200
                    ${active
                                        ? "bg-primary text-white"
                                        : "bg-white border border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                {page}
                            </button>
                        );
                    })}

                    {/* Next */}
                    <button
                        type="button"
                        aria-label="Trang sau"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200
            ${currentPage === totalPages
                                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                : "cursor-pointer bg-white border border-slate-300 hover:bg-slate-50"
                            }`}
                    >
                        <ChevronRight size={16} aria-hidden="true" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default CourseList;
