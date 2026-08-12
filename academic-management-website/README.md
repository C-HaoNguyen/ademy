# 📚 Academic Management Website

Một nền tảng quản lý học tập toàn diện được xây dựng bằng React, TypeScript và Tailwind CSS. Đây là **dự án cá nhân** nhằm xây dựng hệ thống quản lý khóa học, học tập hiện đại với giao diện thân thiện và đầy đủ chức năng của một website học online.

## 📖 Giới Thiệu Chi Tiết

### 🎯 Mục Tiêu Dự Án

Dự án này nhằm mục đích tạo ra một nền tảng quản lý học tập hoàn chỉnh, cho phép các sinh viên, giảng viên và quản trị viên có thể tương tác với nhau một cách hiệu quả. Hệ thống được thiết kế với kiến trúc ba tầng:

1. **Lớp Giao Diện (UI)**: Xây dựng bằng React + TypeScript, sử dụng Tailwind CSS để xây dựng UI.
2. **Lớp Logic**: Xử lý logic business, quản lý state, gọi API
3. **Lớp Dữ Liệu**: Tương tác với backend API (triển khai với repository Java tại: LINK)

### ✨ Tính Năng Chính

#### 🎓 Cho Sinh Viên
- **Dashboard Cá Nhân**: Xem tổng quan các khóa học đang theo học, tiến độ học tập
- **Danh Sách Khóa Học**: Tìm kiếm, xem chi tiết các khóa học có sẵn
- **Hồ Sơ Cá Nhân**: Quản lý thông tin cá nhân, cập nhật ảnh đại diện
- **Theo Dõi Tiến Độ**: Xem bài tập, bài thi, điểm số chi tiết
- **Thực Hành Bài Kiểm Tra**: Làm bài kiểm tra thực hành trực tuyến
- **Thanh Toán Khóa Học**: Tích hợp hệ thống thanh toán cho các khóa học premium

#### 👨‍🏫 Cho Giảng Viên
- **Quản Lý Khóa Học**: Tạo, chỉnh sửa, xóa các khóa học
- **Quản Lý Bài Giảng**: Tổ chức nội dung khóa học theo phần, bài học
- **Chấm Điểm**: Chấm điểm bài tập, bài kiểm tra của sinh viên
- **Phân Tích Hiệu Suất**: Xem báo cáo chi tiết về hiệu suất của sinh viên
- **Giao Tiếp**: Gửi thông báo, feedback cho sinh viên

#### 👨‍💼 Cho Quản Trị Viên
- **Quản Lý Người Dùng**: Xem, tạo, chỉnh sửa, xóa tài khoản người dùng
- **Quản Lý Vai Trò**: Gán vai trò (Student, Teacher, Admin) cho người dùng
- **Quản Lý Khóa Học**: Duyệt duyệt, kích hoạt khóa học từ giảng viên
- **Quản Lý Danh Mục**: Quản lý các danh mục khóa học
- **Quản Lý Đơn Hàng**: Xem các đơn thanh toán, lịch sử giao dịch
- **Thống Kê Tổng Quan**: Xem dashboard tổng quan số liệu hệ thống

#### 🌐 Chức Năng Công Khai
- **Trang Chủ**: Giới thiệu nền tảng, hiển thị khóa học nổi bật
- **Danh Sách Khóa Học**: Duyệt tất cả khóa học, lọc theo danh mục
- **Chi Tiết Khóa Học**: Xem mô tả chi tiết, giảng viên, điểm tích lũy
- **Thông Tin Giảng Viên**: Xem profile các giảng viên
- **Liên Hệ**: Trang liên hệ, gửi phản hồi

## 🛠️ Công Nghệ Sử Dụng

### Frontend Stack
- **React 18+**: Thư viện UI hiện đại với Hooks, Context API
- **TypeScript**: Cung cấp type safety cho JavaScript
- **Vite**: Build tool nhanh, tối ưu hóa cho development
- **Tailwind CSS**: Framework CSS utility-first
- **PostCSS**: Xử lý CSS, hỗ trợ các tính năng mới

### Routing & State Management
- **React Router v6**: Quản lý routing ứng dụng
- **Context API**: Quản lý state toàn cục (Authentication, User info)

### UI & Styling
- **Tailwind CSS**: Utility classes cho styling nhanh
- **Lucide React**: Icon library nhẹ, đẹp
- **Custom CSS**: CSS tùy chỉnh cho các component đặc biệt

### Developer Tools
- **ESLint**: Kiểm tra code quality
- **Node.js**: Runtime environment

## 📁 Cấu Trúc Dự Án

