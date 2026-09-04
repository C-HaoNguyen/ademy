# UI Spec — Academic Management Platform (Version mới)

Nguồn: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, codebase hiện tại (`academic-management-website/`).

Tài liệu này định nghĩa từng page/screen ở cấp độ thiết kế (không phải implementation). Mọi token/pattern thị giác tham chiếu `docs/DESIGN_SYSTEM.md` theo số mục (ví dụ "§10.1 Button").

---

## 1. Inventory

### 1.1 Routes hiện tại (từ `AppRoutes.tsx`)

| Route | Page component | Trạng thái hiện tại |
|---|---|---|
| `/` | HomePage | Có, cần redesign visual |
| `/courses` | CourseListPage | Có, cần redesign + bổ sung |
| `/courses/:courseId` | CourseDetailPage | Có, cần bổ sung cấu trúc (curriculum/preview) |
| `/lecturer` | LecturerPage | Có, nội dung tĩnh — cần chuyển sang dữ liệu Teacher thật |
| `/contact` | ContactPage | Có, form không hoạt động thật |
| `/login` | Login | Có |
| `/signup` | Signup | Có |
| `/checkout` | Checkout | Có, mock coupon + không có gateway thật |
| `/student/dashboard` | Dashboard | Có, 3/4 stat card `comingSoon` |
| `/student/my-courses` | MyCourses | Có |
| `/student/learning-profile` | LearningProfile | Có, UI tĩnh hoàn toàn |
| `/student/test-practice` | TestPractice | Có, UI tĩnh hoàn toàn |
| `/student/profile` | Profile | Có |
| `/admin/dashboard` | AdminDashboard | Có, số liệu hardcode |
| `/admin/users` | AdminUsersList | Có |
| `/admin/courses` | AdminCourses | Có, Admin đang là người CRUD trực tiếp (sai trách nhiệm so với PRD) |
| `/admin/categories` | AdminCategories | Có |
| `/admin/orders` | AdminOrders | Có |
| — | `src/pages/auth/AuthPage.tsx` | File rỗng, không route tới — dead code |

### 1.2 Page cần có theo PRD (khoảng trống so với 1.1)

| Nhu cầu PRD | Page mới cần thêm | Trace |
|---|---|---|
| Xem nội dung lesson đã mua, theo dõi tiến độ | **Lesson Player** (Student) — hiện chưa tồn tại route/component nào | PRD-016, PRD-017 |
| Teacher tạo/sửa khóa học, lesson, video, quiz | **Course Editor** (Teacher) | PRD-009 → PRD-014 |
| Teacher xem thống kê học viên khóa mình dạy | Tab "Học viên" trong Course Editor (Teacher) | PRD-015 |
| Teacher xem tổng quan hoạt động của mình | **Teacher Dashboard** | PRD-009, PRD-015 |
| Teacher quản lý danh sách khóa học của mình | **Teacher Courses List** | PRD-009, PRD-011 |
| Admin mời Teacher | Bổ sung action trong AdminUsersList | PRD-002 |
| Admin thu hồi quyền truy cập nội dung (tách biệt Force-unpublish) | Bổ sung action riêng trong AdminCourses | PRD-027 |
| Admin quản lý coupon | **AdminCoupons** (mới) | PRD-023 |
| Admin duyệt yêu cầu hoàn tiền | **AdminRefunds** (mới) | PRD-025, PRD-026 |
| Admin tra cứu audit log | **AdminAuditLog** (mới) | PRD-033, PRD-034 |
| Checkout 2 bước cho 3 gateway | Tách Checkout thành 2 screen | PRD-020 |
| Student gửi yêu cầu hoàn tiền | Action trong MyCourses (không phải page riêng) | PRD-025 |
| Student làm bài test tổng khóa học | **Quiz Attempt** (dùng chung cho lesson-quiz và test tổng) | PRD-018, PRD-019 |

### 1.3 Shared Layouts

| Layout | Dùng cho | Trạng thái |
|---|---|---|
| `PublicLayout` (Header ngang + Footer) | Khách, mọi trang Public + Login/Signup | Giữ cấu trúc, redesign visual theo Design System §10.7 |
| `StudentLayout` (Header 64px + Sidebar 256px trái, đã có sẵn) | Student | Giữ cấu trúc, redesign visual theo Design System §10.6, thêm khả năng thu gọn |
| `AdminLayout` (Header 64px + Sidebar 192px trái, đã có sẵn) | Admin | Giữ cấu trúc, redesign visual, mở rộng sidebar cho 3 mục mới |
| `TeacherLayout` (mới) | Teacher | Tạo mới — cùng pattern Sidebar như Student/Admin |
| `LessonPlayerLayout` (mới) | Student trong lúc học 1 khóa học cụ thể | Tạo mới — thay thế `StudentLayout` khi vào lesson, theo quyết định đã chốt |

### 1.4 Navigation

**Public Header** (giữ nguyên nhóm mục, redesign token): Trang chủ, Các khóa học, Đội ngũ, Liên hệ | Đăng nhập/Đăng ký hoặc Bắt đầu học + avatar menu.

**Student Sidebar** (giữ 4 mục hiện có, thêm nhãn nhất quán):
Tổng quan (`/student/dashboard`) · Khóa học của tôi (`/student/my-courses`) · Bài kiểm tra (`/student/test-practice`) · Hồ sơ học tập (`/student/learning-profile`) · [dưới cùng] Về trang chủ.

**Teacher Sidebar** (mới):
Tổng quan (`/teacher/dashboard`) · Khóa học của tôi (`/teacher/courses`) · [dưới cùng] Về trang chủ.
> Course Editor không phải mục sidebar — truy cập qua action "Tạo khóa học" hoặc click vào 1 khóa học trong danh sách.

**Admin Sidebar** (giữ 5 mục hiện có, thêm 3 mục mới):
Dashboard · Users · Courses · Categories · Orders · **Coupons** (mới) · **Refunds** (mới) · **Audit Log** (mới).

### 1.5 Major User Flows (map theo PRD §6 Core User Journeys)

| Flow | Trace | Chuỗi page |
|---|---|---|
| J1 — Khám phá & đăng ký | PRD J1 | HomePage → CourseListPage → CourseDetailPage → Signup/Login |
| J2 — Mua khóa học | PRD J2 | CourseDetailPage → Checkout (Bước 1: tóm tắt+coupon) → Checkout (Bước 2: chọn gateway) → redirect gateway → MyCourses |
| J3 — Học & làm test | PRD J3 | MyCourses → Lesson Player (video/tài liệu/quiz từng lesson) → Test Practice (bài test tổng) → Quiz Attempt |
| J4 — Teacher tạo khóa học | PRD J4 | Teacher Dashboard → Teacher Courses List → Course Editor (tab Tổng quan → Curriculum → Quiz → Cài đặt) → Publish |
| J5 — Quản lý vòng đời khóa học | PRD J5 | Course Editor (tab Cài đặt, Teacher tự chuyển Draft/Published/Archived) · AdminCourses (Admin force-unpublish) |
| J6 — Admin giám sát | PRD J6 | AdminDashboard → AdminUsersList/AdminCourses/AdminCategories/AdminOrders/AdminCoupons/AdminAuditLog |
| J7 — Yêu cầu hoàn tiền | PRD J7 | MyCourses (action gửi yêu cầu) → AdminRefunds (duyệt) → email kết quả |

---

## 2. Public Pages

### 2.1 HomePage — `/`

**Classification**: Redesign (giữ cấu trúc section, đổi toàn bộ token thị giác + tiết chế hiệu ứng)

