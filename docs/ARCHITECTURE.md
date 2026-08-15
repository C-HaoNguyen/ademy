# Architecture — Academic Management Platform (Version mới)

Status: Thống nhất cho Phase 1 (MVP)
Nguồn: Codebase audit + `docs/PRD.md` + Architecture discussion (thống nhất 2026-08-14)

Tài liệu này mô tả kiến trúc mục tiêu (target architecture), không phải kế hoạch refactor từng bước. Mọi quyết định quan trọng được đánh số **ADR-XXX** và trace ngược về PRD requirement hoặc vấn đề phát hiện ở codebase audit.

---

## 1. Architecture Goals

- Loại bỏ duplicated business logic đang nằm rải rác trong controller (audit finding).
- Cho phép nhiều Teacher độc lập vận hành khóa học của mình mà không đụng dữ liệu/nội dung của nhau (PRD-009).
- Đảm bảo tính toàn vẹn giao dịch thanh toán — server luôn là nguồn sự thật cho amount, trạng thái, và không tạo trùng payment/enrollment (PRD-020/021, EC-001/EC-002).
- Cung cấp khả năng truy vết (audit) cho hành động nhạy cảm mà không rải log thủ công khắp nơi (PRD-033/034).
- Giữ hệ thống **đơn giản, dễ bảo trì**, không thêm pattern/hạ tầng mà PRD hoặc audit không đòi hỏi — tránh microservices, tránh Redux, tránh dịch vụ video chuyên dụng khi chưa cần.
- Cho phép thay đổi vendor bên ngoài (storage, email, payment/refund gateway) mà không sửa domain/application layer.
- Đặt nền móng cho scale NFR-001 (hàng nghìn–chục nghìn user) mà không over-engineer cho quy mô lớn hơn nhiều so với yêu cầu thực tế.

## 2. System Overview

```
                    ┌─────────────────────────┐
                    │   React SPA (Vite)      │
                    │   Public / Student /     │
                    │   Teacher / Admin        │
                    └────────────┬─────────────┘
                                 │ HTTPS + JWT Bearer
                                 ▼
                    ┌─────────────────────────┐
                    │   Spring Boot API        │
                    │   (Modular Monolith)     │
                    │  Controller→Service→Repo │
                    └──┬─────────┬─────────┬───┘
                       │         │         │
                 ┌─────▼───┐ ┌──▼────┐ ┌───▼──────┐
                 │PostgreSQL│ │ R2/S3 │ │ Email    │
                 │ (Render) │ │(video)│ │(Mailpit/ │
                 │          │ │       │ │ Resend)  │
                 └─────────┘ └───────┘ └──────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ VNPay / Momo / Stripe    │
                    │ (Payment Gateway Ports)  │
                    └──────────────────────────┘
```

Một backend Spring Boot duy nhất (modular monolith), một frontend React SPA duy nhất, PostgreSQL là nguồn dữ liệu chính, object storage tách riêng cho video, email và payment/refund gateway đứng sau abstraction layer để không khóa cứng vendor.

> **ADR-001 — Modular Monolith, không tách microservices**
> **Decision**: Backend vẫn là 1 Spring Boot application duy nhất, tổ chức theo module/feature bên trong, không tách thành các service độc lập.
> **Reason**: PRD NFR-001 (hàng nghìn–chục nghìn user) nằm hoàn toàn trong khả năng một monolith được thiết kế tốt. Audit không chỉ ra ranh giới domain nào đủ lớn/độc lập để cần triển khai/scale riêng.
> **Trade-offs**: Nếu sau này một module (ví dụ payment) cần scale độc lập, sẽ phải tách dần — chấp nhận được vì không có tín hiệu hiện tại đòi hỏi việc đó.
> **Related PRD IDs**: NFR-001.

## 3. Module Boundaries

Backend tổ chức theo **feature package**, không theo layer như hiện tại:

```
auth/          user/          course/        enrollment/
assessment/    payment/       audit/         notification/
common/  (security config, global exception handler, base DTO/response)
```

