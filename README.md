# Ademy — Academic Management System

Nền tảng quản lý khóa học trực tuyến: học viên mua và học khóa học, giảng viên tạo nội dung, quản trị viên vận hành hệ thống. Monorepo gồm **REST API** (Spring Boot) và **website** (React + Vite).

## Tech stack

**Backend** — Java 24, Spring Boot 3.5, Spring Security (JWT), Spring Data JPA, PostgreSQL, Flyway, Spring AOP (audit logging), Cloudflare R2 (S3-compatible video storage), Stripe / VNPay / Momo (thanh toán), Resend / Mailpit (email), Docker.

**Frontend** — React 19, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, Framer Motion.

## Tính năng chính

- **Auth & phân quyền**: đăng ký/đăng nhập JWT, 3 vai trò `STUDENT` / `TEACHER` / `ADMIN`, route & API guard theo role.
- **Khóa học**: CRUD khóa học/danh mục, bài học (upload video qua R2 presigned URL), quiz/assessment gắn theo bài học.
- **Ghi danh & thanh toán**: enroll khóa học, checkout qua Stripe/VNPay/Momo (có chế độ mock để test không cần credential thật), coupon giảm giá, refund.
- **Học tập**: theo dõi tiến độ học (lesson progress), làm quiz, dashboard học viên.
- **Quản trị**: dashboard thống kê (users/courses/payments/revenue), quản lý user (khóa/mở khóa), duyệt/từ chối khóa học, audit log các thao tác nhạy cảm.
- **Giảng viên**: dashboard riêng, tạo/sửa khóa học và bài học.

## Cấu trúc project

```
ademy/
├── academic-management-api/       # Spring Boot REST API (port 8080)
│   └── src/main/
│       ├── java/.../{auth,user,category,course,enrollment,payment,assessment,audit,security}/
│       │   └── mỗi package: controller/service/repository/entity/dto riêng
│       └── resources/
│           ├── application.properties
│           └── db/migration/      # Flyway migrations (tự apply khi khởi động)
│
└── academic-management-website/   # React frontend (port 5173)
    └── src/
        ├── config/       # API URL, endpoints, routes, roles — cấu hình tập trung
        ├── routes/       # routing & role guard
        ├── features/     # auth | public | courses | student | teacher | admin | payment
        └── shared/       # api client, auth utils, UI dùng chung
```

## Yêu cầu

| Thành phần | Phiên bản |
|---|---|
| Java | 24 |
| Maven | 3.9+ |
| Node.js | 18+ |
| PostgreSQL | 14+ |

## 1. Cơ sở dữ liệu (PostgreSQL)

Schema được quản lý bởi **Flyway** — tự động apply khi API khởi động, không cần chạy `psql` thủ công. Chỉ cần database tồn tại (có thể rỗng):

```sql
CREATE DATABASE "AcademicManagement";
```

Flyway từ chối migrate nếu database không rỗng và chưa có bảng `flyway_schema_history` (ví dụ DB cũ từng seed thủ công trước khi có Flyway) — tạo database mới thay vì tái dùng DB kiểu đó.

## 2. Chạy Backend API

```bash
cd academic-management-api
cp .env.example .env    # rồi điền giá trị thật
mvn spring-boot:run
```

API chạy tại: **http://localhost:8080**

Tài khoản admin mặc định (tự seed khi khởi động): `admin` / `admin123`

Cấu hình DB qua biến môi trường `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` (xem `.env.example`) — `application.properties` không có giá trị mặc định hardcode. Spring Boot **không** tự đọc file `.env` khi chạy `mvn spring-boot:run`/từ IDE; cần export biến trước hoặc set trong run config. Chạy qua `docker-compose` (mục 6) thì `.env` được nạp tự động.

Các nhóm biến môi trường khác trong `.env.example`:

- `R2_*` — Cloudflare R2 (S3-compatible), bắt buộc ở mọi profile để upload video bài học.
- `MAIL_FROM_ADDRESS`, `MAILPIT_*`, `RESEND_API_KEY` — email: profile `local` dùng Mailpit (kèm trong docker-compose), profile `prod` dùng Resend.
- `PAYMENT_MODE=mock` (mặc định) — `/payments/checkout` thành công ngay, không cần credential cổng thanh toán nào. Đặt `PAYMENT_MODE=live` cùng `VNPAY_*` / `MOMO_*` / `STRIPE_*` để chạy thanh toán thật qua VNPay/Momo/Stripe.

## 3. Chạy Frontend Website

```bash
cd academic-management-website
npm install
npm run dev
```

Website chạy tại: **http://localhost:5173**

```bash
cp .env.example .env    # đã đúng mặc định cho local, chỉnh nếu cần
```

```env
VITE_API_URL=http://localhost:8080
```

## 4. Chạy cả hai (2 terminal)

**Terminal 1 — Backend:**
```bash
cd academic-management-api
mvn spring-boot:run
```

**Terminal 2 — Frontend:**
```bash
cd academic-management-website
npm run dev
```

## 5. Build production

**Backend:**
```bash
cd academic-management-api
mvn clean package
java -jar target/academic-management-api-0.0.1-SNAPSHOT.jar
```

**Frontend:**
```bash
cd academic-management-website
npm run build
npm run preview
```

## 6. Docker (Backend + Mailpit)

```bash
cd academic-management-api
cp .env.example .env    # rồi điền giá trị thật (Docker tự nạp .env vào container)
docker compose up --build
```

`docker-compose.yml` dùng `env_file: .env` để inject toàn bộ biến môi trường (`DB_*`, `R2_*`, `PAYMENT_MODE`, ...) vào container — không cần truyền `-e` thủ công. Mailpit được khởi động kèm để nhận email test, UI xem tại **http://localhost:8025**.

## Test

```bash
cd academic-management-api
mvn test                     # toàn bộ test
mvn test -Dtest=ClassName    # một test class
```