- **Purpose**: giới thiệu nền tảng, tạo động lực khám phá khóa học, dẫn tới đăng ký/khám phá catalog.
- **Target user**: Khách vãng lai, Student chưa đăng nhập.
- **Entry points**: URL gốc, logo header từ mọi trang Public.
- **Information hierarchy**: Hero (headline + CTA) → dải khóa học nổi bật → lý do chọn nền tảng → số liệu thật → CTA cuối trang.
- **Page structure / Main sections**: Hero (headline, mô tả, CTA `cta` "Khám phá khóa học" + CTA `secondary` "Bắt đầu miễn phí", minh họa/illustration bên phải thay cho card thống kê giả lập hiện tại), dải khóa học cuộn ngang (dữ liệu thật từ catalog, không còn card gradient màu tùy ý — dùng `card-marketing`), section "Vì sao chọn nền tảng" (3 card `card-marketing` + icon lucide), section số liệu thật (tổng khóa học, tổng học viên — không hardcode), CTA cuối trang.
- **Primary action**: CTA `cta` "Khám phá khóa học". **Secondary**: "Bắt đầu miễn phí" (`secondary`), CTA cuối trang (`primary`).
- **Component patterns**: `card-marketing` (§10.3), Button `cta`/`primary`/`secondary` (§10.1), Empty State không áp dụng (trang tĩnh có nội dung mặc định).
- **Loading state**: skeleton cho số liệu thật và dải khóa học trong lúc fetch (§10.11); phần tĩnh (Hero, lý do chọn) render ngay không chờ.
- **Empty state**: nếu chưa có khóa học nào publish, dải khóa học hiển thị Empty State "Chưa có khóa học nào" thay vì section trống.
- **Error state**: nếu fetch số liệu/khóa học lỗi, section liên quan ẩn phần số liệu và hiển thị fallback tĩnh (không chặn toàn trang).
- **Success state**: không áp dụng (trang không có hành động submit).
- **Responsive**: mobile-first bắt buộc — Hero chuyển 1 cột (ảnh dưới text), dải khóa học vẫn cuộn ngang trên mobile.
- **Mobile behavior**: nút mũi tên cuộn ẩn trên mobile (dùng touch scroll trực tiếp), container padding giảm theo `space-4`/`space-6`.
- **Accessibility**: heading đúng cấp (`h1` Hero, `h2` section), nút cuộn có `aria-label`, ảnh minh họa có `alt` mô tả hoặc `alt=""` nếu thuần trang trí.

### 2.2 CourseListPage — `/courses`

**Classification**: Redesign (giữ cấu trúc grid + filter, đổi token + thêm pagination/debounce đã thiếu)

- **Purpose**: cho khách/Student duyệt toàn bộ khóa học đã publish, tìm theo category/tên.
- **Target user**: Khách vãng lai, Student.
- **Entry points**: Header "Các khóa học", CTA từ HomePage, link trực tiếp.
- **Information hierarchy**: Thanh tìm kiếm + filter category → lưới kết quả → pagination.
- **Page structure / Main sections**: Search input (Design System §10.2, filled style, debounce theo `UI.SEARCH_DEBOUNCE` — hiện định nghĩa nhưng chưa dùng, cần wire thật) + filter category (dạng chip/badge chọn được), lưới `CourseCard` (§10.3 `card-marketing`), pagination chuẩn (thay literal `ITEMS_PER_PAGE=9` hiện tại bằng `UI.DEFAULT_PAGE_SIZE`).
- **Primary action**: click 1 `CourseCard` → CourseDetailPage. **Secondary**: filter/search.
- **Component patterns**: Input filled (§10.2), Badge/chip filter (§10.4), Card marketing (§10.3), pagination (mới — theo table pattern §10.5 áp dụng khái niệm phân trang tương tự).
- **Loading state**: skeleton lưới card khi fetch/filter.
- **Empty state**: Empty State (§10.10) "Không tìm thấy khóa học phù hợp" khi search/filter rỗng kết quả, kèm action "Xóa bộ lọc".
- **Error state**: Toast `status-danger-text` nếu fetch lỗi, kèm nút "Thử lại" trong khu vực lưới.
- **Success state**: không áp dụng.
- **Responsive**: mobile-first — lưới `grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-3`.
- **Mobile behavior**: filter category chuyển thành dropdown/sheet thay vì hàng chip ngang tràn nếu quá nhiều category.
- **Accessibility**: search input có `label` (có thể ẩn trực quan nhưng tồn tại cho screen reader), kết quả filter thay đổi cần thông báo qua `aria-live="polite"`.

### 2.3 CourseDetailPage — `/courses/:courseId`

**Classification**: Redesign + bổ sung cấu trúc (thêm curriculum/preview — nội dung mới bắt buộc theo PRD, không phải feature tự thêm)

- **Purpose**: cung cấp đủ thông tin để Student quyết định mua; cho xem thử lesson preview.
- **Target user**: Khách vãng lai (xem thông tin, không xem preview), Student/Teacher/Admin đã đăng nhập (xem được preview — BR-007).
- **Entry points**: click từ CourseCard (HomePage/CourseListPage).
- **Information hierarchy**: Tiêu đề + giảng viên + giá + CTA mua → mô tả khóa học → **Nội dung khóa học (curriculum, mới)** → thông tin giảng viên.
- **Page structure / Main sections**:
  1. Header khóa học: thumbnail, tên, tên Teacher (link tới hồ sơ nếu có), category badge, giá, CTA `cta` "Mua khóa học" (hoặc "Vào học" nếu đã sở hữu).
  2. Mô tả khóa học (text dài, `text-body-lg`).
  3. **Curriculum (mới, bắt buộc theo PRD-006/007)**: danh sách lesson theo thứ tự, mỗi item hiện icon loại nội dung (video/tài liệu/quiz), nhãn "Xem thử" cho lesson `isPreview=true` (click mở Lesson Player ở chế độ preview nếu đã đăng nhập, hoặc mở Login nếu chưa đăng nhập — theo BR-007), lesson còn lại hiện icon khóa.
  4. Thông tin giảng viên (ngắn gọn, link `/lecturer` hoặc hồ sơ Teacher nếu có trang riêng — không có trong scope hiện tại, dùng text đơn giản).
- **Primary action**: CTA `cta` "Mua khóa học" → Checkout Bước 1. **Secondary**: "Xem thử" trên lesson preview.
- **Component patterns**: Card marketing cho header, list pattern cho curriculum (không phải Table — đây là danh sách tuyến tính, dùng list item với icon trạng thái khóa/mở), Badge cho category.
- **Loading state**: skeleton cho toàn bộ block (header, mô tả, curriculum) khi fetch chi tiết khóa học.
- **Empty state**: nếu khóa học chưa có lesson nào, khu vực Curriculum hiện Empty State "Nội dung đang được cập nhật".
- **Error state**: nếu `courseId` không tồn tại/đã bị Admin thu hồi truy cập, hiện full-page error state (Design System §14) "Không tìm thấy khóa học" + nút quay lại CourseListPage.
- **Success state**: không áp dụng (điều hướng sang Checkout khi bấm mua).
- **Responsive**: mobile-first — header chuyển 1 cột, curriculum luôn full-width danh sách dọc.
- **Mobile behavior**: CTA "Mua khóa học" có thể sticky ở đáy màn hình trên mobile để luôn truy cập được khi cuộn dài qua curriculum.
- **Accessibility**: lesson bị khóa có `aria-disabled` + text ẩn "cần mua khóa học để mở khóa" cho screen reader, không chỉ dựa vào icon khóa.

### 2.4 LecturerPage — `/lecturer`

**Classification**: Rearrange (giữ cấu trúc trình bày đội ngũ, chuyển nội dung tĩnh sang dữ liệu Teacher thật vì Teacher giờ là role thật theo PRD — không phải thêm feature mới, chỉ nối đúng dữ liệu)

- **Purpose**: giới thiệu đội ngũ Teacher, tăng tin cậy trước khi mua khóa học.
- **Target user**: Khách vãng lai, Student cân nhắc mua khóa học.
- **Entry points**: Header "Đội ngũ".
- **Information hierarchy**: Giới thiệu ngắn → lưới hồ sơ Teacher.
- **Page structure / Main sections**: Hero ngắn (giữ nguyên nếu có) + lưới `TeacherCard` (component đã có sẵn, redesign token) hiển thị Teacher thật (tên, avatar, số khóa học đang dạy) — thay dữ liệu tĩnh hiện tại.
- **Primary action**: click `TeacherCard` → lọc CourseListPage theo Teacher đó (liên kết hợp lý, không phải trang hồ sơ riêng — giữ scope tối thiểu).
- **Component patterns**: Card marketing, avatar image.
- **Loading state**: skeleton lưới card Teacher.
- **Empty state**: Empty State nếu chưa có Teacher nào (trường hợp hệ thống mới khởi tạo).
- **Error state**: Toast lỗi nếu fetch danh sách Teacher thất bại.
- **Success state**: không áp dụng.
- **Responsive**: mobile-first, lưới co giãn giống CourseListPage.
- **Mobile behavior**: không có hành vi đặc biệt ngoài grid responsive chuẩn.
- **Accessibility**: avatar có `alt` = tên Teacher.

### 2.5 ContactPage — `/contact`

**Classification**: Redesign (giữ cấu trúc form liên hệ, làm thật theo PRD-032)

