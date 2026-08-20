# Refactor Plan — Academic Management Platform (Version mới)

Nguồn: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/UI_SPEC.md`, `docs/COMPONENT_SYSTEM.md`, Gap Analysis v2 (đã thống nhất).

Roadmap chia thành **Stage** (nhóm phụ thuộc lớn) và **Phase** (đơn vị implement/test/review độc lập) trong mỗi Stage. Mỗi phase chỉ chứa 1 loại thay đổi (không trộn backend+frontend+UI trong cùng phase), có thể merge riêng, test riêng.

**Nguyên tắc áp dụng xuyên suốt**: incremental, không big-bang; DB/API compatibility được xét ở từng phase chạm schema/endpoint; mọi compatibility code tạm thời (nếu có) phải ghi rõ điều kiện xóa; không redesign UI ngoài `DESIGN_SYSTEM.md`/`UI_SPEC.md`; không thêm requirement ngoài `PRD.md`.

**Đánh dấu hoàn tất phase**: sau khi implement xong 1 phase (đã pass validation/tests), heading của phase đó phải được cập nhật thành `### Phase N: <tên> — ĐÃ HOÀN TẤT` (theo đúng mẫu Phase 1), và nội dung phase cập nhật lại để phản ánh những gì **thực sự** đã làm (bao gồm deviation so với bản kế hoạch gốc nếu có, kết quả verify thực tế, và file/doc liên quan đã cập nhật kèm theo) — không chỉ đổi mỗi tiêu đề. Áp dụng cho mọi phase từ đây trở về sau, không riêng phase nào.