> **ADR-002 — Backend: package theo feature, mỗi feature có Service layer riêng**
> **Decision**: Thay cấu trúc phẳng theo layer (`controller/`, `dto/`, `entity/`, `repository/`) bằng package theo feature; mỗi feature chứa `controller/service/repository/dto` của chính nó. **Thêm Service layer** — hiện tại logic nằm 100% trong controller.
> **Reason**: Audit: logic trùng lặp giữa các controller không liên quan (enrollment-check lặp ở `EnrollmentController` và `PaymentController`; `getAllCourses`/`getAllCoursesDetail` giống hệt nhau). Package theo feature giữ code liên quan gần nhau, giảm rủi ro trùng lặp.
> **Trade-offs**: Refactor ban đầu tốn công di chuyển code hiện có; đổi lại dễ maintain và onboard hơn về lâu dài.
> **Related PRD IDs**: Toàn bộ PRD-0xx (nền tảng cho mọi feature); trực tiếp từ audit finding về duplicated logic.

**Ranh giới nghiêm ngặt**: module `payment` là nơi DUY NHẤT được ghi vào bảng `payments` và tính `amount`; `enrollment` module không tự tạo enrollment độc lập — enrollment luôn được tạo như hệ quả của một payment thành công, gọi từ `payment` service, tránh lặp lại đúng lỗi audit đã tìm thấy.

Frontend tổ chức theo audience/feature:

```
shared/api/   shared/ui/
features/auth/       features/courses/    features/student/
features/teacher/    features/admin/      features/payment/
```

## 4. Frontend Architecture

React 19 + TypeScript + Vite (giữ nguyên framework hiện tại — audit không chỉ ra vấn đề với lựa chọn này, chỉ với cách tổ chức state/API).

> **ADR-020 — Server state qua TanStack Query, không dùng Redux**
> **Decision**: Toàn bộ dữ liệu lấy từ API (courses, users, payments, enrollments...) quản lý bằng TanStack Query (React Query); không thêm Redux/Zustand cho client state.
> **Reason**: Audit: mỗi trang tự `useState`/`useEffect` fetch riêng, dữ liệu trùng (categories/course-count fetch lặp ở nhiều trang), không cache, không dedupe request.
> **Trade-offs**: Cần học/áp dụng thư viện mới, nhưng nhẹ hơn nhiều so với Redux cho nhu cầu hiện tại — tránh over-engineer.
> **Related PRD IDs**: Không map trực tiếp 1 PRD-ID; là nền tảng kỹ thuật phục vụ mọi trang fetch dữ liệu (PRD-005, 015, 028...).

> **ADR-021 — API client tập trung, bắt buộc dùng `API_ENDPOINTS`**
> **Decision**: Một wrapper fetch duy nhất (`shared/api/client.ts`) tự gắn bearer token, tự xử lý 401 → logout; mọi lời gọi API bắt buộc dùng hằng số `API_ENDPOINTS` đã định nghĩa, không hardcode path.
> **Reason**: Audit: fetch rải rác khắp các trang, `authFetch` (có auto-logout khi 401) dùng không nhất quán, nhiều nơi hardcode `${API_URL}/admin/...` dù `API_ENDPOINTS` đã có sẵn nhưng không được dùng.
> **Trade-offs**: Không đáng kể — đây là dọn dẹp kỷ luật code, không thêm độ phức tạp mới.
> **Related PRD IDs**: Nền tảng kỹ thuật, không map PRD-ID cụ thể.

> **ADR-022 — Code-splitting theo route/audience**
> **Decision**: `React.lazy` cho từng nhóm route (public/student/teacher/admin) thay vì import tĩnh toàn bộ trong `AppRoutes.tsx`.
> **Reason**: Audit: hiện tại mọi trang import tĩnh, bundle admin/student/public gộp chung dù user chỉ dùng một vùng.
> **Trade-offs**: Thêm Suspense boundary/loading state cần thiết kế nhất quán; đổi lại giảm bundle size ban đầu, quan trọng khi thêm hẳn khu vực Teacher mới.
> **Related PRD IDs**: Hỗ trợ NFR-001 (scale) gián tiếp qua trải nghiệm tải trang.

> **ADR-023 — i18n dựng khung ở Phase 1, nội dung tiếng Anh ở Phase 2**
> **Decision**: Thêm thư viện i18n (ví dụ `react-i18next`) và tách chuỗi text ra file dịch ngay từ Phase 1, nhưng chỉ điền tiếng Việt; tiếng Anh điền ở Phase 2.
> **Reason**: NFR-006 yêu cầu "đặt nền móng" cho đa ngôn ngữ nhưng không bắt buộc song ngữ hoàn chỉnh ở Phase 1 (đã thống nhất trong interview).
> **Trade-offs**: Thêm một lớp trừu tượng (translation key) ngay cả khi chỉ có 1 ngôn ngữ hoạt động — chấp nhận được vì tránh phải đi refactor lại toàn bộ text sang Phase 2.
> **Related PRD IDs**: NFR-006.