- **Purpose**: cho khách gửi câu hỏi/liên hệ tới Admin.
- **Target user**: Khách vãng lai, Student.
- **Entry points**: Header "Liên hệ".
- **Information hierarchy**: Thông tin liên hệ tĩnh (email/hotline) → form gửi liên hệ.
- **Page structure / Main sections**: Block thông tin liên hệ (card-marketing), Form liên hệ (Họ tên, Email, Nội dung — theo Form Pattern §11, 1 cột, width giới hạn).
- **Primary action**: Button `primary` "Gửi liên hệ".
- **Component patterns**: Input filled, Textarea filled, Button `primary`.
- **Loading state**: Button chuyển trạng thái `loading` khi submit (§10.1).
- **Empty state**: không áp dụng (form luôn hiện).
- **Error state**: inline error dưới field nếu validate thất bại (§11); Toast `status-danger-text` nếu submit lỗi server.
- **Success state**: Toast `status-success-text` "Đã gửi liên hệ thành công" + reset form.
- **Responsive**: mobile-first, form luôn 1 cột.
- **Mobile behavior**: không có hành vi đặc biệt.
- **Accessibility**: mọi field có `label` liên kết đúng chuẩn (§11), nút submit có `aria-busy` khi loading.

### 2.6 Login — `/login`

**Classification**: Redesign (giữ cấu trúc form, đổi token, thêm validation còn thiếu, bỏ `alert()`)

- **Purpose**: xác thực người dùng đã có tài khoản (Student/Teacher/Admin).
- **Target user**: Mọi role.
- **Entry points**: Header "Đăng nhập", redirect từ `ProtectedRoute` khi chưa đăng nhập.
- **Information hierarchy**: Logo/branding → form đăng nhập → link sang Signup.
- **Page structure / Main sections**: Card `card-marketing` căn giữa, width giới hạn ~420px (Form Pattern §11) chứa: username/email, password (có toggle ẩn/hiện — giữ hành vi hiện tại), Button `primary` "Đăng nhập", link "Chưa có tài khoản? Đăng ký".
- **Primary action**: Button `primary` "Đăng nhập". **Secondary**: link Đăng ký.
- **Component patterns**: Input filled, Button primary, Link (`text-link`).
- **Loading state**: Button `loading` khi submit.
- **Empty state**: không áp dụng.
- **Error state**: inline error dưới field khi để trống (hiện tại Login **chưa có** validate rỗng — cần bổ sung theo Form Pattern §11); Toast `status-danger-text` khi sai thông tin đăng nhập (thay `alert()` hiện tại).
- **Success state**: điều hướng thẳng theo role, không cần toast riêng (điều hướng tức thời đã là tín hiệu thành công).
- **Responsive**: mobile-first, form full-width trong giới hạn max ~420px, căn giữa dọc màn hình.
- **Mobile behavior**: bàn phím mobile không che field password (đảm bảo scroll-into-view khi focus).
- **Accessibility**: nút toggle hiện/ẩn password có `aria-label` ("Hiện mật khẩu"/"Ẩn mật khẩu"), input password có `autocomplete="current-password"`.

### 2.7 Signup — `/signup`

**Classification**: Redesign (giữ cấu trúc + validation hiện có — đã tốt hơn Login — chỉ đổi token, bỏ `alert()`)

- **Purpose**: tạo tài khoản Student mới (BR-002 — chỉ Student tự đăng ký, Teacher do Admin mời).
- **Target user**: Khách vãng lai muốn trở thành Student.
- **Entry points**: Header "Đăng ký", link từ Login.
- **Information hierarchy**: Form đăng ký (họ tên, email, username, password, xác nhận password).
- **Page structure / Main sections**: Card căn giữa giống Login, giữ nguyên real-time validation đã có (đánh giá tốt ở audit), đổi feedback từ `alert()` sang Toast/inline.
- **Primary action**: Button `primary` "Đăng ký".
- **Component patterns**: Input filled, Button primary, inline validation (đã có, giữ pattern, chuẩn hóa theo §11).
- **Loading state**: Button `loading`.
- **Empty state**: không áp dụng.
- **Error state**: inline error đã có (giữ), thay `alert()` bằng Toast cho lỗi cấp server (ví dụ email đã tồn tại).
- **Success state**: Toast `status-success-text` + điều hướng sang Login hoặc Student Dashboard tùy hành vi hiện có.
- **Responsive**: giống Login.
- **Mobile behavior**: giống Login.
- **Accessibility**: password + confirm-password có `autocomplete="new-password"`, thông báo mismatch password qua `aria-describedby`.

### 2.8 Checkout — Bước 1: Tóm tắt & Coupon — `/checkout`

**Classification**: Redesign + tách bước (theo quyết định đã chốt: 2 bước)

- **Purpose**: xác nhận khóa học sẽ mua, áp coupon nếu có, trước khi chọn phương thức thanh toán.
- **Target user**: Student (mọi role đã đăng nhập theo route hiện tại — `ProtectedRoute` không giới hạn role cho `/checkout`, giữ nguyên vì PRD không giới hạn role nào bị cấm mua).
- **Entry points**: CTA "Mua khóa học" từ CourseDetailPage.
- **Information hierarchy**: Tóm tắt khóa học → nhập coupon → tổng tiền → CTA tiếp tục.
- **Page structure / Main sections**: Card tóm tắt (thumbnail nhỏ, tên khóa học, giá gốc), Input coupon + Button `secondary` "Áp dụng" (thay mock logic hardcode hiện tại bằng validate thật qua API — PRD-024), dòng tổng tiền sau giảm giá, Button `cta` "Tiếp tục".
- **Primary action**: Button `cta` "Tiếp tục" → Bước 2. **Secondary**: "Áp dụng" coupon.
- **Component patterns**: Card marketing, Input filled + Button secondary inline, Button cta.
- **Loading state**: Button "Áp dụng" chuyển `loading` khi validate coupon.
- **Empty state**: không áp dụng.
- **Error state**: inline message dưới ô coupon nếu mã không hợp lệ/hết hạn (`status-danger-text`), không dùng Toast cho lỗi cấp field này.
- **Success state**: hiển thị badge `status-success-bg` nhỏ cạnh ô coupon khi áp dụng thành công + cập nhật tổng tiền ngay.
- **Responsive**: 1 cột, width giới hạn giống form Public khác.
- **Mobile behavior**: tổng tiền + CTA "Tiếp tục" sticky đáy màn hình.
- **Accessibility**: tổng tiền cập nhật động cần `aria-live="polite"` để screen reader đọc lại khi coupon áp dụng thành công.

### 2.9 Checkout — Bước 2: Chọn phương thức thanh toán — `/checkout/payment` (route mới trong flow)

**Classification**: New (tách ra từ Checkout hiện tại theo quyết định đã chốt)

- **Purpose**: chọn 1 trong 3 gateway (VNPay/Momo/Stripe), khởi tạo giao dịch, redirect sang gateway.
- **Target user**: Student đã hoàn tất Bước 1.
- **Entry points**: chỉ từ Bước 1 (không có entry point trực tiếp — nếu vào thẳng route này mà chưa có session checkout hợp lệ, redirect lại Bước 1).
- **Information hierarchy**: Tóm tắt số tiền cuối cùng (rút gọn từ Bước 1) → danh sách 3 phương thức thanh toán → CTA xác nhận.
- **Page structure / Main sections**: Tóm tắt đơn hàng thu gọn (1 dòng: tên khóa học + tổng tiền), danh sách lựa chọn gateway dạng radio-card (VNPay/Momo/Stripe — mỗi option có logo + tên), Button `cta` "Xác nhận thanh toán".
- **Primary action**: Button `cta` "Xác nhận thanh toán" → redirect gateway. **Secondary**: link "Quay lại" về Bước 1.
- **Component patterns**: radio-card selection (biến thể của Card `card-marketing` — Checkout thuộc khu vực Public theo Design System §2/§10.3, không dùng `card-app` — với trạng thái selected dùng `nav-selected-bg`/`border-brand`), Button cta.
- **Loading state**: Button `loading` trong lúc hệ thống khởi tạo giao dịch (gọi `PaymentGatewayPort`) trước khi redirect.
- **Empty state**: không áp dụng.
- **Error state**: nếu khởi tạo giao dịch thất bại (gateway lỗi/timeout), Toast `status-danger-text` + cho phép thử lại hoặc chọn gateway khác — **không tự động tạo giao dịch trùng** (Idempotency-Key theo ADR-007 dùng lại cho retry cùng attempt).
- **Success state**: không hiển thị ở đây — thành công thể hiện ở trang kết quả sau khi gateway redirect về (xem 2.10).
- **Responsive**: 1 cột, danh sách gateway xếp dọc trên mobile.
- **Mobile behavior**: không có hành vi đặc biệt.
- **Accessibility**: lựa chọn gateway dùng radio group thật (`role="radiogroup"`, điều hướng bàn phím mũi tên), logo gateway có `alt`.

