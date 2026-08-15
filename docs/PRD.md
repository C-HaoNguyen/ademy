# PRD — Academic Management Platform (Version mới)

Status: Draft cho Phase 1 (MVP)
Nguồn: Codebase audit (2026-08-13) + Product discovery interview (2026-08-13)

---

## 1. Product Overview

Academic Management Platform là nền tảng học trực tuyến (LMS) của **một academy duy nhất**, nơi:

- **Admin** vận hành nền tảng, mời và quản lý **Teacher**, giám sát nội dung/giao dịch.
- **Teacher** (nhân sự/cộng tác viên do Admin mời, không tự đăng ký) tự tạo, quản lý và publish khóa học của chính mình, tạo bài kiểm tra trắc nghiệm và theo dõi học viên.
- **Student** duyệt catalog, mua khóa học (thanh toán thật), học theo lesson (video/tài liệu/quiz), theo dõi tiến độ và làm bài test.
- **Khách vãng lai** (chưa đăng nhập) duyệt catalog công khai trước khi quyết định đăng ký/mua.

Đây là bản redesign toàn diện (frontend + backend) dựa trên hệ thống hiện tại, không migrate dữ liệu cũ (dữ liệu hiện tại chỉ là seed/demo).

## 2. Problem Statement

Từ kết quả audit codebase hiện tại:

- Nền tảng hiện chỉ có **Admin** là người duy nhất tạo/quản lý khóa học — không có cơ chế cho nhiều giáo viên tự chủ nội dung.
- **Thanh toán là mock**: không tích hợp cổng thanh toán thật, số tiền do client gửi lên (rủi ro toàn vẹn dữ liệu), không có state machine rõ ràng.
- **Trải nghiệm học tập chưa tồn tại thật**: Learning Progress và Test Practice chỉ là UI tĩnh, không có logic theo dõi tiến độ hay chấm bài thật.
- **Admin Dashboard hiển thị số liệu hardcode**, không phản ánh dữ liệu thật.
- Thiếu các cơ chế vận hành cơ bản: audit log, chính sách hoàn tiền, coupon, thông báo qua email.
- Kiến trúc không có service layer, không có exception handling tập trung, zero test coverage — gây khó khăn khi mở rộng.

Version mới cần giải quyết đồng thời cả ba trục: (1) mở nền tảng cho nhiều Teacher tự chủ, (2) xây trải nghiệm học tập thật, (3) xây luồng kinh doanh (thanh toán, coupon, refund) đáng tin cậy.

## 3. Target Users

| Nhóm | Mô tả |
|---|---|
| **Khách vãng lai** | Chưa đăng nhập, duyệt catalog công khai (danh sách khóa học, chi tiết khóa học, giảng viên, liên hệ). Không xem được lesson preview (yêu cầu đăng nhập). |
| **Student** | Đã đăng ký tài khoản, mua và học khóa học, làm bài test, theo dõi tiến độ học. |
| **Teacher** | Do Admin mời (không tự đăng ký), tự tạo/quản lý/publish khóa học của mình, tạo bài kiểm tra trắc nghiệm, xem thống kê học viên của khóa mình dạy. |
| **Admin** | Vận hành toàn nền tảng: quản lý user (bao gồm mời Teacher), giám sát/khóa nội dung vi phạm, quản lý category, tạo coupon, duyệt yêu cầu hoàn tiền, xem báo cáo tổng quan. |

## 4. Goals

- **G1** — Cho phép nhiều Teacher độc lập tự tạo, publish và quản lý khóa học của mình mà không cần Admin làm thay.
- **G2** — Cung cấp trải nghiệm học tập thật: xem lesson, theo dõi tiến độ theo % hoàn thành, làm bài test trắc nghiệm và nhận kết quả.
- **G3** — Xây luồng mua khóa học đáng tin cậy với cổng thanh toán thật (VNPay, Momo, Stripe), không còn lỗ hổng tính toàn vẹn giá trị giao dịch.
- **G4** — Cho Admin công cụ giám sát và vận hành: số liệu thật trên dashboard, audit log cho hành động nhạy cảm, khả năng can thiệp (khóa user/course, duyệt refund).
- **G5** — Thiết kế lại toàn bộ UI/UX nhất quán, đặt nền móng cho đa ngôn ngữ (Việt + Anh) ở Phase 2.