```
src/
├── components/              # Các component React
│   ├── admin/              # Components cho admin dashboard
│   │   ├── AddCourseOverlay.tsx
│   │   ├── AddUserOverlay.tsx
│   │   ├── AdminHeader.tsx
│   │   ├── AdminLayout.tsx
│   │   └── AdminSidebar.tsx
│   ├── checkout/           # Components thanh toán
│   │   ├── EnrollSuccessOverlay.tsx
│   │   ├── OrderSummary.tsx
│   │   └── PaymentForm.tsx
│   ├── common/             # Components dùng chung
│   │   ├── Badge.tsx
│   │   └── Toast.tsx
│   ├── loading/            # Components loading
│   ├── public/             # Components công khai
│   │   ├── CourseCard.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── PublicLayout.tsx
│   │   └── TeacherCard.tsx
│   └── student/            # Components cho sinh viên
│       ├── InfoItem.tsx
│       ├── StudentHeader.tsx
│       └── StudentSidebar.tsx
├── pages/                   # Các trang ứng dụng
│   ├── admin/              # Trang admin
│   │   ├── AdminCategories.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminOrders.tsx
│   │   └── courses/AdminCourses.tsx
│   │   └── users/AdminUsersList.tsx
│   ├── auth/               # Trang xác thực
│   │   ├── AuthPage.tsx
│   │   ├── Login.tsx
│   │   └── Signup.tsx
│   ├── public/             # Trang công khai
│   │   ├── about/ContactPage.tsx
│   │   ├── courses/CourseDetailPage.tsx
│   │   ├── courses/CourseListPage.tsx
│   │   ├── home/HomePage.tsx
│   │   ├── lecturer/LecturerPage.tsx
│   │   └── payment/Checkout.tsx
│   ├── student/            # Trang sinh viên
│   │   ├── dashboard/Dashboard.tsx
│   │   ├── dashboard/MyCoursesOverview.tsx
│   │   ├── dashboard/QuickActions.tsx
│   │   ├── learning-profile/LearningProgress.tsx
│   │   ├── my-courses/MyCourses.tsx
│   │   ├── profile/Profile.tsx
│   │   └── test-practice/TestPractice.tsx
│   └── teacher/            # Trang giảng viên
├── routes/                  # Định tuyến ứng dụng
│   ├── AppRoutes.tsx       # Cấu hình routes
│   └── ProtectedRoute.tsx  # Component bảo vệ routes
├── types/                   # TypeScript types
│   └── User.ts
├── utils/                   # Các hàm tiện ích
│   ├── AuthFetch.ts        # Gọi API có xác thực
│   ├── AuthUtils.tsx       # Xử lý với token
│   └── DateUtils.tsx       # Xử lý ngày tháng
├── config/                  # Cấu hình ứng dụng
│   └── constants.ts
├── assets/                  # Hình ảnh, icon
├── App.tsx                  # Component root
├── main.tsx                 # Entry point
└── index.css               # Styles toàn cục
```

## 🚀 Cách Chạy Project

### ✅ Yêu Cầu
- **Node.js**: v16.0.0 hoặc cao hơn
- **npm** hoặc **yarn**: Quản lý package dependencies

### 📝 Bước Cài Đặt

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi động server phát triển (dev server)
npm run dev
# Ứng dụng sẽ chạy tại: http://localhost:5173

# 3. Build cho production (khi cần deploy)
npm run build
```

### 🔧 Các Script Khác

```bash
# Linting và kiểm tra code quality
npm run lint