### 2.10 Checkout — Kết quả — `/checkout/result` (route mới)

**Classification**: New

- **Purpose**: thông báo kết quả giao dịch sau khi gateway redirect về (thành công/thất bại), điều hướng tiếp.
- **Target user**: Student vừa hoàn tất/hủy thanh toán ở gateway.
- **Entry points**: redirect callback từ VNPay/Momo/Stripe.
- **Information hierarchy**: Trạng thái lớn (thành công/thất bại) → chi tiết giao dịch → CTA tiếp theo.
- **Page structure / Main sections**: Icon + heading trạng thái, tên khóa học + số tiền + mã giao dịch (nếu thành công), CTA `primary` "Vào học ngay" (nếu thành công, dẫn tới MyCourses) hoặc CTA `secondary` "Thử lại" (nếu thất bại, quay lại Bước 2).
- **Primary action**: theo trạng thái — "Vào học ngay" hoặc "Thử lại".
- **Component patterns**: full-page result state (không phải Empty/Error state chuẩn — dùng cấu trúc tương tự full-page error §14 nhưng biến thể success/failure).
- **Loading state**: skeleton/spinner ngắn trong lúc hệ thống xác nhận trạng thái giao dịch với backend (verify callback).
- **Empty state**: không áp dụng.
- **Error state**: nếu không xác định được trạng thái giao dịch (timeout xác minh), hiển thị trạng thái trung tính "Đang xử lý, vui lòng kiểm tra lại ở Khóa học của tôi sau ít phút" thay vì báo lỗi/thành công sai.
- **Success state**: đây chính là trang success — Toast không cần thiết vì cả trang đã là thông báo.
- **Responsive**: 1 cột căn giữa.
- **Mobile behavior**: không có hành vi đặc biệt.
- **Accessibility**: heading trạng thái là `h1`, không chỉ dựa vào màu để phân biệt thành công/thất bại (kèm icon + text rõ ràng).

---

## 3. Student Pages

### 3.1 Dashboard — `/student/dashboard`

**Classification**: Redesign (giữ cấu trúc stat cards + danh sách; thay `comingSoon` bằng dữ liệu thật cho những số liệu có nguồn thật — xem ghi chú Phase 28 bên dưới)

- **Purpose**: tổng quan nhanh cho Student mỗi khi đăng nhập — tiến độ, khóa học đang học.
- **Target user**: Student.
- **Entry points**: mặc định khi vào `/student` (redirect index), Sidebar "Tổng quan".
- **Information hierarchy**: Chào mừng + stat card tổng quan → khóa học đang học gần nhất.
- **Page structure / Main sections**: 3 stat card (`card-app`, compact — số khóa học đã đăng ký, số bài test đã làm: **dữ liệu thật**; tiến độ trung bình: chưa có nguồn dữ liệu thật, hiện "Sắp ra mắt" cho tới khi Lesson Player (Phase 35) ghi nhận `LessonProgress`), danh sách "Tiếp tục học" (2-3 khóa học đăng ký gần nhất — **không có progress bar/streak/"hoạt động gần đây"**: không có nguồn dữ liệu thật cho các số liệu này ở phase hiện tại, xem ghi chú Phase 28 ở REFACTOR_PLAN.md).
- **Primary action**: click "Vào học" trên 1 khóa học → tạm thời điều hướng tới MyCourses (Lesson Player chưa tồn tại, cùng tiền lệ CourseDetailPage ở Phase 26).
- **Component patterns**: Card app (§10.3), StatCard (§10.3, có `pendingText` cho số liệu chưa có dữ liệu thật), Skeleton loading.
- **Loading state**: skeleton cho từng stat card + danh sách khi fetch.
- **Empty state**: nếu Student chưa đăng ký khóa học nào, thay danh sách "Tiếp tục học" bằng Empty State "Bạn chưa có khóa học nào" + CTA `primary` "Khám phá khóa học" (dẫn `/courses`).
- **Error state**: Toast lỗi nếu fetch thất bại, stat card hiện giá trị "—" thay vì crash.
- **Success state**: không áp dụng.
- **Responsive**: mobile-first — 3 stat card dùng `grid-cols-2` trên mobile, `sm:grid-cols-3` từ tablet trở lên.
- **Mobile behavior**: danh sách "Tiếp tục học" đủ rộng chạm (44px touch target theo §6).
- **Accessibility**: không áp dụng phần progress bar cho tới khi có dữ liệu thật (Phase 35).

### 3.2 MyCourses — `/student/my-courses`

**Classification**: Redesign (giữ cấu trúc danh sách; action gửi yêu cầu hoàn tiền **hoãn sang phase sau** — xem ghi chú Phase 28 ở REFACTOR_PLAN.md)

- **Purpose**: liệt kê mọi khóa học Student đã mua, truy cập nhanh vào học.
- **Target user**: Student.
- **Entry points**: Sidebar "Khóa học của tôi", CTA "Vào học ngay" từ Header (mọi trang khi đã đăng nhập).
- **Information hierarchy**: Danh sách khóa học đã mua, action chính "Vào học".
- **Page structure / Main sections**: Lưới `card-app` mỗi khóa học (thumbnail, tên, Teacher, ngày mua). **Không có progress bar** (chưa có nguồn dữ liệu thật — chờ Lesson Player, Phase 35) và **không có menu "···"/hoàn tiền** (backend `POST /refund-requests` đã có từ Phase 23, nhưng UI (Modal/Idempotency-Key/mutation) chưa build — hoãn sang phase riêng; `GET /payments/me` đã có sẵn để phase đó lấy `paymentId` theo course).
- **Primary action**: Button `primary` "Vào học" trên mỗi card → tạm thời điều hướng tới chính MyCourses (Lesson Player chưa tồn tại, cùng tiền lệ CourseDetailPage ở Phase 26).
- **Component patterns**: Card app, Button primary.
- **Loading state**: skeleton lưới card (`SkeletonCardGrid`).
- **Empty state**: Empty State "Bạn chưa mua khóa học nào" + CTA "Khám phá khóa học".
- **Error state**: Toast lỗi khi fetch danh sách thất bại.
- **Success state**: không áp dụng (hoàn tiền chưa có UI).
- **Responsive**: mobile-first, lưới `grid-cols-1` → `sm:grid-cols-2`.
- **Mobile behavior**: không có hành vi đặc biệt (menu "···" chưa tồn tại ở phase này).
- **Accessibility**: không áp dụng phần menu/modal hoàn tiền cho tới khi build (phase sau).

### 3.3 Lesson Player — `/student/learn/:courseId` (route mới, layout riêng)

**Classification**: New — page quan trọng nhất còn thiếu hoàn toàn trong codebase hiện tại

- **Purpose**: nơi Student thực sự học — xem video/tài liệu, làm quiz gắn trong lesson, theo dõi tiến độ theo thời gian thực.
- **Target user**: Student đã mua khóa học (hoặc bất kỳ role đã đăng nhập, chỉ với lesson `isPreview=true` — BR-007).
- **Entry points**: "Vào học"/"Tiếp tục học" từ Dashboard, MyCourses, hoặc "Xem thử" từ CourseDetailPage (chế độ preview — ẩn các lesson chưa mở khóa, chỉ cho xem lesson preview).
- **Information hierarchy**: Danh sách lesson trong khóa học (trạng thái đã học/đang học/chưa học) → nội dung lesson đang chọn → điều hướng lesson kế tiếp.
- **Page structure / Main sections** (dùng `LessonPlayerLayout` riêng — sidebar toàn cục ẩn theo quyết định đã chốt):
  1. Topbar mỏng: tên khóa học, nút "Thoát" (→ MyCourses), progress bar tổng thể khóa học.
  2. Sidebar trái (260px, cùng width chuẩn theo Design System §6): danh sách lesson theo thứ tự, icon loại nội dung (video/tài liệu/quiz), checkmark cho lesson đã hoàn thành (`status-success-icon`), lesson hiện tại có `nav-selected-bg`.
  3. Content area chính: render theo loại lesson — video player (embed hoặc file từ object storage), tài liệu/text (đọc), hoặc Quiz Attempt (§3.5) nếu lesson là quiz.
  4. Footer content area: Button `primary` "Đánh dấu hoàn thành & tiếp tục" (ghi `LessonProgress`, điều hướng lesson kế tiếp).