Component: hợp nhất các thành phần trùng lặp hiện có — `UserFormOverlay` dùng chung cho Add/Edit (thay vì 2 component riêng), `ConfirmDeleteModal` dùng chung, `ToastProvider` dùng chung thay vì mỗi trang tự cài `setTimeout` riêng (audit finding cụ thể — không cần ADR riêng vì đây là dọn dẹp trùng lặp trong `shared/ui/`, không phải quyết định kiến trúc mới).

Auth state: `AuthContext` nhẹ bọc token/role/user hiện tại, thay cho việc `Profile`, `Login`, `AuthUtils` mỗi nơi tự đọc `localStorage`/decode JWT riêng (audit finding — hệ quả trực tiếp của ADR-002 áp dụng phía frontend, không tạo pattern mới).

## 5. Backend Architecture

Spring Boot 3.5, Java — giữ nguyên. Cấu trúc: `Controller → Service → Repository → Entity`, package theo feature (ADR-002).

> **ADR-003 — Global exception handling**
> **Decision**: Thêm `@ControllerAdvice` tập trung, ánh xạ exception nghiệp vụ (NotFound, Forbidden, Conflict, ValidationFailed) sang response HTTP chuẩn.
> **Reason**: Audit: không có exception handler nào; lỗi "not found" ném `RuntimeException` trần → lộ raw 500/stack trace ra client.
> **Trade-offs**: Không đáng kể — chuẩn hóa lại cách xử lý lỗi đã tồn tại rải rác.
> **Related PRD IDs**: Hỗ trợ NFR-002 (bảo mật — không lộ chi tiết implementation qua lỗi).

> **ADR-004 — Bean Validation nhất quán trên mọi request DTO**
> **Decision**: Mọi `@RequestBody` DTO đều được validate bằng `@Valid` + Bean Validation annotation.
> **Reason**: Audit: `@Valid` dùng không nhất quán — thiếu ở `LoginRequest`, `EnrollmentRequest`, `PaymentRequest`.
> **Trade-offs**: Không đáng kể.
> **Related PRD IDs**: Hỗ trợ NFR-002.

> **ADR-005 — Enum thay cho String tự do ở các trường status**
> **Decision**: `Users.role`, `Payments.status`, `Courses.status`, `Courses.level` chuyển từ `String` sang enum Java, đồng bộ với DB check constraint.
> **Reason**: Audit phát hiện bug thật: `PaymentController` insert `"SUCCESS"` (uppercase) trong khi DB check constraint chỉ cho phép lowercase `'success'` — sẽ fail runtime. Enum loại bỏ toàn bộ lớp lỗi này.
> **Trade-offs**: Không đáng kể — enum an toàn hơn String ở compile-time.
> **Related PRD IDs**: PRD-020, PRD-021, BR-004.

> **ADR-006 — Transactional boundaries cho checkout/enrollment**
> **Decision**: Toàn bộ luồng checkout → tạo payment → tạo enrollment chạy trong một `@Transactional` service method.
> **Reason**: Audit: race condition thật — check-then-insert không có transaction/lock, 2 request đồng thời có thể tạo trùng payment (không có unique constraint trên `payments` như trên `enrollments`).
> **Trade-offs**: Transaction dài hơn một chút nếu gọi gateway đồng bộ trong cùng transaction — cần thiết kế để không giữ transaction mở khi chờ gateway (gateway call nên xảy ra ngoài transaction ghi DB, xem Data Flow ở ADR-009).
> **Related PRD IDs**: PRD-020, PRD-021, EC-001, EC-002, BR-008.

> **ADR-007 — Idempotency-Key cho checkout và refund-request**
> **Decision**: Client sinh UUID cho mỗi lần thao tác (checkout attempt, refund request), gửi qua header `Idempotency-Key`. Server lưu bảng dedup riêng, trả lại kết quả của request đầu tiên nếu key trùng, không tạo bản ghi mới.
> **Reason**: Xác nhận trực tiếp từ user: chặn duplicate khi double-click/network retry. Cùng cơ chế áp dụng cho refund-request để nhất quán.
> **Trade-offs**: Thêm 1 bảng dedup + logic kiểm tra ở mọi endpoint mutation quan trọng — chi phí nhỏ, lợi ích lớn cho tính toàn vẹn dữ liệu.
> **Related PRD IDs**: PRD-020, PRD-025, EC-001, EC-002.

