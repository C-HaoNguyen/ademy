# Design System — Academic Management Platform (Version mới)

Status: v1 — Source of truth cho UI/UX
Nguồn: Visual design interview (thống nhất 2026-08-14)

Tài liệu này định nghĩa ngôn ngữ thị giác (visual language) và quy tắc sử dụng component cho toàn bộ sản phẩm. Mọi token dùng **semantic name** — không dùng thẳng tên màu nguyên bản (`teal-600`, `slate-500`...) trong code ứng dụng; primitive scale ở mục 3 chỉ tồn tại như bảng tham chiếu nội bộ cho người maintain design system.

---

## 1. Design Principles

1. **Teal, có chủ đích, không lạm dụng** — brand color duy nhất là Teal; phân cấp thị giác tạo bằng shade/variant/typography/spacing, không thêm hue mới khi chưa có lý do semantic rõ ràng.
2. **Clean nơi cần tập trung, sống động nơi cần thu hút** — khu vực làm việc (Student/Teacher/Admin dashboard) tối giản, ít nhiễu thị giác; khu vực marketing/marketplace được phép biểu cảm hơn.
3. **Rõ ràng hơn trang trí** — mọi hiệu ứng (gradient, shadow, illustration, animation) phải phục vụ một mục đích cụ thể (nhấn mạnh hành động, giảm cảm giác trống, báo trạng thái) — không dùng để trang trí thuần túy.
4. **Nhất quán qua semantic token** — không có màu/khoảng cách/bo góc "một lần dùng"; mọi giá trị thị giác đi qua token đã định nghĩa.
5. **Truy cập được cho tất cả** — WCAG 2.1 AA là sàn tối thiểu, không phải mục tiêu tùy chọn.
6. **Trẻ trung nhưng đáng tin** — thân thiện, tạo động lực, nhưng không childish; đây là nền tảng học tập, không phải app giải trí.

## 2. Visual Language

- **Direction**: Modern Vibrant EdTech — nền clean/minimal + brand color Teal mạnh + rounded UI vừa phải + illustration thân thiện có chủ đích + progress visualization nhẹ.
- **Density theo ngữ cảnh**:
  - **Marketing/Marketplace** (Public: Home, Course catalog, Course detail, Lecturer, Contact): comfortable spacing, cho phép shadow mềm, gradient CTA, illustration, animation vừa phải.
  - **App/Workspace** (Student/Teacher/Admin sau khi đăng nhập): compact spacing, border thay shadow, giảm animation, ưu tiên hiệu suất quét thông tin.
- **Dark mode**: không hỗ trợ ở Phase 1 — toàn bộ token chỉ định nghĩa giá trị Light.
- **Không có** mascot, cartoon, hoặc nhiều accent hue cạnh tranh nhau.

## 3. Color Tokens

### 3.1 Primitive palette (tham chiếu nội bộ — không dùng trực tiếp trong code)

**Teal (brand)**

| Primitive | Hex |
|---|---|
| `teal-50` | `#F0FDFA` |
| `teal-100` | `#CCFBF1` |
| `teal-200` | `#99F6E4` |
| `teal-300` | `#5EEAD4` |
| `teal-400` | `#2DD4BF` |
| `teal-500` | `#14B8A6` |
| `teal-600` | `#0D9488` |
| `teal-700` | `#0F766E` |
| `teal-800` | `#115E59` |
| `teal-900` | `#134E4A` |

**Neutral**

| Primitive | Hex |
|---|---|
| `neutral-0` | `#FFFFFF` |
| `neutral-50` | `#F8FAFC` |
| `neutral-100` | `#F1F5F9` |
| `neutral-200` | `#E2E8F0` |
| `neutral-300` | `#CBD5E1` |
| `neutral-400` | `#94A3B8` |
| `neutral-500` | `#64748B` |
| `neutral-600` | `#475569` |
| `neutral-700` | `#334155` |
| `neutral-800` | `#1E293B` |
| `neutral-900` | `#0F172A` |

**Status hues** (tách biệt hoàn toàn khỏi Teal để không nhầm lẫn ý nghĩa)

| Primitive | Hex | Ghi chú |
|---|---|---|
| `green-700` | `#15803D` | Success — dùng cho text (≥4.5:1 trên nền trắng) |
| `green-600` | `#16A34A` | Success — dùng cho icon/border/large text (đạt ngưỡng non-text 3:1, KHÔNG đủ AA cho text thường) |
| `green-100` | `#DCFCE7` | Success nền nhạt |
| `amber-800` | `#92400E` | Warning — dùng cho text (≥4.5:1 trên nền trắng) |
| `amber-600` | `#D97706` | Warning — dùng cho icon/border/large text (chỉ ~3:1 trên nền trắng, KHÔNG đủ AA cho text thường) |
| `amber-100` | `#FEF3C7` | Warning nền nhạt |
| `red-600` | `#DC2626` | Danger — đạt ~4.8:1 trên nền trắng, dùng được cho cả text và icon |
| `red-100` | `#FEE2E2` | Danger nền nhạt |
| `blue-700` | `#1D4ED8` | Info — dùng cho text (an toàn hơn blue-600 vốn cận ngưỡng AA) |
| `blue-600` | `#2563EB` | Info — dùng cho icon/border/large text |
| `blue-100` | `#DBEAFE` | Info nền nhạt |

### 3.2 Semantic tokens

**Surface & Background**

