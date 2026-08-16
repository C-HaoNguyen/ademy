# Ademy — Academic Management System

Hệ thống quản lý học tập gồm **backend API** (Spring Boot) và **frontend website** (React + Vite).

## Cấu trúc project

```
ademy/
├── academic-management-api/       # Spring Boot REST API (port 8080)
│   └── src/main/
│       ├── java/.../controller|dto|entity|repository|security|seeder/
│       └── resources/
│           ├── application.properties
│           └── db/migration/      # Flyway migrations (tự apply khi khởi động)
│
└── academic-management-website/   # React frontend (port 5173)
    └── src/
        ├── config/                # constants, API URL
        ├── routes/                # routing & guards
        ├── pages/                 # auth | public | student | admin
        ├── components/            # public | student | admin | common
        ├── utils/                 # AuthUtils, AuthFetch
        └── types/
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

> **Lưu ý:** Flyway từ chối migrate nếu database không rỗng và chưa có bảng `flyway_schema_history` (ví dụ DB cũ từng seed thủ công trước khi có Flyway) — tạo database mới thay vì tái dùng DB kiểu đó.

## 2. Chạy Backend API

```bash
cd academic-management-api
cp .env.example .env    # rồi điền giá trị thật
mvn spring-boot:run
```

API chạy tại: **http://localhost:8080**

Tài khoản admin mặc định (tự seed khi khởi động): `admin` / `admin123`

Cấu hình DB qua biến môi trường `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` (xem `.env.example`) — `application.properties` không còn giá trị mặc định hardcode. Spring Boot **không** tự đọc file `.env` khi chạy `mvn spring-boot:run`/từ IDE; cần export biến trước hoặc set trong run config. Chạy qua `docker-compose` (mục 6) thì `.env` được nạp tự động.

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
cd D:\courses\SE347\ademy\academic-management-api
mvn spring-boot:run
```

**Terminal 2 — Frontend:**
```bash
cd D:\courses\SE347\ademy\academic-management-website
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

## 6. Docker (Backend)

```bash
cd academic-management-api
cp .env.example .env    # rồi điền giá trị thật (Docker tự nạp .env vào container)
docker compose up --build
```

`docker-compose.yml` dùng `env_file: .env` để inject `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` vào container — không cần truyền `-e` thủ công.

## Thay đổi cấu trúc (refactor)

Refactor gần đây **không đổi logic nghiệp vụ**, chỉ tổ chức lại:

- Gom cấu hình API vào `src/config/` (xóa `pages/api.ts`)
- Thêm path alias `@/` → `src/` (Vite + TypeScript)
- Chuẩn hóa trang admin vào subfolder: `dashboard/`, `categories/`, `orders/`
- Xóa file không dùng: `App.css`, `QuickActions.tsx`, `DateUtils.tsx`
- Backend: sửa stub `@Valid` gây tắt validation, dọn dead code, chuyển SQL sang `db/migration/`
