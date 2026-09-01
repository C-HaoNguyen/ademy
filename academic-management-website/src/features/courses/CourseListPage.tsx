import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import CourseCard from "./components/CourseCard";
import { useCoursesQuery, type RawCourse } from "@/shared/api/queries/useCoursesQuery";
import { useCategoriesQuery } from "@/shared/api/queries/useCategoriesQuery";
import { SkeletonCardGrid } from "@/shared/ui/Skeleton";
import EmptyState from "@/shared/ui/EmptyState";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { UI } from "@/config/constants";
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

// Backend trả level dạng lowercase enum (CourseLevel.toValue()); map sang nhãn hiển thị
// tiếng Việt cho nhất quán với phần còn lại của UI.
const LEVEL_LABELS: Record<string, string> = {
    beginner: "Cơ bản",
    intermediate: "Trung cấp",
    advanced: "Nâng cao",
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

function mapCourse(item: RawCourse): Course {
    return {
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
    };
}

const CourseList = () => {
    const [searchParams] = useSearchParams();
    const instructorParam = searchParams.get("instructor");

    const coursesQuery = useCoursesQuery();
    const categoriesQuery = useCategoriesQuery();

    const allCourses = useMemo<Course[]>(() => {
        const data = coursesQuery.data ?? [];
        return [...data.map(mapCourse)].sort((a, b) => a.title.localeCompare(b.title));
    }, [coursesQuery.data]);

    const categoryOptions = useMemo<string[]>(() => {
        const fromCategoriesEndpoint = (categoriesQuery.data ?? [])
            .map((item) => item.categoryName?.toLowerCase())
            .filter((name): name is string => typeof name === "string");
        const derivedFromCourses = allCourses
            .map((c) => c.category?.categoryName)
            .filter((name): name is string => typeof name === "string");
        return Array.from(new Set([...fromCategoriesEndpoint, ...derivedFromCourses]));
    }, [categoriesQuery.data, allCourses]);

    const levelOptions = useMemo<string[]>(() => {
        return Array.from(
            new Set(
                allCourses
                    .map((c) => c.level)
                    .filter((level): level is string => typeof level === "string")
            )
        );
    }, [allCourses]);

    const loading = coursesQuery.isLoading;
    const loadError = coursesQuery.isError;

    const [searchInput, setSearchInput] = useState("");
    const [filterValue, setFilterValue] = useState("");
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(filteredCourses.length / UI.DEFAULT_PAGE_SIZE));
    const paginatedCourses = filteredCourses.slice(
        (currentPage - 1) * UI.DEFAULT_PAGE_SIZE,
        currentPage * UI.DEFAULT_PAGE_SIZE
    );

    type DropdownType = "category" | "level" | null;
    const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [levels, setLevels] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<"popular" | "newest" | "price-asc" | "price-desc">("popular");

    // Debounce search input theo UI.SEARCH_DEBOUNCE (§2.2)
    useEffect(() => {
        const timer = setTimeout(() => setFilterValue(searchInput), UI.SEARCH_DEBOUNCE);
        return () => clearTimeout(timer);
    }, [searchInput]);

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

        // Instructor (từ link "Xem khóa học" của LecturerPage, §2.4)
        if (instructorParam) {
            result = result.filter((c) => c.instructor?.username === instructorParam);
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
    }, [filterValue, instructorParam, categories, levels, allCourses, sortBy]);

    const clearFilters = () => {
        setSearchInput("");
        setFilterValue("");
        setCategories([]);
        setLevels([]);
    };

    const hasActiveFilters = filterValue.trim() !== "" || categories.length > 0 || levels.length > 0;

    return (
        <div className="min-h-screen bg-background px-6 py-12">
            {/* ===== Hero Section ===== */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-6xl mx-auto mb-10"
            >
                <h1 className="text-h1 text-brand mb-3">
                    Khám phá khóa học của chúng tôi!
                </h1>
                <p className="text-body-lg text-secondary">
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
                    <label htmlFor="course-search" className="sr-only">
                        Tìm kiếm khóa học
                    </label>
                    <Search
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-placeholder"
                        size={18}
                        aria-hidden="true"
                    />
                    <Input
                        id="course-search"
                        type="text"
                        placeholder="Tìm kiếm khóa học..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-11"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4 justify-end">
                    {/* Label */}
                    <div className="flex items-center text-body-sm text-secondary">
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
                                    rounded-radius-md border border-default bg-surface
                                    px-3 py-2 text-body-sm text-secondary
                                    hover:bg-surface-muted transition-colors duration-200"
                        >
                            {categories.length === 0 ? (
                                <span className="text-placeholder">Phân loại</span>
                            ) : (
                                categories.map((item) => (
                                    <span
                                        key={item}
                                        className="rounded-radius-full bg-surface-brand-muted px-2 py-1
                                   text-xs text-brand"
                                    >
                                        {item}
                                    </span>
                                ))
                            )}
                            <ChevronDown className="ml-auto text-placeholder" size={16} aria-hidden="true" />
                        </button>

                        {activeDropdown === "category" && (
                            <ul className="absolute z-dropdown mt-2 w-full rounded-radius-md border border-default bg-surface shadow-elevated overflow-hidden">
                                {categoryOptions.length === 0 ? (
                                    <li className="px-4 py-2 text-body-sm text-placeholder">Không có danh mục</li>
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
                                        px-4 py-2 text-body-sm transition-colors duration-200
                                        ${active
                                                        ? "bg-surface-brand-muted text-brand"
                                                        : "text-secondary hover:bg-surface-muted"
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
                                    rounded-radius-md border border-default bg-surface
                                    px-3 py-2 text-body-sm text-secondary
                                    hover:bg-surface-muted transition-colors duration-200"
                        >
                            {levels.length === 0 ? (
                                <span className="text-placeholder">Trình độ</span>
                            ) : (
                                levels.map((item) => (
                                    <span
                                        key={item}
                                        className="rounded-radius-full bg-surface-brand-muted px-2 py-1
                                   text-xs text-brand"
                                    >
                                        {LEVEL_LABELS[item] ?? item}
                                    </span>
                                ))
                            )}
                            <ChevronDown className="ml-auto text-placeholder" size={16} aria-hidden="true" />
                        </button>

                        {activeDropdown === "level" && (
                            <ul className="absolute z-dropdown mt-2 w-full rounded-radius-md border border-default bg-surface shadow-elevated overflow-hidden">
                                {levelOptions.length === 0 ? (
                                    <li className="px-4 py-2 text-body-sm text-placeholder">Không có trình độ</li>
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
                                        px-4 py-2 text-body-sm transition-colors duration-200
                                        ${active
                                                        ? "bg-surface-brand-muted text-brand"
                                                        : "text-secondary hover:bg-surface-muted"
                                                    }`}
                                            >
                                                {LEVEL_LABELS[item] ?? item}
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
                            className="appearance-none cursor-pointer rounded-radius-md border border-default bg-surface
                                        px-3 py-2 pr-10 text-body-sm text-secondary focus:border-brand focus:ring-2 focus:ring-focus
                                        hover:bg-surface-muted transition-colors duration-200"
                        >
                            <option value="popular">Phổ biến nhất</option>
                            <option value="newest">Mới nhất</option>
                            <option value="price-asc">Giá tăng dần</option>
                            <option value="price-desc">Giá giảm dần</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-placeholder" size={16} aria-hidden="true" />
                    </div>
                </div>
            </motion.div>

            {/* ===== Course Grid ===== */}
            <div className="max-w-6xl mx-auto" aria-live="polite">
                {loading ? (
                    <SkeletonCardGrid count={UI.DEFAULT_PAGE_SIZE} />
                ) : loadError ? (
                    <EmptyState
                        icon={SearchX}
                        title="Không thể tải danh sách khóa học"
                        description="Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại."
                        action={
                            <Button variant="primary" size="sm" onClick={() => coursesQuery.refetch()}>
                                Thử lại
                            </Button>
                        }
                    />
                ) : filteredCourses.length === 0 ? (
                    <EmptyState
                        icon={SearchX}
                        title="Không tìm thấy khóa học phù hợp"
                        description="Hãy thử điều chỉnh từ khóa hoặc bộ lọc để xem thêm kết quả."
                        action={
                            hasActiveFilters ? (
                                <Button variant="primary" size="sm" onClick={clearFilters}>
                                    Xóa bộ lọc
                                </Button>
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
                        className={`rounded-radius-md px-3 py-2 text-body-sm font-medium transition-colors duration-200
            ${currentPage === 1
                                ? "cursor-not-allowed bg-action-disabled-bg text-action-disabled-text"
                                : "cursor-pointer bg-surface border border-default hover:bg-surface-muted"
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
                                className={`cursor-pointer rounded-radius-md px-4 py-2 text-body-sm font-medium transition-colors duration-200
                    ${active
                                        ? "bg-action-primary-bg text-inverse"
                                        : "bg-surface border border-default hover:bg-surface-muted"
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
                        className={`rounded-radius-md px-3 py-2 text-body-sm font-medium transition-colors duration-200
            ${currentPage === totalPages
                                ? "cursor-not-allowed bg-action-disabled-bg text-action-disabled-text"
                                : "cursor-pointer bg-surface border border-default hover:bg-surface-muted"
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