- **Primary action**: "Đánh dấu hoàn thành & tiếp tục". **Secondary**: chọn lesson bất kỳ trong sidebar (không bắt buộc tuần tự — trừ khi PRD yêu cầu khóa tuần tự, hiện không có yêu cầu này nên cho phép tự do chọn).
- **Component patterns**: Sidebar nav pattern (§10.6, biến thể trong-khóa-học thay vì toàn hệ thống), Progress bar, Button primary.
- **Loading state**: skeleton toàn bộ layout khi tải danh sách lesson lần đầu; skeleton riêng content area khi chuyển lesson.
- **Empty state**: nếu khóa học chưa có lesson nào (trường hợp hiếm, Teacher chưa thêm nội dung), hiện Empty State toàn content area "Nội dung đang được cập nhật".
- **Error state**: nếu lesson yêu cầu quyền truy cập mà Student chưa mua (truy cập trực tiếp URL), full-page error "Bạn cần mua khóa học để xem nội dung này" + CTA về CourseDetailPage; nếu video/tài liệu tải lỗi, inline error trong content area kèm nút "Tải lại".
- **Success state**: Toast ngắn `status-success-text` khi hoàn thành lesson cuối cùng của khóa học ("Bạn đã hoàn thành khóa học!").
- **Responsive**: Student là khu vực mobile-first — trên mobile, sidebar lesson chuyển thành danh sách có thể mở/đóng (accordion hoặc bottom-sheet) thay vì cột cố định, ưu tiên tối đa diện tích cho content area.
- **Mobile behavior**: video player full-width, nút "Đánh dấu hoàn thành & tiếp tục" sticky đáy màn hình; nội dung đọc dài dùng `text-body-lg` theo ngoại lệ đã ghi trong Design System §4.
- **Accessibility**: video player có transcript/caption nếu định dạng hỗ trợ (không bắt buộc theo PRD hiện tại, ghi nhận là cân nhắc tốt), điều hướng lesson bằng bàn phím đầy đủ, trạng thái hoàn thành lesson công bố qua `aria-live`.

### 3.4 Test Practice (hub bài kiểm tra) — `/student/test-practice`

**Classification**: Redesign hoàn toàn (từ UI tĩnh sang danh sách thật)

- **Purpose**: liệt kê mọi bài kiểm tra tổng khóa học (PRD-014) từ các khóa Student đã mua, cho biết đã làm/chưa làm/điểm số.
- **Target user**: Student.
- **Entry points**: Sidebar "Bài kiểm tra".
- **Information hierarchy**: Danh sách bài test theo khóa học, trạng thái mỗi bài.
- **Page structure / Main sections**: Danh sách dạng Table hoặc list-card (chọn list-card vì đây là danh sách hành động, không phải dữ liệu nhiều cột — nhất quán với MyCourses), mỗi item: tên khóa học, tên bài test, trạng thái (badge "Chưa làm"/"Đã hoàn thành — điểm X"), Button "Làm bài"/"Xem kết quả".
- **Primary action**: Button `primary` "Làm bài" → Quiz Attempt (§3.5). **Secondary**: "Xem kết quả" cho bài đã làm.
- **Component patterns**: List-card pattern (giống MyCourses), Badge trạng thái.
- **Loading state**: skeleton danh sách.
- **Empty state**: Empty State "Bạn chưa có bài kiểm tra nào" (khi chưa mua khóa học nào có test, hoặc Teacher chưa tạo test) + CTA "Khám phá khóa học".
- **Error state**: Toast lỗi khi fetch thất bại.
- **Success state**: không áp dụng (thành công thể hiện ở Quiz Attempt).
- **Responsive**: mobile-first, danh sách 1 cột luôn.
- **Mobile behavior**: không có hành vi đặc biệt.
- **Accessibility**: trạng thái không chỉ dựa vào màu badge, luôn kèm text rõ ràng.

### 3.5 Quiz Attempt — `/student/quiz/:quizId` (route mới, dùng chung cho lesson-quiz và test tổng)

**Classification**: New

- **Purpose**: cho Student làm bài trắc nghiệm và nhận kết quả chấm tự động ngay lập tức (PRD-018).
- **Target user**: Student.
- **Entry points**: từ Test Practice ("Làm bài"), hoặc nhúng trong Lesson Player khi lesson type = quiz.
- **Information hierarchy**: Câu hỏi hiện tại + tiến trình (câu X/N) → các lựa chọn → điều hướng câu hỏi → nộp bài.
- **Page structure / Main sections**: Progress indicator (câu X/N, không phải progress bar phần trăm khóa học), khối câu hỏi (text câu hỏi + danh sách lựa chọn dạng radio-card), điều hướng "Câu trước/Câu sau", Button `cta` "Nộp bài" ở câu cuối (hoặc luôn hiện, cho nộp sớm).
- **Primary action**: chọn đáp án (bắt buộc từng câu), Button `cta` "Nộp bài". **Secondary**: điều hướng qua lại giữa câu hỏi.
- **Component patterns**: radio-card (cùng pattern với chọn gateway ở Checkout Bước 2), Button cta.
- **Loading state**: skeleton khi tải câu hỏi lần đầu.
- **Empty state**: không áp dụng (quiz luôn có ít nhất câu hỏi khi đã publish — nếu Teacher publish quiz rỗng là lỗi dữ liệu, không phải trạng thái UI cần xử lý riêng).
- **Error state**: Toast lỗi nếu nộp bài thất bại (giữ nguyên lựa chọn đã chọn, cho nộp lại — không mất dữ liệu).
- **Success state**: sau khi nộp, chuyển sang màn hình kết quả trong cùng route (điểm số, số câu đúng/sai, không hiển thị đáp án đúng chi tiết trừ khi PRD yêu cầu — hiện PRD chỉ yêu cầu "nhận kết quả", giữ tối thiểu là điểm số) + Button `primary` "Quay lại" (Test Practice hoặc Lesson Player tùy nguồn vào).
- **Responsive**: mobile-first, 1 câu hỏi/màn hình luôn phù hợp mobile tự nhiên.
- **Mobile behavior**: điều hướng câu trước/sau dạng nút lớn dễ chạm ở 2 bên hoặc đáy màn hình.
- **Accessibility**: mỗi câu hỏi là 1 `fieldset`/`legend`, lựa chọn là radio group thật, tiến trình câu hỏi công bố qua `aria-live` khi chuyển câu.

### 3.6 LearningProfile (Hồ sơ học tập) — `/student/learning-profile`

**Classification**: Redesign hoàn toàn (từ UI tĩnh sang dữ liệu thật)

- **Purpose**: tổng hợp tiến độ học tập trên toàn bộ khóa học (khác MyCourses — đây là góc nhìn tổng hợp/phân tích, không phải danh sách hành động).
- **Target user**: Student.
- **Entry points**: Sidebar "Hồ sơ học tập".
- **Information hierarchy**: Tổng quan số liệu học tập → chi tiết theo từng khóa học.
- **Page structure / Main sections**: Stat card tổng — tổng số khóa học, tổng bài test đã làm, điểm trung bình (**dữ liệu thật**, gộp trên mọi khóa học). **Không có "% hoàn thành trung bình"** ở phase này — chưa có nguồn dữ liệu thật, chờ Lesson Player (Phase 35). Danh sách chi tiết theo khóa học ở phase này chỉ hiện tên khóa + Teacher (**không có % tiến độ hay số bài test riêng theo từng khóa** — backend hiện chỉ tổng hợp được số liệu gộp trên toàn bộ khóa học của Student, chưa breakdown theo từng khóa; xem ghi chú Phase 28 ở REFACTOR_PLAN.md).
- **Primary action**: click 1 dòng khóa học → tạm thời điều hướng tới MyCourses (Lesson Player chưa tồn tại).
- **Component patterns**: Stat card (Card app), Table hoặc list tùy độ dài — Student thường có ít khóa học nên dùng list-card nhất quán với MyCourses/Test Practice thay vì Table đầy đủ (Table dành riêng cho khu vực Admin/Teacher theo Design System §10.5).
- **Loading state**: skeleton.
- **Empty state**: Empty State giống MyCourses khi chưa có khóa học nào.
- **Error state**: Toast lỗi khi fetch thất bại.
- **Success state**: không áp dụng.
- **Responsive**: mobile-first.
- **Mobile behavior**: stat card chuyển `grid-cols-2`.
- **Accessibility**: số liệu tổng hợp có text mô tả đầy đủ, không chỉ số/icon.