| Token | Giá trị | Dùng khi |
|---|---|---|
| `background` | `neutral-50` | Nền toàn trang (body) |
| `surface` | `neutral-0` | Nền card, panel, modal, table row |
| `surface-muted` | `neutral-100` | Nền phụ (input filled, khối phân tách nhẹ, hover row) |
| `surface-sunken` | `neutral-100` | Nền vùng lõm nhẹ (ví dụ khung code, khung trích dẫn) |
| `surface-inverse` | `neutral-900` | Nền tối cho tooltip/nút trên nền sáng khi cần tương phản mạnh |
| `surface-brand-muted` | `teal-50` | Nền nhấn nhẹ dùng Teal (banner thông tin, badge chọn) |

**Border**

| Token | Giá trị | Dùng khi |
|---|---|---|
| `border-default` | `neutral-200` | Viền mặc định của card, input (trạng thái nghỉ), divider |
| `border-muted` | `neutral-100` | Viền rất nhẹ, phân tách khu vực không cần nổi bật |
| `border-strong` | `neutral-300` | Viền cần nổi bật hơn (table header, focus-adjacent) |
| `border-brand` | `teal-500` | Viền khi input/card ở trạng thái focus/selected |
| `border-danger` | `red-600` | Viền input lỗi |

**Text**

| Token | Giá trị | Dùng khi |
|---|---|---|
| `text-primary` | `neutral-900` | Heading, nội dung chính |
| `text-secondary` | `neutral-600` | Mô tả phụ, label, metadata |
| `text-tertiary` | `neutral-500` | Caption có nội dung đọc được (timestamp, metadata phụ) — đạt ~4.6:1 trên `surface`, đủ AA |
| `text-placeholder` | `neutral-400` | **Chỉ** placeholder trong input — placeholder được miễn yêu cầu contrast AA vì không phải nội dung đọc, không dùng token này cho text hiển thị thật |
| `text-disabled` | `neutral-300` | Text trong element bị disable (miễn contrast AA — element không tương tác được) |
| `text-inverse` | `neutral-0` | Text trên nền tối/brand đậm (button Teal, surface-inverse) |
| `text-link` | `teal-700` | Link văn bản (không phải button) |
| `text-brand` | `teal-700` | Text cần nhấn bằng màu thương hiệu (không phải action) |

**Action (Teal monochromatic — phân cấp bằng shade + variant, không thêm hue)**

| Token | Giá trị | Dùng khi |
|---|---|---|
| `action-cta-bg` | gradient `teal-600 → teal-500` | Nền nút High-emphasis/Conversion CTA (duy nhất nhóm được phép gradient) |
| `action-cta-bg-hover` | gradient `teal-700 → teal-600` | Hover của CTA |
| `action-primary-bg` | `teal-600` (solid) | Nền nút Standard primary action |
| `action-primary-bg-hover` | `teal-700` | Hover Standard primary |
| `action-primary-bg-active` | `teal-800` | Active/pressed |
| `action-secondary-border` | `neutral-300` | Viền nút Secondary (outline) |
| `action-secondary-text` | `neutral-700` | Chữ nút Secondary |
| `action-secondary-bg-hover` | `neutral-100` | Hover nền nút Secondary |
| `action-tertiary-text` | `teal-700` | Chữ nút/link Tertiary (ghost/text) |
| `action-tertiary-bg-hover` | `teal-50` | Hover nền Tertiary |
| `action-disabled-bg` | `neutral-100` | Nền mọi action khi disabled |
| `action-disabled-text` | `neutral-400` | Chữ mọi action khi disabled |
| `nav-selected-bg` | `teal-50` | Nền item sidebar/tab đang chọn |
| `nav-selected-text` | `teal-700` | Chữ item sidebar/tab đang chọn |
| `nav-selected-indicator` | `teal-600` | Thanh/marker chỉ báo item đang chọn |
| `progress-fill` | `teal-500` | Progress bar, completion indicator |
| `progress-track` | `neutral-100` | Nền rãnh progress bar |
| `focus-ring` | `teal-500` (2px, offset 2px) | Vòng focus cho mọi element tương tác |

**Status** (chỉ truyền đạt trạng thái — không dùng làm action/brand)

| Token | Giá trị | Dùng khi |
|---|---|---|
| `status-success-text` | `green-700` | Text báo thành công (message, label) |
| `status-success-icon` | `green-600` | Icon/border báo thành công (không dùng cho text) |
| `status-success-bg` | `green-100` | Nền badge/banner success |
| `status-warning-text` | `amber-800` | Text báo cảnh báo (message, label) |
| `status-warning-icon` | `amber-600` | Icon/border báo cảnh báo (không dùng cho text) |
| `status-warning-bg` | `amber-100` | Nền badge/banner warning |
| `status-danger-text` | `red-600` | Text báo lỗi (đã đạt AA, không cần shade riêng) |
| `status-danger-icon` | `red-600` | Icon/border báo lỗi |
| `status-danger-bg` | `red-100` | Nền badge/banner danger |
| `status-info-text` | `blue-700` | Text thông tin trung tính |
| `status-info-icon` | `blue-600` | Icon/border thông tin trung tính |
| `status-info-bg` | `blue-100` | Nền badge/banner info |

> **Quy tắc bắt buộc**: `status-*` không bao giờ được dùng cho button action hay biểu thị brand. `action-*`/`nav-*` không bao giờ dùng để báo trạng thái thành công/lỗi. Với text hiển thị nội dung đọc được, **luôn dùng biến thể `-text`**, không dùng `-icon` cho text (trừ `danger` đã đạt AA ở cả hai).