## 5. Non-Goals

- Không xây marketplace mở (Teacher tự đăng ký, chia doanh thu theo %) — nền tảng vẫn là một academy duy nhất.
- Không hỗ trợ chấm bài tự luận/thủ công — chỉ trắc nghiệm auto-grade.
- Không yêu cầu Admin duyệt nội dung trước khi Teacher publish.
- Không phát hành certificate hoàn thành khóa học.
- Không xây cơ chế chống học ké tài khoản (single-session, giới hạn thiết bị...) trong version này.
- Không xây mobile app native — chỉ web responsive.
- Không migrate dữ liệu từ hệ thống cũ.
- Không đưa i18n (đa ngôn ngữ) vào Phase 1 — để Phase 2.

## 6. Core User Journeys

**J1 — Khách khám phá và đăng ký học**
Khách vãng lai duyệt catalog công khai → xem chi tiết khóa học → đăng ký tài khoản/đăng nhập → xem thử lesson preview (yêu cầu đăng nhập) → quyết định mua.

**J2 — Student mua khóa học**
Student đăng nhập → chọn khóa học → áp coupon (nếu có) → thanh toán qua VNPay/Momo/Stripe → nhận xác nhận qua email → khóa học xuất hiện trong "My Courses".

**J3 — Student học và làm bài test**
Student vào khóa học đã mua → xem lesson (video/tài liệu) theo thứ tự → hệ thống ghi nhận tiến độ (% hoàn thành) → làm bài test trắc nghiệm do Teacher tạo → nhận kết quả tự động → nhận email kết quả.

**J4 — Teacher tạo và vận hành khóa học**
Admin mời Teacher (tạo tài khoản) → Teacher đăng nhập → tạo khóa học mới (Draft) → thêm lesson (video/tài liệu/quiz), đánh dấu lesson preview miễn phí → publish khóa học (Published) → tạo bài test trắc nghiệm cho khóa học → theo dõi danh sách/thống kê học viên đã đăng ký.

**J5 — Teacher/Admin quản lý vòng đời khóa học**
Teacher có thể chuyển khóa học giữa Draft ⇄ Published ⇄ Archived. Admin có quyền force-unpublish khóa học vi phạm (hành động tách biệt, có audit log) mà không tự động thu hồi quyền truy cập của người đã mua.

**J6 — Admin giám sát vận hành**
Admin đăng nhập → xem dashboard với số liệu thật (doanh thu, số học viên, số khóa học) → quản lý user (khóa/mở, mời Teacher) → tạo coupon → xử lý yêu cầu hoàn tiền → tra cứu audit log khi cần điều tra.

**J7 — Student yêu cầu hoàn tiền**
Student gửi yêu cầu hoàn tiền cho khóa học đã mua → Admin xem xét và duyệt/từ chối → trạng thái thanh toán cập nhật → student nhận email thông báo kết quả.

## 7. Functional Requirements

### Auth & Account Management
- **PRD-001**: Hệ thống phải hỗ trợ đăng ký/đăng nhập cho Student (tự đăng ký).
- **PRD-002**: Admin phải có khả năng tạo tài khoản Teacher (mời trực tiếp) — Teacher không tự đăng ký.
- **PRD-003**: Admin phải có khả năng khóa/mở khóa tài khoản Student và Teacher.
- **PRD-004**: Hệ thống phải phân quyền theo 3 role: STUDENT, TEACHER, ADMIN, cộng với trạng thái khách chưa đăng nhập.