### 3.7 Profile — `/student/profile`

**Classification**: Redesign (giữ cấu trúc form, đổi token, sửa thiếu `alt` cho avatar)

- **Purpose**: xem/sửa thông tin cá nhân.
- **Target user**: Student (áp dụng chung pattern cho Teacher/Admin nếu có trang tương đương, không nằm trong scope PRD hiện tại nên chỉ định nghĩa cho Student).
- **Entry points**: Header avatar menu "Chỉnh sửa hồ sơ".
- **Information hierarchy**: Avatar + thông tin cơ bản → form chỉnh sửa.
- **Page structure / Main sections**: Card app chứa avatar (có `alt` — hiện thiếu), form (họ tên, email, các field khác hiện có), Button `primary` "Lưu thay đổi".
- **Primary action**: Button `primary` "Lưu thay đổi".
- **Component patterns**: Input filled, Button primary, Avatar image.
- **Loading state**: Button `loading` khi lưu; skeleton form khi tải dữ liệu profile lần đầu.
- **Empty state**: không áp dụng.
- **Error state**: inline error dưới field khi validate thất bại, Toast khi lưu server lỗi.
- **Success state**: Toast `status-success-text` "Đã lưu thay đổi".
- **Responsive**: mobile-first, form 1 cột.
- **Mobile behavior**: không có hành vi đặc biệt.
- **Accessibility**: avatar `<img>` bắt buộc có `alt` (hiện đang thiếu — audit finding), nút đổi avatar (nếu có) có `aria-label`.

---

## 4. Teacher Pages (toàn bộ mới — PRD-009 → PRD-015)

### 4.1 Teacher Dashboard — `/teacher/dashboard`

**Classification**: New

- **Purpose**: tổng quan hoạt động giảng dạy của Teacher — số khóa học, học viên, trạng thái publish.
- **Target user**: Teacher.
- **Entry points**: mặc định khi vào `/teacher`, Sidebar "Tổng quan".
- **Information hierarchy**: Stat card tổng quan → danh sách khóa học cần chú ý (Draft chưa publish, hoặc có yêu cầu hoàn tiền liên quan).
- **Page structure / Main sections**: 3-4 stat card (`card-app`, compact — tổng khóa học, tổng học viên, khóa học đang Draft), danh sách rút gọn "Khóa học của bạn" (link sang Teacher Courses List).
- **Primary action**: click stat/danh sách → Teacher Courses List hoặc Course Editor tương ứng.
- **Component patterns**: Stat card, list-card.
- **Loading state**: skeleton.
- **Empty state**: nếu Teacher chưa có khóa học nào, Empty State "Bạn chưa có khóa học nào" + CTA `primary` "Tạo khóa học đầu tiên" (→ Course Editor chế độ tạo mới).
- **Error state**: Toast lỗi khi fetch thất bại.
- **Success state**: không áp dụng.
- **Responsive**: Teacher là khu vực desktop-first (Design System §16) — tối ưu từ `lg` trở lên, vẫn dùng được dưới `lg` nhưng không tối ưu sâu (stat card xếp `grid-cols-2` trên mobile, chấp nhận được).
- **Mobile behavior**: không tối ưu sâu — dùng được, không thiết kế riêng.
- **Accessibility**: theo chuẩn WCAG AA chung (§15), không có yêu cầu đặc thù thêm.

### 4.2 Teacher Courses List — `/teacher/courses`

**Classification**: New

- **Purpose**: liệt kê toàn bộ khóa học Teacher sở hữu, trạng thái, truy cập nhanh vào Course Editor.
- **Target user**: Teacher.
- **Entry points**: Sidebar "Khóa học của tôi".
- **Information hierarchy**: Danh sách khóa học + trạng thái (Draft/Published/Archived) + action.
- **Page structure / Main sections**: Table thật (density Compact theo §10.5, vì đây là khu vực Admin/Teacher data-heavy) — cột: Tên khóa học, Trạng thái (badge), Số học viên, Ngày cập nhật, Action (Sửa/Xem). Button `primary` "Tạo khóa học mới" ở góc trên.
- **Primary action**: Button `primary` "Tạo khóa học mới" → Course Editor (chế độ tạo mới). **Secondary**: click dòng/action "Sửa" → Course Editor (chế độ chỉnh sửa).
- **Component patterns**: Table (§10.5, sort/filter theo cột — filter theo trạng thái), Badge trạng thái, Button primary.
- **Loading state**: skeleton row trong table.
- **Empty state**: Empty State thay bảng "Bạn chưa có khóa học nào" + CTA "Tạo khóa học mới".
- **Error state**: Toast lỗi khi fetch thất bại.
- **Success state**: không áp dụng.
- **Responsive**: desktop-first — dưới `lg`, table cuộn ngang trong container riêng (§10.5).
- **Mobile behavior**: dùng được qua scroll ngang, không tối ưu card-list riêng cho mobile.
- **Accessibility**: header cột table có thể sort báo trạng thái sort hiện tại qua `aria-sort`.

### 4.3 Course Editor — `/teacher/courses/new` và `/teacher/courses/:id/edit`

**Classification**: New — theo quyết định đã chốt: 1 màn hình, tab nội bộ, dùng chung tạo mới/chỉnh sửa

- **Purpose**: nơi Teacher tạo và quản lý toàn bộ nội dung 1 khóa học — thông tin, lesson, quiz, trạng thái, xem học viên.
- **Target user**: Teacher (chỉ với khóa học của chính mình — ownership check theo ADR-008).
- **Entry points**: "Tạo khóa học mới" hoặc "Sửa" từ Teacher Courses List, hoặc từ Teacher Dashboard.
- **Information hierarchy**: Tên khóa học + trạng thái ở đầu trang (luôn hiển thị dù đang ở tab nào) → nội dung theo tab đang chọn.
- **Page structure / Main sections**:
  1. Header cố định trong trang: tên khóa học (editable inline hoặc trong tab Tổng quan), badge trạng thái hiện tại, Button trạng thái chuyển đổi (Publish/Archive theo BR-004 — chỉ Teacher tự chuyển, không phải Admin force-unpublish).
  2. Tab nội bộ (5 tab, mở rộng từ 4 tab đã thống nhất bằng cách gộp "Học viên" theo PRD-015 thay vì tách trang riêng):
     - **Tổng quan**: tên, mô tả, giá, category, thumbnail — form chuẩn (§11).
     - **Curriculum**: danh sách lesson, thêm/sửa/xóa/sắp xếp lại thứ tự, mỗi lesson chọn loại nội dung (video upload/embed — PRD-012, tài liệu/text, quiz gắn lesson — PRD-013), toggle "Lesson xem thử" (PRD-006).
     - **Quiz (test tổng)**: tạo/sửa bài kiểm tra tổng khóa học — danh sách câu hỏi trắc nghiệm, mỗi câu có các lựa chọn + đánh dấu đáp án đúng (PRD-014).
     - **Học viên**: danh sách Student đã đăng ký, tiến độ từng người (Table, chỉ đọc — PRD-015). Tab này **disabled/ẩn khi đang ở chế độ tạo mới** (chưa có `id` khóa học, chưa thể có học viên).
     - **Cài đặt**: chuyển trạng thái Draft/Published/Archived (BR-004), xóa khóa học (nếu cho phép — action `danger` có xác nhận).
- **Primary action**: tùy tab — "Lưu" (Tổng quan/Cài đặt), "Thêm lesson"/"Thêm câu hỏi" (Curriculum/Quiz). **Secondary**: "Publish"/"Archive" ở header.
- **Component patterns**: Tab navigation (mới trong Design System — biến thể của Sidebar nav áp dụng ngang, dùng `nav-selected-*` token tương tự), Table (tab Học viên), Form pattern (§11) cho Tổng quan/Curriculum item/Quiz question, Button variants đầy đủ theo ngữ cảnh (primary cho lưu, cta cho publish nếu coi là hành động chuyển đổi quan trọng nhất, danger cho xóa).
- **Loading state**: skeleton toàn trang khi tải khóa học (chế độ sửa); form trống ngay lập tức ở chế độ tạo mới.
- **Empty state**: tab Curriculum/Quiz hiện Empty State "Chưa có lesson nào"/"Chưa có câu hỏi nào" + CTA thêm mới; tab Học viên hiện Empty State "Chưa có học viên đăng ký" khi khóa học chưa có ai mua.
- **Error state**: inline error cho form (§11); Toast lỗi khi lưu/publish thất bại — **publish thất bại nếu curriculum rỗng hoặc thiếu thông tin bắt buộc, thông báo rõ lý do** (không publish khóa học rỗng).
- **Success state**: Toast `status-success-text` sau mỗi lần lưu; Toast riêng khi publish thành công ("Khóa học đã được xuất bản").
- **Responsive**: desktop-first — đây là công cụ soạn thảo phức tạp, không tối ưu sâu cho mobile, nhưng tab vẫn dùng được (chuyển tab thành dropdown chọn thay vì hàng ngang khi màn hình hẹp).
- **Mobile behavior**: chấp nhận được, không thiết kế riêng.
- **Accessibility**: tab navigation dùng `role="tablist"`/`role="tab"`/`aria-selected` chuẩn, điều hướng tab bằng phím mũi tên trái/phải.