# Chỉ cài đặt packages cần thiết (thay vì npm install)
npm ci
```

## 📖 Hướng Dẫn Sử Dụng

### 🔐 Quy Trình Đăng Nhập
1. Truy cập trang chủ
2. Nhấp "Đăng Nhập" hoặc "Đăng Ký"
3. Nhập email và mật khẩu
4. Hệ thống sẽ ghi nhớ token (JWT) trong localStorage
5. Redirect đến dashboard phù hợp với vai trò

### 🎓 Cho Sinh Viên
- **Dashboard**: `/student/dashboard` - Xem tóm tắt khóa học, tiến độ học tập
- **Khóa Học Của Tôi**: `/student/my-courses` - Danh sách khóa học đang học
- **Hồ Sơ**: `/student/profile` - Chỉnh sửa thông tin cá nhân
- **Thực Hành**: `/student/test-practice` - Làm bài kiểm tra thực hành

### 👨‍🏫 Cho Giảng Viên
- **Khóa Học**: `/teacher/courses` - Quản lý khóa học của mình
- **Chấm Điểm**: `/teacher/grading` - Chấm điểm bài tập, bài kiểm tra

### 👨‍💼 Cho Quản Trị Viên
- **Dashboard**: `/admin` - Xem thống kê tổng quan
- **Người Dùng**: `/admin/users` - Quản lý tài khoản, vai trò
- **Khóa Học**: `/admin/courses` - Duyệt khóa học
- **Danh Mục**: `/admin/categories` - Quản lý danh mục
- **Đơn Hàng**: `/admin/orders` - Xem lịch sử thanh toán

### 🌐 Công Khai (Không cần đăng nhập)
- **Trang Chủ**: `/` - Trang chủ, khóa học nổi bật
- **Khóa Học**: `/courses` - Duyệt tất cả khóa học
- **Chi Tiết Khóa Học**: `/courses/:id` - Xem thông tin chi tiết
- **Giảng Viên**: `/lecturers` - Danh sách giảng viên
- **Liên Hệ**: `/contact` - Trang liên hệ
- **Thanh Toán**: `/checkout` - Trang thanh toán khóa học

## 🔐 Bảo Mật & Xác Thực

### 🔑 JWT Authentication
- **accessToken**: Token ngắn hạn lưu trong localStorage, dùng cho các request API
- **refreshToken**: Token dài hạn, dùng để cấp lại accessToken khi hết hạn
- **Thời gian hết hạn**: accessToken ~15 phút, refreshToken ~7 ngày

### 🛡️ Protected Routes
- Các route yêu cầu xác thực được bảo vệ bằng component `ProtectedRoute`
- Nếu chưa đăng nhập, redirect đến trang login
- Kiểm tra vai trò (role) trước khi cho phép truy cập
- Tự động refresh token trước khi hết hạn

Chi tiết xem tại:
- [AuthUtils.tsx](src/utils/AuthUtils.tsx) - Xử lý token
- [ProtectedRoute.tsx](src/routes/ProtectedRoute.tsx) - Bảo vệ routes
- [AuthFetch.ts](src/utils/AuthFetch.ts) - Gọi API có xác thực

## 🎨 Styling & Design

### 🎯 Tailwind CSS
- Sử dụng utility classes cho styling nhanh
- Tệp cấu hình: `tailwind.config.js`
- Custom colors, fonts, spacing tùy chỉnh
- Dark mode support (có thể thêm)

### 🖼️ Global Styles
- [index.css](src/index.css) - Reset CSS, utility classes tùy chỉnh
- [App.css](src/App.css) - Styles cho các component chính

### 📱 Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Tất cả components đều responsive trên các kích thước màn hình khác nhau

### 🎨 Design System
- **Colors**: Primary, Secondary, Success, Warning, Danger, Info
- **Spacing**: 8px grid system
- **Typography**: Consistent font sizes, line heights
- **Components**: Reusable UI components (Button, Card, Badge, Toast)

## � Phát Triển & Debugging

### 🐛 Dev Tools
- **React DevTools**: Debug React components, props, state
- **ESLint**: Kiểm tra code quality trong editor
- **Vite**: Fast refresh, HMR (Hot Module Replacement) cho development nhanh

### 🔍 Debugging Tips
```typescript
// Thêm console.log để debug
console.log('Debug info:', data);

// Hoặc sử dụng debugger statement
debugger; // Dừng tại đây khi mở DevTools

// React Dev Tools: Inspect component
// Redux Dev Tools: Nếu có dùng Redux
```

### 📊 Performance Tips
- Sử dụng React.memo() cho components không cần re-render
- Lazy loading components bằng React.lazy() + Suspense
- Code splitting theo routes
- Image optimization

## 📝 Ghi Chú Phát Triển

### ⏳ Điểm Chưa Hoàn Thành
- [ ] Deployment/Hosting (Netlify, Vercel, GitHub Pages, v.v.)
- [ ] Auto email confirmation khi đăng ký
- [ ] Password reset functionality
- [ ] Email notifications
- [ ] Real-time notifications (WebSocket)

### 🚀 Tính Năng Có Thể Mở Rộng
- Video streaming cho bài giảng (sử dụng FFmpeg hoặc HLS)
- Forum/Discussion board để sinh viên thảo luận
- Notifications service (email, SMS, push notifications)
- Analytics dashboard (Google Analytics, Mixpanel)
- Mobile app (React Native, Flutter)
- Real-time chat feature (Socket.io)
- Course certificates/badges
- Gamification (points, badges, leaderboard)
- AI-powered course recommendations

## 📚 Tài Nguyên & Tài Liệu

### Tài Liệu Chính
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Router v6](https://reactrouter.com/)
- [Vite Guide](https://vitejs.dev/guide/)

### Công Cụ Hữu Ích
- [Lucide Icons](https://lucide.dev) - Icon library
- [Tailwind UI Components](https://tailwindui.com)
- [Figma](https://www.figma.com) - Design tool

## 📞 Liên Hệ & Hỗ Trợ

Nếu gặp vấn đề hoặc có câu hỏi:
- Kiểm tra [Hướng dẫn Sử Dụng](#-hướng-dẫn-sử-dụng) ở trên
- Xem lại console browser (F12) để debug
- Kiểm tra terminal xem có lỗi backend không

---

## 📊 Thông Tin Dự Án

| Thông Tin | Chi Tiết |
|-----------|---------|
| **Loại Dự Án** | Dự án cá nhân (Personal Project) |
| **Trạng Thái** | 🔨 Đang phát triển (In Development) |
| **Version** | 1.0.0 (Beta) |
| **Lần Cập Nhật** | Tháng 2, 2026 |
| **Node Version** | 16.0.0+ |
| **npm Version** | 8.0.0+ |

---

**Made with ❤️ for learning and development**