## 4. Typography Scale

Font family: **Plus Jakarta Sans** (toàn hệ thống, không dùng font phụ).

| Token | Size / Line-height | Weight | Dùng khi |
|---|---|---|---|
| `text-display` | 48px / 56px (mobile: 36px / 44px) | 700 | Hero heading trang marketing (chỉ Public) |
| `text-h1` | 32px / 40px | 700 | Tiêu đề trang (page title) |
| `text-h2` | 24px / 32px | 700 | Tiêu đề section |
| `text-h3` | 20px / 28px | 600 | Tiêu đề card/block |
| `text-h4` | 16px / 24px | 600 | Tiêu đề nhỏ, tên mục trong list |
| `text-body-lg` | 16px / 26px | 400 | Nội dung marketing, mô tả dài |
| `text-body` | 14px / 22px | 400 | Body mặc định toàn hệ thống (đặc biệt App/dashboard) |
| `text-body-sm` | 13px / 20px | 400 | Text phụ, table cell, form helper |
| `text-caption` | 12px / 16px | 500 | Label uppercase nhẹ, timestamp, badge text |

Quy tắc:
- Khu vực **App/Workspace** dùng `text-body` (14px) làm baseline mặc định cho UI chrome (label, table, list, nav) để phù hợp compact density; khu vực **Marketing** dùng `text-body-lg` (16px) cho đoạn văn chính.
- `text-display` chỉ dùng ở Public Hero — không dùng trong App/Workspace.
- Không tạo size/weight ngoài bảng trên.
- **Student** (thuộc App/Workspace nhưng cũng là khu vực mobile-first): nội dung dạng đọc dài (mô tả bài học, hướng dẫn, câu hỏi quiz) dùng `text-body-lg` (16px) trên mọi breakpoint; UI chrome dạng danh sách/bảng nhỏ (My Courses list, tiến độ dạng bảng) giữ `text-body` (14px) theo baseline App/Workspace. Teacher/Admin (desktop-first) giữ `text-body` 14px cho mọi nội dung, không áp dụng ngoại lệ này.

## 5. Spacing Scale

Base unit 4px, dùng chung một thang cho toàn hệ thống, nhưng **App/Workspace ưu tiên các bước nhỏ, Marketing ưu tiên các bước lớn**:

| Token | Giá trị | Ghi chú |
|---|---|---|
| `space-1` | 4px | Khoảng cách icon-text sát nhau |
| `space-2` | 8px | Padding trong compact table cell/button nhỏ |
| `space-3` | 12px | Padding input/button mặc định (App) |
| `space-4` | 16px | Gap giữa các field trong form, padding card (App) |
| `space-5` | 20px | Padding card (Marketing, mức vừa) |
| `space-6` | 24px | Gap giữa section nhỏ, padding card (Marketing) |
| `space-8` | 32px | Gap giữa block trong page (App) |
| `space-10` | 40px | Padding section (App page-level) |
| `space-12` | 48px | Gap giữa section (Marketing) |
| `space-16` | 64px | Padding hero/section lớn (Marketing) |
| `space-20` | 80px | Padding hero (Marketing, desktop) |

Quy tắc: **App/Workspace** không dùng token lớn hơn `space-10` cho padding nội bộ component (tránh loãng density đã chốt là Compact). **Marketing** tự do dùng đến `space-20` cho hero/section.

## 6. Sizing & Layout Rules

| Thành phần | Giá trị |
|---|---|
| Sidebar width (expanded) | 260px |
| Sidebar width (collapsed) | 72px (icon-only) |
| Header height (Public) | 64px |
| Topbar height (App, phía trên content area) | 56px |
| Container width (Public/Marketing) | max-width 1280px, canh giữa |
| Content area (App) | Fluid — full width phần còn lại sau sidebar, không max-width cứng |
| Touch target tối thiểu (Public/Student, mobile-first) | 44×44px |
| Touch target tối thiểu (Admin/Teacher, desktop-first) | 36×36px (chấp nhận nhỏ hơn do ưu tiên desktop, nhưng không dưới 32px) |
| Table row height (compact) | 40px |
| Button height — `sm` / `md` / `lg` | 32px / 40px / 48px |
| Input height | 40px (đồng bộ `md` button) |

**Z-index scale** (tránh xung đột lớp khi nhiều layer chồng nhau: sidebar overlay mobile, dropdown, modal, toast):

| Token | Giá trị | Dùng cho |
|---|---|---|
| `z-sticky` | 10 | Header (Public) sticky, table header sticky |
| `z-dropdown` | 20 | Dropdown menu, account menu (mục 10.7) |
| `z-overlay-nav` | 30 | Sidebar overlay trên mobile (mục 10.6) |
| `z-modal` | 40 | Modal/Dialog + overlay nền (mục 10.9) |
| `z-toast` | 50 | Toast (mục 10.8) — luôn ở lớp trên cùng, không bị modal che |

Quy tắc: không dùng giá trị z-index ngoài thang trên; layer mới cần bổ sung phải chèn đúng vị trí tương đối trong thang, không tự ý dùng số tùy ý (ví dụ `z-[9999]`).

## 7. Grid & Responsive Breakpoints