> **ADR-008 — Authorization: Role-based + Resource Ownership**
> **Decision**: Ngoài role check (`hasRole`) chuẩn của Spring Security, thêm kiểm tra ownership ở service layer cho mọi mutation của Teacher (ví dụ: `course.instructor.id == currentUser.id`) trước khi cho phép sửa/xóa/publish.
> **Reason**: PRD-009 yêu cầu Teacher chỉ quản lý được khóa học của chính mình — role `TEACHER` đơn thuần không đủ để phân biệt "khóa học của ai".
> **Trade-offs**: Thêm một bước kiểm tra ở mỗi service method liên quan Teacher — cần kỷ luật để không quên áp dụng ở endpoint mới.
> **Related PRD IDs**: PRD-009, PRD-010, PRD-011, PRD-012, PRD-013, PRD-014, PRD-015.

> **ADR-009 — Payment Gateway abstraction (Strategy pattern)**
> **Decision**: Interface `PaymentGatewayPort` với 3 adapter (`VnPayGateway`, `MomoGateway`, `StripeGateway`), chọn theo `PaymentMethod` client gửi ở bước checkout.
> **Reason**: PRD-020 xác nhận cần cả 3 gateway đồng thời — cần một điểm trừu tượng chung để Service layer không phụ thuộc chi tiết từng gateway.
> **Trade-offs**: 3 adapter nghĩa là 3 lần tích hợp thật (VNPay/Momo là redirect+checksum, Stripe là API-based) — độ phức tạp tích hợp có thật, nhưng không tránh được vì PRD yêu cầu cả 3.
> **Related PRD IDs**: PRD-020.

> **ADR-010 — Refund: tách Business state khỏi Execution state**
> **Decision**: `RefundRequest` có 2 trường trạng thái độc lập — `businessStatus` (REQUESTED → APPROVED/REJECTED, do Admin quyết định) và `executionStatus` (theo dõi việc hoàn tiền thực tế đã xảy ra chưa), cộng `gatewayRefundReference` (nullable) để reconciliation khi dùng gateway thật.
> **Reason**: Yêu cầu tường minh từ user: không gọi refund API ngay khi submit, chỉ sau khi được approve; cần tách rõ "quyết định nghiệp vụ" khỏi "việc hoàn tiền đã thực hiện" để audit/đối soát.
> **Trade-offs**: Mô hình 2 trạng thái phức tạp hơn 1 trạng thái đơn — cần thiết vì nghiệp vụ thực sự có 2 giai đoạn tách biệt.
> **Related PRD IDs**: PRD-025, PRD-026, BR-009.

> **ADR-011 — Refund Phase 1: chỉ Manual adapter, gateway refund thật hoãn sang Phase 2**
> **Decision**: `RefundGatewayPort` có 1 implementation ở Phase 1 — `ManualRefundGateway` (Admin duyệt → tự hoàn tiền ngoài hệ thống → đánh dấu `MANUAL_COMPLETED`). `VnPayRefundGateway`/`MomoRefundGateway`/`StripeRefundGateway` triển khai ở Phase 2 mà không đổi domain/interface.
> **Reason**: Xác nhận scope từ user — giảm effort Phase 1 đáng kể, chấp nhận vận hành thủ công tạm thời, không chặn nâng cấp sau.
> **Trade-offs**: Admin phải tự thao tác hoàn tiền ngoài hệ thống ở Phase 1 — rủi ro chậm/quên, chấp nhận được vì là lựa chọn tường minh.
> **Related PRD IDs**: PRD-025, PRD-026.

> **ADR-012 — Audit logging qua AOP**
> **Decision**: Aspect (`@Around`) bắt các service method được đánh dấu `@Audited`, ghi vào bảng `audit_log` riêng (actor, action, targetType, targetId, timestamp, metadata).
> **Reason**: PRD-033/034 yêu cầu log cho 4 nhóm hành động (đăng nhập/bảo mật, thanh toán/refund, Teacher CUD course/quiz, Admin hành động nhạy cảm). AOP đảm bảo không method nào bị bỏ sót log so với ghi thủ công rải rác.
> **Trade-offs**: Tăng "magic"/khó trace khi đọc code lần đầu — chấp nhận được vì đây là cross-cutting concern kinh điển, đúng use case cho AOP.
> **Related PRD IDs**: PRD-033, PRD-034.