---

## 5. Admin Pages

### 5.1 AdminDashboard — `/admin/dashboard`

**Classification**: Redesign (thay 100% số liệu hardcode bằng dữ liệu thật — PRD-028)

- **Purpose**: tổng quan vận hành toàn nền tảng cho Admin.
- **Target user**: Admin.
- **Entry points**: mặc định khi vào `/admin`, Sidebar "Dashboard".
- **Information hierarchy**: Stat card tổng (doanh thu, học viên, khóa học, Teacher) → hoạt động cần chú ý (yêu cầu hoàn tiền đang chờ, khóa học mới publish).
- **Page structure / Main sections**: 4 stat card thật (tổng doanh thu, tổng học viên, tổng khóa học, tổng Teacher — thay "Recent Activities" giả và chart "Coming soon" hiện tại), danh sách rút gọn "Yêu cầu hoàn tiền đang chờ duyệt" (link sang AdminRefunds), danh sách rút gọn "Khóa học mới publish gần đây" (link sang AdminCourses).
- **Primary action**: click từng mục → trang chi tiết tương ứng (AdminRefunds/AdminCourses).
- **Component patterns**: Stat card, list-card rút gọn, Table không cần ở đây (chỉ preview, xem đầy đủ ở trang con).
- **Loading state**: skeleton từng stat card + danh sách.
- **Empty state**: danh sách rút gọn hiện Empty State nhỏ ("Không có yêu cầu nào đang chờ") khi rỗng — không phải lỗi.
- **Error state**: Toast lỗi khi fetch thất bại, stat card hiện "—".
- **Success state**: không áp dụng.
- **Responsive**: desktop-first, stat card `grid-cols-2` trên mobile.
- **Mobile behavior**: chấp nhận được, không tối ưu sâu.
- **Accessibility**: số liệu có text label rõ, không chỉ số lớn không ngữ cảnh.

### 5.2 AdminUsersList — `/admin/users`

**Classification**: Redesign + bổ sung action (mời Teacher — PRD-002)

- **Purpose**: quản lý toàn bộ tài khoản (Student, Teacher, Admin) — xem, khóa/mở khóa, mời Teacher mới.
- **Target user**: Admin.
- **Entry points**: Sidebar "Users".
- **Information hierarchy**: Filter theo role → bảng danh sách → action mỗi dòng.
- **Page structure / Main sections**: Filter tab/dropdown theo role (Tất cả/Student/Teacher/Admin), Table thật (§10.5, Compact) — cột: Tên, Email, Role (badge), Trạng thái (Active/Locked), Ngày tạo, Action (Khóa/Mở khóa). Button `primary` "Mời Teacher" (mở Modal form — chỉ tạo tài khoản Teacher, không phải Student — BR-002) thay cho việc dùng chung 1 nút "Thêm user" mơ hồ như hiện tại nếu có.
- **Primary action**: Button `primary` "Mời Teacher". **Secondary**: action Khóa/Mở khóa mỗi dòng (button `danger`/`secondary` tùy trạng thái, có xác nhận qua Modal).
- **Component patterns**: Table (§10.5), Filter tab, Modal (§10.9, dùng chung `UserFormOverlay` cho form mời Teacher — hợp nhất `AddUserOverlay`/`EditUserOverlay` gần-trùng-lặp hiện tại theo Architecture §4), Badge role/trạng thái.
- **Loading state**: skeleton row.
- **Empty state**: Empty State khi filter không có kết quả ("Không có user nào phù hợp").
- **Error state**: Toast lỗi fetch/action thất bại.
- **Success state**: Toast `status-success-text` sau khi mời Teacher thành công / khóa-mở khóa thành công.
- **Responsive**: desktop-first, table cuộn ngang dưới `lg`.
- **Mobile behavior**: chấp nhận được.
- **Accessibility**: action khóa/mở khóa có `aria-label` mô tả rõ đối tượng ("Khóa tài khoản Nguyễn Văn A"), modal xác nhận theo §10.9.

### 5.3 AdminCourses — `/admin/courses`

**Classification**: Redesign trách nhiệm (thay đổi mục đích: từ "Admin CRUD trực tiếp" sang "Admin giám sát" — theo module boundary ADR-008/PRD-030, không phải feature mới mà là sửa sai lệch trách nhiệm)

- **Purpose**: Admin xem toàn bộ khóa học trên nền tảng (mọi Teacher), can thiệp khi vi phạm (force-unpublish, thu hồi quyền truy cập) — **không còn là nơi Admin tự tạo/sửa khóa học** (việc đó nay thuộc Course Editor của Teacher).
- **Target user**: Admin.
- **Entry points**: Sidebar "Courses".
- **Information hierarchy**: Bảng toàn bộ khóa học (mọi Teacher) → action giám sát.
- **Page structure / Main sections**: Table thật (Compact) — cột: Tên khóa học, Teacher sở hữu, Trạng thái, Số học viên, Ngày publish, Action gồm 3 mục tách biệt: "Xem" (→ CourseDetailPage công khai để kiểm tra nội dung), "Force-unpublish" (button `danger`, Modal xác nhận + lý do vi phạm, ghi audit log theo PRD-030 — chỉ ẩn khỏi catalog, **không** thu hồi quyền truy cập người đã mua theo BR-005), "Thu hồi quyền truy cập" (button `danger`, Modal xác nhận **riêng biệt** yêu cầu nhập lý do — gọi `POST /admin/enrollments/{id}/revoke-access` cho từng học viên của khóa học, ghi audit log theo PRD-027/ADR-025).
- **Primary action**: action "Force-unpublish" hoặc "Thu hồi quyền truy cập" (khi cần — 2 action độc lập, không được gộp chung 1 nút/1 Modal). Không còn "Thêm khóa học" ở trang này.
- **Component patterns**: Table, Badge trạng thái, Modal xác nhận (§10.9) riêng cho từng action (force-unpublish và thu hồi quyền truy cập không dùng chung Modal).
- **Loading state**: skeleton row.
- **Empty state**: không thực sự xảy ra (luôn có khóa học nếu nền tảng đã vận hành) — nếu rỗng, Empty State "Chưa có khóa học nào trên nền tảng".
- **Error state**: Toast lỗi fetch/action thất bại.
- **Success state**: Toast `status-success-text` sau force-unpublish hoặc thu hồi quyền truy cập thành công.
- **Responsive**: desktop-first.
- **Mobile behavior**: chấp nhận được.
- **Accessibility**: mọi hành động phá hủy/hạn chế (force-unpublish, thu hồi quyền truy cập) luôn qua Modal xác nhận rõ hậu quả, tách biệt nhau (theo PRD-027 "thu hồi truy cập là hành động tường minh riêng").

### 5.4 AdminCategories — `/admin/categories`

**Classification**: Redesign (visual only, giữ nguyên cấu trúc CRUD — trang này vốn đã đúng trách nhiệm)

- **Purpose**: quản lý danh mục khóa học.
- **Target user**: Admin.
- **Entry points**: Sidebar "Categories".
- **Information hierarchy**: Bảng danh mục → action CRUD.
- **Page structure / Main sections**: Table (Compact) — cột: Tên danh mục, Số khóa học thuộc danh mục, Action (Sửa/Xóa). Button `primary` "Thêm danh mục".
- **Primary action**: Button `primary` "Thêm danh mục". **Secondary**: Sửa/Xóa mỗi dòng.
- **Component patterns**: Table, Modal (dùng chung `CategoryFormOverlay`, `ConfirmDeleteModal` — hợp nhất theo Architecture §4).
- **Loading state**: skeleton row.
- **Empty state**: Empty State "Chưa có danh mục nào" + CTA "Thêm danh mục".
- **Error state**: Toast lỗi; nếu xóa danh mục đang có khóa học thuộc về, chặn xóa với inline message rõ lý do (không phải lỗi chung chung).
- **Success state**: Toast `status-success-text` sau CRUD thành công.
- **Responsive**: desktop-first.
- **Mobile behavior**: chấp nhận được.
- **Accessibility**: Modal xóa dùng `ConfirmDeleteModal` chuẩn (§10.9).