| Breakpoint | Min-width | Ưu tiên thiết kế |
|---|---|---|
| `xs` (mặc định, không prefix) | 0px | Baseline mobile — bắt buộc đầy đủ cho Public/Student |
| `sm` | 640px | Public/Student tối ưu đầy đủ |
| `md` | 768px | Chuyển từ mobile nav sang layout rộng hơn; Admin/Teacher bắt đầu dùng được nhưng chưa tối ưu sâu |
| `lg` | 1024px | Baseline chính thức cho Admin/Teacher (sidebar cố định hiện diện đầy đủ) |
| `xl` | 1280px | Container Public đạt max-width |
| `2xl` | 1536px | Không cần layout riêng thêm — content area App tự giãn |

Grid: 12-column cho Public/Marketing (`grid-cols-1` mobile → `grid-cols-2/3/4` theo breakpoint); App/Workspace dùng layout linh hoạt theo component (table full-width, form 1-2 cột tối đa) thay vì grid 12 cột cứng.

## 8. Border / Radius / Shadow Tokens

**Radius**

| Token | Giá trị | Dùng khi |
|---|---|---|
| `radius-sm` | 6px | Badge nhỏ, checkbox, input nhỏ |
| `radius-md` | 8px | Input, button, list item |
| `radius-lg` | 12px | Card, modal, panel |
| `radius-full` | 9999px | Chỉ dành riêng cho: badge, tag, nav-pill (Public header). **Không dùng cho button chuẩn, card, input.** |

**Shadow**

| Token | Giá trị | Dùng khi |
|---|---|---|
| `shadow-none` | none | Mặc định trong App/Workspace — dựa vào `border-default` thay vì shadow |
| `shadow-soft` | `0 4px 16px rgba(15,23,42,0.06)` | Card marketing (Public), hover nhẹ |
| `shadow-elevated` | `0 12px 32px rgba(15,23,42,0.12)` | Dropdown, popover, toast |
| `shadow-modal` | `0 20px 48px rgba(15,23,42,0.18)` | Modal/dialog nổi trên overlay |

Quy tắc: **App/Workspace** (table, card admin, form) mặc định `shadow-none` + `border-default`. Shadow chỉ xuất hiện cho element **nổi trên nội dung khác** (modal, dropdown, toast) bất kể khu vực nào — không dùng shadow để trang trí card tĩnh trong App.

## 9. Iconography Rules

- Thư viện: **lucide-react** duy nhất — không trộn thư viện icon khác.
- Stroke width: mặc định 2px, không đổi theo ngữ cảnh.
- Size chuẩn: `16px` (inline với text-body-sm/caption), `20px` (inline với text-body/button), `24px` (đứng độc lập — empty state icon, section header icon).
- Màu icon **luôn đi qua token text/action/status** tương ứng ngữ cảnh (ví dụ icon trong nút Secondary dùng `action-secondary-text`), không hardcode màu riêng cho icon.
- Icon một mình (không kèm text) bắt buộc có `aria-label`; icon kèm text bắt buộc `aria-hidden="true"`.
- Illustration: flat/geometric, palette giới hạn trong Teal + Neutral (không dùng màu ngoài palette), cho phép human character đơn giản, **không mascot/cartoon**. Chỉ dùng ở: onboarding, empty state, achievement/completion, section marketing được chọn lọc. Không dùng illustration trang trí trong App/Workspace ngoài các vị trí này.

## 10. Component Design Rules

### 10.1 Button

**Khi nào dùng**: mọi hành động người dùng chủ động kích hoạt (submit, điều hướng có chủ đích, mở modal). Không dùng button cho điều hướng thuần túy giữa trang tĩnh — dùng link (`text-link`).

**Variants** (đúng 5, không tạo thêm):

| Variant | Nền/viền | Dùng khi | Giới hạn |
|---|---|---|---|
| `cta` | `action-cta-bg` (gradient Teal), `text-inverse` | Hành động chuyển đổi quan trọng nhất màn hình (mua khóa học, xác nhận thanh toán, publish course) | **Tối đa 1 nút `cta` hiển thị cùng lúc trên một màn hình/section** |
| `primary` | `action-primary-bg` (solid), `text-inverse` | Hành động chính nhưng không phải điểm chuyển đổi cao nhất (lưu form, tạo mới) | Có thể có nhiều hơn 1 nếu ở ngữ cảnh khác nhau, nhưng không cạnh tranh với `cta` trong cùng khung nhìn |
| `secondary` | Outline `action-secondary-border`, `action-secondary-text` | Hành động thay thế/hủy đi kèm `primary` hoặc `cta` | Luôn đặt cạnh, không đứng một mình khi có hành động chính |
| `tertiary` | Ghost, `action-tertiary-text`, không viền | Hành động phụ, ít quan trọng (xem thêm, hủy trong modal nhẹ) | Không dùng cho hành động phá hủy dữ liệu |
| `danger` | Solid `status-danger-text` (dùng làm nền fill), `text-inverse` | Hành động phá hủy dữ liệu không thể hoàn tác (xóa) | Luôn đi kèm bước xác nhận (modal) |

**Sizes**: `sm` (32px), `md` (40px, mặc định), `lg` (48px, chỉ dùng ở Public/Marketing CTA).

**States**: default, hover (`*-hover` token), active/pressed (giảm 1 shade hoặc `scale-[0.98]`), focus-visible (`focus-ring`, bắt buộc luôn hiển thị khi điều hướng bàn phím), disabled (`action-disabled-bg`/`action-disabled-text`, `cursor-not-allowed`), loading (spinner/inline progress thay label, giữ nguyên kích thước, disable tương tác).