> **ADR-013 — Audit log retention: configurable, mặc định 180 ngày online**
> **Decision**: `audit_log` có cột `archived_at`/`archive_batch_id` (nullable) ngay từ Phase 1; retention policy configurable, mặc định giữ 180 ngày trong Postgres, hỗ trợ archive sang object storage cho retention dài hạn (đích 1–2 năm). Archival job không bắt buộc implement ở Phase 1.
> **Reason**: Xác nhận từ user — chưa có regulatory requirement cụ thể, nhưng kiến trúc không được giả định audit log tồn tại vĩnh viễn trong Postgres.
> **Trade-offs**: Schema có cột chưa dùng ở Phase 1 (archival job chưa chạy) — chấp nhận được để tránh migrate schema lại khi cần archival thật.
> **Related PRD IDs**: PRD-033, PRD-034.

> **ADR-014 — Ports & Adapters cho mọi external integration**
> **Decision**: Storage, Email, Payment, Refund đều định nghĩa interface (port) ở tầng `application`; implementation cụ thể (adapter) nằm ở tầng `infrastructure`, chọn qua Spring profile/config. Domain/Service layer chỉ phụ thuộc interface, không bao giờ import SDK vendor trực tiếp.
> **Reason**: Yêu cầu tường minh từ user cho cả storage, email, và payment/refund — đổi vendor sau này (R2→S3, Resend→provider khác, Manual→gateway refund thật) không được phép đụng vào domain/application layer.
> **Trade-offs**: Thêm một lớp trừu tượng (interface + adapter) cho mỗi integration — chi phí nhỏ, đổi lại tránh vendor lock-in hoàn toàn, đúng yêu cầu.
> **Related PRD IDs**: PRD-012, PRD-020, PRD-025, PRD-031.

> **ADR-015 — Object storage: S3-compatible adapter, Cloudflare R2 mặc định, presigned direct upload**
> **Decision**: `ObjectStoragePort` với adapter mặc định dùng Cloudflare R2 (SDK tương thích S3). Video upload đi **thẳng từ FE lên storage bằng presigned URL**, backend không proxy file.
> **Reason**: PRD-012 (Teacher upload video); user xác nhận "chưa có ngân sách hạ tầng" → R2 có free tier hào phóng, không phí egress, API tương thích S3 nên đổi sang AWS S3/vendor khác sau này không cần đổi code (chỉ đổi adapter theo ADR-014); tránh proxy file lớn qua Spring Boot (tốn memory/băng thông backend).
> **Trade-offs**: Không tự động transcode/adaptive-bitrate — video lớn có thể tải chậm trên mạng yếu. Chấp nhận được vì PRD chưa yêu cầu chất lượng streaming cao cấp; có thể thêm CDN/transcode sau mà không đổi kiến trúc lưu trữ.
> **Related PRD IDs**: PRD-012.

> **ADR-016 — Email: Mailpit (local/test), Resend (production), chọn qua config/profile**
> **Decision**: `EmailSenderPort` với `MailpitEmailAdapter` cho môi trường local/test, `ResendEmailAdapter` cho production; lựa chọn qua Spring profile.
> **Reason**: Xác nhận từ user — vendor-agnostic bắt buộc, Mailpit cho dev local không cần gửi email thật, Resend là target production.
> **Trade-offs**: Không đáng kể.
> **Related PRD IDs**: PRD-031, NFR-007.

> **ADR-017 — Flyway quản lý migration thật**
> **Decision**: Bật Flyway, xóa các file migration trùng lặp hiện có (`V0.0.1_02`/`V0.0.1_03` giống hệt nhau), viết lại migration theo schema mới.
> **Reason**: Audit: `ddl-auto=none` + áp SQL thủ công không đảm bảo migration chạy đúng; đã xác nhận build mới hoàn toàn, không cần migrate dữ liệu cũ — đây là thời điểm rẻ nhất để sửa.
> **Trade-offs**: Không đáng kể trong bối cảnh build mới.
> **Related PRD IDs**: Hỗ trợ toàn bộ Data Architecture, không map PRD-ID cụ thể.

> **ADR-018 — Sửa N+1 risk: LAZY fetch + JOIN FETCH, index cho mọi FK**
> **Decision**: Mọi `@ManyToOne` chuyển `FetchType.LAZY`; query danh sách dùng JPQL `JOIN FETCH` khi cần dữ liệu liên quan. Thêm index cho mọi cột FK (`instructor_id`, `category_id`, `student_id`, `course_id`...).
> **Reason**: Audit: toàn bộ `@ManyToOne` hiện tại mặc định EAGER, không có index FK nào — rủi ro N+1 và query chậm khi dữ liệu tăng.
> **Trade-offs**: Không đáng kể — đây là sửa lỗi hiệu năng đã biết trước.
> **Related PRD IDs**: NFR-001.