### 5.5 AdminOrders — `/admin/orders`

**Classification**: Redesign (giữ mục đích xem giao dịch, cập nhật trạng thái theo enum thật — ADR-005, tách phần refund sang trang riêng theo quyết định đã chốt)

- **Purpose**: xem toàn bộ giao dịch thanh toán trên nền tảng (chỉ xem — xử lý hoàn tiền chuyển sang AdminRefunds).
- **Target user**: Admin.
- **Entry points**: Sidebar "Orders".
- **Information hierarchy**: Bảng giao dịch, filter theo trạng thái.
- **Page structure / Main sections**: Filter theo trạng thái (Pending/Success/Failed/Refunded — enum thật thay string tự do), Table (Compact) — cột: Học viên, Khóa học, Số tiền, Phương thức (VNPay/Momo/Stripe), Trạng thái (badge), Ngày giao dịch.
- **Primary action**: không có action ghi (chỉ xem — read-only theo đúng trách nhiệm module `payment`). **Secondary**: click dòng để xem chi tiết giao dịch (mở Modal chi tiết, không phải trang riêng).
- **Component patterns**: Table, Filter, Modal chi tiết (read-only).
- **Loading state**: skeleton row.
- **Empty state**: Empty State khi filter rỗng kết quả.
- **Error state**: Toast lỗi fetch.
- **Success state**: không áp dụng (trang read-only).
- **Responsive**: desktop-first.
- **Mobile behavior**: chấp nhận được.
- **Accessibility**: badge trạng thái luôn kèm text.

### 5.6 AdminCoupons — `/admin/coupons` (mới)

**Classification**: New — PRD-023/024, chỉ Admin tạo (BR-003)

- **Purpose**: tạo/quản lý mã giảm giá áp dụng toàn nền tảng hoặc theo khóa học cụ thể.
- **Target user**: Admin.
- **Entry points**: Sidebar "Coupons".
- **Information hierarchy**: Bảng coupon → action CRUD.
- **Page structure / Main sections**: Table (Compact) — cột: Mã coupon, Loại giảm (%/số tiền cố định), Phạm vi (Toàn nền tảng/Khóa học cụ thể), Hạn dùng, Số lượt đã dùng, Trạng thái (Đang hoạt động/Hết hạn), Action (Sửa/Vô hiệu hóa). Button `primary` "Tạo coupon".
- **Primary action**: Button `primary` "Tạo coupon" (Modal form: mã, loại giảm, phạm vi — chọn khóa học nếu không phải toàn nền tảng, hạn dùng, giới hạn lượt dùng). **Secondary**: Sửa/Vô hiệu hóa mỗi dòng.
- **Component patterns**: Table, Modal form (§10.9 + §11), Badge trạng thái.
- **Loading state**: skeleton row.
- **Empty state**: Empty State "Chưa có coupon nào" + CTA "Tạo coupon".
- **Error state**: inline error trong Modal khi tạo trùng mã coupon; Toast lỗi fetch.
- **Success state**: Toast `status-success-text` sau khi tạo/sửa thành công.
- **Responsive**: desktop-first.
- **Mobile behavior**: chấp nhận được.
- **Accessibility**: form Modal theo §11 chuẩn.

### 5.7 AdminRefunds — `/admin/refunds` (mới)

**Classification**: New — PRD-025/026, theo quyết định đã chốt (trang riêng, tách khỏi Orders)

- **Purpose**: Admin xem xét, duyệt/từ chối yêu cầu hoàn tiền từ Student; sau khi duyệt, đánh dấu đã hoàn tiền thủ công (Phase 1 — Manual adapter theo ADR-011).
- **Target user**: Admin.
- **Entry points**: Sidebar "Refunds", link rút gọn từ AdminDashboard.
- **Information hierarchy**: Filter theo trạng thái nghiệp vụ (Đang chờ/Đã duyệt/Đã từ chối) → bảng yêu cầu → chi tiết + action duyệt.
- **Page structure / Main sections**: Filter theo `businessStatus` (REQUESTED/APPROVED/REJECTED), Table (Compact) — cột: Học viên, Khóa học, Số tiền, Lý do (rút gọn, click xem đầy đủ), Ngày yêu cầu, Trạng thái nghiệp vụ (badge), Trạng thái xử lý (badge riêng — `executionStatus`: Chưa xử lý/Đang hoàn tiền thủ công/Đã hoàn tất). Click dòng mở Modal chi tiết với action "Duyệt"/"Từ chối" (nếu đang REQUESTED) hoặc "Đánh dấu đã hoàn tiền" (nếu đã APPROVED nhưng chưa MANUAL_COMPLETED).
- **Primary action**: trong Modal chi tiết — "Duyệt" (`primary`)/"Từ chối" (`secondary`, yêu cầu nhập lý do) khi đang chờ; "Đánh dấu đã hoàn tiền" (`primary`) khi đã duyệt — **không có action nào tự động gọi cổng thanh toán ở Phase 1** (đúng ADR-011).
- **Component patterns**: Table, Filter kép (2 loại trạng thái), Modal chi tiết + action, Badge trạng thái (2 loại tách biệt theo đúng ADR-010).
- **Loading state**: skeleton row.
- **Empty state**: Empty State theo từng filter ("Không có yêu cầu nào đang chờ duyệt").
- **Error state**: Toast lỗi khi duyệt/từ chối/đánh dấu thất bại.
- **Success state**: Toast `status-success-text` sau mỗi action, cập nhật badge trạng thái ngay trong bảng (không cần reload).
- **Responsive**: desktop-first.
- **Mobile behavior**: chấp nhận được.
- **Accessibility**: 2 loại badge trạng thái (nghiệp vụ + xử lý) phải phân biệt rõ bằng text, không chỉ màu — dễ nhầm lẫn nếu chỉ dựa màu sắc.

### 5.8 AdminAuditLog — `/admin/audit-log` (mới)

**Classification**: New — PRD-033/034

- **Purpose**: tra cứu lịch sử hành động nhạy cảm (đăng nhập/bảo mật, thanh toán/refund, Teacher CUD course/quiz, Admin hành động nhạy cảm) để điều tra khi cần.
- **Target user**: Admin.
- **Entry points**: Sidebar "Audit Log".
- **Information hierarchy**: Filter (theo actor/loại hành động/khoảng thời gian) → bảng log theo thời gian giảm dần.
- **Page structure / Main sections**: Filter (dropdown actor, dropdown loại hành động, `DateRangeInput`), Table (Compact, mật độ cao vì log thường nhiều dòng) — cột: Thời gian, Người thực hiện, Hành động, Đối tượng, Chi tiết (click xem metadata đầy đủ trong Modal read-only).
- **Primary action**: không có action ghi (read-only). **Secondary**: filter, xem chi tiết 1 dòng.
- **Component patterns**: Table, Filter (`DateRangeInput` — Design System §10.2), Modal chi tiết read-only.
- **Loading state**: skeleton row.
- **Empty state**: Empty State khi filter rỗng kết quả ("Không có log nào phù hợp bộ lọc").
- **Error state**: Toast lỗi fetch.
- **Success state**: không áp dụng.
- **Responsive**: desktop-first — đây là công cụ điều tra chuyên sâu, không cần tối ưu mobile.
- **Mobile behavior**: chấp nhận được, không thiết kế riêng.
- **Accessibility**: `DateRangeInput` điều hướng được bằng bàn phím, bảng log dài cần pagination rõ ràng (không infinite scroll để giữ khả năng tham chiếu vị trí khi điều tra).

---

## 6. Removed

| Item | Lý do |
|---|---|
| `src/pages/auth/AuthPage.tsx` | File rỗng, không được route tới — dead code, xóa hoàn toàn, không có page thay thế cần thiết |
| Checkout dạng 1-trang hiện tại | Thay bằng 2 bước (§2.8, §2.9) + trang kết quả (§2.10) theo quyết định đã chốt |
| AdminCourses vai trò "CRUD trực tiếp" | Trách nhiệm CRUD chuyển sang Teacher Course Editor (§4.3); AdminCourses giữ lại nhưng đổi mục đích thành giám sát (§5.3) |