**Accessibility**: mọi button icon-only bắt buộc `aria-label`; trạng thái `loading` phải có `aria-busy="true"`; không dùng `<div onClick>` thay `<button>`.

**Không được phép**:
- Gradient ở bất kỳ variant nào ngoài `cta`.
- `rounded-full` cho button (trừ trường hợp nút icon tròn độc lập như nút mũi tên carousel Public — xem như biệt lệ UI element riêng, không phải Button chuẩn).
- Hai nút `cta` cùng lúc trong một khung nhìn.
- Dùng `danger` cho hành động không phá hủy dữ liệu.

### 10.2 Input / Select / Textarea

**Khi nào dùng**: thu thập dữ liệu nhập từ người dùng.

**Appearance**: Filled style — nền `surface-muted`, không viền ở trạng thái nghỉ; viền `border-brand` xuất hiện khi focus; viền `border-danger` khi lỗi.

**Sizes**: chỉ 1 size mặc định (height 40px) — không tạo input `sm`/`lg` riêng để giữ nhất quán form.

**States**: default, focus (`border-brand` + `focus-ring`), filled (có giá trị, không đổi style so với default), error (`border-danger` + `status-danger-text` cho helper text), disabled (`surface-muted` đậm hơn + `text-disabled`, không tương tác).

**Accessibility**: mọi input bắt buộc có `<label>` liên kết (`htmlFor`/`id`), không dùng `placeholder` thay label. Error message liên kết qua `aria-describedby`.

**Không được phép**: input không viền và không nền phân biệt (phải luôn tách biệt khỏi `surface` xung quanh qua `surface-muted`); label đặt bên trong input kiểu floating-label (không nằm trong scope đã chốt).

**Biến thể `DateRangeInput`**: cùng appearance/token với `Input` filled (§10.2), nhưng hiển thị 2 giá trị ngày (từ–đến) trong 1 field, mở date picker khi click. Chỉ dùng cho filter theo khoảng thời gian ở khu vực Admin/Teacher (ví dụ AdminAuditLog) — không dùng cho nhập ngày đơn (dùng `Input type="date"` chuẩn cho trường hợp đó). Date picker mở ra tuân `z-dropdown` (§6), đóng khi chọn xong hoặc click ngoài, điều hướng được bằng bàn phím (mũi tên đổi ngày, Enter chọn).

### 10.3 Card

**Khi nào dùng**: nhóm nội dung liên quan thành một khối độc lập (course card, stat card, form section).

**Variants**:
- `card-marketing`: `surface`, `radius-lg`, `shadow-soft`, dùng ở Public.
- `card-app`: `surface`, `radius-lg`, `border-default`, `shadow-none`, dùng ở App/Workspace.

**Không được phép**: dùng `shadow-soft` trong App/Workspace; dùng `border-default` cho card marketing thay vì shadow (phá vỡ phân biệt density theo ngữ cảnh đã chốt).

### 10.4 Badge / Tag

**Khi nào dùng**: gắn nhãn trạng thái ngắn hoặc phân loại (category, course status, payment status).

**Appearance**: `radius-full`, nền `status-*-bg` + chữ `status-*-text` tương ứng khi biểu thị trạng thái; nền `surface-brand-muted` + `text-brand` khi biểu thị phân loại trung tính (category, không phải trạng thái).

**Sizes**: 1 size duy nhất, `text-caption`.

**Không được phép**: dùng badge cho hành động có thể click như button (badge không tương tác được, trừ khi rõ ràng là filter-chip — component riêng, chưa nằm trong scope tài liệu này).

### 10.5 Table

**Khi nào dùng**: danh sách dữ liệu nhiều cột, cần so sánh/scan nhanh (Admin/Teacher list). Không dùng cho danh sách đơn giản 1-2 thuộc tính (dùng list/card thay thế).

**Appearance**: `surface` nền, `border-default` cho mọi border ngang, header `surface-muted` + `text-secondary` + sticky khi cuộn, row height compact (40px theo mục 6), hover row `surface-muted`.

**Behavior**: hỗ trợ sort theo cột (click header), filter ở trên bảng — không filter trong header row. Trên mobile (nếu Admin/Teacher truy cập): scroll ngang trong container riêng, không vỡ layout trang.

**States**: empty (dùng Empty State component, mục 14), loading (skeleton row, không spinner giữa bảng), row selected (nền `surface-brand-muted`).

**Không được phép**: card-list thay thế table trên desktop cho màn hình Admin đã xác định là compact/table (mục Table style đã chốt); tự ý thêm border dọc giữa cột (chỉ border ngang, giữ sạch mắt).

### 10.6 Sidebar Navigation (Student/Teacher/Admin)

**Khi nào dùng**: điều hướng chính cho mọi khu vực sau đăng nhập.

**Appearance**: `surface` nền, `border-default` bên phải phân tách content; item mặc định `text-secondary`; item active dùng `nav-selected-bg` + `nav-selected-text` + `nav-selected-indicator` (thanh dọc bên trái item).

**Behavior**: expand/collapse (260px ↔ 72px icon-only); collapsed state vẫn hiển thị icon + tooltip tên mục khi hover; nhóm mục theo section có label `text-caption` phân cách (không viền).

**Responsive**: `< lg` (1024px) — sidebar ẩn mặc định, mở qua nút hamburger dạng overlay (không đẩy content).

