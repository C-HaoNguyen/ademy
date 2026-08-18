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

### Phase 4: Status field type safety (Enum)

- **Goal**: Loại bỏ lớp lỗi do String tự do gây ra (bug case-sensitivity thật đã phát hiện).
- **Scope**: Chuyển `Users.role`, `Payments.status`, `Courses.status`, `Courses.level` từ `String` sang enum Java; migration DB đồng bộ giá trị enum với check constraint.
- **Dependencies**: Phase 1 (Flyway), Phase 2 (service layer là nơi map enum).
- **Changes required**: Enum class cho từng field; Flyway migration cập nhật constraint nếu cần; sửa mọi nơi so sánh String cứng (`"SUCCESS"`, `"pending"`...) sang dùng enum.
- **Modules/files**: `user/entity/Users.java`, `payment/entity/Payments.java`, `course/entity/Courses.java`, migration mới trong `db/migration/`.
- **Existing behavior cần preserve**: Giá trị hợp lệ hiện có (role STUDENT/ADMIN, status các loại) phải map đúng 1-1 sang enum, không đổi tập giá trị hợp lệ ngoài việc sửa đúng bug case-sensitivity.
- **Migration concerns**: Đây chính là phase sửa bug thật (`"SUCCESS"` uppercase vs constraint `'success'` lowercase) — cần quyết định chuẩn hóa theo 1 case duy nhất (khuyến nghị lowercase khớp constraint hiện có) và áp dụng nhất quán ở cả entity lẫn mọi nơi tạo giá trị.
- **Tests/verification**: Test insert Payment với mọi trạng thái hợp lệ, xác nhận không còn vi phạm check constraint; test không thể insert giá trị ngoài enum (compile-time).
- **Exit criteria**: Không còn field status/role dạng String tự do; bug case-sensitivity đã sửa và có test xác nhận không tái diễn.
- **Trace**: ADR-005, PRD-020/021, BR-004.

### Phase 5: Data access hygiene

- **Goal**: Giảm rủi ro N+1 và dọn cấu trúc khóa fragile trước khi domain mới thêm nhiều bảng liên kết.
- **Scope**: Chuyển mọi `@ManyToOne` sang `FetchType.LAZY` + thêm `JOIN FETCH` ở query danh sách cần dữ liệu liên quan; thêm index cho mọi cột FK; đổi `LessonProgress` từ composite key (`@IdClass`) sang surrogate key + unique constraint.
- **Dependencies**: Phase 1, Phase 4.
- **Changes required**: Sửa annotation fetch type trên entity; JPQL `JOIN FETCH` ở repository method liên quan; migration thêm index; entity `LessonProgress` đổi PK, xóa `LessonProgressId`.
- **Modules/files**: Mọi entity có `@ManyToOne` (`Courses`, `Enrollments`, `Payments`, `Lessons`, `LessonProgress`), migration mới. `Lessons`/`LessonProgress` đã có vị trí cố định từ Phase 2: submodule `course/lesson/` (xem Target Project Structure mục B) — không đặt lại vị trí ở phase này.
- **Existing behavior cần preserve**: Kết quả trả về API không đổi (chỉ đổi cách lấy dữ liệu, không đổi shape response); ràng buộc nghiệp vụ 1 student × 1 lesson chỉ có 1 progress record phải giữ nguyên qua unique constraint.
- **Migration concerns**: Đổi PK của `LessonProgress` là thay đổi schema có rủi ro nếu có data — đã xác nhận build mới không cần giữ data cũ nên an toàn để đổi trực tiếp.
- **Tests/verification**: Test lấy danh sách course kèm instructor/category không phát sinh N+1 (kiểm tra số query qua log/Hibernate statistics); test insert trùng `(student_id, lesson_id)` vào `lesson_progress` bị chặn bởi unique constraint.
- **Exit criteria**: Không còn `FetchType.EAGER` mặc định; mọi FK có index; `LessonProgress` dùng surrogate key.
- **Trace**: ADR-018, ADR-019, NFR-001.