### Course Catalog & Preview
- **PRD-005**: Khách vãng lai (chưa đăng nhập) phải xem được danh sách và chi tiết khóa học đã Published.
- **PRD-006**: Teacher phải đánh dấu được một số lesson là "preview miễn phí".
- **PRD-007**: Xem lesson preview yêu cầu đăng nhập (bất kỳ role nào), không mở cho khách chưa đăng nhập.
- **PRD-008**: Khóa học ở trạng thái Archived phải bị ẩn khỏi catalog công khai nhưng vẫn hiển thị trong "My Courses" của người đã mua.

### Course Authoring (Teacher)
- **PRD-009**: Teacher phải tạo/sửa/xóa được khóa học của chính mình (không sửa được khóa học của Teacher khác).
- **PRD-010**: Khóa học phải có vòng đời trạng thái: Draft → Published → Archived/Unpublished.
- **PRD-011**: Teacher phải tự chuyển đổi được trạng thái khóa học của mình giữa Draft/Published/Archived.
- **PRD-012**: Teacher phải thêm/sửa/xóa được lesson trong khóa học của mình, với nội dung dạng video (upload hoặc embed link) và tài liệu/text.
- **PRD-013**: Teacher phải gắn được quiz vào từng lesson.
- **PRD-014**: Teacher phải tạo được bài kiểm tra trắc nghiệm tổng cho khóa học, định nghĩa đáp án đúng.
- **PRD-015**: Teacher phải xem được danh sách học viên đã đăng ký và tiến độ học của họ trong khóa học mình dạy.

### Learning Experience (Student)
- **PRD-016**: Student chỉ truy cập được nội dung đầy đủ của khóa học đã mua (ngoại trừ lesson preview).
- **PRD-017**: Hệ thống phải ghi nhận tiến độ học của Student theo lesson đã hoàn thành (% hoàn thành khóa học).
- **PRD-018**: Student phải làm được bài test trắc nghiệm và nhận kết quả được chấm tự động ngay lập tức.
- **PRD-019**: Student phải xem lại được lịch sử kết quả bài test đã làm.

### Payment & Commerce
- **PRD-020**: Hệ thống phải tích hợp cổng thanh toán thật: VNPay, Momo, Stripe.
- **PRD-021**: Số tiền thanh toán phải được xác định server-side từ giá khóa học tại thời điểm checkout (không nhận giá trị từ client).
- **PRD-022**: Payment phải có trạng thái rõ ràng (ví dụ: PENDING, SUCCESS, FAILED) phản ánh đúng phản hồi từ cổng thanh toán.
- **PRD-023**: Admin phải tạo được coupon/discount code, áp dụng toàn nền tảng hoặc cho khóa học cụ thể. Teacher không có quyền tạo coupon.
- **PRD-024**: Student phải áp dụng được coupon hợp lệ tại bước checkout.
- **PRD-025**: Hệ thống phải hỗ trợ Student gửi yêu cầu hoàn tiền cho khóa học đã mua.
- **PRD-026**: Admin phải xem xét và duyệt/từ chối yêu cầu hoàn tiền (quy tắc nghiệp vụ chi tiết — điều kiện/thời hạn — sẽ chốt ở giai đoạn sau).
- **PRD-027**: Việc thu hồi quyền truy cập nội dung khóa học sau khi mua chỉ xảy ra thông qua hành động tường minh của Admin (ví dụ gắn với refund hoặc xử lý vi phạm), không tự động khi course chuyển sang Archived.

### Admin Operations
- **PRD-028**: Admin Dashboard phải hiển thị số liệu thật: tổng doanh thu, tổng số học viên, tổng số khóa học.
- **PRD-029**: Admin phải quản lý được Category (CRUD).
- **PRD-030**: Admin phải force-unpublish được khóa học vi phạm, độc lập với quyền tự quản lý của Teacher.

### Notification
- **PRD-031**: Hệ thống phải gửi email cho các sự kiện: thanh toán thành công, kết quả xử lý yêu cầu hoàn tiền, kết quả bài test.