> **ADR-019 — `lesson_progress`: surrogate key thay composite key**
> **Decision**: Bỏ `@IdClass(LessonProgressId.class)`, dùng surrogate PK (ví dụ `id BIGSERIAL`) + unique constraint `(student_id, lesson_id)`.
> **Reason**: Audit gọi composite key hiện tại là "fragile, dễ vỡ khi refactor" (kiểu dữ liệu `LessonProgressId` không khớp trực tiếp kiểu entity, dễ lỗi ngầm).
> **Trade-offs**: Không đáng kể — đơn giản hóa mà không mất ràng buộc nghiệp vụ (unique constraint vẫn đảm bảo 1 student × 1 lesson chỉ có 1 progress record).
> **Related PRD IDs**: PRD-017.

> **ADR-024 — Deploy target: Render (API + DB), object storage tách riêng**
> **Decision**: Tiếp tục dùng Render cho Spring Boot API và PostgreSQL; R2 (ADR-015) đứng ngoài Render vì Render không có object storage native.
> **Reason**: Xác nhận từ user — giữ nguyên hạ tầng PaaS hiện tại.
> **Trade-offs**: Không đáng kể.
> **Related PRD IDs**: NFR-005.

## 6. Data Architecture

Bảng mới (theo PRD, không phát minh thêm):

| Bảng | Mục đích | Trace |
|---|---|---|
| `quizzes`, `quiz_questions`, `quiz_choices`, `quiz_attempts` | Bài test trắc nghiệm Teacher tạo, Student làm | PRD-014, PRD-018, PRD-019 |
| `coupons`, `coupon_redemptions` | Discount code do Admin tạo | PRD-023, PRD-024 |
| `refund_requests` | Yêu cầu hoàn tiền, tách business/execution state (ADR-010) | PRD-025, PRD-026 |
| `audit_log` | Log hành động nhạy cảm (ADR-012/013) | PRD-033, PRD-034 |
| `lesson_video_assets` | Metadata video (storage key hoặc embed URL) | PRD-012 |
| `payment_idempotency_keys` | Dedup checkout/refund request (ADR-007) | EC-001, EC-002 |

Thay đổi trên bảng hiện có:

- `payments`: enum `status` (ADR-005), `idempotency_key` liên kết bảng dedup (ADR-007), `amount` luôn tính server-side (ADR-006, PRD-021).
- `courses`: `status` enum `DRAFT/PUBLISHED/ARCHIVED` (BR-004); `category_id` NOT NULL nếu nghiệp vụ luôn bắt buộc — đồng bộ DB/code (audit đã chỉ ra lệch nhau).
- `lesson_progress`: surrogate key (ADR-019).
- Mọi FK: thêm index (ADR-018).

## 7. API Architecture

REST, JSON, theo tài nguyên (giữ nguyên phong cách hiện tại — audit không chỉ ra vấn đề với REST style, chỉ với việc thiếu DTO mapping nhất quán và endpoint trùng lặp).

- Loại bỏ endpoint trùng lặp: `CourseController.getAllCoursesDetail` (giống hệt `getAllCourses`), `course-detail?classId=` (trùng chức năng `/courses/{id}`) — audit finding cụ thể.
- Mọi response đi qua DTO mapping tường minh (không trả raw entity) — nhất quán hóa pattern hiện chỉ có ở `CourseController.mapToDto`.
- Mutation quan trọng (checkout, refund-request) bắt buộc header `Idempotency-Key` (ADR-007).
- Response lỗi theo format chuẩn từ `@ControllerAdvice` (ADR-003).
- Video upload dùng endpoint xin presigned URL riêng (`POST .../video/presign`), không có endpoint nhận file trực tiếp (ADR-015).

## 8. Auth & Authorization

Giữ JWT bearer token stateless (đúng mô hình hiện tại — audit không chỉ ra lý do phải đổi sang session-based).