**Không được phép**: dùng `radius-full`/pill cho sidebar item (khác Public header); để nhiều hơn 1 item ở trạng thái `nav-selected` cùng lúc.

### 10.7 Header (Public)

Giữ nguyên tinh thần cấu trúc hiện tại (logo trái, tab giữa dạng pill, auth action phải) nhưng áp lại toàn bộ token mới: tab active dùng `nav-selected-bg`/`nav-selected-text`, CTA "Đăng ký"/"Bắt đầu học" dùng variant `primary` hoặc `cta` tùy mức độ chuyển đổi (Đăng ký = `primary`; không có 2 CTA cạnh tranh cùng lúc).

### 10.8 Toast

**Khi nào dùng**: phản hồi tức thời cho hành động vừa thực hiện (success/error), không chặn luồng thao tác tiếp theo.

**Appearance**: `surface`, `radius-md`, `shadow-elevated`, icon dùng `status-*-icon`, text dùng `status-*-text` tương ứng, vị trí góc màn hình (giữ vị trí hiện tại: bottom-right hoặc top-right — nhất quán 1 vị trí toàn hệ thống).

**Behavior**: tự động biến mất sau khoảng thời gian cố định (dùng 1 giá trị duy nhất toàn hệ thống, không mỗi nơi tự định nghĩa); có nút đóng thủ công cho người cần đọc lại/dùng screen reader.

**Accessibility**: `role="status"` (success/info) hoặc `role="alert"` (error), để screen reader thông báo mà không cần focus.

### 10.9 Modal / Dialog

**Khi nào dùng**: yêu cầu xác nhận hoặc nhập liệu ngắn cần chặn luồng chính (xác nhận xóa, form nhanh Add/Edit).

**Appearance**: `surface`, `radius-lg`, `shadow-modal`, overlay nền `neutral-900` opacity thấp.

**Behavior**: đóng bằng ESC, click ngoài overlay, hoặc nút đóng tường minh; focus trap trong modal khi mở; trả focus về phần tử đã mở modal khi đóng.

**Không được phép**: modal lồng modal; modal không có cách đóng bằng bàn phím.

### 10.9b DropdownMenu

**Khi nào dùng**: menu hành động ngắn gắn với 1 phần tử cụ thể (ví dụ "···" trên course card ở MyCourses), không cần chặn toàn màn hình như `Modal`.

**Appearance**: `surface`, `radius-md`, `shadow-elevated`, danh sách item ngắn (`text-body-sm`), item destructive dùng `status-danger-text`.

**Behavior**: mở khi click trigger, đóng khi chọn item/click ngoài/ESC; tuân `z-dropdown` (§6) — **không** có overlay nền, **không** focus trap (khác biệt cốt lõi với `Modal`).

**Không được phép**: dùng `DropdownMenu` cho form nhập liệu hoặc nội dung cần đọc dài (dùng `Modal`); lồng `DropdownMenu` trong `DropdownMenu`.

**Accessibility**: `role="menu"`/`role="menuitem"`, điều hướng bằng phím mũi tên lên/xuống, trigger có `aria-expanded`/`aria-haspopup`.

### 10.10 Empty State

**Khi nào dùng**: danh sách/table/khu vực không có dữ liệu (chưa có khóa học, chưa có học viên, kết quả tìm kiếm rỗng).

**Appearance**: illustration nhẹ (theo mục 9) hoặc icon 24px nếu không có illustration phù hợp, `text-h4` cho title, `text-secondary` cho mô tả, action button (`secondary` hoặc `primary` tùy ngữ cảnh) nếu có hành động khắc phục rõ ràng (ví dụ "Tạo khóa học đầu tiên").

### 10.11 Skeleton (Loading)

**Khi nào dùng**: đang tải dữ liệu cho khu vực đã biết trước hình dạng (table, card, list). Không dùng spinner toàn trang trừ khi tải trang lần đầu.

**Appearance**: khối `surface-muted` bo `radius-sm/md` theo hình dạng nội dung thật, animation pulse nhẹ nhất quán toàn hệ thống.

## 11. Form Patterns

- **Label**: luôn ở trên field (không inline, không floating-label), `text-body-sm` + `text-secondary`, trọng số `medium`.
- **Required field**: dấu `*` màu `status-danger-text` ngay sau label — không dùng chữ "(bắt buộc)" lặp lại ở mọi field.
- **Helper text**: dưới field, `text-caption` + `text-tertiary`; chuyển thành `status-danger-text` khi có lỗi, thay thế helper text mặc định (không hiển thị cả hai cùng lúc).
- **Validation**: hiển thị lỗi ngay dưới field liên quan (inline), không dùng `alert()` hay toast cho lỗi validate cấp field. Toast/banner chỉ dùng cho lỗi cấp form tổng (ví dụ lỗi submit do server).
- **Bố cục**: 1 cột trên mobile luôn luôn; App/Workspace tối đa 2 cột trên `lg+` cho form dài (ví dụ form tạo course); Public form (Login/Signup/Checkout) luôn 1 cột, căn giữa, width giới hạn (tối đa ~420px) để tập trung.
- **Nút submit**: đặt cuối form, dùng `primary` hoặc `cta` tùy mức độ chuyển đổi của hành động (checkout = `cta`; lưu profile = `primary`); nút hủy/quay lại dùng `secondary`, đặt bên trái nút submit.

## 12. Navigation Patterns