### Contact
- **PRD-032**: Form liên hệ công khai phải hoạt động thật — gửi email và/hoặc lưu vào hệ thống để Admin xem, thay vì chỉ là UI tĩnh như hiện tại.

### Audit & Security
- **PRD-033**: Hệ thống phải ghi audit log cho: sự kiện đăng nhập/bảo mật (đăng nhập thành công/thất bại, đổi mật khẩu), sự kiện thanh toán/hoàn tiền (checkout, refund request, thay đổi trạng thái payment), hành động Teacher (tạo/sửa/xóa khóa học, publish/unpublish, tạo bài test), hành động Admin nhạy cảm (khóa/mở user, xóa course/user, tạo coupon, duyệt refund).
- **PRD-034**: Audit log phải ghi được ai thực hiện hành động, hành động gì, đối tượng nào, thời điểm nào.

## 8. Business Rules

- **BR-001**: Mô hình giá là mua trọn đời (one-time purchase) — mua một lần, truy cập vĩnh viễn (trừ khi bị Admin thu hồi tường minh theo PRD-027).
- **BR-002**: Teacher là nhân sự/cộng tác viên do Admin mời; không có luồng tự đăng ký làm Teacher.
- **BR-003**: Chỉ Admin được tạo coupon/discount code.
- **BR-004**: Course chỉ có 3 trạng thái: Draft, Published, Archived/Unpublished. Teacher tự chuyển đổi giữa các trạng thái cho khóa học của mình; Admin có quyền force-unpublish bất kỳ khóa học nào.
- **BR-005**: Khóa học Archived bị ẩn khỏi catalog công khai nhưng người đã mua trước đó vẫn giữ quyền truy cập nội dung.
- **BR-006**: Bài test chỉ ở dạng trắc nghiệm, chấm điểm tự động theo đáp án Teacher định nghĩa sẵn — không có chấm tay/tự luận.
- **BR-007**: Lesson preview miễn phí chỉ xem được khi đã đăng nhập (bất kỳ role nào), không mở cho khách chưa đăng nhập.
- **BR-008**: Amount thanh toán luôn tính từ giá khóa học tại thời điểm giao dịch trên server, không nhận từ input client.
- **BR-009**: Refund cần có cơ chế/trạng thái trong hệ thống; quy tắc nghiệp vụ chi tiết (điều kiện, thời hạn) chưa chốt, sẽ bổ sung ở giai đoạn sau — không chặn việc thiết kế trạng thái/luồng xử lý cơ bản.

## 9. Edge Cases

- **EC-001**: Hai request checkout đồng thời cho cùng một Student + Course — hệ thống phải tránh tạo trùng payment/enrollment (đã là lỗ hổng thực tế trong hệ thống hiện tại, cần giải quyết ở version mới dù không đi sâu implementation ở PRD này).
- **EC-002**: Callback/webhook từ cổng thanh toán đến trễ hoặc lặp lại — trạng thái payment không được thay đổi sai lệch do xử lý webhook trùng.
- **EC-003**: Coupon hết hạn hoặc đã dùng hết lượt tại thời điểm checkout — phải từ chối áp dụng và thông báo rõ cho Student.
- **EC-004**: Teacher archive khóa học đang có Student học dở — Student vẫn phải truy cập được nội dung bình thường theo BR-005.
- **EC-005**: Admin force-unpublish một khóa học đang có giao dịch refund đang chờ xử lý — hai luồng (unpublish và refund) phải không xung đột dữ liệu.
- **EC-006**: Teacher bị Admin khóa tài khoản trong khi khóa học của họ vẫn đang được Student học — nội dung khóa học vẫn phải khả dụng cho Student (khóa tài khoản Teacher không đồng nghĩa với khóa nội dung).
- **EC-007**: Một tài khoản được nhiều người cùng dùng chung để học (account sharing) — được xác nhận là vấn đề thật nhưng nằm ngoài phạm vi xử lý của version này (xem mục 11).
- **EC-008**: Student yêu cầu hoàn tiền sau khi đã hoàn thành phần lớn nội dung khóa học — cần quy tắc xử lý cụ thể (chưa chốt, thuộc BR-009).

