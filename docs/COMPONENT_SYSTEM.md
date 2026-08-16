# Component System — Academic Management Platform (Version mới)

Nguồn: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/UI_SPEC.md`, frontend code hiện tại (`academic-management-website/src`).

Tài liệu này xác định ranh giới component trước khi refactor frontend — không implement, không sửa code.

---

## 1. Inventory & Classification

### 1.1 Component hiện có

| Component | Vị trí | Phân loại | Lý do / Hướng xử lý |
|---|---|---|---|
| `Badge` | `components/common/Badge.tsx` | **Needs refactor** | Hardcode `bg-blue-100`/`green-100`/`red-100` thay vì `status-*-bg`/`status-*-text` token — giữ shape (text+color prop) nhưng đổi nguồn màu |
| `EmptyState` | `components/common/EmptyState.tsx` | **Reusable** | Đã đúng shape (icon+title+description+action), chỉ cần refactor token + mở khả năng nhận illustration thay icon |
| `Skeleton` + `SkeletonCard`/`SkeletonCardGrid`/`SkeletonRow`/`SkeletonTable`/`SkeletonText` | `components/common/Skeleton.tsx` | **Reusable** | Đã composable tốt, là ví dụ đúng hướng — chỉ refactor `bg-slate-200` → `surface-muted` |
| `Toast` | `components/common/Toast.tsx` | **Needs refactor** (gap nghiêm trọng) | Chỉ là component hiển thị đơn lẻ — **không có Provider/queue**, mọi trang tự viết `useState`+`setTimeout` riêng (audit finding). Phải tách thành `ToastProvider` + `useToast()` + `Toast` |
| `CourseCard` | `components/public/CourseCard.tsx` | **Needs refactor** | Hardcode `text-gray-900`/`text-indigo-600`/`bg-blue-600` thay vì token; giữ nguyên shape props |
| `TeacherCard` | `components/public/TeacherCard.tsx` | **Needs refactor + rename** | Hardcode màu; kiểu dữ liệu `Teacher` tĩnh không khớp entity thật — đổi tên `InstructorCard`, đổi shape theo dữ liệu Teacher thật (PRD-002) |
| `Header` (Public) | `components/public/Header.tsx` | **Needs refactor** | Avatar hardcode URL CDN ngoài; token màu cần đổi; giữ cấu trúc |
| `Footer` | `components/public/Footer.tsx` | **Needs refactor** | Gradient `slate-900→800` ngoài palette; giữ cấu trúc |
| `PublicLayout` | `components/public/PublicLayout.tsx` | **Reusable structure** | Giữ, chỉ refactor token nền (`bg-surface`) |
| `StudentHeader` | `components/student/StudentHeader.tsx` | **Duplicated** (với AdminHeader) | Cùng vai trò Topbar — gộp vào `AppHeader` (Layout layer) |
| `StudentSidebar` | `components/student/StudentSidebar.tsx` | **Duplicated** (với AdminSidebar) | Cùng cấu trúc, khác nav items — gộp vào `SidebarNav` dùng chung |
| `StudentLayout` | `components/student/StudentLayout.tsx` | **Duplicated** (với AdminLayout, và sẽ trùng lần 3 nếu tự viết TeacherLayout) | Gộp thành 1 `AppShellLayout` tham số hóa theo nav config |
| `InfoItem` | `components/student/InfoItem.tsx` | **Too specific → thay bằng primitive** | Hardcode màu (`gray-400`, `blue-400`); chỉ dùng ở Profile; label+value+editable nên là `FormField`/`Input` chuẩn, không cần component riêng |
| `AdminHeader` | `components/admin/AdminHeader.tsx` | **Duplicated** (với StudentHeader) | Gộp vào `AppHeader` |
| `AdminSidebar` | `components/admin/AdminSidebar.tsx` | **Duplicated** (với StudentSidebar) | Gộp vào `SidebarNav` |
| `AdminLayout` | `components/admin/AdminLayout.tsx` | **Duplicated** | Gộp vào `AppShellLayout` |
| `AddUserOverlay` | `components/admin/AddUserOverlay.tsx` | **Duplicated** (gần trùng `EditUserOverlay`) | Gộp thành `UserFormOverlay` (mode `add`/`edit`/`invite-teacher`) |
| `EditUserOverlay` | `components/admin/EditUserOverlay.tsx` | **Duplicated** | Gộp vào `UserFormOverlay` |
| `AddCourseOverlay` | `components/admin/AddCourseOverlay.tsx` | **Obsolete** | Admin không còn tự tạo/sửa khóa học (UI_SPEC §5.3 — trách nhiệm chuyển sang Teacher Course Editor). Sub-component `Field` nội bộ là hình mẫu tốt cho `FormField` primitive mới, nhưng bản thân Overlay này bị xóa khỏi Admin |
| `CategoryOverlay` | `components/admin/CategoryOverlay.tsx` | **Needs refactor** | Vẫn cần (AdminCategories giữ đúng trách nhiệm — UI_SPEC §5.4), đổi tên `CategoryFormOverlay`, dựng lại trên `Modal` + `FormField` primitive thay vì tự viết `AnimatePresence`/input riêng |
| `OrderSummary` | `components/checkout/OrderSummary.tsx` | **Needs refactor** | Cấu trúc đúng nhu cầu Checkout Bước 1 (UI_SPEC §2.8), nhưng hardcode màu, copy chính sách hoàn tiền cứng ("30 ngày") sai vì BR-009 chưa chốt quy tắc — đổi tên `OrderSummaryCard`, bỏ text hardcode |
| `PaymentForm` | `components/checkout/PaymentForm.tsx` | **Obsolete — phải xóa** | Thu thập số thẻ/CVC thô trong DOM của mình — **không tương thích với ADR-009** (VNPay/Momo là redirect+checksum, Stripe phải dùng Stripe Elements/Checkout đã tokenize; tự thu thập card number là rủi ro PCI thật). Thay bằng `PaymentMethodSelector` (radio-card chọn gateway, UI_SPEC §2.9) |
| `EnrollSuccessOverlay` | `components/checkout/EnrollSuccessOverlay.tsx` | **Obsolete** | Modal ăn mừng bị thay bởi trang Checkout Result đầy đủ (UI_SPEC §2.10); cũng dùng emoji `🎉` làm icon — vi phạm quy tắc iconography (Design System §9, chỉ lucide-react) |
| `pages/auth/AuthPage.tsx` | — | **Should be removed** | File rỗng, không route tới — dead code (đã ghi nhận từ audit trước) |
| `pages/student/dashboard/MyCoursesOverview.tsx` | — | **Should be removed** | File rỗng — dead code (phát hiện mới khi kiểm tra lần này) |

### 1.2 Component còn thiếu hoàn toàn (không tồn tại dưới bất kỳ hình thức nào)

Đây là phát hiện quan trọng: hệ thống hiện tại **không có primitive nào** — mọi `<button>`, `<input>`, khối "card", modal, table đều viết tay lặp lại ở từng nơi (PaymentForm, CategoryOverlay, Login, Signup, Profile mỗi nơi tự viết input/label/error markup riêng). Đây là nguyên nhân gốc của phần lớn duplication mà audit đã tìm thấy.

| Component cần tạo mới | Vì sao chưa có nhưng cần |
|---|---|
| `Button` | Chưa tồn tại — mọi nơi tự viết `<button className="...">` |
| `Input` / `Textarea` | Chưa tồn tại — tự viết markup input+focus-ring riêng ở mỗi form |
| `FormField` | Chưa tồn tại — label/error/helper text lặp lại thủ công mọi nơi (gần nhất là `Field` nội bộ trong `AddCourseOverlay`, không export dùng chung) |
| `Card` (marketing/app variant) | Chưa tồn tại — chỉ là `className` lặp lại |
| `Modal` | Chưa tồn tại — mỗi Overlay tự viết `AnimatePresence`+backdrop riêng |
| `ConfirmDeleteModal` | Chưa tồn tại — modal xác nhận xóa copy-paste inline ở 3 trang Admin (audit finding) |
| `Table` | Chưa tồn tại — mỗi trang Admin tự viết `<table>` |
| `Tabs` | Chưa tồn tại — cần mới cho Teacher Course Editor (UI_SPEC §4.3) |
| `SidebarNav` | Chưa tồn tại dưới dạng dùng chung (2 bản trùng lặp riêng lẻ) |
| `StatCard` | Chưa tồn tại — mỗi dashboard tự viết khối số liệu |
| `ProgressBar` | Chưa tồn tại — HomePage hardcode `div` progress ngay trong page |
| `RadioCardGroup` | Chưa tồn tại — cần cho chọn gateway (UI_SPEC §2.9) và chọn đáp án quiz (UI_SPEC §3.5) |
| `DateRangeInput` | Chưa tồn tại — cần cho filter AdminAuditLog (UI_SPEC §5.8) |
| `DropdownMenu` | Chưa tồn tại — cần cho menu "···" ở MyCourses (UI_SPEC §3.2) |

---

## 2. Component Model

5 tầng, phụ thuộc một chiều (tầng dưới không được biết tới tầng trên):

```
5. Page-specific   → chỉ dùng trong đúng 1 page, không export dùng lại
4. Feature/Domain   → gắn với 1 nghiệp vụ cụ thể (Course, Payment, Refund...)
3. Layout           → khung trang (Header, Sidebar, Shell)
2. Shared UI        → tổ hợp primitive phục vụ nhiều nghiệp vụ (Modal, Table, Toast, Tabs...)
1. Design Primitives → nguyên tử thị giác, không biết gì về nghiệp vụ (Button, Input, Card, Badge)
```

**Nguyên tắc phụ thuộc** (mở rộng Dependency Rules ở `ARCHITECTURE.md` §14 sang frontend):
- Primitive (1) không import Shared/Layout/Feature/Page — không biết `course`, `payment`, `user` là gì.
- Shared UI (2) không import Feature/Page — không chứa business logic (không gọi API, không biết PRD rule nào).
- Layout (3) chỉ biết "có những vùng nào" (header/sidebar/content), không biết nội dung nghiệp vụ bên trong.
- Feature (4) được phép gọi API/hook dữ liệu (React Query theo ADR-020), được phép biết rule nghiệp vụ (ví dụ "chỉ Admin tạo coupon" — BR-003), nhưng không tự vẽ lại primitive đã có.
- Page (5) chỉ compose Feature + Shared + Layout, không chứa markup thị giác gốc, không chứa business logic phức tạp — nếu 1 page dài quá vì logic, logic đó thuộc Feature layer, không phải Page layer (đây là cách tránh god component — `AdminCourses.tsx`/`AdminUsersList.tsx` hiện tại vi phạm chính xác nguyên tắc này).

---

## 3. Design Primitives

### 3.1 `Button` — quan trọng

- **Responsibility**: render 1 hành động clickable với đúng phân cấp thị giác theo Design System §10.1. Không biết gì về nghiệp vụ (không có prop `courseId`, không tự gọi API).
- **Variants**: `cta` | `primary` | `secondary` | `tertiary` | `danger` (đúng 5, không thêm).
- **Sizes**: `sm` | `md` (mặc định) | `lg`.
- **States**: default, hover, active, focus-visible, `disabled`, `loading` (khi `loading=true`: hiện spinner thay label, tự set `aria-busy="true"`, tự vô hiệu hóa click).
- **Props (conceptual)**: `variant`, `size`, `disabled`, `loading`, `iconLeft`/`iconRight` (icon lucide, optional), `children` (label), `onClick`, `type` (`button`/`submit`), `asChild`/`href` (nếu cần render như link nhưng giữ style button — chỉ thêm nếu thực sự có ca dùng, không thêm trước).
- **Composition rules**: mọi nơi trong app render hành động clickable **phải** dùng `Button`, không tự viết `<button className="...">`. `cta` chỉ 1 instance hiển thị cùng lúc trong 1 khung nhìn (rule nghiệp vụ này do **Feature/Page layer tự tuân thủ**, `Button` component không tự đếm/enforce — primitive không biết ngữ cảnh trang).
- **Accessibility**: `<button>` thật (không phải `<div onClick>`); icon-only variant bắt buộc `aria-label` qua prop riêng; `loading` phải giữ nguyên kích thước (không co lại khi mất text) để tránh layout shift.
- **Khi nào dùng**: mọi hành động do người dùng chủ động kích hoạt.
- **Khi nào không dùng**: điều hướng thuần túy giữa trang tĩnh (dùng `Link`/`NavLink` với style `text-link`, không phải `Button`).

### 3.2 `Input` / `Textarea` / `Select` + `FormField` — quan trọng

- **Responsibility**: `Input`/`Textarea`/`Select` là nguyên tử nhập liệu filled-style (Design System §10.2). `FormField` là wrapper bố cục (label phía trên + control + helper/error text) — tách riêng vì label/error là bố cục dùng chung cho mọi loại control, không nên nhân bản logic đó vào từng `Input`.
- **Variants**: không có biến thể màu (chỉ 1 style filled theo §10.2); `Select` có biến thể native `<select>` hoặc custom dropdown — dùng native trước, chỉ thay custom khi có nhu cầu cụ thể (tránh abstraction sớm).
- **States**: default, focus (`border-brand`+`focus-ring`), error (`border-danger`), disabled — `FormField` tự quyết định hiển thị helper text thường hay error text dựa trên có `error` prop hay không.
- **Props (conceptual)** — `FormField`: `label`, `required`, `error` (string, optional), `helperText` (string, optional), `children` (control bên trong). `Input`: `value`, `onChange`, `placeholder` (không thay label), `type`, `disabled`, `id` (để `FormField` gắn `htmlFor`).
- **Composition rules**: mọi field trong form **luôn** bọc bởi `FormField`, không hiển thị `error`/`helperText` cùng lúc (đúng rule Design System §11). `Input` không tự biết mình đang "có lỗi" theo nghĩa nghiệp vụ — chỉ nhận `hasError` (boolean) từ `FormField` để đổi border.
- **Accessibility**: `FormField` tự sinh `id` liên kết `label`+`htmlFor`+`aria-describedby` (trỏ tới error/helper) — đây là lý do tách `FormField` riêng thay vì để từng chỗ tự nối `aria-describedby` (đã từng bị bỏ sót ở `PaymentForm`/`CategoryOverlay` hiện tại).
- **Khi nào dùng**: mọi input nhập liệu trong form.
- **Khi nào không dùng**: hiển thị dữ liệu chỉ-đọc không cần chỉnh sửa (dùng text thường + `text-secondary`, không bọc trong `Input disabled` giả — đây chính là lỗi của `InfoItem` hiện tại khi `editable=false`).

**Biến thể `DateRangeInput`** (Design System §10.2): dựng trên cùng token với `Input`, hiển thị khoảng ngày từ–đến trong 1 field, mở date picker khi click (`z-dropdown`). Props conceptual: `value: { from, to }`, `onChange`. Chỉ dùng cho filter Admin/Teacher (ví dụ AdminAuditLog) — không dùng cho nhập ngày đơn.

### 3.3 `Badge`

- **Responsibility**: hiển thị nhãn ngắn cho trạng thái hoặc phân loại.
- **Variants**: `status` (nhận `tone`: `success`/`warning`/`danger`/`info`, tự map sang `status-*-bg`+`status-*-text`) và `neutral` (dùng `surface-brand-muted`+`text-brand`, cho phân loại như category — không phải trạng thái).
- **States**: chỉ có 1 trạng thái hiển thị (không tương tác) — nếu cần badge bấm được (filter chip), đó là component khác (`FilterChip`, feature/shared tùy ngữ cảnh, không ép vào `Badge`).
- **Props (conceptual)**: `tone` (khi `variant="status"`), `children` (text).
- **Composition rules**: mọi badge trạng thái trong toàn app (course status, payment status, refund business/execution status, user active/locked...) dùng chung `Badge`, không tự viết `span` màu riêng.
- **Accessibility**: text luôn hiển thị kèm màu (đã là bản chất của Badge — không chỉ icon/màu đơn thuần).
- **Khi nào dùng**: trạng thái/phân loại ngắn, không tương tác.
- **Khi nào không dùng**: label có thể click (dùng `Button` biến thể nhỏ hoặc `FilterChip`, không "gắn onClick" vào `Badge`).

### 3.4 `Card`

- **Responsibility**: khối nội dung độc lập, 2 biến thể theo Design System §10.3.
- **Variants**: `marketing` (`shadow-soft`, dùng Public) | `app` (`border-default`, `shadow-none`, dùng App/Workspace).
- **Props (conceptual)**: `variant`, `padding` (map tới `space-*` token, mặc định theo variant), `children`.
- **Composition rules**: `Card` chỉ cung cấp khung (nền/bo góc/viền-hoặc-shadow) — nội dung bên trong luôn do Feature/Page layer quyết định, `Card` không tự biết đó là course card hay stat card.
- **Accessibility**: không có yêu cầu riêng ngoài heading bên trong đúng cấp bậc do nơi dùng quyết định.
- **Khi nào dùng**: nhóm nội dung liên quan thành khối trực quan.
- **Khi nào không dùng**: bọc toàn bộ page content chỉ để có padding (dùng layout content area, không lạm dụng `Card` làm wrapper trang).

---

## 4. Shared UI Components

### 4.1 `ToastProvider` + `useToast()` + `Toast` — quan trọng, ưu tiên cao nhất

- **Responsibility**: quản lý hàng đợi thông báo toàn app. Đây là component sửa lỗi nghiêm trọng nhất hiện tại (mọi page tự viết `useState`+`setTimeout` riêng — audit finding).
- **Variants**: tone `success`/`danger`/`warning`/`info` (map `status-*-icon` cho icon, `status-*-text` cho chữ theo Design System).
- **States**: hiển thị → tự động biến mất sau thời lượng cố định toàn hệ thống (1 giá trị duy nhất, không mỗi nơi tự định nghĩa) → có thể đóng thủ công.
- **Props/API (conceptual)**: `ToastProvider` bọc ở gốc app (1 lần duy nhất, trong `AppShellLayout`/root). Hook `useToast()` trả về hàm `showToast({ tone, message })` — Feature/Page layer gọi hàm này, không tự quản state.
- **Composition rules**: **cấm** mọi component khác tự implement toast logic riêng (state+setTimeout) — nếu cần thông báo, luôn gọi `useToast()`.
- **Accessibility**: container toast có `role="status"` (success/info) hoặc `role="alert"` (error) theo Design System §10.8, vị trí `z-toast` (mục 6 Design System).
- **Khi nào dùng**: phản hồi tức thời cho hành động vừa thực hiện.
- **Khi nào không dùng**: lỗi cấp field (dùng `FormField` error), lỗi chặn toàn trang (dùng full-page error state).

### 4.2 `Modal` (+ `ConfirmDeleteModal` dựng trên nó) — quan trọng

- **Responsibility**: `Modal` là khung dialog chuẩn (overlay, focus trap, đóng bằng ESC/click ngoài/nút đóng, `z-modal`) theo Design System §10.9 — không biết nội dung bên trong. `ConfirmDeleteModal` là 1 preset dựng trên `Modal` cho ca dùng lặp lại nhiều nhất: xác nhận xóa.
- **Variants `Modal`**: size `sm`/`md`/`lg` (map max-width).
- **Variants `ConfirmDeleteModal`**: không có — luôn cùng 1 layout (tiêu đề cảnh báo, mô tả hậu quả, `Button danger` "Xóa" + `Button secondary` "Hủy").
- **States**: open/closed (điều khiển từ ngoài qua prop, không tự quản trạng thái mở — Feature/Page layer quyết định khi nào mở).
- **Props (conceptual)** — `Modal`: `open`, `onClose`, `title`, `children`, `footer` (slot cho action buttons). `ConfirmDeleteModal`: `open`, `onClose`, `onConfirm`, `itemName` (để sinh câu hỏi "Xóa {itemName}?"), `loading` (khi đang gọi API xóa).
- **Composition rules**: mọi Overlay hiện có (`AddUserOverlay`/`EditUserOverlay` → `UserFormOverlay`, `CategoryOverlay` → `CategoryFormOverlay`, và modal mới như `RefundReviewModal`) **phải** dựng trên `Modal`, không tự viết `AnimatePresence`+backdrop riêng như hiện tại. Mọi hành động xóa trong toàn app (user, course, category, coupon) dùng `ConfirmDeleteModal`, không copy-paste JSX xác nhận như 3 trang Admin hiện tại.
- **Accessibility**: `Modal` tự quản focus trap + trả focus về phần tử mở modal khi đóng (Design System §10.9) — đặt logic này 1 lần duy nhất ở đây, không lặp lại ở từng Overlay.
- **Khi nào dùng**: xác nhận hoặc nhập liệu ngắn cần chặn luồng chính.
- **Khi nào không dùng**: nội dung dài cần cuộn nhiều (dùng trang riêng — ví dụ Course Editor không phải Modal), hoặc thông báo không cần chặn thao tác (dùng Toast).

### 4.3 `Table` — quan trọng

- **Responsibility**: bảng dữ liệu chuẩn cho khu vực Admin/Teacher (Design System §10.5) — header sticky, sort theo cột, density Compact.
- **Variants**: không có biến thể màu; có "chế độ" `selectable` (checkbox chọn dòng) chỉ bật khi cần (ví dụ nếu sau này cần bulk action — hiện PRD không yêu cầu, **không tạo prop này trước khi cần** — tránh abstraction sớm).
- **States**: loading (dùng `SkeletonRow`/`SkeletonTable` đã có sẵn — tái sử dụng, không viết lại), empty (render `EmptyState` thay vì `<tbody>` rỗng), lỗi (page/feature layer tự xử lý bằng Toast + giữ bảng ở trạng thái trước đó).
- **Props (conceptual)**: `columns` (định nghĩa header + cách render mỗi cell), `data`, `loading`, `emptyState` (nội dung truyền vào `EmptyState`), `sortBy`/`onSortChange` (nếu cột hỗ trợ sort), `onRowClick` (optional).
- **Composition rules**: `Table` không biết dữ liệu là user/course/order gì — cấu hình `columns` hoàn toàn do Feature layer định nghĩa (`UserTable`, `CourseOversightTable`, `RefundTable`, `AuditLogTable` là Feature components composing `Table` + business columns, không phải biến thể riêng của `Table`).
- **Accessibility**: `<table>` semantic thật (`<thead>`/`<tbody>`/`<th scope="col">`), cột sort có `aria-sort`.
- **Khi nào dùng**: danh sách dữ liệu nhiều cột ở Admin/Teacher.
- **Khi nào không dùng**: danh sách đơn giản 1-2 thuộc tính hoặc cần action lớn mỗi item (dùng list-card — ví dụ MyCourses, Test Practice hub theo UI_SPEC §3.2/§3.4).

### 4.4 `Tabs`

- **Responsibility**: điều hướng nội bộ trong 1 trang (dùng đầu tiên cho Teacher Course Editor, UI_SPEC §4.3).
- **Variants**: không có — 1 style duy nhất theo token `nav-selected-*`.
- **States**: tab active, tab disabled (ví dụ tab "Học viên" disabled khi Course Editor đang ở chế độ tạo mới — UI_SPEC §4.3 đã ghi rõ).
- **Props (conceptual)**: `tabs` (mảng `{ key, label, disabled? }`), `activeKey`, `onChange`, `children` (nội dung tab active — render bởi Page/Feature layer, `Tabs` không tự biết nội dung).
- **Composition rules**: `Tabs` chỉ là thanh điều hướng + quản lý active state, không tự chứa logic form/nghiệp vụ của từng tab.
- **Accessibility**: `role="tablist"`/`role="tab"`/`aria-selected`, điều hướng bằng phím mũi tên trái/phải (Design System §12).
- **Khi nào dùng**: nhiều nhóm nội dung liên quan trong cùng 1 thực thể (ví dụ cùng 1 khóa học).
- **Khi nào không dùng**: điều hướng giữa các trang độc lập (dùng route thật qua `SidebarNav`, không giả lập bằng Tabs).

### 4.5 `SidebarNav`

- **Responsibility**: sidebar điều hướng dùng chung cho Student/Teacher/Admin (Design System §10.6) — thay 2 bản `StudentSidebar`/`AdminSidebar` trùng lặp hiện tại + tránh viết bản thứ 3 cho Teacher.
- **Variants**: không có biến thể màu; có state `expanded`/`collapsed` (260px ↔ 72px).
- **States**: item active (dùng `nav-selected-*`), item hover, collapsed (chỉ icon + tooltip).
- **Props (conceptual)**: `items` (mảng `{ to, label, icon }` — do Layout/Feature layer truyền vào theo role, `SidebarNav` không tự biết Student có mấy mục), `collapsed`, `onToggleCollapse`, `footerSlot` (cho nút "Về trang chủ").
- **Composition rules**: nav items của từng role (Student/Teacher/Admin) là **data**, khai báo ở 1 chỗ theo role (ví dụ trong config Layout tương ứng), không hardcode trong chính `SidebarNav`.
- **Accessibility**: `<nav>` semantic, mục đang active có `aria-current="page"`.
- **Khi nào dùng**: điều hướng chính của khu vực sau đăng nhập.
- **Khi nào không dùng**: điều hướng trong Lesson Player (dùng `LessonListSidebar` — feature component riêng, khác hẳn về nội dung/hành vi: danh sách lesson kèm trạng thái hoàn thành, không phải menu điều hướng route cấp cao — **không ép dùng chung `SidebarNav`** vì bản chất khác nhau, đây là quyết định tránh trừu tượng hóa sai).

### 4.6 `StatCard`

- **Responsibility**: hiển thị 1 số liệu tổng quan (dùng ở Student Dashboard, Teacher Dashboard, AdminDashboard, LearningProfile).
- **Variants**: không có biến thể màu; có state `loading` (render skeleton nội bộ) và `comingSoon` **không được giữ lại** — theo UI_SPEC, mọi stat ở Phase 1 phải là dữ liệu thật (PRD-017/PRD-028), nên `StatCard` **không có** prop `comingSoon`/placeholder vĩnh viễn (khác cách dùng sai hiện tại ở `Dashboard.tsx`).
- **Props (conceptual)**: `label`, `value` (số/chuỗi đã format), `icon` (optional), `loading`, `trend` (optional, ví dụ "+12%" — chỉ thêm khi có nhu cầu thật, hiện HomePage có nhưng Dashboard các trang khác chưa chắc cần).
- **Composition rules**: `StatCard` không tự fetch dữ liệu — luôn nhận `value` đã tính sẵn từ Feature layer (hook dữ liệu qua React Query).
- **Accessibility**: `value` lớn luôn có `label` text đi kèm rõ ràng (không chỉ số không ngữ cảnh — Design System §5.2 stat card rule).
- **Khi nào dùng**: số liệu tổng quan dạng 1 con số + nhãn.
- **Khi nào không dùng**: số liệu cần biểu đồ/xu hướng phức tạp (ngoài scope Phase 1 theo PRD Non-Goals — không tự thêm chart component).

### 4.7 `ProgressBar`

- **Responsibility**: thanh tiến độ dùng token `progress-fill`/`progress-track`.
- **Variants**: không có.
- **States**: giá trị 0–100%.
- **Props (conceptual)**: `value` (0–100), `label` (optional, hiển thị cạnh bar).
- **Composition rules**: dùng ở Dashboard, MyCourses, Lesson Player topbar — không tự viết `<div className="h-2 bg-slate-100">` lặp lại như HomePage hiện tại.
- **Accessibility**: `role="progressbar"` + `aria-valuenow`/`aria-valuemin`/`aria-valuemax` (Design System §3.6 rule).
- **Khi nào dùng**: thể hiện tiến độ hoàn thành có thể đo bằng %.
- **Khi nào không dùng**: trạng thái nhị phân đơn giản (dùng `Badge`, không ép `ProgressBar` 0%/100%).

### 4.8 `RadioCardGroup`

- **Responsibility**: nhóm lựa chọn dạng card (Checkout Bước 2 chọn gateway — UI_SPEC §2.9; Quiz Attempt chọn đáp án — UI_SPEC §3.5).
- **Variants**: không có biến thể màu riêng; dùng chung token selected (`nav-selected-bg`/`border-brand`) cho mọi ngữ cảnh.
- **States**: option selected, option hover, group disabled (khi đang submit).
- **Props (conceptual)**: `options` (mảng `{ value, label, icon/logo? }`), `value`, `onChange`, `name` (cho `role="radiogroup"`).
- **Composition rules**: `RadioCardGroup` không biết "gateway" hay "đáp án quiz" là gì — Feature layer (`PaymentMethodSelector`, `QuizQuestionCard`) truyền `options` phù hợp ngữ cảnh.
- **Accessibility**: `role="radiogroup"`, điều hướng phím mũi tên giữa các option (Design System §2.9/§3.5 rule).
- **Khi nào dùng**: chọn đúng 1 trong nhiều lựa chọn hiển thị dạng card lớn (không phù hợp dropdown/checkbox nhỏ).
- **Khi nào không dùng**: danh sách quá dài (>6-7 lựa chọn — dùng `Select` thay vì card list dài).

### 4.9 `DropdownMenu`

- **Responsibility**: popover menu hành động ngắn gắn với 1 trigger cụ thể (Design System §10.9b) — dùng đầu tiên cho menu "···" trên course card ở MyCourses (UI_SPEC §3.2). **Khác `Modal`**: không overlay nền, không focus trap, đóng ngay khi chọn item/click ngoài.
- **Variants**: không có.
- **States**: open/closed, item hover, item destructive (dùng `status-danger-text`).
- **Props (conceptual)**: `trigger` (element mở menu), `items` (mảng `{ label, onClick, destructive? }`).
- **Composition rules**: `DropdownMenu` không biết nội dung nghiệp vụ của từng item — Feature layer (ví dụ `MyCourses`) truyền `items` (bao gồm action mở `RefundRequestModal`).
- **Accessibility**: `role="menu"`/`role="menuitem"`, điều hướng phím mũi tên, trigger có `aria-haspopup`/`aria-expanded`.
- **Khi nào dùng**: menu hành động ngắn, không cần nhập liệu.
- **Khi nào không dùng**: cần nhập liệu hoặc nội dung dài (dùng `Modal`).

---

## 5. Layout Components

| Component | Responsibility | Ghi chú |
|---|---|---|
| `AppShellLayout` (mới, gộp `AdminLayout`+`StudentLayout`+`TeacherLayout` tương lai) | Khung Header (64px) + `SidebarNav` (256px, thu gọn được) + content area, dùng chung 3 role sau đăng nhập | Nhận `navItems` theo role + `children`/`<Outlet/>`; đặt `ToastProvider` ở đây (1 lần) |
| `PublicLayout` | Khung Header ngang + Footer + content area cho Public | Giữ nguyên cấu trúc hiện có, chỉ refactor token |
| `LessonPlayerLayout` (mới) | Khung riêng khi Student đang học — ẩn `AppShellLayout` sidebar (UI_SPEC §3.3, quyết định đã chốt) | Topbar mỏng + `LessonListSidebar` + content area, không dùng chung `AppShellLayout` |
| `AppHeader` (mới, gộp `AdminHeader`+`StudentHeader`) | Topbar 56px trong `AppShellLayout`: tên trang hiện tại, search (nếu áp dụng), avatar menu | Nhận `pageTitle` từ Page layer |
| `Header` (Public) | Header ngang Public — logo, nav pill, auth action (Design System §10.7) | Giữ, refactor token, sửa avatar hardcode CDN |
| `Footer` (Public) | Footer marketing | Giữ, refactor token |

---

## 6. Feature/Domain Components

Danh sách rút gọn (đầy đủ chi tiết không cần thiết cho mọi component — chỉ liệt kê để xác định ranh giới, tránh trùng lặp khi implement).

| Component | Domain | Dựng trên | Trạng thái so với hiện tại |
|---|---|---|---|
| `CourseCard` | Course | `Card(marketing)` | Refactor từ component hiện có |
| `InstructorCard` | User/Teacher | `Card(marketing)` | Refactor + đổi tên từ `TeacherCard`, đổi shape dữ liệu |
| `CourseCurriculumPreview` | Course | list pattern (không phải `Table`) | Mới — CourseDetailPage §2.3, read-only, hiện icon khóa/preview |
| `LessonListEditor` | Course/Teacher | list pattern, khác `CourseCurriculumPreview` (có sort/thêm/xóa) | Mới — Course Editor tab Curriculum. **Không gộp chung với `CourseCurriculumPreview`** vì hành vi khác hẳn (đọc vs sửa) |
| `LessonListSidebar` | Learning | list pattern trong `LessonPlayerLayout` | Mới — UI_SPEC §3.3 |
| `LessonContentViewer` | Learning | polymorphic (video/text/quiz) | Mới — render theo loại lesson |
| `QuizQuestionCard` | Assessment | `RadioCardGroup` | Mới — UI_SPEC §3.5 |
| `OrderSummaryCard` | Payment | `Card(marketing)` + `CouponInput` | Refactor từ `OrderSummary` |
| `CouponInput` | Payment | `Input` + `Button` | Mới — tách phần coupon ra khỏi `OrderSummaryCard` để tái dùng độc lập nếu cần |
| `PaymentMethodSelector` | Payment | `RadioCardGroup` | Mới — thay thế hoàn toàn `PaymentForm` (đã xóa) |
| `RefundRequestModal` | Refund | `Modal` + `FormField` | Mới — UI_SPEC §3.2 |
| `RefundReviewModal` | Refund | `Modal` + `Badge` | Mới — UI_SPEC §5.7 |
| `UserFormOverlay` | User | `Modal` + `FormField` | Gộp từ `AddUserOverlay`+`EditUserOverlay`, thêm mode `invite-teacher` (PRD-002) |
| `CategoryFormOverlay` | Category | `Modal` + `FormField` | Refactor từ `CategoryOverlay` |
| `CourseOverviewForm` | Course/Teacher | `FormField` | Mới — Course Editor tab Tổng quan (kế thừa ý tưởng từ `AddCourseOverlay` nhưng gắn Teacher, không phải Admin) |
| `CouponFormOverlay` | Coupon | `Modal` + `FormField` | Mới — AdminCoupons |
| `StudentRosterTable` | Course/Teacher | `Table` | Mới — Course Editor tab Học viên |
| `AuditLogDetailModal` | Audit | `Modal` | Mới — AdminAuditLog |
| `CourseStatusBadge` / `PaymentStatusBadge` / `RefundStatusBadge` | tương ứng domain | `Badge` | Preset mỏng ánh xạ enum → tone, không phải component độc lập nặng |

---

## 7. Page-specific Components

Chỉ dùng trong đúng 1 page, **không** export ra ngoài thư mục page đó — nếu sau này cần dùng lại ở nơi khác, mới cân nhắc nâng cấp lên Feature/Shared (đúng nguyên tắc tránh abstraction sớm).

| Component | Page | Ghi chú |
|---|---|---|
| `HeroSection` | HomePage | Bố cục Hero riêng biệt, không tái dùng ở đâu khác |
| `FeatureHighlights` | HomePage | 3 card lý do chọn nền tảng, nội dung tĩnh gắn riêng Home |
| `StatsBanner` | HomePage | Dải số liệu nền `action-primary-bg`, chỉ xuất hiện ở Home |
| `CheckoutOrderRecap` | Checkout Bước 2 | Bản rút gọn 1 dòng của `OrderSummaryCard`, chỉ dùng ở bước chọn gateway |

---

## 8. God Components hiện tại — cách tách theo model mới

`AdminCourses.tsx` (483 dòng) và `AdminUsersList.tsx` (429 dòng) hiện gộp fetch + CRUD + modal + toast trong 1 file (audit finding). Theo model 5 tầng:

- **Data fetching/mutation** → chuyển vào hook Feature layer (`useUsersQuery`, `useInviteTeacherMutation`... theo ADR-020 TanStack Query), không nằm trong page component.
- **Modal form** → `UserFormOverlay` (Feature, mục 6), page chỉ giữ state `isModalOpen`.
- **Xác nhận xóa/khóa** → `ConfirmDeleteModal` (Shared, mục 4.2), không viết JSX xác nhận riêng.
- **Thông báo** → `useToast()` (Shared, mục 4.1), không tự quản `setTimeout`.
- **Bảng hiển thị** → `UserTable` (Feature, composing `Table` + cột nghiệp vụ cụ thể).
- **Page còn lại** (`AdminUsersList.tsx` sau refactor): chỉ gọi hook data, render `UserTable` + `UserFormOverlay` + `ConfirmDeleteModal`, không còn markup thị giác gốc nào — đúng vai trò Page layer "chỉ compose".

---

## 9. Anti-patterns — checklist tránh lặp lại

| Anti-pattern | Đã tránh như thế nào trong model này |
|---|---|
| God components | Mục 8 — tách data/modal/table/toast ra khỏi Page layer |
| Duplicate components chỉ khác style nhỏ | `AddUserOverlay`+`EditUserOverlay` → 1 `UserFormOverlay` với `mode`; `AdminSidebar`+`StudentSidebar` → 1 `SidebarNav` với `items` |
| Business logic trong generic UI component | `Button`/`Modal`/`Table`/`Badge` không gọi API, không biết PRD rule nào — rule nghiệp vụ (ví dụ "chỉ 1 CTA/màn hình", "chỉ Admin tạo coupon") nằm ở Feature/Page layer |
| Page-specific behavior trong shared component | `SidebarNav` nhận `items` từ ngoài thay vì hardcode theo role; `LessonListSidebar` tách riêng khỏi `SidebarNav` dù cùng là "sidebar" vì hành vi khác hẳn |
| Abstraction quá sớm | `Select` dùng native trước khi cần custom; `Table` không thêm `selectable` khi PRD chưa yêu cầu bulk action; `RadioCardGroup` không giới hạn số lượng option cứng nếu chưa có ca dùng vượt 6-7; page-specific component (mục 7) không nâng cấp lên Shared cho tới khi có ca dùng thứ 2 thật sự |

---

## 10. Removed / Obsolete Summary

| Component | Lý do xóa |
|---|---|
| `PaymentForm.tsx` | Thu thập card thô — không tương thích ADR-009, rủi ro PCI |
| `EnrollSuccessOverlay.tsx` | Bị thay bởi Checkout Result page (UI_SPEC §2.10); dùng emoji vi phạm iconography rule |
| `AddCourseOverlay.tsx` (ở Admin) | Admin không còn CRUD course trực tiếp (UI_SPEC §5.3) |
| `InfoItem.tsx` | Thay bằng `FormField`/`Input` chuẩn |
| `pages/auth/AuthPage.tsx` | Dead file, rỗng |
| `pages/student/dashboard/MyCoursesOverview.tsx` | Dead file, rỗng |
| `AdminHeader.tsx`, `StudentHeader.tsx` (dưới dạng 2 file riêng) | Gộp vào `AppHeader` |
| `AdminSidebar.tsx`, `StudentSidebar.tsx` (dưới dạng 2 file riêng) | Gộp vào `SidebarNav` |
| `AdminLayout.tsx`, `StudentLayout.tsx` (dưới dạng 2 file riêng) | Gộp vào `AppShellLayout` |