- **Public**: Header ngang cố định trên cùng (sticky), tab dạng pill, hoạt động như hiện tại nhưng dùng token mới (mục 10.7).
- **Student/Teacher/Admin**: Sidebar trái cố định (mục 10.6), có Topbar ngắn phía trên content (56px) chứa: tên trang hiện tại (`text-h1` hoặc `text-h2`), search nếu áp dụng, avatar/account menu bên phải.
- **Breadcrumb**: dùng cho trang có độ sâu ≥ 3 cấp (ví dụ Admin → Courses → Course Detail → Lesson Edit); không dùng cho trang cấp 1-2.
- **Active state**: chỉ 1 điểm chỉ báo "đang ở đâu" tại một thời điểm trong mỗi hệ thống điều hướng (sidebar hoặc breadcrumb), không hiển thị active ở cả hai nơi mâu thuẫn nhau.

## 13. Interaction States

Áp dụng nhất quán cho **mọi** element tương tác (button, link, input, nav item, table row có thể click, card có thể click):

| State | Quy tắc |
|---|---|
| Default | Theo token mặc định của component |
| Hover | Thay đổi rõ rệt nhưng nhẹ (nền hoặc màu chữ đổi 1 bước token), transition 150–200ms. **Chỉ dùng màu/shadow/border cho hover — không dùng `transform: scale`/`translate` gây dịch chuyển bố cục xung quanh**, trừ hiệu ứng entrance khi cuộn trên Public/Marketing (đã nêu ở cuối bảng này) |
| Active/Pressed | Đậm hơn hover 1 bước, hoặc `scale-[0.98]` cho button |
| Focus-visible | **Bắt buộc luôn hiển thị** `focus-ring` khi điều hướng bàn phím (không tắt outline mặc định của trình duyệt mà không thay bằng `focus-ring`) |
| Disabled | `action-disabled-*` token, `cursor-not-allowed`, không có hover/active effect |
| Loading | Component tự vô hiệu hóa tương tác, hiển thị chỉ báo tải rõ ràng (spinner nhỏ trong button, skeleton trong khu vực nội dung) |

Animation: giới hạn ở transition trạng thái (hover/focus/mở-đóng) và một số hiệu ứng entrance vừa phải trên Public/Marketing (fade/slide nhẹ khi cuộn tới). App/Workspace hạn chế animation entrance để giữ cảm giác nhanh/gọn. Mọi animation tôn trọng `prefers-reduced-motion` (tắt/giảm animation khi người dùng bật cờ này ở hệ điều hành).

## 14. Loading / Empty / Error / Success States

| Loại | Cách thể hiện |
|---|---|
| **Loading (tải trang/khu vực lần đầu)** | Skeleton khớp hình dạng nội dung thật (mục 10.11), không spinner toàn trang trừ khi thực sự cần (ví dụ xử lý thanh toán) |
| **Loading (hành động, ví dụ submit)** | Trạng thái `loading` của Button (mục 10.1) |
| **Empty (không có dữ liệu)** | Empty State component (mục 10.10) |
| **Success (hành động thành công)** | Toast dùng `status-success-icon` cho icon + `status-success-text` cho chữ (mục 10.8); với hành động quan trọng (thanh toán thành công, publish course) có thể kèm trang/khu vực xác nhận riêng, không chỉ toast |
| **Error (lỗi cấp field)** | Inline error dưới field (mục 11) |
| **Error (lỗi cấp hành động/hệ thống)** | Toast dùng `status-danger-icon` cho icon + `status-danger-text` cho chữ, message ngắn gọn dễ hiểu — không hiển thị stack trace/mã lỗi kỹ thuật thô cho người dùng cuối |
| **Error (toàn trang, ví dụ mất kết nối)** | Full-page state: icon/illustration + `text-h3` + mô tả + nút `secondary` "Thử lại" |

## 15. Accessibility Rules

Chuẩn mục tiêu: **WCAG 2.1 AA**.

- **Contrast**: text thường ≥ 4.5:1 với nền; text lớn (`text-h3` trở lên hoặc bold ≥ 18px) ≥ 3:1; toàn bộ cặp token màu ở mục 3.2 phải được kiểm tra đạt tỷ lệ này trước khi đưa vào implementation (đặc biệt `text-tertiary` trên `surface`, `nav-selected-text` trên `nav-selected-bg`).
- **Focus**: mọi element tương tác có `focus-ring` hiển thị rõ khi điều hướng bàn phím (mục 13); không có "focus trap" ngoài ý muốn (trừ Modal, có chủ đích theo mục 10.9).
- **Keyboard navigation**: toàn bộ luồng chính (đăng nhập, mua khóa học, tạo course, làm quiz) phải thao tác được hoàn toàn bằng bàn phím.
- **Semantic HTML**: dùng đúng thẻ (`button` cho hành động, `a`/`NavLink` cho điều hướng, `label` cho input, heading đúng cấp bậc `h1→h6` phản ánh cấu trúc thật, không nhảy cấp).
- **Alt text**: mọi `<img>` mang thông tin có `alt` mô tả; ảnh trang trí thuần túy dùng `alt=""`.
- **ARIA**: chỉ dùng khi semantic HTML không đủ (icon-only button, toast, modal — đã nêu ở từng component mục 10); không lạm dụng ARIA để "sửa" cấu trúc HTML sai.
- **Touch target**: theo mục 6 (44px mobile-first areas, tối thiểu 32px cho Admin/Teacher desktop-first).
- **Motion**: tôn trọng `prefers-reduced-motion` (mục 13).
- **Không dùng màu là kênh thông tin duy nhất**: mọi trạng thái status (success/warning/danger) luôn đi kèm icon hoặc text, không chỉ dựa vào màu sắc.