- 4 role thực tế trong hệ thống: khách (chưa đăng nhập), STUDENT, TEACHER, ADMIN.
- Route-level: `/auth/**`, catalog công khai — permitAll; `/admin/**` — ROLE_ADMIN; các route Teacher — ROLE_TEACHER; route cần đăng nhập bất kỳ role — authenticated.
- Resource-level: ownership check ở service layer cho Teacher (ADR-008) — route-level role check không đủ để phân biệt "khóa học của ai".
- Lesson preview: yêu cầu đăng nhập (bất kỳ role) nhưng không yêu cầu đã mua khóa học — kiểm tra ở service layer khi trả nội dung lesson (BR-007).
- Password hashing BCrypt — giữ nguyên (audit không tìm thấy vấn đề ở đây).

## 9. State Management

- **Server state (frontend)**: TanStack Query (ADR-020) — cache, dedupe, invalidation tự động sau mutation.
- **Client-only state (frontend)**: `AuthContext` cho token/role/user hiện tại; state cục bộ (`useState`) cho UI state không cần chia sẻ (form input, modal open/close).
- **Backend**: stateless — không session server-side; mọi state nghiệp vụ nằm trong DB, truy xuất qua Service layer trong transaction boundary (ADR-006).

## 10. Business Logic Ownership

| Domain | Ai sở hữu logic | Ghi chú |
|---|---|---|
| Tính giá/coupon/amount thanh toán | `payment` service | Duy nhất — không service khác được tính lại amount (ADR-006, BR-008) |
| Tạo enrollment | `payment` service (hệ quả của payment thành công) | `enrollment` service không tự tạo enrollment độc lập |
| Ownership check (Teacher sửa course/quiz của mình) | `course`/`assessment` service | Không đặt ở controller hay ở frontend (ADR-008) |
| Course lifecycle (Draft/Published/Archived) | `course` service | Transition rules theo BR-004/BR-005 |
| Refund business decision (Approve/Reject) | `payment`/refund service | Tách khỏi execution (ADR-010) |
| Audit logging | AOP aspect, không phải business code | Cross-cutting, không đặt trong service logic (ADR-012) |

## 11. Validation & Error Handling

- Input validation: Bean Validation trên DTO (ADR-004), chạy trước khi vào Service layer.
- Business rule validation (ví dụ: coupon hết hạn, course không phải Draft khi cố publish lại): thực hiện trong Service layer, ném exception nghiệp vụ có kiểu rõ ràng (không dùng `RuntimeException` trần — audit finding).
- Mọi exception nghiệp vụ được `@ControllerAdvice` (ADR-003) bắt và chuyển thành response chuẩn: `{ code, message, details? }`, không lộ stack trace.
- Frontend: lỗi từ API client tập trung (ADR-021) được xử lý nhất quán qua 1 pattern hiển thị (Toast/inline error), không còn tình trạng nơi dùng `alert()`, nơi dùng `console.error` như audit đã chỉ ra.

## 12. Testing Strategy

Audit hiện tại: **0% test coverage** ở cả backend và frontend. Chiến lược tối thiểu, tập trung vào rủi ro cao nhất thay vì phủ 100%:

- **Backend — Unit test cho Service layer**: đặc biệt các service có business rule quan trọng (payment amount calculation, coupon validation, ownership check, refund state transition, idempotency key handling).
- **Backend — Integration test cho Controller + Repository**: dùng Testcontainers (PostgreSQL thật trong container) để test luồng end-to-end trong backend (checkout → payment → enrollment; publish course; audit log ghi đúng khi có hành động nhạy cảm).
- **Frontend — Component test** cho component dùng chung quan trọng (`shared/ui/`) và các form nghiệp vụ chính (checkout, course authoring, quiz authoring).
- **E2E**: giới hạn ở các golden path quan trọng nhất (đăng ký → mua khóa → học → làm test; Teacher tạo → publish course) — không cố phủ toàn bộ UI bằng E2E để tránh chi phí bảo trì cao.
- Không đầu tư vào test coverage toàn diện 100% ở Phase 1 — ưu tiên các luồng có rủi ro tài chính/toàn vẹn dữ liệu (payment, refund, enrollment) trước.

## 13. Target Project Structure

### Backend

```
src/main/java/com/example/academic_management_api/
  auth/            {controller, service, dto}
  user/            {controller, service, dto}
  course/          {controller, service, dto, entity}
  enrollment/      {controller, service, dto, entity}
  assessment/      {controller, service, dto, entity}
  payment/         {controller, service, dto, entity}
  audit/           {service, entity}          -- không có controller riêng ngoài Admin query endpoint
  notification/    {service}
  application/port/       -- ObjectStoragePort, EmailSenderPort, PaymentGatewayPort, RefundGatewayPort
  infrastructure/
    storage/       -- R2ObjectStorageAdapter
    email/         -- MailpitEmailAdapter, ResendEmailAdapter
    payment/       -- VnPayGateway, MomoGateway, StripeGateway
    refund/        -- ManualRefundGateway (Phase 1), gateway thật (Phase 2)
  common/          -- security config, GlobalExceptionHandler, base response types
```

