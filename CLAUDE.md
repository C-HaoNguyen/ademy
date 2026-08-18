# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This is a monorepo — a single git repo at the root containing two independent projects:

- `academic-management-api/` — Spring Boot 3.5 REST API (Java 24), port 8080
- `academic-management-website/` — React 19 + TypeScript + Vite frontend, port 5173

There is no root-level build; each project is built/run independently from its own directory.

## Commands

### Backend (`academic-management-api/`)

```bash
mvn spring-boot:run          # run dev server (port 8080, or $PORT)
mvn clean package            # build jar
mvn test                     # run all tests
mvn test -Dtest=ClassName    # run a single test class
java -jar target/academic-management-api-0.0.1-SNAPSHOT.jar
```

Database is PostgreSQL and schema is managed by **Flyway** (`spring.flyway.enabled=true`) — migrations in `src/main/resources/db/migration/` are applied automatically on startup against an existing (can be empty) database. Flyway refuses to run against a non-empty schema that lacks a `flyway_schema_history` table (e.g. a DB seeded manually before Flyway was introduced) — reset that DB rather than adding `baseline-on-migrate`.

DB connection comes from `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` env vars (no defaults are baked into `application.properties`) — copy `.env.example` to `.env` and fill in real values, or run via `docker-compose up` which loads `.env` automatically (`env_file:` in `docker-compose.yml`). Spring Boot does **not** auto-load `.env` for non-Docker runs (`mvn spring-boot:run`, IDE run configs) — export the vars yourself or set them in your run configuration.

A default admin user (`admin` / `admin123`) is auto-seeded on startup by `AdminSeeder` if no user with role `ADMIN` exists yet.

### Frontend (`academic-management-website/`)

```bash
npm install
npm run dev        # dev server on :5173
npm run build       # tsc -b && vite build
npm run lint
npm run preview
```

Requires `.env` with `VITE_API_URL` (and/or `VITE_API_BASE_URL`) pointing at the backend, e.g. `http://localhost:8080` — copy `.env.example` for the expected shape.

## Backend architecture

Modular monolith under `com.example.academic_management_api`, packaged by feature (not by technical layer) — each module owns its own `controller/service/repository/entity/dto`:

- `auth/` — `AuthController`/`AuthService` (signup/login/me); no entity of its own, uses `user`'s `Users`
- `user/` — `Users` entity; `UserController` (self-service `/users/me`) + `AdminController` (admin user management under `/admin/users/**`, `/admin/instructors`, `/admin/total-users`), both backed by `UserService`
- `category/` — `Categories` entity; `CategoryController` (public `/categories`) + `AdminCategoryController` (`/admin/categories/**`), both backed by `CategoryService`
- `course/` — `Courses` entity; `CourseController` (public `/courses/**`) + `AdminCourseController` (`/admin/courses/**`, `/admin/total-courses`, `/admin/deleted-course/{id}`), both backed by `CourseService`
  - `course/lesson/` — submodule holding `Lessons`, `LessonProgress` (composite key `LessonProgressId`); no service/controller yet (not wired to any endpoint)
- `enrollment/` — `Enrollments` entity; `EnrollmentController`/`EnrollmentService` (`/enrollments/**`); exposes `createEnrollment`/`isEnrolled` for `payment` to call
- `payment/` — `Payments` entity; `PaymentController` (`/payments/checkout`) + `AdminPaymentController` (`/admin/payments`, `/admin/total-payments`), both backed by `PaymentService`. `payment` is the only module that writes `payments` and creates enrollments — it does so by calling `EnrollmentService`, never `EnrollmentRepository` directly
- `security/` — JWT auth: `JwtTokenUtil` (issue/parse tokens), `JwtAuthFilter` (per-request auth, registered before `UsernamePasswordAuthenticationFilter`), `CustomUserDetails`, `SecurityConfig` (route authorization + CORS — the single source of CORS config)
- `seeder/AdminSeeder` — `CommandLineRunner` that creates the default admin on first boot

Cross-module access rules: a controller only calls services in its own module; cross-module reads/writes go through the other module's `service` public methods, never its `repository`/internal `entity` directly (a `@ManyToOne` FK reference to another module's entity, e.g. `Courses.instructor` → `Users`, is not a boundary violation).

Authorization is role-based and defined centrally in `SecurityConfig`:
- `/auth/**`, `/courses/**` — public
- `/admin/**` — requires `ROLE_ADMIN`
- `/enrollments/**` — requires `ROLE_STUDENT`
- everything else — requires authentication

Auth is stateless (JWT bearer tokens, no sessions, CSRF disabled, `httpBasic`/`formLogin` disabled). CORS is locked to specific origins (`http://localhost:5173` and the deployed frontend) in `SecurityConfig` — add new frontend origins there when needed.

`spring.jpa.hibernate.ddl-auto=none`: schema changes must be made by adding a new file to `db/migration/` and updating entities to match — Hibernate will not auto-migrate.

## Frontend architecture

Routing (`src/routes/AppRoutes.tsx`) is organized by audience, each behind its own layout:
- Public routes wrapped in `PublicLayout` (home, courses, lecturer, contact; `/checkout` additionally requires auth)
- `/student/*` wrapped in `StudentLayout`, gated by `ProtectedRoute` with `allowedRoles={[ROLES.STUDENT]}`
- `/admin/*` wrapped in `AdminLayout`, gated by `ProtectedRoute` with `allowedRoles={[ROLES.ADMIN]}`

`ProtectedRoute` (`src/routes/ProtectedRoute.tsx`) checks login state and role before rendering children, redirecting to `/login` otherwise.

Auth/token handling lives in `src/utils/`:
- `AuthUtils.ts` — reads/decodes the JWT from `localStorage` (`jwt-decode`), exposes `isLoggedIn`, `extractRole`, `isTokenExpired`, `logout`
- `AuthFetch.ts` — `authFetch()` wraps `fetch`, attaches the bearer token, and force-logs-out on token expiry or a 401 response

All cross-cutting config (API base URL, all API endpoint paths, role names, frontend route paths, localStorage keys, UI constants like debounce/pagination/layout sizing) is centralized in `src/config/constants.ts`, re-exported via `src/config/index.ts` as `@/config`. Prefer adding to `API_ENDPOINTS`/`ROUTES`/`ROLES` there rather than hardcoding paths in components.

Path alias `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig*.json`) — use it for all internal imports instead of relative paths.

Component/page organization mirrors the route audience: `components/{admin,student,public,checkout,common}/` and `pages/{admin,student,auth,public}/...` (admin/public pages are further split into per-feature subfolders, e.g. `pages/admin/courses/`, `pages/admin/categories/`).

`teacher/` role and routes exist in `ROLES`/`ROUTES` config as forward-looking placeholders but have no implemented pages/routes yet.