## 16. Responsive Behavior

- **Mobile-first bắt buộc đầy đủ**: Public (Home, Course catalog/detail, Lecturer, Contact, Login/Signup, Checkout) và Student (Dashboard, My Courses, Learning Progress, Test Practice, Profile).
- **Desktop-first, mobile chấp nhận được**: Admin và Teacher — layout tối ưu từ `lg` (1024px) trở lên; dưới `lg`, sidebar chuyển overlay (mục 10.6), table cuộn ngang trong container riêng (mục 10.5), form chuyển 1 cột.
- **Không được phép**: nội dung bị cắt/che khuất không truy cập được ở bất kỳ breakpoint nào (kể cả Admin/Teacher trên mobile — "chấp nhận được" nghĩa là dùng được, không tối ưu sâu, không có nghĩa là vỡ layout).
- **Ảnh/media**: luôn có `max-width: 100%`, không tràn container ở bất kỳ breakpoint nào.

## 17. Content & UI Copy Principles

- **Ngôn ngữ chính**: Tiếng Việt (khung i18n dựng ở Phase 1 theo Architecture, nội dung tiếng Anh bổ sung Phase 2 — copy Phase 1 chỉ cần viết tiếng Việt, đặt qua translation key).
- **Giọng điệu**: thân thiện, tích cực, khích lệ — đúng personality đã chốt (trẻ trung nhưng đáng tin, không sáo rỗng/quá phấn khích).
- **Ngắn gọn**: label button là động từ hành động ngắn ("Lưu thay đổi", "Mua khóa học" — không "Bấm vào đây để lưu thay đổi của bạn").
- **Case**: sentence case cho button/label/heading (viết hoa chữ đầu câu, không Viết Hoa Từng Từ) — nhất quán toàn hệ thống.
- **Thông báo lỗi**: mô tả điều đã xảy ra + hướng xử lý nếu có ("Không thể kết nối máy chủ, vui lòng thử lại" — không "Error 500", không lộ chi tiết kỹ thuật cho người dùng cuối, đúng tinh thần Global Exception Handler đã thống nhất ở Architecture).
- **Trạng thái trống**: mô tả ngắn + gợi ý hành động tiếp theo, không chỉ nói "Không có dữ liệu".
- **Nhất quán thuật ngữ**: một khái niệm dùng đúng 1 từ xuyên suốt hệ thống (ví dụ luôn "Khóa học", không đổi qua lại "Lớp học"/"Khóa học"; luôn "Bài kiểm tra" hoặc luôn "Bài test", chọn 1).

## 18. Do / Don't Rules

| Do | Don't |
|---|---|
| Dùng semantic token (`action-primary-bg`, `text-secondary`...) trong mọi component | Dùng thẳng giá trị màu nguyên bản (`teal-600`, `#0D9488`) trong component code |
| Tối đa 1 nút `cta` (gradient) mỗi khung nhìn | Gắn gradient cho `primary`/`secondary`/`tertiary` hoặc nhiều nút `cta` cùng lúc |
| Dùng `border-default` cho card/table trong App/Workspace | Dùng shadow trang trí cho card tĩnh trong App/Workspace |
| Dùng `radius-full` chỉ cho badge/tag/nav-pill | Dùng `radius-full` cho button, card, input, modal |
| Giữ Teal là brand color duy nhất | Thêm hue mới (cam, tím...) làm accent khi chưa có lý do semantic |
| Dùng `status-*-text`/`status-*-icon` chỉ để báo trạng thái | Dùng `status-success-*` (xanh lá) làm màu action/brand — dễ nhầm với Teal |
| Dùng `*-text` cho text đọc được, `*-icon` cho icon/border | Dùng `*-icon` (600-level) cho text — không đủ contrast AA (chỉ ~3:1) |
| Skeleton cho loading khu vực đã biết hình dạng | Spinner toàn trang cho mọi loại loading |
| Inline error dưới field cho lỗi validate | `alert()`/toast cho lỗi cấp field |
| Icon từ lucide-react, màu qua token | Trộn nhiều thư viện icon, hoặc hardcode màu icon |
| Illustration có chủ đích, giới hạn palette Teal+Neutral | Illustration trang trí tràn lan, dùng màu ngoài palette |
| Sentence case cho mọi label/button/heading | Trộn Title Case và sentence case tùy tiện |
| Luôn hiển thị `focus-ring` khi điều hướng bàn phím | Tắt outline focus mặc định mà không thay thế |
| Table thật (sort/filter theo cột) cho Admin/Teacher list | Card-list thay table trên desktop cho màn hình đã xác định compact/table |
| Animation tôn trọng `prefers-reduced-motion` | Animation entrance nặng ở App/Workspace làm chậm cảm giác thao tác |
| Hover đổi màu/shadow/border, `cursor-pointer` trên mọi element click được | Hover dùng `scale`/`translate` gây dịch chuyển bố cục (đặc biệt trong table row, list item, card trong App/Workspace) |
| Dùng thang `z-*` đã định nghĩa (mục 6) cho mọi layer nổi | Tự ý đặt `z-index` tùy ý (`z-[9999]`) khi thêm component mới |