### Frontend

```
src/
  shared/api/      -- client.ts, endpoint constants
  shared/ui/        -- Toast, Modal, ConfirmDeleteModal, Skeleton, EmptyState...
  features/auth/
  features/courses/       -- catalog công khai + course detail
  features/student/       -- my-courses, learning progress, test-practice
  features/teacher/       -- course authoring, quiz authoring, student stats
  features/admin/         -- user mgmt, category, coupon, refund review, audit log, dashboard
  features/payment/       -- checkout flow, gateway redirect handling
  routes/          -- AppRoutes.tsx với React.lazy theo audience
```

## 14. Dependency Rules

- **Domain/Service layer không import SDK vendor trực tiếp** — chỉ phụ thuộc interface trong `application/port/` (ADR-014). Vi phạm rule này (ví dụ `payment` service import trực tiếp Stripe SDK) coi là lỗi kiến trúc cần sửa.
- **`infrastructure/*` phụ thuộc `application/port/`**, không chiều ngược lại.
- **`controller` chỉ gọi `service`**, không gọi `repository` trực tiếp.
- **`payment` module là nơi duy nhất ghi bảng `payments`/tạo `enrollment`** (Module Boundaries, mục 3) — module khác không được insert trực tiếp vào 2 bảng này.
- **Frontend `features/*` không gọi `fetch` trực tiếp** — luôn qua `shared/api/client.ts` (ADR-021).
- **`shared/ui/` không phụ thuộc ngược vào `features/*`** — component dùng chung phải độc lập với nghiệp vụ cụ thể.

## 15. Security & Performance Considerations

- **Security**: role + ownership authorization (ADR-008); audit log cho hành động nhạy cảm (ADR-012); Bean Validation chặn input không hợp lệ (ADR-004); amount thanh toán luôn server-side (ADR-006) — chặn đúng lỗ hổng "client tự đặt giá" mà audit phát hiện; idempotency key chặn duplicate transaction (ADR-007).
- **Performance**: LAZY fetch + JOIN FETCH + index FK (ADR-018) để tránh N+1 khi dữ liệu tăng theo NFR-001; video upload đi thẳng client→storage, không qua backend (ADR-015) để tránh backend nghẽn khi nhiều Teacher upload cùng lúc; frontend code-splitting (ADR-022) giảm thời gian tải ban đầu.
- **Không đầu tư**: rate limiting nâng cao, WAF, DDoS protection, multi-region — không có yêu cầu nào trong PRD đòi hỏi mức này ở Phase 1; có thể bổ sung sau nếu vận hành thực tế cho thấy cần.

## 16. Known Trade-offs

| Trade-off | Lý do chấp nhận |
|---|---|
| Modular monolith có thể cần tách dần nếu 1 module cần scale riêng sau này | Không có tín hiệu hiện tại đòi hỏi tách sớm; tách sớm là over-engineer (ADR-001) |
| Refund Phase 1 phụ thuộc thao tác thủ công của Admin | Giảm effort đáng kể, đã là lựa chọn tường minh, không chặn nâng cấp Phase 2 (ADR-011) |
| Video qua R2 không tự transcode/adaptive-bitrate | Tránh vendor phức tạp/chi phí cao khi PRD chưa yêu cầu chất lượng streaming cao cấp (ADR-015) |
| `audit_log` archival job chưa implement ở Phase 1 (chỉ có schema sẵn sàng) | Chưa có regulatory requirement bắt buộc; tránh xây hạ tầng archival khi chưa cần dùng (ADR-013) |
| AOP cho audit log tăng "magic", khó trace khi đọc code lần đầu | Đúng use case kinh điển cho cross-cutting concern, giảm rủi ro bỏ sót log hơn ghi thủ công (ADR-012) |
| Testing strategy giới hạn ở luồng rủi ro cao, không phủ 100% | Từ 0% coverage, ưu tiên đúng chỗ có rủi ro tài chính/toàn vẹn dữ liệu trước, tránh đầu tư dàn trải (mục 12) |