---

## Stage B — Frontend Foundation

### Phase 6: Project restructure (frontend)

- **Goal**: Có cấu trúc thư mục theo feature trước khi thêm API client/state layer và Teacher area mới.
- **Scope**: Di chuyển `components/{admin,student,public,checkout,common}` và `pages/{admin,student,auth,public}` sang `shared/{api,ui}` + `features/{auth,public,courses,student,teacher,admin,payment}` — **đúng theo [Target Project Structure & Organization Rules](#target-project-structure--organization-rules) mục C** (thêm `features/public/` so với bản kế hoạch gốc — bị thiếu trước đây dù Phase 26 đã giả định nó tồn tại). Chỉ di chuyển/đổi tên file, chưa đổi nội dung.
- **Dependencies**: Không phụ thuộc Stage A — có thể chạy song song.
- **Changes required**:
  - Move file + cập nhật import path theo đúng mục C; cập nhật `AppRoutes.tsx` trỏ đúng vị trí mới.
  - `components/checkout/*` (PaymentForm, OrderSummary, EnrollSuccessOverlay) + `pages/public/payment/Checkout.tsx` → gộp thẳng vào `features/payment/` trong lúc move (không tạo bước rename riêng — 2 tên "checkout"/"payment" hiện đang chỉ cùng 1 domain, thống nhất về `payment` ngay ở bước move này).
  - `pages/student/learning-profile/LearningProgress.tsx` → đổi tên file thành `LearningProfile.tsx` khi move vào `features/student/` (tên file/thư mục đang lệch nhau, và UI_SPEC/Phase 28 đều gọi là "LearningProfile" — đổi tên file không phải đổi nội dung, vẫn trong phạm vi "chỉ move" của phase này).
  - Xóa `pages/auth/AuthPage.tsx`, `pages/student/dashboard/MyCoursesOverview.tsx` (0 dòng, không nơi nào import — dead file xác nhận qua grep, xóa an toàn ngay trong lúc move thay vì chờ Phase 37).
- **Modules/files**: Toàn bộ `academic-management-website/src/{components,pages}`.
- **Existing behavior cần preserve**: Toàn bộ trang hiện có phải render và hoạt động y hệt trước/sau di chuyển.
- **Migration concerns**: Risk lớn nhất là lẫn refactor nội dung component vào cùng lúc move — tách riêng commit move khỏi commit sửa nội dung (giống nguyên tắc Phase 2 backend).
- **Tests/verification**: Chạy `npm run build` + `npm run lint` xác nhận không lỗi import; click-through thủ công mọi route hiện có.
- **Exit criteria**: Build/lint sạch; mọi route hiện có hoạt động không đổi; cấu trúc thư mục khớp mục C (Target Project Structure); không còn `components/checkout/`; 2 dead file đã xóa.
- **Trace**: Architecture §4, §13; Target Project Structure mục C.

### Phase 7: API client layer

- **Goal**: Một điểm gọi API duy nhất, thay thế fetch rải rác.
- **Scope**: Tạo `shared/api/client.ts` (tự gắn bearer token, tự xử lý 401 → logout); thay mọi lời gọi fetch trực tiếp trong component hiện có bằng client này; đảm bảo dùng `API_ENDPOINTS` thay vì hardcode path.
- **Dependencies**: Phase 6.
- **Changes required**: `shared/api/client.ts`; sửa từng trang đang tự fetch (AdminCourses, AdminUsersList, AdminCategories, AdminOrders, HomePage, CourseListPage, CourseDetailPage, Checkout, Dashboard, MyCourses, Profile, Login, Signup) để dùng client chung.
- **Modules/files**: `shared/api/`, mọi page/feature hiện gọi `fetch()` trực tiếp.
- **Existing behavior cần preserve**: Dữ liệu hiển thị và luồng thao tác hiện có không đổi — đây là thay đổi cách gọi API, không đổi UI/behavior quan sát được.
- **Migration concerns**: Đồng bộ với Phase 3 (backend chuẩn hóa lỗi) để error handling nhất quán 2 phía; nếu Phase 3 backend chưa xong, client tạm xử lý cả 2 hình dạng lỗi cũ/mới, ghi rõ TODO xóa nhánh tương thích cũ sau khi Phase 3 hoàn tất.
- **Tests/verification**: Verify từng trang đã chuyển vẫn fetch đúng dữ liệu; test riêng hành vi auto-logout khi nhận 401.
- **Exit criteria**: Không còn `fetch()` gọi trực tiếp ngoài `shared/api/client.ts`; không còn endpoint hardcode ngoài `API_ENDPOINTS`.
- **Trace**: ADR-021.

### Phase 8: Server state (TanStack Query)

- **Goal**: Loại bỏ duplication fetch/cache tự phát.
- **Scope**: Cài TanStack Query; chuyển các trang có fetch trùng lặp rõ rệt (categories/course-count đang fetch độc lập ở nhiều nơi) sang dùng query hook chung trước, sau đó áp dụng dần cho các trang còn lại.
- **Dependencies**: Phase 7.
- **Changes required**: `QueryClientProvider` ở root; hook `useCoursesQuery`, `useCategoriesQuery`... theo nhu cầu từng trang; xóa `useState`/`useEffect` fetch thủ công tương ứng.
- **Modules/files**: `src/main.tsx` (provider), từng feature cần data fetching.
- **Existing behavior cần preserve**: Dữ liệu hiển thị không đổi; loading/error state hiển thị hành vi tương đương (chưa cần đổi UI ở phase này, chỉ đổi cơ chế lấy dữ liệu).
- **Migration concerns**: Làm dần từng trang, không chuyển toàn bộ 1 lần — mỗi trang là 1 commit độc lập để dễ review/rollback riêng lẻ.
- **Tests/verification**: Xác nhận cache hoạt động (không fetch lại khi điều hướng qua lại); xác nhận invalidate đúng sau mutation (ví dụ sau khi Admin sửa category, danh sách course liên quan cập nhật).
- **Exit criteria**: Categories/course-count không còn fetch trùng lặp; các trang chính đã chuyển sang React Query.
- **Trace**: ADR-020.

### Phase 9: Auth state + fix `isTokenExpired` bug

- **Goal**: Tập trung auth state, sửa bug bảo mật thật.
- **Scope**: Tạo `AuthContext`; sửa `isTokenExpired` để token thiếu `exp` không còn bị coi là "không bao giờ hết hạn"; chuyển `Profile`/`Login`/`Header` sang đọc từ context thay vì tự đọc `localStorage` riêng.
- **Dependencies**: Phase 7 (client xử lý 401 cần đồng bộ với context).
- **Changes required**: `AuthContext` + provider ở root; sửa logic `isTokenExpired` trong `AuthUtils.ts`; cập nhật các component đọc auth state.
- **Modules/files**: `shared/auth/AuthContext.tsx` (mới), `utils/AuthUtils.ts`, `Header.tsx`, `Profile.tsx`, `Login.tsx`.
- **Existing behavior cần preserve**: Luồng đăng nhập/đăng xuất hiện có không đổi ngoài việc sửa đúng bug hết hạn token.
- **Migration concerns**: Đây là bug bảo mật thật (session không hết hạn khi thiếu `exp`) — cần test riêng để xác nhận sửa đúng, tránh vô tình đổi hành vi cho token có `exp` hợp lệ.
- **Tests/verification**: Test token có `exp` hết hạn → bị logout đúng; test token thiếu `exp` → **không còn** coi là hợp lệ vĩnh viễn (theo quyết định cần làm rõ: coi token thiếu `exp` là không hợp lệ ngay, vì đây là dữ liệu bất thường).
- **Exit criteria**: Mọi nơi đọc auth state qua `AuthContext`, không tự đọc `localStorage` rải rác; bug `isTokenExpired` đã sửa và có test.
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