**Structure là bắt buộc, không phải gợi ý**: từ phase này trở đi, bất kỳ file/package/folder mới nào được tạo ra ở bất kỳ phase nào **phải** đặt đúng vị trí theo section [Target Project Structure & Organization Rules](#target-project-structure--organization-rules) ngay dưới đây. Nếu 1 phase cần tạo file ở vị trí chưa được section đó liệt kê, phải bổ sung vào section đó trước (cập nhật `REFACTOR_PLAN.md`), không tự quyết định tại chỗ trong lúc code.

---

## Target Project Structure & Organization Rules

> Nguồn duy nhất (source of truth) cho cấu trúc thư mục/package trong suốt quá trình refactor — thay thế phần cấu trúc rải rác trước đây trong từng phase riêng lẻ. `docs/ARCHITECTURE.md` §3/§13/§14 là bản nháp ban đầu của structure này; section này là bản đã đối chiếu với code thật (audit thực tế) và đã giải quyết các mâu thuẫn/thiếu sót phát hiện được — xem "Mâu thuẫn đã xử lý" cuối section.

### A. Root

```
ademy/
├── README.md              # NGUỒN DUY NHẤT — hướng dẫn chạy project (setup, DB, Docker, cả 2 project)
├── CLAUDE.md               # hướng dẫn cho AI agent — kiến trúc, convention, lệnh thường dùng
├── docs/                   # PRD, ARCHITECTURE, DESIGN_SYSTEM, UI_SPEC, COMPONENT_SYSTEM, REFACTOR_PLAN
├── academic-management-api/
└── academic-management-website/
```

**Quy tắc**: Không có README riêng ở `academic-management-api/` hay `academic-management-website/` — 1 project 2 phần nhưng 1 README duy nhất ở root, tránh 2 nguồn lệch nhau (đã lệch thật, xem "Mâu thuẫn đã xử lý"). `.gitignore` root là nơi duy nhất khai báo ignore rule cho cả 2 project (đã đúng, giữ nguyên).

### B. Backend package structure (Modular Monolith)

**Nguyên tắc module boundary**:
- Mỗi feature module chứa `controller/service/repository/entity/dto` **của riêng nó**; không có tầng kỹ thuật toàn cục (không còn `controller/`, `dto/`, `entity/`, `repository/` ở gốc chứa mọi domain trộn lẫn).
- `controller` chỉ gọi `service` cùng module, **không bao giờ gọi `repository` trực tiếp** và **không gọi `repository` của module khác**.
- Truy cập cross-module chỉ qua `service` public method của module kia (ví dụ `payment/service` gọi `enrollment/service`), không import `repository`/`entity` nội bộ của module khác trừ khi thực sự cần trả kiểu dữ liệu dùng chung (entity làm FK target là ngoại lệ chấp nhận được, ví dụ `course` entity tham chiếu `Users` qua FK — không phải vi phạm boundary vì đó là quan hệ dữ liệu, không phải gọi logic).
- **Ranh giới nghiêm ngặt** (giữ nguyên từ ARCHITECTURE.md ADR-006/§3): `payment` module là nơi DUY NHẤT ghi bảng `payments` và tạo `enrollment`; `enrollment` module không tự tạo enrollment độc lập.
- Submodule lồng bên trong 1 feature (`payment/coupon/`, `payment/refund/`, `course/lesson/`) chỉ dùng khi tính năng con phụ thuộc chặt vào dữ liệu/vòng đời của module cha và không có giá trị đứng riêng — không lạm dụng để né việc tạo module mới khi cần.

```
com.example.academic_management_api/
├── AcademicManagementApiApplication.java
├── common/                        # CHỈ chứa thứ dùng chung không thuộc riêng feature nào: exception handling, base response type
│   └── exception/                 # GlobalExceptionHandler, NotFoundException, ForbiddenException, ConflictException (Phase 3)
├── security/                      # JWT + SecurityConfig (bao gồm CORS — xem quy tắc bên dưới) + CustomUserDetails — TOP-LEVEL, không nhét vào common/
├── seeder/                        # AdminSeeder — bootstrap 1 lần khi start, không thuộc riêng feature nào
│
├── auth/
│   └── controller/ service/ dto/                          # không có entity riêng — dùng chung Users (user/entity)
├── user/
│   └── controller/ service/ repository/ entity/ dto/       # Users.java tại đây
├── category/
│   └── controller/ service/ repository/ entity/ dto/       # Categories.java — module riêng, KHÔNG nhét vào course/
├── course/
│   ├── controller/ service/ repository/ entity/ dto/       # Courses.java
│   └── lesson/                                             # submodule — Lessons + LessonProgress (Phase 5)
│       └── controller/ service/ repository/ entity/
├── enrollment/
│   └── controller/ service/ repository/ entity/ dto/       # Enrollments.java
├── payment/
│   ├── controller/ service/ repository/ entity/ dto/       # Payments.java
│   ├── coupon/                                             # submodule (Phase 22)
│   └── refund/                                             # submodule (Phase 23) — entity/service/controller refund domain
├── assessment/                    # (Phase 24) quiz/quiz_question/quiz_attempt
├── audit/                         # (Phase 25) — chỉ service + entity, không có controller riêng ngoài 1 endpoint Admin query
│
├── application/
│   └── port/                      # interface thuần: ObjectStoragePort, EmailSenderPort, PaymentGatewayPort, RefundGatewayPort
└── infrastructure/                # implementation thật của port — nơi DUY NHẤT được import SDK vendor
    ├── storage/                   # R2ObjectStorageAdapter (Phase 20)
    ├── email/                     # MailpitEmailAdapter, ResendEmailAdapter (Phase 20)
    ├── payment/                   # VnPayGateway, MomoGateway, StripeGateway (Phase 21)
    └── refund/                    # ManualRefundGateway (Phase 23)
```

**Vị trí DTO hiện có (đã audit code thật, không phải giả định)** — áp dụng khi thực hiện Phase 2:
- `dto/CategoryDto.java` (phẳng) → `course/dto/` (đã sửa lại khi implement Phase 2 — đây là DTO lồng trong `CourseResponseDto.category`, dùng để trả field `category` trong response course, cùng bản chất với `InstructorDto` bên dưới; **không phải** bản trùng của `dto/category/CategoryRequest.java` như nhận định ban đầu — 2 DTO khác mục đích (request tạo/sửa vs. nested response projection), không gộp được, giữ `CategoryRequest` nguyên vị trí `category/dto/`).
- `dto/InstructorDto.java` (phẳng) → `course/dto/` (đây là DTO lồng trong `CourseResponseDto`, dùng để trả field `instructor` trong response course — không phải DTO chung của `user`).
- `dto/EnrollRequest.java` (phẳng) → `enrollment/dto/`.
- `dto/PaymentRequest.java`, `dto/PaymentResponse.java` (phẳng) → `payment/dto/`.

**Dependency Rules** (đã có ở ARCHITECTURE.md §14, nhắc lại làm rule bắt buộc cho mọi phase từ đây):
- Domain/Service layer không import SDK vendor trực tiếp — chỉ phụ thuộc interface trong `application/port/`.
- `infrastructure/*` phụ thuộc `application/port/`, không có chiều ngược lại.
- `controller` chỉ gọi `service`, không gọi `repository` trực tiếp.
- CORS/security config chỉ khai báo **1 nơi duy nhất** (`security/SecurityConfig.java`) — không tạo `WebMvcConfigurer` riêng lặp lại cấu hình CORS (xem "Mâu thuẫn đã xử lý").

### C. Frontend folder structure

```
academic-management-website/src/
├── shared/
│   ├── api/                       # client.ts (Phase 7), API_ENDPOINTS usage
│   │   ├── queryClient.ts         # QueryClient instance dùng chung (Phase 8)
│   │   └── queries/                # query hook (useCoursesQuery, useCategoriesQuery...) dùng chung nhiều audience (Phase 8) — chỉ đặt ở đây khi hook được >1 feature dùng, nếu chỉ 1 feature dùng thì co-locate trong feature đó
│   ├── ui/                        # Button, Badge, Input, FormField, Card, Modal, ToastProvider, Table, Tabs, SidebarNav... (Stage C)
│   ├── layout/                    # AppShellLayout, AppHeader (Phase 15) — dùng chung Admin/Student/Teacher (sidebar layout)
│   └── auth/                      # AuthContext (Phase 9)
├── features/
│   ├── auth/                      # Login, Signup
│   ├── public/                    # Home, Lecturer, Contact, Header/Footer/PublicLayout — trang public KHÔNG thuộc courses catalog
│   ├── courses/                   # catalog công khai + course detail (tách riêng khỏi public vì đủ lớn/rõ domain)
│   ├── student/                   # dashboard, my-courses, learning-profile, test-practice
│   ├── teacher/                   # (Phase 30) course authoring, quiz authoring
│   ├── admin/                     # user mgmt, category, coupon, refund review, audit log, dashboard
│   └── payment/                   # checkout flow, gateway redirect handling (gộp cả `components/checkout` cũ vào đây)
├── routes/                        # AppRoutes.tsx (React.lazy theo audience — Phase 38), ProtectedRoute.tsx
├── config/                        # constants.ts — giữ nguyên, đã đúng chuẩn
├── utils/                         # phần còn lại sau khi AuthContext/api client tiếp quản phần lớn AuthUtils/AuthFetch
├── types/
└── assets/
```

**Cấu trúc bên trong mỗi `features/<audience>/`** (chốt ở Phase 6 — mục C gốc chỉ liệt kê phẳng, không đặc tả internal layout; quyết định khi implement Phase 6):
- Giữ nguyên subfolder theo domain hiện có: `features/<audience>/<domain>/Page.tsx` (ví dụ `features/admin/courses/AdminCourses.tsx`, `features/student/profile/Profile.tsx`) — domain chỉ có 1 file thì để phẳng ngay dưới `features/<audience>/` (ví dụ `features/auth/Login.tsx`, `features/courses/CourseListPage.tsx`, `features/payment/Checkout.tsx`).
- Component dùng chung trong nội bộ 1 audience (không phải `shared/ui`) đặt tại `features/<audience>/components/` (ví dụ `features/admin/components/AdminLayout.tsx`, `features/student/components/StudentSidebar.tsx`, `features/payment/components/PaymentForm.tsx`).
- `CourseCard.tsx` (trước ở `components/public/`) → `features/courses/components/` (chỉ dùng bởi `CourseListPage`, thuộc domain `courses` chứ không phải `public`, dù nằm cùng thư mục `components/public/` cũ).

**Naming convention**:
- Component/page dùng `PascalCase.tsx`; hook dùng `useX.ts`; không trộn `.tsx` cho file không chứa JSX (`AuthUtils.ts` là `.ts` đúng, không phải `.tsx`).
- Tên thư mục và tên file chính bên trong phải khớp nhau về domain naming (ví dụ thư mục `learning-profile/` chứa file `LearningProfile.tsx`, không phải `LearningProgress.tsx` — xem "Mâu thuẫn đã xử lý").
- Domain "thanh toán" gọi thống nhất là **payment** ở mọi nơi (route, folder, tên module backend) — không dùng "checkout" làm tên thư mục/module (chỉ dùng "checkout" khi nói về luồng UI 3 bước cụ thể trong `features/payment/checkout/`).

**Dependency Rules (frontend)**:
- `features/*` không gọi `fetch()` trực tiếp — luôn qua `shared/api/client.ts`.
- `shared/ui/` không phụ thuộc ngược vào `features/*` — component dùng chung phải độc lập với nghiệp vụ cụ thể.
- `shared/layout/` chỉ chứa layout kiểu app-shell (sidebar, dùng chung Admin/Student/Teacher) — layout kiểu marketing site (header/footer, dùng cho Public) sống trong `features/public/`, không lẫn vào `shared/layout/` vì khác hẳn pattern.

### D. Config / Docker / Migration / Test / Docs — vị trí chuẩn (đã đúng từ Phase 1, giữ nguyên)

| Loại | Vị trí | Ghi chú |
|---|---|---|
| DB migration | `academic-management-api/src/main/resources/db/migration/` | Flyway, 1 file/version, không sửa file đã áp dụng |
| Env template | `<project>/.env.example` (mỗi project 1 file) | Commit được — không chứa secret. `.env` thật không commit |
| Docker | `academic-management-api/{Dockerfile, docker-compose.yml}` | Chỉ backend cần Docker hiện tại (frontend chưa cần) |
| Backend test | `academic-management-api/src/test/` | Theo cùng package feature với source (Phase 39) |
| Frontend test | Cạnh component/page (`Component.test.tsx`) | Chưa có, sẽ thêm dần theo Phase 39 |
| Docs | `docs/*.md` | Không tạo doc rải rác ở nơi khác |

### E. Cleanup actions — độc lập, không phụ thuộc phase nào, làm được ngay sau khi approve

Đây là các hygiene fix phát hiện qua audit thực tế, không thuộc phạm vi 1 phase nghiệp vụ cụ thể nào, rủi ro gần như 0 (không đổi logic, không đổi cấu trúc module), nhưng **vẫn chờ approve trước khi thực hiện** theo đúng yêu cầu:

- **Remove**: `academic-management-api/academic-management-api.iml` (file IDE bị commit nhầm).
- **Missing / Should add**: thêm `*.iml` vào `.gitignore` root.
- **Remove**: `academic-management-api/README.md` (nội dung hỏng encoding + trùng lặp root README).
- **Remove**: `academic-management-website/README.md` (stale nặng, trùng lặp root README).
- **Refactor**: gộp CORS config — xóa `WebConfig.java` (`security/`), chỉ giữ `.cors(...)` trong `SecurityConfig.java` (2 cấu hình hiện tại giá trị y hệt nhau, xóa không đổi hành vi).
- **Remove** (làm cùng lúc Phase 6, không tách riêng): `pages/auth/AuthPage.tsx`, `pages/student/dashboard/MyCoursesOverview.tsx` (0 dòng, không nơi nào import).

### Mâu thuẫn đã xử lý (giữa target structure mới, `ARCHITECTURE.md`, và các phase đã viết trước đó)

1. **`category` module bị thiếu hoàn toàn** khỏi cả `ARCHITECTURE.md` §3/§13 lẫn Phase 2's target list gốc (`{auth,user,course,enrollment,payment,common}`) — dù `CategoryController`/`CategoryRepository`/`Categories` entity đã tồn tại độc lập trong code thật. → Đã thêm `category/` làm module top-level riêng vào target structure + Phase 2 (mục B ở trên).
2. **`Lessons`/`LessonProgress` không có module chủ** — không xuất hiện trong bất kỳ danh sách module nào (kể cả `ARCHITECTURE.md`), dù Phase 5 đã sửa PK của `LessonProgress`. → Đã gán vào submodule `course/lesson/`, theo đúng pattern submodule đã dùng cho `payment/coupon`, `payment/refund`.
3. **`notification/` xuất hiện trong `ARCHITECTURE.md` §3/§13 nhưng không phase nào thực sự tạo business logic cho nó** — mọi nơi gửi email (Phase 20/23) đều gọi thẳng `EmailSenderPort` từ module gọi (`payment/refund`, `user` khi invite Teacher), không qua 1 domain "notification" riêng. Giữ `notification/` rỗng sẽ vi phạm nguyên tắc "không thêm abstraction chưa cần". → Đã bỏ `notification/` khỏi target structure hiện tại; ghi chú rõ: chỉ tạo lại nếu về sau có nhu cầu thật (ví dụ notification preferences, in-app notification) — không tạo trước.
4. **`security` bị liệt kê nhầm là nằm trong `common/`** ở `ARCHITECTURE.md` §13 (`common/ -- security config, ...`), nhưng code thật có hẳn 1 package `security/` với 5 file (JWT, SecurityConfig, CustomUserDetails...) — nhét vào `common/` sẽ biến `common/` thành thùng rác kỹ thuật. → Target structure mới giữ `security/` là top-level riêng, `common/` chỉ còn exception handling + base response type.
5. **`user/` bị thiếu `entity` trong danh sách `ARCHITECTURE.md` §13** (chỉ ghi `{controller, service, dto}`) dù `Users.java` chắc chắn phải có nơi ở — có khả năng là thiếu sót khi viết tài liệu (không phải quyết định có chủ đích, vì Phase 4 đã tự nhắc tới `user/entity/Users.java`). → Đã sửa, `user/` có đủ `{controller, service, repository, entity, dto}`.
6. **CORS bị cấu hình trùng lặp 2 nơi trong code thật** (`SecurityConfig.cors()` và `WebConfig.addCorsMappings()`, giá trị y hệt nhau) — không phải mâu thuẫn giữa các tài liệu, mà là vi phạm rule "1 nguồn duy nhất" mà target structure mới đặt ra. → Thêm vào Cleanup actions (mục E).
7. **`features/public/` chưa từng được định nghĩa** ở `ARCHITECTURE.md` §3/§13 hay Phase 6's target list gốc (`{auth,courses,student,teacher,admin,payment}`), nhưng Phase 26 đã giả định `features/public/` tồn tại (`Modules/files: features/courses/, features/public/`) khi liệt kê nơi chứa HomePage/LecturerPage/ContactPage. → Đã thêm `features/public/` vào Phase 6's target + mục C ở trên.
8. **`checkout/` (frontend) vs `payment` (mọi nơi khác)** — tên miền nghiệp vụ bị gọi 2 kiểu khác nhau (`components/checkout/`, `pages/public/payment/Checkout.tsx`, nhưng Phase 33 lại dùng `features/payment/`). → Xác nhận **`payment` là tên đúng/target** (khớp Phase 33 và module backend `payment/`); Phase 6 (move) sẽ gộp thẳng `components/checkout/*` vào `features/payment/` luôn trong bước move, không cần 1 bước rename riêng — đã cập nhật Phase 6.
9. **`learning-profile/LearningProgress.tsx`** — tên thư mục và tên file lệch nhau, trong khi UI_SPEC/Phase 28 gọi trang này là "LearningProfile". → Đã thêm vào Phase 6: đổi tên file thành `LearningProfile.tsx` trong lúc move (đổi tên file không phải đổi nội dung, vẫn nằm trong nguyên tắc "chỉ di chuyển" của Phase 6).
10. **Đề xuất trước đó của tôi (ở lượt audit trước) nói giữ nguyên cấu trúc frontend theo audience, chưa cần đổi sang `features/`** — mâu thuẫn trực tiếp với Phase 6 (đã tồn tại từ trước, đã được duyệt) và với `ARCHITECTURE.md` §3/§4 (đã chốt `features/` từ đầu). Đây là sai sót của tôi ở lượt trước do chưa đối chiếu đủ kỹ — **rút lại đề xuất đó**, dùng đúng target `features/` theo Phase 6/`ARCHITECTURE.md`.

---

## Stage A — Backend Foundation

### Phase 1: Migration tooling cleanup + DB connection config — ĐÃ HOÀN TẤT

- **Goal**: Có pipeline migration đáng tin cậy, và cách cấu hình kết nối DB (local + hosted) tái lập được cho mọi máy dev, trước khi chạm schema ở bất kỳ phase nào khác.
- **Scope**:
  1. *Migration tooling*: Thêm Flyway (trước đó chưa có dependency, không phải "đang tắt"); gộp `V0.0.1_01`/`V0.0.1_02`/`V0.0.1_03` (thực tế là 3 bản khác nhau, không trùng nhau — `_03` là full schema snapshot khớp entity hiện tại, không phải bản trùng `_02`) thành 1 file baseline `V1__baseline.sql`; sửa bug thật phát hiện trong lúc gộp: `users.role` từng có 2 check constraint cùng tên/đối nghịch giá trị (lowercase inline vs uppercase named) khiến baseline gốc khả năng cao không chạy sạch được trên DB rỗng — chỉ giữ lại check uppercase (khớp giá trị mọi nơi code Java đang dùng).
  2. *DB connection config* (bổ sung sau khi review thực tế lúc kết nối DB hosted — cùng phạm vi "pipeline đáng tin cậy" của phase này, không phải phase mới): `academic-management-api/.env.example` + `academic-management-website/.env.example` làm template biến môi trường (commit vào git, không chứa secret); `academic-management-api/docker-compose.yml` dùng `env_file: .env` để chạy backend qua Docker mà không cần dotenv-loader library nào (Spring Boot tự resolve `${DB_URL}`/`${DB_USERNAME}`/`${DB_PASSWORD}` từ env do Docker/OS inject).
- **Dependencies**: Không — đây là phase đầu tiên.
- **Changes required**:
  - `pom.xml`: thêm `flyway-core` + `flyway-database-postgresql`.
  - `application.properties`: thêm `spring.flyway.enabled=true`.
  - Xóa `V0.0.1_01/02/03_*.sql`, thêm `V1__baseline.sql`.
  - Thêm `academic-management-api/.env.example`, `academic-management-website/.env.example`.
- **Modules/files**: `academic-management-api/{pom.xml, src/main/resources/db/migration/, src/main/resources/application.properties, .env.example, docker-compose.yml, Dockerfile}`, `academic-management-website/.env.example`.
- **Existing behavior cần preserve**: Schema cuối cùng sau migration giống hệt schema hiện tại (không đổi cấu trúc bảng ở phase này, trừ đúng 1 chỗ sửa bug constraint role nêu trên). `.env` thật (chứa secret) tiếp tục không commit — chỉ thêm `.env.example` (không có secret).
- **Migration concerns**: Đã xác nhận build mới hoàn toàn, không cần giữ data cũ — an toàn để reset DB nếu cần thay vì viết migration tương thích ngược. **Lưu ý cho các máy/DB đã có schema từ trước Phase 1** (tạo thủ công qua `psql -f V0.0.1_03...` theo quy trình cũ): Flyway sẽ từ chối migrate nếu schema không rỗng và chưa có bảng `flyway_schema_history` — cần reset DB đó (khuyến nghị, đúng quyết định "build mới") thay vì thêm `spring.flyway.baseline-on-migrate=true` (chưa cần thiết, chỉ thêm khi thực sự gặp case này).
- **Tests/verification**: Đã verify thực nghiệm (không chỉ đọc code) — áp `V1__baseline.sql` trên Postgres rỗng thật: chạy sạch, insert `role='ADMIN'` thành công (xác nhận bug constraint đã sửa đúng); boot app thật bằng jar, Flyway log `Successfully applied 1 migration`, `AdminSeeder` tạo admin thành công, `GET /courses` và `POST /auth/login` trả kết quả đúng; verify lại lần 2 trên DB Neon (Postgres hosted) đã được migrate từ trước qua `docker-compose` + `.env` thật — Flyway báo `Schema "public" is up to date`, app boot và kết nối thành công.
- **Exit criteria**: Flyway chạy sạch từ DB rỗng; không còn file migration trùng lặp; ứng dụng chạy bình thường như trước phase này; `.env.example` tồn tại ở cả 2 project, không chứa secret; `docker-compose up` chạy được backend end-to-end với `.env` thật.
- **Trace**: ADR-017.

### Phase 2: Package restructure + Service layer skeleton — ĐÃ HOÀN TẤT

- **Goal**: Có ranh giới module rõ ràng và nơi đặt business logic trước khi rewrite bất kỳ domain nào.
- **Scope**: Di chuyển code hiện có từ cấu trúc theo layer (`controller/`, `dto/`, `entity/`, `repository/`) sang package theo feature, **đúng theo [Target Project Structure & Organization Rules](#target-project-structure--organization-rules) mục B**; tạo Service class cho mỗi feature, di chuyển logic từ controller vào service nguyên trạng (không đổi logic nghiệp vụ quan sát được).
- **Dependencies**: Phase 1.
- **Changes thực tế đã thực hiện** (đã audit code thật trước khi làm — 3 điểm lệch so với bản kế hoạch gốc, đã chốt trước khi implement):
  - Move toàn bộ entity/repository/DTO theo feature package `{auth,user,category,course,enrollment,payment,security,seeder}` (thêm `category`); `security/` và `seeder/` giữ nguyên top-level, không gộp vào `common/` (`common/` chưa cần tạo ở phase này vì chưa có nội dung — sẽ tạo ở Phase 3).
  - `course/lesson/entity/` — submodule chứa `Lessons`, `LessonProgress`, `LessonProgressId` (chưa có repository/service/controller vì chưa có endpoint nào dùng tới — đúng nguyên tắc không tạo abstraction chưa cần).
  - **Deviation #1**: `CategoryDto` → `course/dto/` (không phải `category/dto/` như bản kế hoạch gốc). Lý do: audit code thật cho thấy `CategoryDto` là DTO lồng trong `CourseResponseDto.category` (giống hệt cách dùng `InstructorDto`), không phải bản trùng của `CategoryRequest` (request tạo/sửa category) — 2 DTO khác mục đích, không gộp được. `InstructorDto` → `course/dto/`; `EnrollRequest` → `enrollment/dto/`; `PaymentRequest`/`PaymentResponse` → `payment/dto/` — đúng bản gốc.
  - **Deviation #2**: `AdminController.java` gốc (282 dòng) không phải 1 file thuộc 1 module — nó trộn logic của 4 domain (user/course/category/payment), tự inject cả 4 repository. Đã tách thành 4 file theo đúng module đích: `user/controller/AdminController.java`, `category/controller/AdminCategoryController.java`, `course/controller/AdminCourseController.java`, `payment/controller/AdminPaymentController.java` — route `/admin/**` giữ nguyên 100% (đối chiếu đủ 19/19 endpoint gốc). Đây là hệ quả bắt buộc của rule "controller chỉ gọi service cùng module" mà chính Target Project Structure mục B đặt ra, không phải mở rộng scope.
  - **Deviation #3**: `PaymentController.checkout()` gốc ghi thẳng `EnrollmentRepository` (tạo `Enrollments` trực tiếp) — vi phạm rule "cross-module chỉ qua service public method" (mục B). Đã sửa: `PaymentService` gọi `EnrollmentService.createEnrollment(...)`/`EnrollmentService.isEnrolled(...)`, không còn cầm `EnrollmentRepository`. Dữ liệu tạo ra giống hệt trước (cùng field, `@PrePersist` tự set `enrolledAt`), chỉ đổi code path.
  - Sửa field injection `public`/thiếu `final` (`AdminController`, `CategoryController`) thành `private final` khi tách.
  - Gộp `getAllCourses`/`getAllCoursesDetail` (route `/courses` và `/courses/allDetail`, logic hệt nhau ở bản gốc) về dùng chung 1 service method `CourseService.getAllCoursesDto()` — giữ nguyên 2 route.
  - Gộp CORS: xóa `security/WebConfig.java`, chỉ giữ cấu hình trong `SecurityConfig.java` (đã verify 2 cấu hình gốc giá trị y hệt nhau).
  - Cleanup mục E làm cùng lúc: xóa `academic-management-api.iml`, `academic-management-api/README.md`, `academic-management-website/README.md`; thêm `*.iml` vào `.gitignore` root.
  - Cập nhật `CLAUDE.md` mục "Backend architecture" để khớp cấu trúc package-by-feature mới (mô tả lỗi thời từ trước phase này).
- **Modules/files**: Toàn bộ `com.example.academic_management_api.{controller,dto,entity,repository}` → tổ chức lại theo mục B; `CLAUDE.md` (mục Backend architecture).
- **Existing behavior cần preserve**: Đã đối chiếu đủ 33/33 endpoint gốc (14 non-admin + 19 admin) — route, HTTP method, request/response shape giữ nguyên 100%.
- **Tests/verification**: `mvn clean compile` PASS; `mvn test` PASS (chưa có test suite trong repo — thuộc Phase 19, không viết thêm ở phase này); `mvn clean package` PASS, build ra jar thành công. Không verify được live end-to-end qua DB hosted trong sandbox do bug driver `pgjdbc`/SCRAM không tương thích JDK 24 của môi trường — không liên quan tới thay đổi phase này; cần verify thủ công trên máy có JDK tương thích trước khi merge.
- **Known pre-existing issues không sửa ở phase này** (đúng nguyên tắc preserve behavior, giữ nguyên bug cũ): `getAllInstructors()` dùng `findByRole("INSTRUCTOR")` — role không tồn tại trong hệ role thật, luôn trả rỗng; `CourseController.getClassDetail()` trả thẳng entity thay vì DTO; `CourseRepository.findAllCoursesDetail()` — native query tham chiếu cột không tồn tại, nhưng không được gọi ở đâu (dead code).
- **Exit criteria**: Đạt đủ — toàn bộ endpoint hoạt động y hệt trước phase; không còn controller gọi trực tiếp repository; không còn cross-module repository access (`payment`→`enrollment` đã qua service); cấu trúc package khớp mục B (trừ 3 deviation đã ghi rõ lý do ở trên); `WebConfig.java` đã xóa; `academic-management-api.iml` đã xóa khỏi git; `CLAUDE.md` đã cập nhật.
- **Trace**: ADR-002.

### Phase 3: Global exception handling + Bean Validation — ĐÃ HOÀN TẤT

- **Goal**: Chuẩn hóa response lỗi, chặn input không hợp lệ nhất quán.
- **Scope**: Thêm `@RestControllerAdvice` ánh xạ exception nghiệp vụ (NotFound/Conflict/ValidationFailed) sang response chuẩn; bổ sung `@Valid` còn thiếu ở `LoginRequest`, `EnrollRequest`, `PaymentRequest`.
  - **Điều chỉnh sau audit code thật (trước khi implement, cùng tinh thần các deviation đã ghi ở Phase 2)**: bản gốc chỉ liệt kê `auth`/`enrollment`/`payment`, nhưng grep `RuntimeException`/`orElseThrow` trên toàn `src/main/java` cho thấy `category/service/CategoryService.java`, `user/service/UserService.java`, `course/service/CourseService.java` cũng ném `RuntimeException` trần y hệt pattern ở 3 module gốc (11 call site khác). Nếu chỉ sửa 3 module gốc, cùng 1 loại lỗi "not found" sẽ trả 2 status khác nhau tùy module (404 ở auth/enrollment/payment, 500 ở category/user/course) — vi phạm chính mục tiêu "chuẩn hóa response lỗi" của phase này. → **Mở rộng scope sang cả 6 module** (đây vẫn là cùng 1 "loại thay đổi" — exception handling — không lẫn feature khác, không vi phạm nguyên tắc dòng 5).
  - `ForbiddenException` **bỏ khỏi scope Phase 3** (dời sang Phase 18 — xem ghi chú tại Phase 18): tại thời điểm này chưa có bất kỳ nơi nào trong code ném lỗi "forbidden" (chưa có ownership/ resource-level check nào tồn tại — việc đó chỉ bắt đầu ở Phase 18), tạo class này ở đây sẽ là dead code không dùng suốt Phase 4→17, vi phạm nguyên tắc "không thêm abstraction chưa cần" mà chính plan này áp dụng ở các phase khác (vd. Phase 14).
- **Dependencies**: Phase 2 (cần service layer tồn tại để ném exception nghiệp vụ đúng chỗ).
- **Changes required**: Class exception nghiệp vụ tối thiểu (`NotFoundException`, `ConflictException`) + `ErrorResponse` (DTO chuẩn hóa body lỗi: status/error/message/fieldErrors/path); `GlobalExceptionHandler` (`NotFoundException`→404, `ConflictException`→409, `MethodArgumentNotValidException`→400 kèm field errors, fallback `Exception`→500 dạng JSON chuẩn hóa thay vì Whitelabel — vẫn phải log đầy đủ stack trace server-side, không nuốt lỗi thật); thêm `@Valid` vào 3 controller còn thiếu; thay toàn bộ `RuntimeException` trần ở 6 service (`auth`, `enrollment`, `payment`, `category`, `user`, `course`) bằng `NotFoundException`/`ConflictException` tương ứng.
- **Modules/files**: `common/exception/` (mới); `auth/service/AuthService.java`, `auth/dto/LoginRequest.java`, `auth/controller/AuthController.java`; `enrollment/service/EnrollmentService.java`, `enrollment/dto/EnrollRequest.java`, `enrollment/controller/EnrollmentController.java`; `payment/service/PaymentService.java`, `payment/dto/PaymentRequest.java`, `payment/controller/PaymentController.java`; `category/service/CategoryService.java`; `user/service/UserService.java`; `course/service/CourseService.java`.
- **Existing behavior cần preserve**: Response thành công không đổi; chỉ đổi hình dạng response lỗi (trước đây không nhất quán, nay chuẩn hóa — breaking change nhỏ về format lỗi, không phải breaking change về logic). Riêng `PaymentService.checkout()` nhánh "đã đăng ký khóa học" (409 nghiệp vụ) **giữ nguyên** kiểu response hiện có (`PaymentResponse{success:false, message}`, HTTP 400) — **không** chuyển sang `ConflictException`, vì đây là outcome nghiệp vụ 2 chiều (`success` field) frontend Checkout đang đọc trực tiếp, đổi sang `ErrorResponse` sẽ đổi hợp đồng response của luồng thanh toán, ngoài phạm vi "chuẩn hóa lỗi kỹ thuật" của phase này. `AuthService.signup()` (duplicate username/email, đã trả 400 String body có kiểm soát) cũng giữ nguyên, không convert.
- **Migration concerns**: Frontend hiện đang xử lý lỗi không nhất quán (`res.text()`/`res.json()` tùy nơi) — cần đồng bộ với Phase 6 (API client) để không có khoảng trống 2 phía hiểu lỗi khác nhau. Có thể tạm chấp nhận format cũ song song cho tới khi Phase 6 xong (nếu cần), nhưng nên làm gần nhau về thời gian để tránh giữ code tương thích tạm lâu dài.
- **Điều chỉnh phát sinh trong lúc verify (đã sửa cùng phase, vẫn trong đúng phạm vi "chuẩn hóa response lỗi")**: fallback `Exception.class` ban đầu bắt luôn cả exception nội bộ của Spring MVC (`HttpRequestMethodNotSupportedException` và các exception tương tự implement interface `org.springframework.web.ErrorResponse`), quy hết thành 500 thay vì giữ đúng status gốc (vd. sai HTTP method lẽ ra phải 405). Đã sửa `GlobalExceptionHandler.handleUnexpected()`: nếu exception implement `org.springframework.web.ErrorResponse`, dùng đúng status/message của nó; chỉ log + trả 500 cho exception thực sự không rõ nguồn gốc.
- **Tests/verification**: Repo chưa có hạ tầng test tự động (`src/test/` chưa tồn tại) và việc dựng test suite được dồn riêng về Phase 39 (Test hardening) — không tạo test tự động đầu tiên của repo ở phase này. Đã verify **thủ công** bằng app thật chạy với DB Neon hosted (`mvn spring-boot:run` + `curl`), tất cả case sau đều đúng kỳ vọng:
  - Login user không tồn tại → 404 `ErrorResponse`; login thiếu field → 400 kèm `fieldErrors`; login thành công → response y hệt cũ (`AuthResponse`).
  - Sai HTTP method (`POST /admin/categories`) → 405 (không còn bị nuốt thành 500).
  - Update category/user không tồn tại → 404; tạo course với instructor không tồn tại → 404; `GET /courses/{id}` không tồn tại → 404.
  - Enroll thiếu `courseId` → 400 kèm `fieldErrors`; enroll course không tồn tại → 404; enroll thành công → response y hệt cũ; enroll trùng → **409** `ErrorResponse` (trước đây 409 với String body trần — đổi hình dạng, đúng breaking change nhỏ đã cảnh báo ở "Existing behavior cần preserve").
  - `POST /payments/checkout` thiếu field → 400 kèm `fieldErrors`. **Không verify được** 3 case còn lại (not-found/success/đã đăng ký) do bug pre-existing chặn đường — xem "Known pre-existing issues" bên dưới.
  - `DELETE /admin/deleted-user`, `DELETE /admin/categories/{id}`, `DELETE /admin/deleted-course/{id}` với id không tồn tại → 404 `ErrorResponse` (fix bổ sung sau code review, xem bên dưới); xóa id thật vẫn 200 như cũ.
- **Fix bổ sung sau code review nội bộ (trước khi coi phase hoàn tất)**: `UserService.deleteUser()`, `CategoryService.deleteCategory()`, `CourseService.deleteCourse()` gọi thẳng `repository.deleteById()` không kiểm tra tồn tại trước — nếu id không tồn tại, Spring Data ném `EmptyResultDataAccessException` (không phải `NotFoundException`, không implement `org.springframework.web.ErrorResponse`) nên rơi vào fallback 500 thay vì 404, dù đây đúng cùng 3 file/cùng bản chất "not-found" mà Phase 3 đã chuẩn hóa ở các method khác trong chính các file này (`updateUser`, `updateCategory`, `updateCourse`...) — bị bỏ sót vì audit ban đầu chỉ grep `RuntimeException`/`orElseThrow`, không bắt được kiểu lỗi Spring Data tự ném. Đã sửa cả 3: thêm `existsById()` check, ném `NotFoundException` trước khi `deleteById()`. Không tính là mở rộng scope vì cùng file, cùng loại thay đổi đã làm.
- **Known pre-existing issues phát hiện trong lúc verify/review, không sửa ở phase này** (đúng nguyên tắc preserve behavior + không mở rộng scope, theo đúng tiền lệ Phase 2 đã ghi nhận bug tương tự):
  1. `PaymentController.checkout()` — `@AuthenticationPrincipal CustomUserDetails user` luôn `null` → `user.getUserId()` ném NPE → 500 với **mọi** request JWT thật. Nguyên nhân: `JwtAuthFilter` build principal của `Authentication` là `String` (username thô), không phải `CustomUserDetails`, nên kiểu không khớp và Spring trả `null` cho `@AuthenticationPrincipal CustomUserDetails`. Đã xác nhận `CustomUserDetails` chỉ được dùng qua `@AuthenticationPrincipal` ở đúng 1 chỗ này trong toàn bộ codebase (không ảnh hưởng endpoint khác — mọi nơi khác dùng `Authentication authentication` + `getName()`, không bị ảnh hưởng). Bug không phải do Phase 3 gây ra — khiến `/payments/checkout` thực chất **không hoạt động được** ở trạng thái hiện tại của repo, kể cả trước Phase 3. Đề xuất sửa cục bộ trong `payment` module (đổi `PaymentController`/`PaymentService` sang nhận `username` qua `Authentication` rồi tự lookup `Users`, giống pattern đã verify đúng ở `EnrollmentService.enroll()`) trong 1 commit/phase riêng.
  2. `auth/dto/SignupRequest.java` — chỉ có `@NotBlank`/`@Email` cho `signupEmail`; `signupUsername`/`signupPassword` không có constraint nào. `signupPassword` null → `passwordEncoder.encode(null)` ném NPE → 500 thay vì 400. `/auth/signup` không nằm trong 3 endpoint Phase 3 nhắm tới (`LoginRequest`/`EnrollRequest`/`PaymentRequest`) nên không sửa ở đây.
  3. `user/dto/UpdateProfileRequest.java` — không có constraint Bean Validation nào, khiến `@Valid` đã có sẵn ở `UserController.updateMyProfile()` thành no-op; field null (username/fullName/email — đều `nullable=false` ở `Users` entity) sẽ gây lỗi ràng buộc DB không được xử lý (500) thay vì 400. Không nằm trong 3 endpoint Phase 3 nhắm tới nên không sửa ở đây.
  4. `course/service/CourseService.createCourse()` — dead code có từ Phase 2: kiểm tra `request.getCategoryId() == null` rồi return sớm, ngay sau đó lại kiểm tra `!= null` (luôn đúng, không thể sai) — không phải bug runtime, chỉ là code thừa gây hiểu nhầm cho người đọc sau. Không thuộc "loại thay đổi" của Phase 3 (exception handling), để dành cho phase cleanup/simplification khác.
- **Exit criteria**: Đạt đủ trong phạm vi verify được — mọi lỗi "not found"/"conflict" ở cả 6 module (`auth`, `enrollment`, `payment`, `category`, `user`, `course`) trả đúng HTTP status (404/409) ở các luồng verify được, bao gồm cả 3 delete method vừa fix bổ sung; không còn `RuntimeException` trần lộ 500 ở 6 module này (đã grep xác nhận 0 kết quả ngoài định nghĩa 2 class exception mới); 3 endpoint thiếu validate đã có `@Valid`; `ForbiddenException` chưa tồn tại (đúng — dời sang Phase 18). Riêng luồng thành công của `payments/checkout`, và 2 DTO chưa có validation (`SignupRequest`, `UpdateProfileRequest`) chưa verify/sửa được do nằm ngoài phạm vi phase — không thuộc trách nhiệm exit criteria của Phase 3 nhưng cần lưu ý khi merge.
- **File/doc liên quan đã cập nhật**: `docs/REFACTOR_PLAN.md` (mục Phase 3 và Phase 18, sửa trước khi implement).
- **Trace**: ADR-003, ADR-004.

### Phase 4: Status field type safety (Enum) — ĐÃ HOÀN TẤT

- **Goal**: Loại bỏ lớp lỗi do String tự do gây ra (bug case-sensitivity thật đã phát hiện).
- **Scope thực tế đã làm**: Chuyển `Users.role`, `Payments.status`, `Courses.status`, `Courses.level` từ `String` sang enum Java (`Role`, `PaymentStatus`, `CourseStatus`, `CourseLevel` — đặt cạnh entity chủ, đúng package-by-feature). Sửa bug thật: `PaymentService.checkout()` ghi `"SUCCESS"` (hoa) trong khi DB check constraint chỉ chấp nhận `'success'` (thường) → đã đổi thành `PaymentStatus.SUCCESS`.
- **Quyết định thiết kế (đã audit trước khi code, không phải giả định)**: Wire-format (JSON) và DB case của 4 field này vốn **khác nhau** giữa các field, đã audit trực tiếp frontend để xác nhận trước khi chọn cách map:
  - `Role`: DB constraint + JWT claim + toàn bộ frontend (`AddUserOverlay.tsx` option value, `SecurityConfig.hasRole()`) đều dùng **HOA** (`ADMIN`/`INSTRUCTOR`/`STUDENT`) — dùng thẳng `@Enumerated(EnumType.STRING)`, hằng số enum viết hoa khớp cả DB lẫn JSON, không cần converter riêng.
  - `PaymentStatus`, `CourseStatus`, `CourseLevel`: DB constraint **thường** (`'pending'/'success'/'failed'`, `'draft'/'published'/'archived'`, `'beginner'/'intermediate'/'advanced'`); riêng `Courses.level/status` còn bị `AdminCourses.tsx` so sánh **literal string thường** không normalize case (`course.status === "published"`) — nếu serialize JSON ra hoa sẽ vỡ ngầm trang Admin Courses dù Phase 4 không đụng frontend. → Hằng số enum viết **HOA** theo convention Java (`DRAFT`, `SUCCESS`...) nhưng thêm `@JsonValue`/`@JsonCreator` (serialize/deserialize JSON ra thường) + `AttributeConverter` riêng (persist DB ra thường) cho từng enum — giữ đúng y hệt JSON/DB case cũ, không cần sửa migration constraint.
- **Dependencies**: Phase 1 (Flyway), Phase 2 (service layer) — cả hai đã hoàn tất trước khi làm.
- **Changes đã thực hiện**: 4 enum mới (`user/entity/Role.java`, `payment/entity/PaymentStatus.java` + `PaymentStatusConverter.java`, `course/entity/CourseStatus.java` + `CourseStatusConverter.java`, `course/entity/CourseLevel.java` + `CourseLevelConverter.java`); đổi field type trên `Users`, `Payments`, `Courses`; `UserRepository.findByRole/existsByRole` nhận `Role`; sửa mọi call site String cứng ở `AuthService`, `UserService`, `CourseService`, `PaymentService`, `AdminSeeder`; đổi `AdminCreateUserRequest.role`/`AdminUpdateUserRequest.role`/`CreateCourseRequest.level`/`CreateCourseRequest.status` từ `String` sang enum tương ứng (`@NotBlank` trên `role` đổi thành `@NotNull` vì không còn là `CharSequence`). **Không cần migration DB mới** — giá trị DB giữ nguyên, check constraint hiện có (`V1__baseline.sql`) không đổi.
- **Modules/files**: đúng như liệt kê ở mục "Changes đã thực hiện"; không đụng migration.
- **Existing behavior cần preserve**: Đã verify — tập giá trị hợp lệ (role 3 giá trị, course status/level 3+3 giá trị, payment status 3 giá trị) map đúng 1-1; JSON response ở 6 endpoint trả entity trực tiếp (`GET /admin/users`, `GET /admin/courses`, `GET /admin/payments`, `POST/PUT /admin/users/*`, `POST/PUT /admin/courses/*`) giữ đúng y hệt case cũ (role hoa, course status/level thường) — đã verify bằng curl thật, không chỉ đọc code.
- **Tests/verification**: Repo chưa có `src/test/` (đúng tiền lệ Phase 1-3, hạ tầng test dồn về Phase 39) — verify **thủ công** bằng `mvn spring-boot:run` + curl thật trên DB Neon hosted:
  - `POST /auth/signup` → role mặc định `STUDENT`; `POST /auth/login` → JSON `role` đúng hoa, JWT claim đúng.
  - `GET /admin/users`, `GET /admin/courses` → role/level/status trong JSON đúng y hệt case cũ.
  - `POST /admin/courses/add` với `level="intermediate"`, `status="published"` → 200, lưu DB và đọc lại đúng giá trị (round-trip converter OK cả 2 chiều).
  - `PUT /admin/users/{id}` với `role="INSTRUCTOR"` hợp lệ → 200, round-trip đúng.
  - `mvn clean package` PASS (build jar thành công).
  - Dữ liệu test tạo trong lúc verify (1 course, 1 user) đã xóa lại sau khi xong, không để lại rác trên DB hosted dùng chung.
- **Phát hiện ngoài kỳ vọng lúc verify (không sửa — ngoài scope Phase 4, xem bên dưới)**:
  1. Gửi giá trị enum không hợp lệ trong request body (vd. `"role":"SUPERADMIN"`, `"level":"nonsense"`) trả về **500** thay vì 400 như kỳ vọng ban đầu trong plan. Nguyên nhân: exception ném ra là `HttpMessageNotReadableException` (Jackson deserialize fail) — exception này **không implement** `org.springframework.web.ErrorResponse`, nên rơi vào fallback generic 500 của `GlobalExceptionHandler` (Phase 3) thay vì nhánh giữ đúng status. Đây **không phải regression**: trước Phase 4, field này là `String` tự do, giá trị sai sẽ đi tới tận `INSERT/UPDATE` rồi vi phạm DB check constraint → cũng ném exception không được `GlobalExceptionHandler` bắt riêng → cũng 500. Hành vi HTTP status không đổi (500 trước/sau), chỉ đổi loại exception và thời điểm fail (sớm hơn, tại tầng deserialize thay vì tại DB) — an toàn hơn nhưng không đạt được 400 như kỳ vọng lạc quan ghi trong bản kế hoạch gốc. Sửa việc này (bắt thêm `HttpMessageNotReadableException` trong `GlobalExceptionHandler`) thuộc phạm vi "chuẩn hóa response lỗi" của Phase 3, không phải "type safety" của Phase 4 — để lại cho phase liên quan tới exception handling sau này, không tự mở rộng scope ở đây.
  2. `POST /payments/checkout` vẫn không verify được luồng thành công end-to-end do bug pre-existing đã ghi nhận ở Phase 3 (known issue #1: `@AuthenticationPrincipal CustomUserDetails` luôn `null` → NPE) — đã xác nhận lại bằng curl thật, log lỗi khớp đúng mô tả Phase 3, không phải lỗi mới do Phase 4 gây ra. Việc sửa `PaymentService.checkout()` dùng `PaymentStatus.SUCCESS` đã verify gián tiếp qua code path tương đương (`CourseService`/`UserService` round-trip qua converter/enum thành công) nhưng chưa verify trực tiếp được do bug chặn đường này.
- **Exit criteria**: Đạt đủ — không còn field `role`/`status`/`level` dạng String tự do ở 3 entity; bug `"SUCCESS"` hoa đã sửa; build/package PASS; JSON/DB case giữ nguyên đã verify thật.
- **Trace**: ADR-005, PRD-020/021, BR-004.

### Phase 5: Data access hygiene — ĐÃ HOÀN TẤT

- **Goal**: Giảm rủi ro N+1 và dọn cấu trúc khóa fragile trước khi domain mới thêm nhiều bảng liên kết.
- **Scope thực tế đã làm**: Chuyển mọi `@ManyToOne` sang `FetchType.LAZY` (5 entity: `Courses`, `Lessons`, `Enrollments`, `Payments`, `LessonProgress`); thêm `JOIN FETCH` ở đúng 3 query danh sách phục vụ endpoint trả về nhiều bản ghi kèm dữ liệu liên quan (không đụng endpoint chi tiết 1 bản ghi — đúng phạm vi "N+1" của Goal); thêm index cho toàn bộ 9 cột FK; đổi `LessonProgress` từ composite key (`@IdClass`) sang surrogate key (`progress_id`) + `UNIQUE(student_id, lesson_id)`.
- **Dependencies**: Phase 1, Phase 4 — cả hai đã hoàn tất trước khi làm.
- **Changes đã thực hiện**:
  - Entity: `Courses.instructor/category`, `Lessons.course`, `Enrollments.student/course`, `Payments.student/course`, `LessonProgress.student/lesson` — thêm `fetch = FetchType.LAZY`.
  - `LessonProgress`: bỏ `@IdClass(LessonProgressId.class)`, đổi `@Id` sang `progressId` (`@GeneratedValue(IDENTITY)`), thêm `@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "lesson_id"}))`. Xóa `LessonProgressId.java` (đã grep xác nhận không còn nơi nào reference).
  - Repository — thêm method `JOIN FETCH` mới, dùng thay cho `findAll()`/`findByStudent_UserId()` trần tại đúng 4 endpoint danh sách bị ảnh hưởng:
    - `CourseRepository.findAllWithDetails()` (`JOIN FETCH c.instructor` + `LEFT JOIN FETCH c.category`) — dùng chung cho `CourseService.getAllCoursesDto()` (`GET /courses`, `/courses/allDetail`) và `getAllCourses()` (`GET /admin/courses`).
    - `EnrollmentRepository.findByStudent_UserIdWithCourse()` (fetch 2 cấp: `e.course` → `instructor`/`category`) — dùng cho `EnrollmentService.getMyCourses()` (`GET /enrollments/student/me/courses`).
    - `PaymentRepository.findAllWithDetails()` (fetch `student` + `course` → `instructor`/`category`) — dùng cho `PaymentService.getAllPayments()` (`GET /admin/payments`).
  - Migration `V2__data_access_hygiene.sql`: đổi PK `lesson_progress` (drop PK cũ, thêm cột `progress_id` PK mới, thêm `UNIQUE(student_id, lesson_id)`); thêm index cho 9 cột FK (`courses.instructor_id/category_id`, `lessons.course_id`, `enrollments.student_id/course_id`, `lesson_progress.student_id/lesson_id`, `payments.student_id/course_id`) — thêm index riêng cho cả 2 cột đã có prefix coverage từ unique constraint sẵn có (`enrollments.student_id`, `lesson_progress.student_id`), theo đúng nghĩa đen "mọi cột FK có index" của Goal, đã thống nhất trước khi implement.
- **Modules/files**: `course/entity/Courses.java`, `course/lesson/entity/{Lessons,LessonProgress}.java` (xóa `LessonProgressId.java`), `course/repository/CourseRepository.java`, `course/service/CourseService.java`, `enrollment/entity/Enrollments.java`, `enrollment/repository/EnrollmentRepository.java`, `enrollment/service/EnrollmentService.java`, `payment/entity/Payments.java`, `payment/repository/PaymentRepository.java`, `payment/service/PaymentService.java`, `db/migration/V2__data_access_hygiene.sql` (mới).
- **Existing behavior cần preserve**: Đã verify — response shape của cả 4 endpoint danh sách không đổi (đối chiếu JSON trả về trước/sau); ràng buộc 1 student × 1 lesson chỉ 1 progress record giữ nguyên, nay qua `UNIQUE(student_id, lesson_id)` thay cho PK composite cũ.
- **Migration concerns**: Đổi PK `LessonProgress` là thay đổi schema không tương thích ngược — an toàn vì bảng này chưa có endpoint/service nào dùng (đúng ghi nhận từ Phase 2), đã verify bảng rỗng trước khi migrate trên DB hosted.
- **Tests/verification**: Repo chưa có `src/test/` (đúng tiền lệ Phase 1-4, hạ tầng test dồn về Phase 39) — verify bằng **app thật chạy trên DB Neon hosted** (`mvn spring-boot:run`, bật `hibernate.generate_statistics` + log SQL):
  - Flyway áp `V2__data_access_hygiene.sql` sạch: `Successfully applied 1 migration to schema "public", now at version v2`.
  - Tạo tạm dữ liệu test (1 course, 1 student, 2 enrollment) để có ≥2 bản ghi, xác nhận **N+1 đã hết** ở cả 4 endpoint: `GET /courses`, `GET /admin/courses`, `GET /enrollments/student/me/courses` — mỗi endpoint chỉ sinh đúng 1 câu SQL fetch-join cho toàn bộ danh sách (đối chiếu log Hibernate); `GET /admin/payments` — câu JPQL fetch-join sinh đúng SQL hợp lệ (0 rows vì bảng `payments` rỗng, xem "Known issue" bên dưới).
  - Unique constraint: dùng JDBC trực tiếp (không có psql/Docker daemon trong môi trường) insert 1 lesson tạm + 2 bản ghi `lesson_progress` trùng `(student_id, lesson_id)` → bản ghi thứ 2 bị reject đúng bởi `uq_lesson_progress_student_lesson`.
  - Index: query `pg_indexes` xác nhận đủ 9 index FK đã tạo đúng tên.
  - Dữ liệu test tạo trong lúc verify đã xóa lại sau khi xong (course, user, enrollment tạm) — đối chiếu `GET /courses`/`GET /admin/users` khớp đúng baseline trước khi test, không để lại rác trên DB hosted dùng chung.
  - **Sau khi verify xong, đã chủ động revert toàn bộ thay đổi schema trên DB Neon** (đưa `lesson_progress` về lại PK composite gốc, xóa 9 index vừa tạo, xóa dòng `version=2` khỏi `flyway_schema_history`) để DB hosted không bị để lại ở trạng thái đã migrate ngoài quy trình chính thức — code (`V2__data_access_hygiene.sql` + entity/repository/service) giữ nguyên trong repo, lần chạy app tiếp theo (kể cả của reviewer) sẽ tự áp lại đúng migration này qua Flyway như bình thường.
- **Known issue phát hiện trong lúc verify, không sửa ở phase này** (pre-existing, đã ghi nhận từ Phase 3 known issue #1): `POST /payments/checkout` vẫn lỗi 500 do bug `@AuthenticationPrincipal CustomUserDetails` luôn `null` → không tạo được `Payments` thật qua API để test N+1 với >0 rows ở `GET /admin/payments`; đã verify gián tiếp qua cấu trúc SQL sinh ra đúng (join `payments`→`users`(student)→`courses`→`users`(instructor)/`categories`), cùng pattern đã verify trực tiếp thành công ở 3 endpoint còn lại.
- **Exit criteria**: Đạt đủ — không còn `FetchType.EAGER` mặc định (đã grep xác nhận toàn bộ `@ManyToOne` có `FetchType.LAZY`); đủ 9/9 cột FK có index (verify qua `pg_indexes` thật); `LessonProgress` dùng surrogate key (`progress_id`), `LessonProgressId.java` đã xóa; `mvn clean package` PASS.
- **Trace**: ADR-018, ADR-019, NFR-001.

---

## Stage B — Frontend Foundation

### Phase 6: Project restructure (frontend) — ĐÃ HOÀN TẤT

- **Goal**: Có cấu trúc thư mục theo feature trước khi thêm API client/state layer và Teacher area mới.
- **Scope thực tế đã làm**: Di chuyển toàn bộ `components/{admin,student,public,checkout,common}` (23 file) và `pages/{admin,student,auth,public}` (18 file, trừ 2 dead file) sang `shared/ui/` + `features/{auth,public,courses,student,admin,payment}/` bằng `git mv` (giữ lịch sử rename), đúng theo mục C — bao gồm cả phần bổ sung "Cấu trúc bên trong mỗi `features/<audience>/`" đã chốt và ghi vào mục C **trước khi** move (theo đúng rule dòng 11: bổ sung structure trước khi tạo file, không tự quyết tại chỗ). Chỉ move + sửa import path, không đổi logic/nội dung file nào (đã đối chiếu diff: mỗi file move chỉ đổi các dòng `import`, giữ nguyên phần còn lại — xác nhận qua `git diff --stat` similarity 98-100%).
- **Quyết định phát sinh khi implement (đã hỏi trước khi làm, không tự quyết)**: Mục C gốc chỉ liệt kê `features/<audience>/` phẳng, không đặc tả cấu trúc bên trong — đã chốt: giữ subfolder theo domain hiện có (`features/<audience>/<domain>/Page.tsx`, domain 1-file thì để phẳng ngay dưới `features/<audience>/`), component dùng riêng trong 1 audience gom vào `features/<audience>/components/`. Đã ghi bổ sung vào mục C của REFACTOR_PLAN.md.
- **Dependencies**: Không phụ thuộc Stage A — đã chạy độc lập, không đụng `academic-management-api/`.
- **Changes đã thực hiện**:
  - `shared/ui/`: `Badge.tsx`, `EmptyState.tsx`, `Skeleton.tsx`, `Toast.tsx` (từ `components/common/`).
  - `features/public/`: pages `home/HomePage.tsx`, `lecturer/LecturerPage.tsx`, `about/ContactPage.tsx`; `components/{Header,Footer,PublicLayout,TeacherCard}.tsx`.
  - `features/courses/`: `CourseListPage.tsx`, `CourseDetailPage.tsx`, `components/CourseCard.tsx` (trước ở `components/public/CourseCard.tsx` — đã xác định thuộc domain `courses` chứ không phải `public` vì chỉ được `CourseListPage` dùng, đúng như đã ghi ở mục C bổ sung).
  - `features/auth/`: `Login.tsx`, `Signup.tsx`.
  - `features/student/`: pages `dashboard/Dashboard.tsx`, `my-courses/MyCourses.tsx`, `learning-profile/LearningProfile.tsx` (đổi tên từ `LearningProgress.tsx`), `profile/Profile.tsx`, `test-practice/TestPractice.tsx`; `components/{InfoItem,StudentHeader,StudentLayout,StudentSidebar}.tsx`.
  - `features/admin/`: pages `categories/AdminCategories.tsx`, `courses/AdminCourses.tsx`, `dashboard/AdminDashboard.tsx`, `orders/AdminOrders.tsx`, `users/AdminUsersList.tsx`; `components/{AddCourseOverlay,AddUserOverlay,AdminHeader,AdminLayout,AdminSidebar,CategoryOverlay,EditUserOverlay}.tsx`.
  - `features/payment/`: `Checkout.tsx` (từ `pages/public/payment/Checkout.tsx`) + `components/{PaymentForm,OrderSummary,EnrollSuccessOverlay}.tsx` (từ `components/checkout/*`) — gộp đúng như plan gốc.
  - Xóa `pages/auth/AuthPage.tsx`, `pages/student/dashboard/MyCoursesOverview.tsx` (đã xác nhận 0 dòng, 0 import trước khi xóa).
  - `features/teacher/` **không tạo** — chưa có file/nội dung nào thuộc domain này (đúng nguyên tắc "không thêm abstraction chưa cần"; khác với liệt kê sơ bộ ban đầu trong Scope nhưng khớp đúng thực tế `teacher/` vẫn là placeholder chưa implement, ghi rõ ở CLAUDE.md).
  - Sửa toàn bộ 19 import trong `routes/AppRoutes.tsx` trỏ đúng `features/*` mới; sửa 27 dòng relative import (`../`) và 21 dòng `@/components|@/pages` import trong các file vừa move — tính lại đúng số cấp `../` theo độ sâu thư mục mới của từng file (một số file sâu hơn 1 cấp do `components/<x>/File.tsx` → `features/<audience>/components/File.tsx`, một số nông hơn 1 cấp do `pages/public/<domain>/Page.tsx` → `features/<audience>/Page.tsx`).
  - Cập nhật `CLAUDE.md` mục "Frontend architecture" khớp cấu trúc mới.
- **Modules/files**: Toàn bộ `academic-management-website/src/{components,pages}` (đã xóa 2 thư mục này hoàn toàn) → `academic-management-website/src/{shared/ui,features}/`; `routes/AppRoutes.tsx`; `CLAUDE.md`; `docs/REFACTOR_PLAN.md` (mục C).
- **Existing behavior cần preserve**: Đã verify — `npm run build` (`tsc -b && vite build`) pass sạch, 0 lỗi import; dev server (`npm run dev`) khởi động sạch, `GET /` trả 200. **Chưa verify được** bằng click-through trình duyệt thật (môi trường sandbox không có trình duyệt) — cần verify thủ công trước khi merge, đúng như risk đã ghi nhận ở bản kế hoạch gốc.
- **Migration concerns**: Đã tách riêng — toàn bộ thay đổi trong phase này chỉ là move file + sửa import, không có dòng logic/JSX nào bị sửa (đối chiếu diff xác nhận).
- **Tests/verification**:
  - `npm run build` → PASS (0 lỗi TypeScript, build ra `dist/` thành công).
  - `npm run lint` → **2 vấn đề pre-existing, không phải regression của phase này** (đối chiếu `git show HEAD:<đường dẫn cũ>` xác nhận y hệt trước khi move): `features/courses/CourseDetailPage.tsx:41` warning `react-hooks/exhaustive-deps`; `features/student/profile/Profile.tsx:86` error `@typescript-eslint/no-unused-vars` (biến `error` trong `catch`). Không sửa ở phase này (ngoài phạm vi "chỉ move", đúng nguyên tắc không mở rộng scope/không refactor unrelated code).
  - Backend không bị đụng tới (`git diff --stat -- academic-management-api` rỗng).
- **Exit criteria**: Build sạch; cấu trúc thư mục khớp mục C + phần bổ sung; không còn `components/`, `pages/` ở `src/` gốc; không còn `components/checkout/`; 2 dead file đã xóa; `LearningProgress.tsx` đã đổi tên. **Riêng "lint sạch"**: không đạt 100% do 2 lỗi lint pre-existing nêu trên — đã xác nhận không phải do phase này gây ra, chấp nhận là known issue thay vì tự ý sửa ngoài scope.
- **Trace**: Architecture §4, §13; Target Project Structure mục C.

### Phase 7: API client layer — ĐÃ HOÀN TẤT

- **Goal**: Một điểm gọi API duy nhất, thay thế fetch rải rác.
- **Scope thực tế đã làm**: Tạo `shared/api/client.ts` (`apiClient`) — tự gắn bearer token khi có, tự xử lý 401 → logout; thay toàn bộ 25 lời gọi `fetch()` trực tiếp ở 14 trang bằng `apiClient`; bổ sung `API_ENDPOINTS` còn thiếu (`CATEGORIES`, `USERS.ADD/DETAIL/LOCK/UNLOCK`, `COURSES.ADMIN_DETAIL`, `ADMIN.PAYMENTS`) để không còn endpoint hardcode; xóa `utils/AuthFetch.ts` (đã gộp vào `apiClient`, không còn call site).
- **Deviation #1 (đã báo trước khi implement)**: `admin/dashboard/AdminDashboard.tsx` bị thiếu khỏi danh sách 13 trang gốc của bản kế hoạch (grep `fetch()` toàn `src` cho ra 14 file, không phải 13) — đã bổ sung vào scope, cùng loại thay đổi (thay fetch bằng client), không phải mở rộng scope nghiệp vụ.
- **Deviation #2 — quyết định thiết kế 401-handling (đã thảo luận + duyệt trước khi code)**: Bản kế hoạch gốc chỉ ghi "tự xử lý 401 → logout" nhưng không tính tới case: trang public (`HomePage`) gọi nhầm endpoint `/admin/total-courses` (bug pre-existing từ trước Phase 7, không sửa ở đây) — nếu auto-logout vô điều kiện trên mọi 401, khách vãng lai mở `HomePage` sẽ bị đá về `/login` dù chưa từng đăng nhập. Đã chốt: `apiClient` chỉ gắn header `Authorization` khi có token, và chỉ auto-logout khi request **có token** nhưng bị từ chối (proactive qua `isTokenExpired()`, hoặc reactive khi nhận đúng 401) — không tự logout khi gọi ẩn danh.
- **Deviation #3 — phát hiện bug thật trong lúc verify, đã sửa cùng phase (không phải mở rộng nghiệp vụ, cùng loại "auth/error handling" mà chính phase này đang làm)**:
  1. `AuthUtils.ts` — `isTokenExpired()`/`extractRole()`/`getUsername()` gọi `jwtDecode()` không có `try/catch`; token bị hỏng/tamper khiến `jwtDecode` ném `InvalidTokenError` ngay trong lúc `<Header>`/`ProtectedRoute` đang **render** → crash toàn bộ React tree (trắng màn hình), không phải lỗi async nên không bị `catch` nào trong `apiClient` bắt được. Đã sửa: bọc cả 3 hàm trong `try/catch`, coi token không parse được là "hết hạn/không hợp lệ" (`true`/`null`) thay vì throw.
  2. **Bug nghiêm trọng hơn, ở backend**: `SecurityConfig` có `httpBasic().disable()` + `formLogin().disable()` nhưng chưa từng cấu hình `AuthenticationEntryPoint` riêng → Spring Security rơi về entry point mặc định `Http403ForbiddenEntryPoint`, khiến **mọi** lỗi xác thực (thiếu token, token hỏng, VÀ đã đăng nhập nhưng sai role) đều trả cùng 1 mã **403** — không bao giờ có 401 thật. Hệ quả: nhánh auto-logout của `apiClient` (chỉ bắt 401) không bao giờ chạy được với token hỏng — user vẫn "logged in" nhưng mọi API im lặng thất bại (đúng như audit thực tế phát hiện: `curl` không token/token rác vào `/admin/total-courses` đều trả 403). Đã xác nhận bằng audit thực tế trước khi sửa (không đoán mò). **Đã hỏi và được duyệt sửa ở backend** (ngoài scope frontend gốc của Phase 7, nhưng là điều kiện bắt buộc để tính năng "auto-logout khi 401" của chính Phase 7 hoạt động đúng như thiết kế) — thêm `security/RestAuthenticationEntryPoint.java` (401 khi chưa xác thực) + `security/RestAccessDeniedHandler.java` (403 khi đã xác thực nhưng sai role) + `security/SecurityErrorResponseWriter.java` (helper dùng chung, viết JSON theo đúng format `ErrorResponse` đã có từ Phase 3), wire vào `SecurityConfig.exceptionHandling()`. Đây là 2 thành phần chạy trong Security filter chain (trước `DispatcherServlet`) nên tách biệt hoàn toàn với `GlobalExceptionHandler` (chỉ bắt exception ném ra trong controller/service) — không phải trùng lặp.
  3. **Bug thứ 3, phát hiện sau khi người dùng đặt câu hỏi trực tiếp "vì sao HomePage/CourseListPage không hiển thị số liệu"** — đã audit lại toàn bộ 29 lời gọi `apiClient` còn lại (đối chiếu từng endpoint với rule phân quyền ở `SecurityConfig`, không chỉ 2 trang bị báo) để đảm bảo không sót thêm chỗ nào tương tự, kết quả chỉ có đúng 2 trang này sai (27 lời gọi còn lại ở Admin/Student pages đều đúng endpoint theo đúng quyền của mình):
     - `CourseListPage.fetchCategories()` gọi `/admin/categories` (chỉ `ROLE_ADMIN`) — trong khi `CategoryController` **đã có sẵn** `GET /categories` public đúng mục đích này (đúng như mô tả từ trước trong `CLAUDE.md`: "`CategoryController` (public `/categories`)"). Audit thêm phát hiện `/categories` **thực ra cũng đang bug ở backend**: `SecurityConfig.permitAll()` liệt kê `/auth/**`, `/courses/**` nhưng quên `/categories` → endpoint dù được thiết kế/document là public vẫn rơi vào rule mặc định "yêu cầu đăng nhập" (đã verify `curl /categories` không token → 401 trước khi sửa). Đã sửa: thêm `/categories` vào `permitAll()` trong `SecurityConfig.java`; đổi `CourseListPage.tsx` sang gọi đúng `/categories`.
     - `HomePage.tsx` gọi `/admin/total-courses` (chỉ `ROLE_ADMIN`) để lấy tổng số khóa học hiển thị — không cần thiết vì `GET /courses` (đã public sẵn, `CourseListPage` cũng đang dùng) trả về đúng toàn bộ danh sách, chỉ cần lấy `.length`. Đã sửa: `HomePage.tsx` đổi sang gọi `COURSES.LIST` + `data.length`, không gọi endpoint admin nào nữa.
     - Đổi tên hằng số cho rõ nghĩa (theo đúng convention đã có ở `COURSES.LIST`/`COURSES.ADMIN_LIST`): `CATEGORIES.LIST` giờ trỏ `/categories` (public); thêm `CATEGORIES.ADMIN_LIST` trỏ `/admin/categories` (dùng cho `AdminCourses.tsx`/`AdminCategories.tsx`, đã cập nhật 2 call site này theo tên mới, hành vi không đổi vì cùng URL cũ).
     - Đã verify bằng `curl` thật sau khi sửa: `/categories` không token → 200 (trả đúng data); `/admin/categories` không token → vẫn 401 (không bị nới lỏng ngoài ý muốn); `/admin/total-courses` không token → vẫn 401 (không đổi, vì không còn nơi nào gọi tới nữa ngoài `AdminDashboard`).
- **Dependencies**: Phase 6.
- **Modules/files**: `shared/api/client.ts` (mới), `config/constants.ts`, `utils/AuthUtils.ts`, `utils/AuthFetch.ts` (xóa), 14 trang (`auth/{Login,Signup}`, `public/home/HomePage`, `courses/{CourseListPage,CourseDetailPage}`, `payment/Checkout`, `student/{dashboard/Dashboard,my-courses/MyCourses,profile/Profile}`, `admin/{courses/AdminCourses,users/AdminUsersList,categories/AdminCategories,orders/AdminOrders,dashboard/AdminDashboard}`); backend: `security/{RestAuthenticationEntryPoint,RestAccessDeniedHandler,SecurityErrorResponseWriter}.java` (mới), `security/SecurityConfig.java`.
- **Existing behavior cần preserve**: Dữ liệu hiển thị và luồng thao tác hiện có không đổi ở tầng UI. Có 2 thay đổi hành vi **có chủ đích** (đã ghi rõ, không phải regression âm thầm): (1) request ẩn danh nhận 401/403 không còn tự logout (trước đây các trang dùng `authFetch` cũ cũng không có khái niệm này với case ẩn danh — hành vi mới nhất quán hơn, không phải theo tiền lệ cũ); (2) mọi request có token bị từ chối do sai/hết hạn giờ auto-logout thống nhất — kể cả 2 trang `AdminUsersList`/`AdminOrders` trước đây dùng raw `fetch()` không có auto-logout (đã xác nhận là inconsistency ngẫu nhiên giữa các trang Admin, không phải quyết định thiết kế cũ cần giữ).
- **Migration concerns**: Không cần nhánh tương thích lỗi cũ/mới — Phase 3 (chuẩn hóa `ErrorResponse`) đã hoàn tất từ trước, và Phase 7 còn bổ sung thêm đúng 2 status code còn thiếu (401/403) vào cùng 1 hợp đồng lỗi đó.
- **Tests/verification**: `npx tsc -b` PASS; `npm run build` PASS; `npm run lint` — 2 lỗi pre-existing từ Phase 6 (không phải regression, đã đối chiếu). Verify **thủ công bằng backend thật** (Docker, DB Neon hosted) qua `curl`:
  - Không token → `GET /admin/total-courses` → **401** `{"status":401,"error":"Unauthorized",...}`.
  - Token rác/không parse được → **401** (không còn rơi vào nhánh unhandled/500).
  - Token hợp lệ nhưng sai role (tài khoản STUDENT gọi endpoint `/admin/**`) → **403** `{"status":403,"error":"Forbidden",...}`.
  - Tài khoản test tạo trong lúc verify (`phase7test`) đã xóa lại sau khi xong, không để lại rác trên DB hosted dùng chung.
  - Backend build/rebuild qua `docker-compose up --build`: Flyway migrate OK, Tomcat start OK, `GET /courses` → 200.
  - Sau khi sửa Deviation #3.3: `curl /categories` không token → **200**; `curl /admin/categories` không token → vẫn **401** (không bị nới lỏng); `curl /admin/total-courses` không token → vẫn **401** (không đổi).
  - `npx tsc -b`, `npm run build`, `mvn clean compile` PASS lại lần cuối sau toàn bộ fix.
  - **Chưa verify được** bằng click-through trình duyệt thật đầy đủ tất cả 14 trang trong phiên làm việc này (môi trường sandbox) — người dùng đã tự verify 1 phần qua trình duyệt thật (phát hiện đúng cả 3 bug ở Deviation #3), cần verify nốt phần còn lại (đặc biệt số liệu `HomePage`/bộ lọc `CourseListPage` hiện đúng) trước khi coi phase này merge-ready.
- **Known issues phát hiện trong lúc verify, không sửa ở phase này (ngoài scope, đã ghi nhận)**: Known issue #1 từ Phase 3 (`@AuthenticationPrincipal CustomUserDetails` luôn `null` ở `PaymentController.checkout()` → NPE) vẫn chưa sửa, không liên quan tới thay đổi của Phase 7.
- **Exit criteria**: Đạt đủ — không còn `fetch()` gọi trực tiếp ngoài `shared/api/client.ts` (đã grep xác nhận); không còn endpoint hardcode ngoài `API_ENDPOINTS`; 401 và 403 đã tách biệt đúng ở cả backend lẫn cách frontend phản ứng; toàn bộ 29 lời gọi API (không riêng 25 lời gọi được move ban đầu) đã đối chiếu đúng quyền theo `SecurityConfig`, không còn trang nào gọi nhầm endpoint sai quyền.
- **File/doc liên quan đã cập nhật**: `CLAUDE.md` (mục "Backend architecture" — bổ sung `RestAuthenticationEntryPoint`/`RestAccessDeniedHandler`; mục "Frontend architecture" — thay mô tả `AuthFetch.ts` đã xóa bằng `shared/api/client.ts`), `docs/REFACTOR_PLAN.md` (mục Phase 7 này).
- **Trace**: ADR-021.

### Phase 8: Server state (TanStack Query) — ĐÃ HOÀN TẤT

- **Goal**: Loại bỏ duplication fetch/cache tự phát.
- **Scope thực tế đã làm**: Cài `@tanstack/react-query`; chuyển đúng 5 trang có fetch trùng lặp thật (đã audit code trước khi làm, khớp nguyên nhân nêu ở ADR-020): `CourseListPage`/`HomePage` (cùng gọi `/courses`), `AdminCourses`/`AdminCategories` (cùng gọi `/admin/courses` và `/admin/categories`), `AdminDashboard` (gộp cùng nhóm vì cùng khái niệm "course-count", tuy dùng endpoint `/admin/total-courses`/`/admin/total-users` riêng).
- **Điều chỉnh phạm vi (đã thảo luận + duyệt trước khi code)**: Các trang GET khác (Profile, MyCourses, Dashboard summary sinh viên, AdminUsersList, AdminOrders, CourseDetailPage) mỗi trang chỉ có đúng 1 call site, không trùng lặp — **không** chuyển ở phase này (dời sang phase kế tiếp áp dụng dần), tránh phình phạm vi ra ngoài đúng nghĩa "loại bỏ duplication" của Goal.
- **Điều chỉnh Target Structure (đã làm trước khi tạo file, đúng rule dòng 11)**: Mục C chưa có vị trí cho query hook — đã bổ sung `shared/api/queryClient.ts` + `shared/api/queries/` vào cây thư mục mục C trước khi tạo file.
- **Dependencies**: Phase 7.
- **Changes đã thực hiện**:
  - `shared/api/queryClient.ts` (mới) — `QueryClient` dùng chung, `defaultOptions.queries.retry: 1` (không dùng mặc định 3 lần — `apiClient` tự `logout()` khi request có token bị 401, retry mặc định sẽ gọi lại API thừa nhiều lần sau khi đã logout).
  - `main.tsx` — bọc `QueryClientProvider`.
  - `shared/api/queries/useCoursesQuery.ts`, `useCategoriesQuery.ts` (public `/courses`, `/categories`) — dùng ở `CourseListPage`, `HomePage`.
  - `shared/api/queries/useAdminCoursesQuery.ts`, `useAdminCategoriesQuery.ts` (`/admin/courses`, `/admin/categories`) — dùng ở `AdminCourses`, `AdminCategories`; cùng 1 `queryKey` hằng số export từ hook để 2 trang chia sẻ đúng 1 cache entry.
  - `shared/api/queries/useAdminStatsQuery.ts` (`/admin/total-users`, `/admin/total-courses`) — dùng ở `AdminDashboard`; giữ 2 `useQuery` độc lập (không gộp làm 1 queryFn) để giữ đúng hành vi cũ: 1 request lỗi không kéo request kia lỗi theo.
  - `CourseListPage.tsx` — thay `fetchCategories`/`refreshCourseList`/`useState(allCourses/loading/loadError/categoryOptions/levelOptions)` bằng 2 hook trên + `useMemo` derive (giữ nguyên logic map/sort/filter, chỉ đổi nguồn dữ liệu); nút "Thử lại" gọi `coursesQuery.refetch()`.
  - `HomePage.tsx` — thay fetch `totalCourses` bằng `useCoursesQuery().data?.length`.
  - `AdminCourses.tsx` — thay `fetchCategories`/`refreshCoursesList` bằng 2 hook trên; 3 mutation (add/edit/delete course) gọi `queryClient.invalidateQueries({queryKey: adminCoursesQueryKey})` thay vì tự refetch. `fetchInstructors`/`INSTRUCTORS.LIST` giữ nguyên `useState`+fetch thủ công (ngoài phạm vi đã chốt, chỉ 1 call site).
  - `AdminCategories.tsx` — thay `refreshCategories`/`fetchCourseCounts` bằng `useAdminCategoriesQuery` + `useMemo` derive count từ `useAdminCoursesQuery` (cùng cache key với `AdminCourses` → điều hướng qua lại không fetch lại); 3 mutation category gọi `queryClient.invalidateQueries({queryKey: adminCategoriesQueryKey})`.
  - `AdminDashboard.tsx` — thay 2 fetch độc lập bằng `useAdminStatsQuery()`.
- **Modules/files**: `src/main.tsx`, `src/shared/api/queryClient.ts` (mới), `src/shared/api/queries/{useCoursesQuery,useCategoriesQuery,useAdminCoursesQuery,useAdminCategoriesQuery,useAdminStatsQuery}.ts` (mới), `src/features/courses/CourseListPage.tsx`, `src/features/public/home/HomePage.tsx`, `src/features/admin/courses/AdminCourses.tsx`, `src/features/admin/categories/AdminCategories.tsx`, `src/features/admin/dashboard/AdminDashboard.tsx`, `package.json`.
- **Existing behavior cần preserve**: Đã giữ — dữ liệu hiển thị, thứ tự sort, logic filter/pagination ở `CourseListPage` không đổi; loading/error UI (`SkeletonCardGrid`/`SkeletonTable`/`EmptyState`) giữ nguyên, chỉ đổi nguồn state (`isLoading`/`isError` của React Query thay cho `useState` thủ công); mutation vẫn cập nhật danh sách ngay sau khi thao tác (qua `invalidateQueries` thay vì tự refetch).
- **Migration concerns**: Làm theo từng trang tuần tự đúng plan (courses public → admin courses/categories → admin dashboard), không đổi 1 lần toàn bộ.
- **Tests/verification**: Repo chưa có hạ tầng test frontend (`package.json` không có `vitest`/`jest`, dựng test suite dồn về Phase 39 theo đúng tiền lệ Phase 6/7) — không thêm automated test ở phase này. Đã verify:
  - `npx tsc -b` PASS (0 lỗi).
  - `npm run build` PASS (`tsc -b && vite build` build ra `dist/` thành công).
  - `npm run lint` — chỉ còn đúng 2 lỗi pre-existing đã biết từ Phase 6 (`CourseDetailPage.tsx:41` warning `react-hooks/exhaustive-deps`, `Profile.tsx:79` error `no-unused-vars`), không phát sinh lỗi lint mới.
  - `git diff --stat -- academic-management-api` rỗng — backend không bị đụng.
  - **Chưa verify được** bằng click-through trình duyệt thật (môi trường sandbox không có trình duyệt) — cần verify thủ công: điều hướng qua lại `CourseListPage`⇄`HomePage` và `AdminCourses`⇄`AdminCategories` xác nhận không fetch lại (Network tab); admin sửa/xoá category/course xác nhận danh sách + course-count cập nhật ngay không cần reload.
- **Exit criteria**: Đạt đủ trong phạm vi đã chốt — `/courses`, `/categories`, `/admin/courses`, `/admin/categories` không còn bị gọi trùng lặp ở code (đã đối chiếu diff); 5 trang trong phạm vi đã chuyển hẳn sang React Query, không còn `useState`/`useEffect` fetch thủ công cho dữ liệu đó. Các trang GET đơn lẻ còn lại (Profile, MyCourses, Dashboard summary, AdminUsersList, AdminOrders, CourseDetailPage) **chưa** chuyển — ghi nhận rõ đây là quyết định phạm vi đã duyệt, không phải sót.
- **Trace**: ADR-020.

### Phase 9: Auth state + fix `isTokenExpired` bug — ĐÃ HOÀN TẤT

- **Goal**: Tập trung auth state, sửa bug bảo mật thật.
- **Scope thực tế đã làm**: Tạo `AuthContext`/`AuthProvider`; sửa `isTokenExpired` để token thiếu `exp` không còn bị coi là "không bao giờ hết hạn"; chuyển toàn bộ nơi đọc/ghi auth state trực tiếp (`localStorage`/`AuthUtils`) sang qua context.
- **Điều chỉnh phạm vi so với bản kế hoạch gốc (đã audit code thật trước khi implement, đã duyệt trước khi code — xem trao đổi trước khi implement)**:
  - **`Profile.tsx` bị loại khỏi scope**: audit lại cho thấy file này không hề đọc `localStorage`/gọi `AuthUtils` trực tiếp (chỉ gọi `apiClient(USERS.ME)` lấy profile từ backend) — assumption gốc của plan sai, không có gì để sửa ở đây.
  - **Thêm 4 file vào scope** (đúng tinh thần Goal "tập trung auth state", audit phát hiện ngoài 3 file gốc còn đọc/ghi auth state trực tiếp):
    - `CourseDetailPage.tsx` — trước đó tự tính `isLoggedIn` bằng `!!localStorage.getItem("accessToken")` (string literal cứng, bỏ qua cả `STORAGE_KEYS` lẫn kiểm tra hết hạn) → đổi sang `useAuth().isLoggedIn`. Đây là thay đổi hành vi có chủ đích: trước đây token hết hạn vẫn hiện nút "Đăng ký" hoạt động được tới khi `apiClient` trả 401 mới bị đá ra; nay bị chặn sớm hơn ngay từ client — đúng mục tiêu bảo mật của phase.
    - `ProtectedRoute.tsx` — đổi `isLoggedIn()`/`extractRole()` gọi trực tiếp từ `AuthUtils` sang đọc từ `useAuth()`.
    - `StudentHeader.tsx`, `AdminHeader.tsx` — đổi gọi `logout()` import thẳng từ `AuthUtils` sang `useAuth().logout()` (hành vi runtime không đổi vì context chỉ pass-through gọi lại đúng hàm cũ).
- **Deviation kỹ thuật phát sinh khi implement (không phải quyết định phạm vi, mà là fix lint error thật)**: `AuthContext.tsx` ban đầu gộp cả `AuthProvider` component lẫn `useAuth` hook lẫn `createContext(...)` trong 1 file → vi phạm rule `react-refresh/only-export-components` (cấu hình mặc định `error`, không phải `warn`, trong `eslint.config.js` có sẵn từ trước, không phải rule mới thêm). Đã tách thành 3 file theo đúng convention `useX.ts` đã có trong Target Structure mục C:
  - `shared/auth/authContextObject.ts` — `createContext(...)` + types (`AuthState`, `AuthContextValue`, `LoginData`).
  - `shared/auth/AuthContext.tsx` — chỉ còn `AuthProvider` component.
  - `shared/auth/useAuth.ts` — hook `useAuth()`.
  (Tên file `authContextObject.ts` thay vì `authContext.ts` vì Windows filesystem không phân biệt hoa/thường — trùng tên với `AuthContext.tsx` gây lỗi biên dịch `TS1149`.)
- **Dependencies**: Phase 7 (đã xong trước đó) — xác nhận không có xung đột: `apiClient.logout()` dùng `window.location.href` (hard reload) nên tự nhiên remount `AuthProvider` với state mới từ `localStorage`, không cần cầu nối 2 chiều giữa `apiClient` và context.
- **Changes đã thực hiện**:
  - `utils/AuthUtils.ts` — `isTokenExpired()`: `if (!decoded.exp) return false` → `return true` (token thiếu `exp` = dữ liệu bất thường = coi là hết hạn).
  - `shared/auth/authContextObject.ts`, `shared/auth/AuthContext.tsx`, `shared/auth/useAuth.ts` (cả 3 mới) — state `{isLoggedIn, role, username}` khởi tạo từ `AuthUtils` lúc mount; `login(data)` ghi 4 key `localStorage` (dùng `STORAGE_KEYS`, giữ đúng hành vi ghi cũ) rồi cập nhật state ngay (đồng bộ, không cần chờ `location` đổi); `logout()` pass-through gọi `AuthUtils.logout()`; lắng nghe `storage` event để sync cross-tab.
  - `main.tsx` — bọc `<AuthProvider>` trong `<QueryClientProvider>`, ngoài `<App />`.
  - `Header.tsx` — đọc `{isLoggedIn, logout}` từ `useAuth()`; xóa 2 `useEffect` cũ (re-check theo `location` + `storage` listener thủ công) vì context đã cover cả 2 concern này.
  - `Login.tsx` — thay 4 dòng `localStorage.setItem(...)` bằng `useAuth().login(data)`.
  - `ProtectedRoute.tsx`, `CourseDetailPage.tsx`, `StudentHeader.tsx`, `AdminHeader.tsx` — như mô tả ở mục "Điều chỉnh phạm vi" trên.
- **Modules/files**: `utils/AuthUtils.ts`; `shared/auth/{authContextObject.ts, AuthContext.tsx, useAuth.ts}` (mới); `main.tsx`; `features/public/components/Header.tsx`; `features/auth/Login.tsx`; `routes/ProtectedRoute.tsx`; `features/courses/CourseDetailPage.tsx`; `features/student/components/StudentHeader.tsx`; `features/admin/components/AdminHeader.tsx`. **Không đổi**: `features/student/profile/Profile.tsx` (không cần, xem lý do trên); `shared/api/client.ts` (giữ nguyên gọi thẳng `AuthUtils` — chạy ngoài React tree, không phải nơi cần context).
- **Existing behavior cần preserve**: Đã giữ — luồng login (role `ADMIN` → `/admin/dashboard`; có `from` → quay lại; mặc định → `/student/dashboard`) không đổi; luồng logout (hard redirect `/login`, xóa đủ 4 key) không đổi; `ProtectedRoute` (chưa login → `/login` kèm `state.from`; sai role → `/`) không đổi logic, chỉ đổi nguồn đọc. Token có `exp` hợp lệ (chưa hết hạn) hành vi y hệt trước — đã verify riêng để không vô tình đổi hành vi case này.
- **Migration concerns**: Bug bảo mật thật (session không hết hạn khi thiếu `exp`) — đã verify bằng script throwaway trước khi động tới bất kỳ component nào (đúng thứ tự: fix bug trong `AuthUtils.ts` → verify độc lập → mới build `AuthContext` lên trên).
- **Tests/verification**: Repo chưa có hạ tầng test frontend (tiền lệ đã lặp lại từ Phase 6/7/8 — dồn về Phase 39) → **không cài `vitest`**, verify bằng script Node throwaway (chạy tay, không commit vào repo) mô phỏng lại đúng logic `isTokenExpired` đã sửa, chạy `jwt-decode@4.0.0` thật (đúng version đang dùng trong `package.json`) với 4 case:
  - Token có `exp` trong quá khứ → `isTokenExpired()` = `true` — PASS.
  - Token **thiếu** `exp` → `isTokenExpired()` = `true` (case bug, trước đây là `false`) — PASS.
  - Token có `exp` trong tương lai → `isTokenExpired()` = `false` (đảm bảo không đổi hành vi case hợp lệ) — PASS.
  - Token rác/không parse được → `isTokenExpired()` = `true` — PASS.
  - `npx tsc -b` PASS (0 lỗi); `npm run lint` — chỉ còn đúng 2 lỗi pre-existing đã biết từ Phase 6 (`CourseDetailPage.tsx` warning `react-hooks/exhaustive-deps`, `Profile.tsx` error `no-unused-vars`), không phát sinh lỗi mới; `npm run build` PASS (`tsc -b && vite build` ra `dist/` thành công).
  - **Chưa verify được** bằng click-through trình duyệt thật (môi trường sandbox không có trình duyệt) — cần verify thủ công trước khi merge: (1) login → `Header`/`StudentHeader`/`AdminHeader` cập nhật trạng thái ngay không cần điều hướng thêm lần nữa; (2) logout từ cả 3 header đều redirect `/login` đúng; (3) sửa tay `accessToken` trong `localStorage` thành token không có `exp` (hoặc token rác) → gọi lại trang cần auth (`/student/profile`) → phải bị coi là chưa login/bị auto-logout; (4) `CourseDetailPage` ẩn danh bấm "Đăng ký" → redirect `/login` đúng `from`; (5) multi-tab — logout ở tab A → tab B (đang mở `Header`) tự cập nhật UI qua `storage` event.
- **Exit criteria**: Đạt đủ trong phạm vi đã audit lại — đã grep xác nhận không còn nơi nào trong `src/features/`, `src/routes/` gọi trực tiếp `isLoggedIn()`/`extractRole()`/`getUsername()`/đọc `localStorage` key auth ngoài `shared/auth/*` và `shared/api/client.ts` (boundary đã biết, giữ nguyên có chủ đích); bug `isTokenExpired` đã sửa, verify bằng 4 test case (không phải automated test do quyết định phạm vi test infra đã duyệt).
- **Trace**: Architecture §9; audit finding (bug bảo mật).

---

## Stage C — UI Foundation (Primitives & Shared Components)

> Điều kiện tiên quyết trước khi redesign bất kỳ trang nào (Stage I trở đi) — nếu bỏ qua Stage này, redesign từng trang sẽ tái tạo lại chính vấn đề duplication hiện tại ở dạng mới.

### Phase 10: Design tokens vào Tailwind config

- **Goal**: Semantic token từ `DESIGN_SYSTEM.md` có mặt trong codebase trước khi bất kỳ component nào dùng.
- **Scope**: Cập nhật `tailwind.config.js` theo bảng token §3 (Teal palette, neutral, status, action, nav, focus) và §8 (radius/shadow) trong `DESIGN_SYSTEM.md`; **chưa sửa component nào dùng token cũ ở phase này**.
- **Dependencies**: Không phụ thuộc Stage A/B — độc lập, có thể chạy sớm.
- **Changes required**: `tailwind.config.js` — thêm `colors` semantic, `borderRadius`, `boxShadow` theo Design System; giữ token cũ (`primary`, `cta`...) song song tạm thời để không breaking mọi component ngay lập tức.
- **Modules/files**: `academic-management-website/tailwind.config.js`.
- **Existing behavior cần preserve**: Giao diện hiện tại không đổi ở phase này (token mới thêm vào, token cũ chưa xóa).
- **Migration concerns**: Token cũ (`primary`, `cta`, `surface`, `ink`...) phải được lên kế hoạch xóa sau khi **toàn bộ** component đã chuyển sang token mới (cuối Stage I) — ghi rõ đây là compatibility code tạm thời, không xóa sớm vì sẽ vỡ giao diện cũ chưa kịp redesign.
- **Tests/verification**: Build Tailwind thành công, không xung đột tên token; component hiện có vẫn render đúng (vì chưa đổi).
- **Exit criteria**: Token mới có mặt đầy đủ trong config; token cũ chưa bị xóa (đánh dấu deprecated trong comment).
- **Trace**: DESIGN_SYSTEM.md §3, §6, §8.

### Phase 11: Primitives — Button, Badge

- **Goal**: 2 primitive nền tảng, dùng nhiều nhất trong toàn app.
- **Scope**: Tạo `Button` (5 variant, 3 size, states theo §10.1); refactor `Badge.tsx` hiện có sang dùng `status-*-bg`/`status-*-text` token (§3.2, §10.4).
- **Dependencies**: Phase 10.
- **Changes required**: `shared/ui/Button.tsx` (mới); `shared/ui/Badge.tsx` (refactor từ `components/common/Badge.tsx`).
- **Modules/files**: `shared/ui/Button.tsx`, `shared/ui/Badge.tsx`.
- **Existing behavior cần preserve**: Không có nơi dùng nào ở phase này (component mới độc lập, `Badge` refactor chưa áp dụng lại vào page dùng nó — đó là việc của Stage I).
- **Migration concerns**: Không tạo prop ngoài 5 variant đã chốt (tránh abstraction sớm — Component System §9).
- **Tests/verification**: Test riêng từng variant/state của `Button` (đặc biệt `loading` giữ nguyên kích thước, `disabled` không có hover effect); test `Badge` với đủ 4 tone.
- **Exit criteria**: `Button`/`Badge` sẵn sàng dùng, có test, chưa áp dụng vào page nào.
- **Trace**: DESIGN_SYSTEM.md §10.1, §10.4; Component System §3.1, §3.3.

### Phase 12: Primitives — Input, Textarea, FormField, Card

- **Goal**: Primitive nhập liệu và khung nội dung.
- **Scope**: Tạo `Input`/`Textarea` (filled style §10.2), `FormField` (wrapper label/error/helper theo §11), `Card` (2 variant marketing/app theo §10.3), `DateRangeInput` (biến thể `Input` cho filter theo khoảng thời gian, cần cho AdminAuditLog — Phase 36).
- **Dependencies**: Phase 10.
- **Changes required**: `shared/ui/Input.tsx`, `shared/ui/FormField.tsx`, `shared/ui/Card.tsx`, `shared/ui/DateRangeInput.tsx`.
- **Modules/files**: `shared/ui/`.
- **Existing behavior cần preserve**: Không có (component mới, chưa áp dụng).
- **Migration concerns**: `FormField` phải tự sinh `id`/`aria-describedby` (đây là điểm hiện tại đang bị bỏ sót ở `PaymentForm`/`CategoryOverlay`) — làm đúng ngay từ primitive để không lặp lại thiếu sót.
- **Tests/verification**: Test `FormField` gắn đúng `htmlFor`/`aria-describedby`; test `Input` error state đổi border đúng token.
- **Exit criteria**: `Input`/`FormField`/`Card`/`DateRangeInput` sẵn sàng dùng, có test.
- **Trace**: DESIGN_SYSTEM.md §10.2, §10.3, §11; Component System §3.2 (bao gồm `DateRangeInput`), §3.4.

### Phase 13: Shared — ToastProvider, Modal, ConfirmDeleteModal

- **Goal**: Xóa nguồn duplication nghiêm trọng nhất (mỗi trang tự viết toast/modal logic).
- **Scope**: Tạo `ToastProvider` + `useToast()` (thay `Toast.tsx` đơn lẻ hiện tại); tạo `Modal` khung dùng chung; tạo `ConfirmDeleteModal` preset trên `Modal`; tạo `DropdownMenu` (popover nhỏ, khác `Modal` — không overlay/focus-trap toàn màn hình, dùng cho menu "···" trong MyCourses — UI_SPEC §3.2).
- **Dependencies**: Phase 11 (Button dùng trong Modal footer).
- **Changes required**: `shared/ui/ToastProvider.tsx`, `shared/ui/Modal.tsx`, `shared/ui/ConfirmDeleteModal.tsx`, `shared/ui/DropdownMenu.tsx`; đặt `ToastProvider` ở root app (`main.tsx`), **chưa xóa toast logic cũ trong từng page ở phase này** (việc thay thế thuộc Stage I khi redesign từng trang).
- **Modules/files**: `shared/ui/ToastProvider.tsx`, `shared/ui/Modal.tsx`, `shared/ui/ConfirmDeleteModal.tsx`, `src/main.tsx`.
- **Existing behavior cần preserve**: Toast/modal hiện có trong từng page chưa bị thay thế ở phase này — component mới chạy song song, chưa bắt buộc dùng.
- **Migration concerns**: `ToastProvider` đặt ở root phải không xung đột với toast tự viết còn lại trong lúc chuyển tiếp (2 hệ thống toast tồn tại song song tạm thời) — ghi rõ kế hoạch: mỗi trang khi redesign ở Stage I sẽ xóa toast logic riêng và chuyển sang `useToast()`, hoàn tất khi Stage I xong.
- **Tests/verification**: Test `useToast()` hiển thị đúng tone/thời lượng; test `Modal` focus trap + trả focus khi đóng; test `ConfirmDeleteModal` gọi đúng `onConfirm`; test `DropdownMenu` đóng khi click ngoài, điều hướng được bằng bàn phím.
- **Exit criteria**: `ToastProvider`/`Modal`/`ConfirmDeleteModal`/`DropdownMenu` sẵn sàng, có test, đặt ở root.
- **Trace**: DESIGN_SYSTEM.md §10.8, §10.9; Component System §4.1, §4.2, §4.9.

### Phase 14: Shared — Table, Tabs

- **Goal**: Primitive cho khu vực data-heavy (Admin/Teacher) và Course Editor.
- **Scope**: Tạo `Table` (cấu hình `columns`, loading/empty state dùng lại `SkeletonRow`/`EmptyState` đã có); tạo `Tabs` (cho Course Editor, chưa dùng ở phase này vì Course Editor chưa tồn tại).
- **Dependencies**: Phase 11 (Badge dùng trong cell), `EmptyState`/`Skeleton` hiện có (đã đúng hướng, chỉ refactor token nhẹ).
- **Changes required**: `shared/ui/Table.tsx`, `shared/ui/Tabs.tsx`; refactor `EmptyState.tsx`/`Skeleton.tsx` sang token mới (đổi `bg-slate-200` → `surface-muted`).
- **Modules/files**: `shared/ui/Table.tsx`, `shared/ui/Tabs.tsx`, `shared/ui/EmptyState.tsx`, `shared/ui/Skeleton.tsx`.
- **Existing behavior cần preserve**: `EmptyState`/`Skeleton` giữ nguyên API hiện có (props không đổi), chỉ đổi màu nền trong.
- **Migration concerns**: Không thêm `selectable`/bulk-action vào `Table` (PRD chưa yêu cầu — tránh abstraction sớm, Component System §9).
- **Tests/verification**: Test `Table` render đúng cột tùy biến, `aria-sort` khi bật sort; test `Tabs` điều hướng phím mũi tên, `aria-selected`.
- **Exit criteria**: `Table`/`Tabs` sẵn sàng dùng, có test.
- **Trace**: DESIGN_SYSTEM.md §10.5, §12; Component System §4.3, §4.4.

### Phase 15: Layout — SidebarNav, AppShellLayout, AppHeader

- **Goal**: Hợp nhất `AdminSidebar`+`StudentSidebar`, `AdminLayout`+`StudentLayout`, `AdminHeader`+`StudentHeader` thành component dùng chung, sẵn sàng cho Teacher area sau này (tránh viết bản trùng lặp lần 3).
- **Dependencies**: Phase 11, 13.
- **Changes required**: `shared/ui/SidebarNav.tsx` (nhận `items` theo role), `shared/layout/AppShellLayout.tsx` (nhận `navItems`, bọc `ToastProvider`), `shared/layout/AppHeader.tsx`; cập nhật `StudentLayout`/`AdminLayout` hiện có để dùng `AppShellLayout` với `navItems` tương ứng (giữ đúng nav items hiện có, chưa thêm Teacher).
- **Modules/files**: `shared/ui/SidebarNav.tsx`, `shared/layout/AppShellLayout.tsx`, `shared/layout/AppHeader.tsx`; xóa `components/admin/AdminSidebar.tsx`, `components/admin/AdminHeader.tsx`, `components/admin/AdminLayout.tsx`, `components/student/StudentSidebar.tsx`, `components/student/StudentHeader.tsx`, `components/student/StudentLayout.tsx` sau khi thay thế xong.
- **Existing behavior cần preserve**: Sidebar/header Admin và Student phải hiển thị đúng nav items hiện có (cùng route, cùng thứ tự), hành vi active state không đổi.
- **Migration concerns**: Đây là merge cơ học 2 component gần giống nhau — rủi ro chính là bỏ sót khác biệt nhỏ (ví dụ width sidebar Admin 192px vs Student 256px hiện tại khác nhau — cần đồng bộ về 260px theo Design System §6, đây là thay đổi thị giác **được phép** vì đúng token, không phải "redesign ngoài spec").
- **Tests/verification**: Click-through Admin/Student layout sau merge, xác nhận mọi route/active state hoạt động đúng.
- **Exit criteria**: Chỉ còn 1 bản `SidebarNav`/`AppShellLayout`/`AppHeader`; file trùng lặp cũ đã xóa.
- **Trace**: DESIGN_SYSTEM.md §10.6, §12; Component System §5, Gap Analysis U9-U11.

### Phase 16: Shared — StatCard, ProgressBar, RadioCardGroup

- **Goal**: 3 primitive còn lại cần cho Dashboard/Checkout/Quiz.
- **Scope**: Tạo `StatCard`, `ProgressBar`, `RadioCardGroup` theo Component System §4.6-4.8.
- **Dependencies**: Phase 11, 12.
- **Changes required**: `shared/ui/StatCard.tsx`, `shared/ui/ProgressBar.tsx`, `shared/ui/RadioCardGroup.tsx`.
- **Modules/files**: `shared/ui/`.
- **Existing behavior cần preserve**: Không có (component mới, chưa áp dụng).
- **Migration concerns**: `StatCard` **không** có prop `comingSoon`/placeholder vĩnh viễn (khác cách dùng sai hiện tại ở `Dashboard.tsx`) — quyết định thiết kế tường minh để tránh lặp lại pattern mock cũ.
- **Tests/verification**: Test `ProgressBar` có `role="progressbar"` + `aria-valuenow` đúng; test `RadioCardGroup` là `radiogroup` thật, điều hướng phím mũi tên.
- **Exit criteria**: 3 component sẵn sàng dùng, có test.
- **Trace**: DESIGN_SYSTEM.md §5.2, §3.6; Component System §4.6-4.8.

---

## Stage D — Auth & Ownership (Backend)

### Phase 17: TEACHER role thật

- **Goal**: Role TEACHER tồn tại thật trong hệ thống, Admin mời được Teacher.
- **Scope**: Thêm `TEACHER` vào enum role (Phase 4); endpoint Admin invite Teacher (tạo tài khoản, không qua signup công khai — BR-002); cập nhật `SecurityConfig` cho route Teacher.
- **Dependencies**: Phase 4 (enum), Phase 3 (validation cho request invite).
- **Changes required**: Endpoint `POST /admin/teachers` (hoặc tương đương) trong `user` module; cập nhật route authorization.
- **Modules/files**: `user/controller/AdminController.java` (hoặc tương đương sau Phase 2), `security/SecurityConfig.java`.
- **Existing behavior cần preserve**: Luồng signup Student công khai không đổi; Admin/Student route hiện có không đổi.
- **Migration concerns**: Đảm bảo Teacher **không** có endpoint tự đăng ký công khai (đúng BR-002) — kiểm tra kỹ `SecurityConfig` không vô tình mở `/auth/signup` cho role Teacher.
- **Tests/verification**: Test Admin invite Teacher thành công, tài khoản Teacher tạo đúng role; test Teacher không tự đăng ký được qua `/auth/signup`.
- **Exit criteria**: Admin invite Teacher hoạt động; route Teacher đã có trong `SecurityConfig` (dù chưa có endpoint nghiệp vụ khác dùng).
- **Trace**: PRD-002, BR-002.

### Phase 18: Course ownership & lifecycle + access revocation

- **Goal**: Teacher CRUD course của chính mình; Admin chuyển sang giám sát/force-unpublish; cơ chế thu hồi quyền truy cập nội dung (PRD-027) tồn tại ở backend, tách biệt hoàn toàn khỏi force-unpublish/archive.
- **Scope**: Thêm resource-ownership check ở `course` service (Teacher chỉ sửa course có `instructor.id == currentUser.id`); course lifecycle Draft/Published/Archived (BR-004); endpoint Admin force-unpublish tách biệt (PRD-030); **giữ nguyên** endpoint Admin CRUD hiện có nhưng đánh dấu deprecated — chưa xóa ở phase này (frontend Stage I mới chuyển hẳn); thêm cột `enrollments.access_revoked_at`/`access_revoked_reason` (nullable) + endpoint `POST /admin/enrollments/{id}/revoke-access` (Admin only, yêu cầu `reason`).
- **Dependencies**: Phase 17, Phase 4 (course status enum), Phase 1 (Flyway, cho cột mới).
- **Changes required**: Ownership check trong `course/service/CourseService.java`; endpoint mới cho Teacher CRUD (`POST/PUT/DELETE /teacher/courses/...`); endpoint `POST /admin/courses/{id}/force-unpublish`; migration thêm cột `access_revoked_at`/`access_revoked_reason` vào `enrollments`; endpoint `POST /admin/enrollments/{id}/revoke-access`; mọi query trả nội dung lesson (Lesson Player, Phase 35) phải kiểm tra `access_revoked_at IS NULL` ngoài kiểm tra enrollment tồn tại. **Kế thừa từ Phase 3**: tạo `common/exception/ForbiddenException.java` (dời từ Phase 3 vì tới đây mới có consumer đầu tiên — ownership check) + thêm nhánh `@ExceptionHandler(ForbiddenException.class)` → 403 vào `common/exception/GlobalExceptionHandler.java` đã có sẵn từ Phase 3.
- **Modules/files**: `course/service/`, `course/controller/`, `enrollment/entity/Enrollments.java`, `enrollment/service/`, `enrollment/controller/`, `common/exception/ForbiddenException.java` (mới), `common/exception/GlobalExceptionHandler.java` (sửa), migration mới.
- **Existing behavior cần preserve**: Endpoint Admin CRUD hiện có (`/admin/courses/**`) vẫn hoạt động cho tới khi frontend Admin chuyển hẳn sang chỉ giám sát (Stage I, Phase 31) — tránh breaking frontend đang chạy trước khi UI kịp cập nhật.
- **Migration concerns**: **Compatibility code tạm thời**: endpoint Admin CRUD course cũ giữ lại cho tới hết Phase 31 (UI Admin chuyển sang giám sát — chỉ thực thi sau khi Phase 30 Teacher Course Editor đã hoạt động), sau đó xóa — ghi rõ điều kiện xóa trong code comment/issue tracker. Endpoint revoke-access **không** được tự động gọi bởi bất kỳ luồng nào khác (archive, force-unpublish, refund) — chỉ Admin chủ động gọi qua UI (Phase 31), đúng PRD-027 "hành động tường minh".
- **Tests/verification**: Test Teacher A không sửa được course của Teacher B (403); test Admin force-unpublish hoạt động độc lập với Teacher tự archive; test endpoint Admin CRUD cũ vẫn chạy trong giai đoạn chuyển tiếp; test revoke-access chặn đúng quyền xem nội dung của enrollment đó mà không ảnh hưởng enrollment khác cùng course; test archive/force-unpublish **không** tự động set `access_revoked_at`.
- **Exit criteria**: Ownership check hoạt động đúng cho mọi mutation Teacher; force-unpublish tách biệt khỏi archive thường; endpoint Admin CRUD cũ còn tồn tại nhưng đã đánh dấu deprecated; endpoint revoke-access hoạt động độc lập, có audit log (Phase 25 gắn `@Audited` vào đây).
- **Trace**: ADR-008, ADR-025, BR-004/005, PRD-009→015, PRD-027, PRD-030.

---

## Stage E — Payment Core Integrity (Backend, chưa có gateway thật)

### Phase 19: Payment amount + transaction + idempotency

- **Goal**: Sửa lỗ hổng toàn vẹn dữ liệu và race condition thật trước khi thêm gateway.
- **Scope**: `PaymentService` tính `amount` server-side từ `course.price` (chưa có coupon — thêm ở Phase 21); gộp logic checkout/enrollment vào 1 `@Transactional` method; bảng `payment_idempotency_keys` + header `Idempotency-Key`.
- **Dependencies**: Phase 2 (service layer), Phase 4 (enum status).
- **Changes required**: `payment/service/PaymentService.java` — bỏ nhận `amount` từ request, tính lại; `@Transactional` bọc checkout→payment→enrollment; migration bảng dedup; middleware/interceptor đọc `Idempotency-Key`.
- **Modules/files**: `payment/service/`, `payment/controller/PaymentController.java`, `enrollment/service/EnrollmentService.java` (không còn tự tạo enrollment độc lập — chỉ `payment` service gọi), migration mới.
- **Existing behavior cần preserve**: Response checkout thành công vẫn trả về thông tin tương đương hiện có (chỉ khác `amount` không còn nhận từ client — **breaking change có chủ đích** đối với `PaymentRequest` DTO, cần đồng bộ với frontend Checkout redesign ở Stage J).
- **Migration concerns**: Đây là breaking API change thật (bỏ field `amount` khỏi request) — cần phối hợp thời điểm deploy với Stage J (Checkout UI) để không có khoảng hở FE gửi `amount` mà BE bỏ qua âm thầm gây nhầm lẫn debug; khuyến nghị deploy backend trước, FE cũ tạm thời vẫn gọi được (BE bỏ qua field thừa) cho tới khi FE Checkout mới lên.
- **Tests/verification**: Test gửi `amount` sai từ client → bị bỏ qua, giá tính đúng theo `course.price`; test 2 request đồng thời cùng `Idempotency-Key` → chỉ tạo 1 payment; test checkout thất bại giữa chừng → không tạo enrollment mồ côi (rollback đúng).
- **Exit criteria**: `amount` luôn tính server-side; idempotency hoạt động đúng; enrollment chỉ được tạo qua `payment` service.
- **Trace**: ADR-006, ADR-007, PRD-021, BR-008, EC-001/002.

---

## Stage F — External Integrations Infrastructure

### Phase 20: Object storage + Email port/adapter

- **Goal**: Hạ tầng upload video và gửi email sẵn sàng trước khi Teacher/Notification cần dùng.
- **Scope**: `ObjectStoragePort` + `R2ObjectStorageAdapter`; endpoint xin presigned URL; `EmailSenderPort` + `MailpitEmailAdapter` (local)/`ResendEmailAdapter` (production), chọn qua profile.
- **Dependencies**: Phase 2 (service layer, port/adapter đặt trong `application/port`, `infrastructure/`).
- **Changes required**: 2 port interface; 3 adapter class; config theo Spring profile; endpoint `POST /courses/{id}/lessons/{id}/video/presign`.
- **Modules/files**: `application/port/ObjectStoragePort.java`, `application/port/EmailSenderPort.java`, `infrastructure/storage/`, `infrastructure/email/`.
- **Existing behavior cần preserve**: Không có hành vi cũ tương đương (net-new).
- **Migration concerns**: Domain/service layer tuyệt đối không import SDK R2/Resend trực tiếp (Dependency Rule ARCHITECTURE.md §14) — review kỹ điểm này vì dễ vi phạm khi code nhanh.
- **Tests/verification**: Test presigned URL sinh đúng, hết hạn đúng thời gian quy định; test gửi email qua Mailpit ở môi trường local nhận được thư.
- **Exit criteria**: 2 port + adapter tương ứng hoạt động, chưa có consumer nghiệp vụ nào gọi tới (đó là việc của Stage G/K).
- **Trace**: ADR-014, ADR-015, ADR-016, PRD-012, PRD-031.

### Phase 21: Payment Gateway port/adapter (VNPay/Momo/Stripe)

- **Goal**: Có thể thực sự thu tiền qua 3 gateway.
- **Scope**: `PaymentGatewayPort` + 3 adapter; endpoint tạo checkout session; endpoint callback/webhook xác thực chữ ký cho từng gateway.
- **Dependencies**: Phase 19 (payment core phải đúng trước khi gắn gateway thật), Phase 2.
- **Changes required**: `application/port/PaymentGatewayPort.java`; `infrastructure/payment/{VnPayGateway,MomoGateway,StripeGateway}.java`; endpoint callback riêng từng gateway, verify chữ ký/signature trước khi cập nhật `Payments.status`.
- **Modules/files**: `application/port/PaymentGatewayPort.java`, `infrastructure/payment/`, `payment/controller/`.
- **Existing behavior cần preserve**: Endpoint checkout hiện có (mock SUCCESS ngay) tiếp tục hoạt động cho tới khi frontend Checkout mới (Stage J) sẵn sàng chuyển hẳn — có thể dùng feature flag/config để chọn "mock mode" vs "gateway thật mode" trong giai đoạn chuyển tiếp, ghi rõ kế hoạch xóa mock mode sau khi Stage J hoàn tất.
- **Migration concerns**: Webhook callback phải idempotent (dùng lại `payment_idempotency_keys` hoặc cơ chế tương đương) — tránh xử lý trùng khi gateway gửi callback lặp lại (đã lường trước ở EC-002).
- **Tests/verification**: Test sandbox mỗi gateway (dùng credential test); test webhook giả lập gửi trùng không tạo 2 lần update; test chữ ký sai bị từ chối.
- **Exit criteria**: 3 gateway hoạt động ở môi trường sandbox; mock mode còn tồn tại tạm thời có đánh dấu rõ điều kiện xóa (khi Stage J xong).
- **Trace**: ADR-009, PRD-020.

---

## Stage G — Commerce Domains (Backend)

### Phase 22: Coupon domain

- **Goal**: Admin tạo coupon, áp dụng được khi checkout.
- **Scope**: Bảng `coupons`/`coupon_redemptions`; endpoint Admin CRUD coupon; `PaymentService` tính giảm giá vào `amount` (nối tiếp Phase 19).
- **Dependencies**: Phase 19, Phase 17 (chỉ Admin — cần role check).
- **Changes required**: Entity/repository/service coupon mới; sửa `PaymentService.calculateAmount()` để trừ discount hợp lệ.
- **Modules/files**: `payment/coupon/` (hoặc submodule tương đương), migration mới.
- **Existing behavior cần preserve**: Checkout không coupon vẫn tính đúng giá như Phase 19.
- **Migration concerns**: Validate coupon hết hạn/hết lượt ở đúng thời điểm checkout (server-side), không tin tưởng giá trị discount từ client.
- **Tests/verification**: Test áp coupon hợp lệ giảm đúng số tiền; test coupon hết hạn/hết lượt bị từ chối; test Teacher không tạo được coupon (403).
- **Exit criteria**: Coupon CRUD hoạt động, checkout áp dụng đúng discount.
- **Trace**: PRD-023/024, BR-003.

### Phase 23: Refund domain

- **Goal**: Student gửi yêu cầu hoàn tiền, Admin duyệt và đánh dấu xử lý thủ công (Phase 1 scope).
- **Scope**: Bảng `refund_requests` (tách `businessStatus`/`executionStatus`, `gatewayRefundReference` nullable); `RefundGatewayPort` + `ManualRefundGateway` (duy nhất adapter ở Phase 1); endpoint Student tạo request, Admin duyệt/từ chối/đánh dấu hoàn tất.
- **Dependencies**: Phase 19 (dùng chung idempotency pattern cho refund-request), Phase 20 (email thông báo kết quả duyệt refund — PRD-031).
- **Changes required**: Entity/service refund mới; endpoint `POST /refund-requests` (Student), `POST /admin/refund-requests/{id}/approve|reject|mark-completed`.
- **Modules/files**: `payment/refund/` (submodule — entity/service/controller domain refund) chứa interface `RefundGatewayPort` ở `application/port/`; implementation `ManualRefundGateway` ở `infrastructure/refund/` (đúng Dependency Rule: domain không tự chứa implementation gateway) — theo Target Project Structure mục B; migration mới.
- **Existing behavior cần preserve**: Không có hành vi cũ tương đương (net-new).
- **Migration concerns**: **Không được gọi bất kỳ gateway API nào** ở Phase 1 — `ManualRefundGateway` chỉ ghi nhận trạng thái, đúng quyết định đã chốt (ADR-011); đảm bảo không lỡ implement gọi VNPay/Momo/Stripe refund API thật ở phase này.
- **Tests/verification**: Test luồng đầy đủ REQUESTED→APPROVED→MANUAL_COMPLETED; test không có action nào tự động approve; test Idempotency-Key chặn double-submit refund request.
- **Exit criteria**: Luồng refund thủ công hoạt động đầy đủ; `RefundGatewayPort` sẵn sàng cho adapter thật ở Phase 2 (ngoài phạm vi plan này).
- **Trace**: ADR-010, ADR-011, PRD-025/026, BR-009.

---

## Stage H — Assessment & Audit (Backend)

### Phase 24: Assessment/Quiz domain

- **Goal**: Teacher tạo quiz, Student làm bài và được chấm tự động.
- **Scope**: Bảng `quizzes/quiz_questions/quiz_choices/quiz_attempts`; endpoint Teacher CRUD quiz (ownership check theo Phase 18); endpoint Student submit attempt + auto-grade.
- **Dependencies**: Phase 18 (course ownership), Phase 17.
- **Changes required**: Entity/service/controller mới trong `assessment/` module.
- **Modules/files**: `assessment/`, migration mới.
- **Existing behavior cần preserve**: Không có hành vi cũ tương đương (net-new, `TestPractice.tsx` hiện tại là mock UI không có backend).
- **Migration concerns**: Đáp án đúng không bao giờ trả về client trước khi submit (tránh lộ đáp án qua response API get quiz).
- **Tests/verification**: Test Student submit đúng/sai được chấm đúng điểm; test đáp án đúng không xuất hiện trong response GET quiz trước khi làm bài; test Teacher B không sửa được quiz của Teacher A.
- **Exit criteria**: Luồng tạo quiz → làm bài → chấm tự động hoạt động đầy đủ qua API.
- **Trace**: PRD-014, PRD-018/019.

### Phase 25: Audit logging (AOP)

- **Goal**: Ghi log hành động nhạy cảm đã tồn tại từ Stage D-G.
- **Scope**: Bảng `audit_log` (có cột archive-ready theo ADR-013); AOP aspect + annotation `@Audited`; áp dụng `@Audited` vào các method đã có từ Phase 17-24 (login, đổi mật khẩu, checkout, refund action, Teacher CUD course/quiz, Admin lock/unlock/delete/coupon/refund-approve).
- **Dependencies**: Phase 17-24 (cần các action này đã tồn tại để gắn annotation).
- **Changes required**: `audit/` module (aspect, entity, repository); thêm `@Audited` vào method liên quan ở các module đã làm trước đó (thay đổi nhỏ, rải rác, không phải rewrite).
- **Modules/files**: `audit/`, và thêm annotation vào các service đã có từ phase trước.
- **Existing behavior cần preserve**: Hành vi nghiệp vụ các action không đổi — chỉ thêm ghi log, không đổi kết quả trả về.
- **Migration concerns**: Retention 180 ngày online là **config**, không phải logic cứng — đảm bảo archival job (chưa bắt buộc implement ở Phase 1) không bị nhầm là đã có sẵn.
- **Tests/verification**: Test mỗi action nhạy cảm sinh đúng 1 bản ghi audit log với actor/action/target đúng; test endpoint Admin query audit log filter đúng.
- **Exit criteria**: 4 nhóm hành động theo PRD-033 đều có audit log; endpoint Admin tra cứu hoạt động.
- **Trace**: ADR-012, ADR-013, PRD-033/034.

---

## Stage I — UI Redesign: Trang hiện có + Teacher Area

> Từ đây trở đi, mọi phase UI đều **bắt buộc** đã có Stage C (primitive) sẵn sàng, và tương ứng backend đã ở đúng phase trong Stage D-H. Teacher Area (Phase 30) được đặt **trước** AdminCourses (Phase 31) trong Stage này — dù về mặt nội dung là net-new hoàn toàn — vì Course Editor của Teacher là cách duy nhất tạo course sau khi Admin bị bỏ quyền CRUD trực tiếp ở Phase 31; nếu đảo ngược thứ tự sẽ có giai đoạn không ai tạo được course qua UI.

### Phase 26: Redesign — Public marketing pages

- **Goal**: HomePage, CourseListPage, CourseDetailPage, LecturerPage, ContactPage lên token mới, đúng cấu trúc UI_SPEC §2.1-2.5.
- **Scope**: Áp `Card`/`Button`/`Badge` mới; wire `ContactPage` submit thật (cần Phase 20 email); thêm curriculum section vào CourseDetailPage (PRD-006/007); `LecturerPage` chuyển sang data Teacher thật (cần Phase 17).
- **Dependencies**: Phase 10-16 (Stage C), Phase 17 (LecturerPage cần Teacher thật), Phase 20 (ContactPage cần email).
- **Changes required**: Redesign từng page theo UI_SPEC §2.1-2.5; `TeacherCard`→`InstructorCard` (đổi shape data).
- **Modules/files**: `features/courses/`, `features/public/` (theo cấu trúc Phase 6).
- **Existing behavior cần preserve**: Nội dung/thông tin hiển thị tương đương (chỉ đổi thị giác + bổ sung curriculum theo PRD, không đổi thông tin cốt lõi khác).
- **Migration concerns**: Đây là redesign thị giác — không được vượt phạm vi `DESIGN_SYSTEM.md`/`UI_SPEC.md` §2.1-2.5 (không tự thêm section/feature ngoài spec).
- **Tests/verification**: Visual QA đối chiếu UI_SPEC từng page; test ContactPage submit thật gửi email nhận được; test CourseDetailPage hiện đúng lesson preview theo BR-007.
- **Exit criteria**: 5 trang khớp UI_SPEC §2.1-2.5, không còn màu/spacing hardcode ngoài token.
- **Trace**: UI_SPEC §2.1-2.5, DESIGN_SYSTEM.md.

### Phase 27: Redesign — Auth pages (Login, Signup)

- **Goal**: Login/Signup lên token mới, bỏ `alert()`, bổ sung validate còn thiếu ở Login.
- **Scope**: Theo UI_SPEC §2.6-2.7 — dùng `FormField`/`Input`/`Button`, `useToast()` thay `alert()`.
- **Dependencies**: Phase 9 (AuthContext), Phase 11-13 (primitives).
- **Changes required**: Redesign 2 form; thêm validate rỗng ở Login (hiện chưa có).
- **Modules/files**: `features/auth/`.
- **Existing behavior cần preserve**: Luồng đăng nhập/đăng ký thành công dẫn đúng route theo role như hiện tại.
- **Migration concerns**: Không thay đổi validation rule của Signup (đã tốt), chỉ đổi cách hiển thị lỗi.
- **Tests/verification**: Test Login với field rỗng bị chặn (mới); test Signup giữ nguyên hành vi validate hiện có; test lỗi hiển thị qua Toast/inline thay `alert()`.
- **Exit criteria**: 2 trang khớp UI_SPEC §2.6-2.7, không còn `alert()`.
- **Trace**: UI_SPEC §2.6-2.7.

### Phase 28: Redesign — Student core pages

- **Goal**: Dashboard, MyCourses, Profile, LearningProfile lên token mới + dữ liệu thật.
- **Scope**: Theo UI_SPEC §3.1, §3.2, §3.6, §3.7 — dùng `StatCard`/`ProgressBar`/`Card`; Dashboard bỏ `comingSoon`, wire dữ liệu thật; MyCourses thêm action "Yêu cầu hoàn tiền" (cần Phase 23).
- **Dependencies**: Phase 8 (React Query), Phase 16 (StatCard/ProgressBar), Phase 23 (refund action).
- **Changes required**: Redesign 4 trang; thêm `RefundRequestModal` (feature component, dựng trên `Modal`+`FormField`) vào MyCourses.
- **Modules/files**: `features/student/`.
- **Existing behavior cần preserve**: Danh sách khóa học/tiến độ hiển thị đúng dữ liệu hiện có (chỉ bỏ mock, không đổi nguồn dữ liệu khác).
- **Migration concerns**: `InfoItem.tsx` bị xóa ở phase này (Profile chuyển sang `FormField`/`Input`) — xác nhận không còn nơi nào khác import `InfoItem` trước khi xóa file.
- **Tests/verification**: Test Dashboard hiện số liệu thật (không còn `comingSoon`); test gửi yêu cầu hoàn tiền từ MyCourses tạo đúng `RefundRequest` (Phase 23); test Profile lưu thay đổi thành công.
- **Exit criteria**: 4 trang khớp UI_SPEC, `InfoItem.tsx` đã xóa.
- **Trace**: UI_SPEC §3.1, §3.2, §3.6, §3.7; PRD-017, PRD-025, PRD-028.

### Phase 29: Redesign — AdminDashboard (dữ liệu thật)

- **Goal**: Bỏ 100% số liệu hardcode.
- **Scope**: Theo UI_SPEC §5.1 — `StatCard` thật cho doanh thu/học viên/khóa học/Teacher; danh sách rút gọn refund đang chờ (cần Phase 23) và course mới publish.
- **Dependencies**: Phase 16, Phase 19 (doanh thu), Phase 23 (refund pending list).
- **Changes required**: Endpoint backend tổng hợp số liệu (nếu chưa có — bổ sung trong `admin` module, thuộc phạm vi phase này vì gắn liền UI cần nó); redesign trang.
- **Modules/files**: `features/admin/dashboard/`, backend `user/controller/AdminController.java` (endpoint summary).
- **Existing behavior cần preserve**: Không (toàn bộ số liệu hiện tại là hardcode, không có behavior thật để giữ).
- **Migration concerns**: Không đáng kể.
- **Tests/verification**: Test số liệu khớp dữ liệu thật trong DB; test danh sách rút gọn link đúng sang AdminRefunds/AdminCourses.
- **Exit criteria**: AdminDashboard khớp UI_SPEC §5.1, không còn số nào hardcode.
- **Trace**: PRD-028, UI_SPEC §5.1.

### Phase 30: Teacher area (Dashboard, Courses List, Course Editor)

- **Goal**: Toàn bộ khu vực Teacher — phần net-new lớn nhất dự án, phải xong trước AdminCourses vì là cách duy nhất tạo course sau khi Admin mất quyền CRUD trực tiếp.
- **Scope**: Theo UI_SPEC §4.1-4.3 — `TeacherLayout` (dùng `AppShellLayout` từ Phase 15 với `navItems` Teacher), Teacher Dashboard, Teacher Courses List (`Table`), Course Editor (`Tabs`: Tổng quan/Curriculum/Quiz/Học viên/Cài đặt).
- **Dependencies**: Phase 15 (AppShellLayout), Phase 14 (Table/Tabs), Phase 18 (course ownership backend), Phase 20 (video upload), Phase 24 (quiz authoring).
- **Changes required**: Toàn bộ route/component mới trong `features/teacher/`; `CourseOverviewForm` (kế thừa ý tưởng `Field` từ `AddCourseOverlay` cũ, gắn context Teacher thay Admin).
- **Modules/files**: `features/teacher/` (mới hoàn toàn), `routes/AppRoutes.tsx` (thêm nhánh `/teacher/**`).
- **Existing behavior cần preserve**: Không (net-new).
- **Migration concerns**: Tab "Học viên" phải disabled đúng khi Course Editor ở chế độ tạo mới (chưa có `id`) — đúng quyết định đã chốt ở UI_SPEC §4.3, dễ bị bỏ sót nếu implement nhanh.
- **Tests/verification**: Test Teacher tạo course → thêm lesson (video upload + embed) → tạo quiz → publish, toàn bộ luồng qua UI thật; test publish thất bại khi curriculum rỗng, thông báo rõ lý do; test tab Học viên hiện đúng danh sách sau khi có Student đăng ký.
- **Exit criteria**: Teacher area khớp UI_SPEC §4 đầy đủ, luồng J4/J5 (PRD Core User Journeys) chạy được end-to-end qua UI thật — **Teacher đã có thể tạo course qua UI trước khi Phase 31 xóa quyền tạo course của Admin**.
- **Trace**: UI_SPEC §4, PRD-009→015, PRD J4/J5.

### Phase 31: Redesign — AdminCourses (đổi trách nhiệm + thu hồi quyền truy cập)

- **Goal**: Admin chuyển từ CRUD trực tiếp sang giám sát/force-unpublish; xóa endpoint Admin CRUD cũ (hoàn tất compatibility code từ Phase 18); bổ sung action "Thu hồi quyền truy cập" riêng biệt theo PRD-027.
- **Scope**: Theo UI_SPEC §5.3 — Table hiển thị mọi course + Teacher sở hữu; action "Force-unpublish" (Modal xác nhận); action riêng biệt "Thu hồi quyền truy cập" (Modal xác nhận khác, yêu cầu nhập lý do — gọi endpoint đã thêm ở Phase 18); **xóa** `AddCourseOverlay.tsx` ở Admin.
- **Dependencies**: **Phase 30 (Teacher Course Editor phải đã hoạt động — đây là điều kiện bắt buộc trước khi xóa quyền tạo course của Admin)**, Phase 18 (backend force-unpublish + revoke-access), Phase 14 (Table), Phase 13 (ConfirmDeleteModal pattern cho Modal xác nhận).
- **Changes required**: Redesign trang; xóa `AddCourseOverlay.tsx`; **xóa endpoint Admin CRUD course cũ ở backend** (điều kiện đã ghi ở Phase 18 nay hoàn tất); thêm action "Thu hồi quyền truy cập" gọi `POST /admin/enrollments/{id}/revoke-access`.
- **Modules/files**: `features/admin/courses/`, backend `course/controller/` (xóa endpoint deprecated).
- **Existing behavior cần preserve**: Không — đây chính là thay đổi trách nhiệm có chủ đích theo PRD, cần thông báo rõ cho người vận hành thật (ngoài phạm vi code) rằng Admin không còn tự tạo course.
- **Migration concerns**: Đảm bảo mọi course hiện có (nếu có dữ liệu thật ở thời điểm deploy — dù đã xác nhận build mới không cần giữ data) đều có `instructor` hợp lệ trước khi xóa quyền Admin tự sửa không qua ownership check; xác nhận Phase 30 đã hoàn tất và Teacher thật sự tạo được course qua UI trước khi thực hiện phần xóa endpoint/nút "Thêm course" của phase này.
- **Tests/verification**: Test Admin không còn thấy nút "Thêm course"; test force-unpublish hoạt động qua UI; test "Thu hồi quyền truy cập" là action tách biệt khỏi force-unpublish, yêu cầu xác nhận riêng, ghi audit log; test gọi endpoint CRUD cũ (nếu còn client nào gọi) trả 404/410 rõ ràng.
- **Exit criteria**: AdminCourses khớp UI_SPEC §5.3; endpoint Admin CRUD course cũ đã xóa khỏi backend; action thu hồi quyền truy cập hoạt động độc lập với force-unpublish/archive.
- **Trace**: UI_SPEC §5.3, PRD-027, PRD-030, ADR-008, ADR-025.

### Phase 32: Redesign — AdminUsersList, AdminCategories, AdminOrders

- **Goal**: 3 trang Admin còn lại lên token mới; AdminUsersList thêm "Mời Teacher"; AdminOrders bỏ phần refund (chuyển sang Phase 36).
- **Scope**: Theo UI_SPEC §5.2, §5.4, §5.5; gộp `AddUserOverlay`+`EditUserOverlay`→`UserFormOverlay` (thêm mode `invite-teacher`, cần Phase 17); `CategoryOverlay`→`CategoryFormOverlay` (dựng trên `Modal`+`FormField`).
- **Dependencies**: Phase 13, 14, 17.
- **Changes required**: Redesign 3 trang; merge 2 overlay thành `UserFormOverlay`; refactor `CategoryOverlay`.
- **Modules/files**: `features/admin/users/`, `features/admin/categories/`, `features/admin/orders/`.
- **Existing behavior cần preserve**: CRUD category/khóa-mở-khóa user hiện có giữ nguyên hành vi; AdminOrders vẫn hiển thị đúng danh sách giao dịch (chỉ bớt phần refund action).
- **Migration concerns**: Xác nhận `AddUserOverlay.tsx`/`EditUserOverlay.tsx` không còn nơi nào import trước khi xóa.
- **Tests/verification**: Test mời Teacher tạo đúng tài khoản (Phase 17 backend); test CRUD category qua `CategoryFormOverlay` mới; test AdminOrders filter theo enum status (Phase 4).
- **Exit criteria**: 3 trang khớp UI_SPEC; `AddUserOverlay.tsx`/`EditUserOverlay.tsx` đã xóa, thay bằng `UserFormOverlay.tsx`.
- **Trace**: UI_SPEC §5.2, §5.4, §5.5; PRD-002.

---

## Stage J — UI Redesign: Checkout

### Phase 33: Checkout 3 bước + xóa component obsolete

- **Goal**: Checkout khớp luồng thanh toán thật, xóa hoàn toàn component không tương thích kiến trúc mới.
- **Scope**: Theo UI_SPEC §2.8-2.10 — Bước 1 (tóm tắt + `CouponInput`, cần Phase 22), Bước 2 (`PaymentMethodSelector` dùng `RadioCardGroup`, cần Phase 21), Bước 3 (Checkout Result); sinh `Idempotency-Key` client-side theo ADR-007; **xóa** `PaymentForm.tsx` và `EnrollSuccessOverlay.tsx`.
- **Dependencies**: Phase 16 (RadioCardGroup), Phase 21 (gateway thật), Phase 22 (coupon), Phase 19 (idempotency backend).
- **Changes required**: 3 trang/route mới thay Checkout hiện có; `OrderSummaryCard` (refactor từ `OrderSummary.tsx`, bỏ text hardcode "hoàn tiền 30 ngày"); xóa `PaymentForm.tsx`, `EnrollSuccessOverlay.tsx`.
- **Modules/files**: `features/payment/`, xóa `components/checkout/PaymentForm.tsx`, `components/checkout/EnrollSuccessOverlay.tsx`.
- **Existing behavior cần preserve**: Không — đây là rewrite có chủ đích theo quyết định đã chốt (Checkout 1 trang → 3 bước); cần đảm bảo backend gateway thật (Phase 21) đã ổn định ở sandbox trước khi tắt hẳn "mock mode" (điều kiện đã ghi ở Phase 21).
- **Migration concerns**: Đồng bộ thời điểm tắt mock mode backend (Phase 21) với thời điểm Checkout mới lên production — không để khoảng trống Checkout mới gọi API cũ (mock) hoặc Checkout cũ gọi API mới (gateway thật) gây nhầm lẫn.
- **Tests/verification**: Test end-to-end sandbox cả 3 gateway từ UI thật; test double-click nút "Xác nhận thanh toán" không tạo 2 giao dịch (Idempotency-Key); test Checkout Result xử lý đúng cả trường hợp thành công/thất bại/timeout xác minh.
- **Exit criteria**: Checkout khớp UI_SPEC §2.8-2.10; `PaymentForm.tsx`/`EnrollSuccessOverlay.tsx` đã xóa; mock mode backend đã tắt.
- **Trace**: UI_SPEC §2.8-2.10, ADR-007, ADR-009, PRD-020, PRD-023/024.

---

## Stage K — New Features còn lại

> Teacher Area đã chuyển sang Phase 30 (Stage I) — Stage này còn lại các trang net-new phụ thuộc Assessment/Lesson Player.

### Phase 34: Test Practice hub + LearningProfile (dữ liệu thật)

- **Goal**: 2 trang hiện là UI tĩnh chuyển sang logic thật (chưa cần Lesson Player — chỉ cần Assessment backend).
- **Scope**: Theo UI_SPEC §3.4, §3.6 — danh sách bài test thật, trạng thái đã làm/chưa làm.
- **Dependencies**: Phase 24 (Assessment backend), Phase 8 (React Query).
- **Changes required**: Redesign 2 trang; tạo `Quiz Attempt` component/route dùng chung (UI_SPEC §3.5) — điểm này có thể triển khai trước Lesson Player vì test tổng khóa học không phụ thuộc Lesson Player.
- **Modules/files**: `features/student/test-practice/`, `features/student/learning-profile/`, `features/assessment/`.
- **Existing behavior cần preserve**: Không (từ UI tĩnh sang thật, không có behavior cũ đáng giữ).
- **Migration concerns**: Đáp án đúng không lộ ra frontend trước khi submit (đồng bộ với ràng buộc đã đặt ở Phase 24 backend).
- **Tests/verification**: Test làm bài test tổng khóa học end-to-end, nhận điểm đúng; test LearningProfile hiện đúng % hoàn thành tổng hợp.
- **Exit criteria**: 2 trang + `Quiz Attempt` khớp UI_SPEC, không còn UI tĩnh.
- **Trace**: UI_SPEC §3.4, §3.5, §3.6; PRD-017, PRD-018/019.

### Phase 35: Lesson Player

- **Goal**: Trang quan trọng nhất còn thiếu hoàn toàn — Student thực sự học được nội dung đã mua.
- **Scope**: Theo UI_SPEC §3.3 — `LessonPlayerLayout` riêng, `LessonListSidebar`, `LessonContentViewer` (polymorphic video/text/quiz), ghi `LessonProgress` theo Phase 5 (surrogate key).
- **Dependencies**: Phase 24 (quiz gắn lesson), Phase 20 (video từ object storage), Phase 5 (LessonProgress schema).
- **Changes required**: Route mới `/student/learn/:courseId`; toàn bộ component mới theo Component System §4 (feature layer).
- **Modules/files**: `features/student/lesson-player/` (mới hoàn toàn).
- **Existing behavior cần preserve**: Không (net-new hoàn toàn).
- **Migration concerns**: Kiểm tra quyền truy cập đúng theo BR-007 (preview cần đăng nhập, nội dung đầy đủ cần đã mua) — đây là điểm bảo mật quan trọng nhất của trang này, không chỉ ẩn UI mà backend phải chặn thật (endpoint lesson content phải tự kiểm tra enrollment/preview, không dựa vào frontend ẩn); đồng thời phải chặn nội dung nếu `enrollments.access_revoked_at` đã được set (Phase 18/31).
- **Tests/verification**: Test truy cập trực tiếp URL lesson chưa mua → chặn đúng (backend, không chỉ frontend); test đánh dấu hoàn thành cập nhật đúng `LessonProgress`; test chuyển lesson mượt, tiến độ tổng khóa học cập nhật đúng; test enrollment đã bị thu hồi quyền truy cập (Phase 31) không xem được nội dung dù trước đó đã mua.
- **Exit criteria**: Lesson Player khớp UI_SPEC §3.3 đầy đủ, kiểm tra quyền truy cập ở cả 2 phía backend/frontend.
- **Trace**: UI_SPEC §3.3, PRD-016/017, BR-007, PRD-027.

### Phase 36: AdminCoupons, AdminRefunds, AdminAuditLog

- **Goal**: 3 trang Admin mới, hoàn tất toàn bộ UI_SPEC.
- **Scope**: Theo UI_SPEC §5.6-5.8 — `Table` + `Modal` cho từng trang; `RefundReviewModal` gọi đúng action theo `businessStatus`/`executionStatus` (Phase 23).
- **Dependencies**: Phase 22 (Coupon backend), Phase 23 (Refund backend), Phase 25 (Audit log backend), Phase 14 (Table), Phase 12 (`DateRangeInput` cho filter Audit Log).
- **Changes required**: 3 route/trang mới; thêm 3 mục vào `SidebarNav` Admin (nav items data, không sửa `SidebarNav` component).
- **Modules/files**: `features/admin/coupons/`, `features/admin/refunds/`, `features/admin/audit-log/`.
- **Existing behavior cần preserve**: Không (net-new).
- **Migration concerns**: `RefundReviewModal` không được có action nào tự động gọi gateway refund thật (đúng ràng buộc Phase 23 — chỉ "Đánh dấu đã hoàn tiền" thủ công).
- **Tests/verification**: Test tạo coupon, áp dụng đúng ở Checkout (Phase 33); test luồng Admin duyệt refund đầy đủ; test Audit Log filter theo actor/hành động/thời gian (dùng `DateRangeInput`) trả đúng kết quả.
- **Exit criteria**: 3 trang khớp UI_SPEC §5.6-5.8; toàn bộ Admin Sidebar khớp UI_SPEC §1.4.
- **Trace**: UI_SPEC §5.6-5.8, PRD-023/024, PRD-025/026, PRD-033/034.

---

## Stage L — Cleanup & Hardening

### Phase 37: Dead code cleanup còn lại

- **Goal**: Xóa mọi dead code đã xác định, không còn sót.
- **Scope**: (2 file rỗng `AuthPage.tsx`/`MyCoursesOverview.tsx` đã xóa từ Phase 6 — không còn việc ở đây) dọn `UI.SEARCH_DEBOUNCE`/`UI.TOAST_DURATION`/`UI.DEFAULT_PAGE_SIZE` — wire thật vào nơi cần (search debounce ở CourseListPage, toast duration ở `ToastProvider`, pagination ở Table/list) hoặc xóa nếu xác nhận không cần; xóa token Tailwind cũ (`primary`, `cta`... đã deprecated từ Phase 10) sau khi xác nhận không còn component nào dùng.
- **Dependencies**: Toàn bộ Stage I-K phải hoàn tất (để chắc chắn không còn nơi dùng token/constant cũ).
- **Changes required**: Xóa file; wire constants; xóa token cũ khỏi `tailwind.config.js`.
- **Modules/files**: Như liệt kê ở Scope.
- **Existing behavior cần preserve**: Toàn bộ UI đã redesign ở Stage I-K không đổi (chỉ dọn phần thực sự không còn dùng).
- **Migration concerns**: Grep toàn repo trước khi xóa token cũ để chắc chắn 0 reference còn sót — nếu còn, quay lại phase tương ứng chưa hoàn tất trước khi cleanup.
- **Tests/verification**: Build/lint sạch sau khi xóa; `npm run build` không còn warning unused.
- **Exit criteria**: Không còn dead file, dead constant, token cũ trong codebase.
- **Trace**: Gap Analysis U21-U23, audit findings ban đầu.

### Phase 38: i18n scaffold + code-splitting

- **Goal**: Đặt nền móng Phase 2 (i18n) và tối ưu tải trang cho Teacher area vừa thêm.
- **Scope**: Cài `react-i18next`, tách chuỗi text hiện có ra translation key (chỉ tiếng Việt, chưa dịch tiếng Anh — đúng ADR-023); `React.lazy` cho từng nhóm route (public/student/teacher/admin).
- **Dependencies**: Toàn bộ Stage I-K (để tách text từ UI đã ổn định, tránh tách 2 lần).
- **Changes required**: Config i18next; wrap text bằng `t()`; `React.lazy`+`Suspense` ở `AppRoutes.tsx`.
- **Modules/files**: Toàn bộ `features/`, `routes/AppRoutes.tsx`.
- **Existing behavior cần preserve**: Nội dung hiển thị (tiếng Việt) không đổi.
- **Migration concerns**: Đây là thay đổi cơ học lớn (chạm mọi text) — nên làm theo từng feature area, mỗi area 1 commit để dễ review.
- **Tests/verification**: Test build production, xác nhận bundle Teacher/Admin không load khi Student dùng app; visual QA không có text bị thiếu do sai key.
- **Exit criteria**: Mọi text qua translation key; route chia bundle theo audience.
- **Trace**: ADR-022, ADR-023, NFR-006.

### Phase 39: Test hardening

- **Goal**: Đảm bảo coverage tối thiểu cho các luồng rủi ro cao đã triển khai xuyên suốt plan (không phải viết test từ đầu — tổng hợp/bổ sung khoảng trống còn sót từ các phase trước).
- **Scope**: Rà soát coverage cho payment/refund/enrollment (Phase 19, 21-23) và Teacher ownership (Phase 18) — đây là 2 nhóm rủi ro cao nhất theo Gap Analysis; bổ sung integration test (Testcontainers) còn thiếu; component test cho `shared/ui/` (Stage C) và form nghiệp vụ chính (Checkout, Course Editor).
- **Dependencies**: Toàn bộ Stage A-K (test hardening tổng kết, không chặn các stage khác — có thể chạy song song rải rác nhưng nên có 1 phase chốt cuối để soát khoảng trống).
- **Changes required**: Bổ sung test case còn thiếu, không viết lại test đã có ở từng phase.
- **Modules/files**: `src/test/` (backend), test files cạnh component (frontend).
- **Existing behavior cần preserve**: Không áp dụng (chỉ thêm test, không đổi code nghiệp vụ — nếu test phát hiện bug, sửa bug đó thuộc phase gốc tương ứng, không phải phase này).
- **Migration concerns**: Nếu phát hiện gap nghiêm trọng ở giai đoạn này (ví dụ thiếu test cho 1 nhánh lỗi quan trọng), ưu tiên bổ sung trước khi coi dự án "hoàn tất Phase 1" — không trì hoãn sang backlog mơ hồ.
- **Tests/verification**: Chính phase này là verification — đầu ra là coverage report cho payment/refund/enrollment/ownership.
- **Exit criteria**: Payment/refund/enrollment/Teacher-ownership có integration test bao phủ golden path + ít nhất 1 edge case mỗi luồng (double-submit, ownership violation, race condition).
- **Trace**: Architecture §12, PRD-020/021/025/026, EC-001/002.

---

## Tổng kết Dependency Graph (rút gọn theo Stage)

```
Stage A (Backend Foundation) ─┐
Stage B (Frontend Foundation) ─┤ (chạy song song, không phụ thuộc nhau)
Stage C (UI Foundation) ──────┘
        │
Stage D (Auth & Ownership) ← cần Stage A
        │
Stage E (Payment Core) ← cần Stage A, D
        │
Stage F (External Integrations) ← cần Stage A
        │
Stage G (Commerce Domains) ← cần Stage E, F, D
        │
Stage H (Assessment & Audit) ← cần Stage D (Assessment), Stage D-G (Audit gắn dần)
        │
Stage I (UI Redesign trang cũ + Teacher Area) ← cần Stage C + tương ứng D-H theo từng trang (Teacher Area/Phase 30 cần D, F, H; AdminCourses/Phase 31 cần đợi Phase 30 xong)
        │
Stage J (Checkout UI) ← cần Stage C, E, F, G
        │
Stage K (New Features UI còn lại) ← cần Stage C, F, G, H (không còn cần Stage D — Teacher Area đã chuyển sang Stage I)
        │
Stage L (Cleanup) ← cần toàn bộ I-K hoàn tất
```