## 10. Non-functional Requirements

- **NFR-001 (Scale)**: Hệ thống phải phục vụ được ở quy mô hàng nghìn đến chục nghìn người dùng.
- **NFR-002 (Security)**: Áp dụng kiểm soát bảo mật chặt: audit log đầy đủ (mục 7 — PRD-033/034), phân quyền chi tiết theo role, ràng buộc rõ ràng về dữ liệu cá nhân.
- **NFR-003 (Payment integrity)**: Không được để giá trị giao dịch bị thao túng từ phía client (liên quan PRD-021/BR-008).
- **NFR-004 (Availability cho Learning)**: Nội dung khóa học đã mua phải luôn khả dụng cho Student trừ khi có hành động thu hồi tường minh từ Admin (liên quan PRD-027).
- **NFR-005 (Platform)**: Chỉ cần web, responsive tốt trên desktop và mobile browser — không yêu cầu app native.
- **NFR-006 (i18n readiness)**: Kiến trúc UI nên đặt nền móng để bổ sung đa ngôn ngữ (Việt + Anh) ở Phase 2, dù bản thân i18n không bắt buộc ở Phase 1.
- **NFR-007 (Email delivery)**: Email thông báo (PRD-031) cần được gửi tin cậy, phản ánh đúng sự kiện xảy ra.

## 11. Out of Scope

- Marketplace mở với nhiều Teacher tự do đăng ký và cơ chế chia doanh thu (revenue-share).
- Chấm bài tự luận/nộp file thủ công — chỉ hỗ trợ trắc nghiệm auto-grade.
- Quy trình Admin duyệt nội dung khóa học trước khi Teacher publish.
- Certificate hoàn thành khóa học.
- Cơ chế chống dùng chung tài khoản (giới hạn phiên đăng nhập đồng thời, giới hạn thiết bị, watermark video...).
- Teacher tự tạo coupon/discount code.
- Mobile app native (iOS/Android).
- Migrate dữ liệu từ hệ thống hiện tại (dữ liệu hiện tại chỉ là seed/demo, không cần giữ).
- Đa ngôn ngữ (i18n) — dời sang Phase 2.

## 12. Success Criteria

Tiêu chí định tính cho Phase 1 (MVP) — chưa gắn số liệu KPI cụ thể, sẽ bổ sung ở giai đoạn sau nếu cần:

- **SC-001**: Một Teacher có thể độc lập tạo, thêm nội dung, và publish một khóa học hoàn chỉnh mà không cần Admin can thiệp vào nội dung.
- **SC-002**: Một Student có thể hoàn tất trọn vẹn hành trình: duyệt catalog → đăng ký → mua khóa học qua cổng thanh toán thật → học lesson → làm bài test trắc nghiệm → nhận kết quả, không gặp lỗi chặn luồng.
- **SC-003**: Mọi giao dịch thanh toán phản ánh đúng giá khóa học tại thời điểm mua, không có sai lệch do client can thiệp.
- **SC-004**: Admin có thể tra cứu audit log để trả lời được "ai đã làm gì, khi nào" cho các hành động nhạy cảm được liệt kê ở PRD-033.
- **SC-005**: Admin Dashboard phản ánh đúng số liệu thật của hệ thống tại mọi thời điểm truy cập (không còn số liệu hardcode).
- **SC-006**: Khóa học Archived không làm gián đoạn quyền truy cập của Student đã mua trước đó.
- **SC-007**: Toàn bộ Functional Requirements (PRD-001 → PRD-034) trong Phase 1 hoạt động đúng như mô tả, được xác minh qua kiểm thử thủ công/tự động trước khi coi là hoàn thành Phase 1.

