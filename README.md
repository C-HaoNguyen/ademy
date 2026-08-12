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
│           └── db/migration/      # SQL schema (chạy thủ công)
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

Tạo database:

```sql
CREATE DATABASE "AcademicManagement";
```

Chạy script schema mới nhất (file cuối cùng trong thư mục migration):

```bash
psql -U postgres -d AcademicManagement -f academic-management-api/src/main/resources/db/migration/V0.0.1_03_Update_Version_All_Tables.sql
```

> **Lưu ý:** Flyway chưa được bật. Schema phải được apply thủ công trước khi chạy API.

## 2. Chạy Backend API

```bash
cd academic-management-api
mvn spring-boot:run
```

API chạy tại: **http://localhost:8080**

Tài khoản admin mặc định (tự seed khi khởi động): `admin` / `admin123`

Cấu hình DB trong `src/main/resources/application.properties` (hoặc qua biến môi trường):

```properties
DB_URL=jdbc:postgresql://localhost:5432/AcademicManagement
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

## 3. Chạy Frontend Website

```bash
cd academic-management-website
npm install
npm run dev
```

Website chạy tại: **http://localhost:5173**

File `.env` (đã có sẵn):

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
docker build -t ademy-api .
docker run -p 8080:8080 \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/AcademicManagement \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  ademy-api
```

## Thay đổi cấu trúc (refactor)

Refactor gần đây **không đổi logic nghiệp vụ**, chỉ tổ chức lại:

- Gom cấu hình API vào `src/config/` (xóa `pages/api.ts`)
- Thêm path alias `@/` → `src/` (Vite + TypeScript)
- Chuẩn hóa trang admin vào subfolder: `dashboard/`, `categories/`, `orders/`
- Xóa file không dùng: `App.css`, `QuickActions.tsx`, `DateUtils.tsx`
- Backend: sửa stub `@Valid` gây tắt validation, dọn dead code, chuyển SQL sang `db/migration/`
