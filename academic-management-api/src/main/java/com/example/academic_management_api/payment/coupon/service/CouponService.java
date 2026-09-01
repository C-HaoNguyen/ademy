package com.example.academic_management_api.payment.coupon.service;

import com.example.academic_management_api.audit.annotation.Audited;
import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.payment.coupon.dto.CouponRequest;
import com.example.academic_management_api.payment.coupon.dto.CouponResponse;
import com.example.academic_management_api.payment.coupon.entity.CouponRedemptions;
import com.example.academic_management_api.payment.coupon.entity.Coupons;
import com.example.academic_management_api.payment.coupon.repository.CouponRedemptionRepository;
import com.example.academic_management_api.payment.coupon.repository.CouponRepository;
import com.example.academic_management_api.payment.entity.Payments;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CouponService {

    private final CouponRepository couponRepository;
    private final CouponRedemptionRepository couponRedemptionRepository;
    private final CourseRepository courseRepository;

    public CouponService(
            CouponRepository couponRepository,
            CouponRedemptionRepository couponRedemptionRepository,
            CourseRepository courseRepository
    ) {
        this.couponRepository = couponRepository;
        this.couponRedemptionRepository = couponRedemptionRepository;
        this.courseRepository = courseRepository;
    }

    public List<CouponResponse> getAllCoupons() {
        return couponRepository.findAllWithDetails().stream().map(this::toResponse).toList();
    }

    @Audited(action = "ADMIN_COUPON_CREATE", targetType = "COUPON", targetIdExpression = "#result.id")
    public CouponResponse createCoupon(CouponRequest request) {
        if (couponRepository.existsByCode(request.getCode())) {
            throw new ConflictException("Mã coupon đã tồn tại");
        }

        Coupons coupon = new Coupons();
        applyRequest(coupon, request);

        return toResponse(couponRepository.save(coupon));
    }

    public CouponResponse updateCoupon(Integer id, CouponRequest request) {
        Coupons coupon = couponRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy coupon"));

        // So sánh case-sensitive (không dùng equalsIgnoreCase) — khớp đúng tính chất của
        // constraint coupons_code_uq (case-sensitive) và existsByCode()/findByCode(); nếu không,
        // đổi code chỉ khác hoa/thường (vd. "sale10" -> "SALE10") có thể bỏ qua guard này rồi
        // save() ném DataIntegrityViolationException trần (500) thay vì ConflictException (409).
        if (!coupon.getCode().equals(request.getCode()) && couponRepository.existsByCode(request.getCode())) {
            throw new ConflictException("Mã coupon đã tồn tại");
        }

        applyRequest(coupon, request);

        return toResponse(couponRepository.save(coupon));
    }

    public void deactivateCoupon(Integer id) {
        Coupons coupon = couponRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy coupon"));

        coupon.setActive(false);
        couponRepository.save(coupon);
    }

    // Dùng bởi PaymentService khi checkout/preview — payment service là nơi DUY NHẤT tính amount
    // cuối cùng (ARCHITECTURE.md §7), method này chỉ trả về coupon hợp lệ, không tự tính discount.
    public Coupons resolveValidCoupon(String code, Integer courseId) {
        Coupons coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException("Mã coupon không tồn tại"));

        if (!coupon.isActive()) {
            throw new ConflictException("Mã coupon đã bị vô hiệu hóa");
        }
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ConflictException("Mã coupon đã hết hạn");
        }
        // getCourseId() trên proxy LAZY không kích hoạt initialize (Hibernate giữ sẵn identifier
        // của association) — so sánh an toàn mà không cần JOIN FETCH ở đây.
        if (coupon.getCourse() != null && !coupon.getCourse().getCourseId().equals(courseId)) {
            throw new ConflictException("Mã coupon không áp dụng cho khóa học này");
        }
        if (coupon.getMaxRedemptions() != null && coupon.getRedemptionCount() >= coupon.getMaxRedemptions()) {
            throw new ConflictException("Mã coupon đã hết lượt sử dụng");
        }

        return coupon;
    }

    // Gọi bởi PaymentService ngay sau khi payment được lưu thành công, trong cùng transaction
    // checkout — atomic increment tránh race condition 2 checkout đồng thời cùng vượt quá
    // max_redemptions, VÀ tránh race coupon bị deactivate/hết hạn giữa lúc resolveValidCoupon() đọc
    // xong và lúc method này chạy (cùng nguyên tắc PaymentRepository.updateStatusIfPending, Phase 21).
    // Trả về false nếu coupon vừa hết lượt/bị vô hiệu hóa/hết hạn ngay lúc này — caller
    // (PaymentService) phải rollback transaction.
    public boolean consumeRedemption(Coupons coupon, Payments payment, BigDecimal discountAmount) {
        int updated = couponRepository.incrementRedemptionIfAllowed(coupon.getId(), LocalDateTime.now());
        if (updated == 0) {
            return false;
        }

        CouponRedemptions redemption = new CouponRedemptions();
        redemption.setCoupon(coupon);
        redemption.setPayment(payment);
        redemption.setDiscountAmount(discountAmount);
        couponRedemptionRepository.save(redemption);

        return true;
    }

    private void applyRequest(Coupons coupon, CouponRequest request) {
        coupon.setCode(request.getCode());
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMaxRedemptions(request.getMaxRedemptions());
        coupon.setExpiresAt(request.getExpiresAt());

        if (request.getCourseId() != null) {
            Courses course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy khóa học"));
            coupon.setCourse(course);
        } else {
            coupon.setCourse(null);
        }
    }

    private CouponResponse toResponse(Coupons coupon) {
        return new CouponResponse(
                coupon.getId(),
                coupon.getCode(),
                coupon.getDiscountType(),
                coupon.getDiscountValue(),
                coupon.getCourse() != null ? coupon.getCourse().getCourseId() : null,
                coupon.getCourse() != null ? coupon.getCourse().getTitle() : null,
                coupon.getMaxRedemptions(),
                coupon.getRedemptionCount(),
                coupon.getExpiresAt(),
                coupon.isActive(),
                coupon.getCreatedAt()
        );
    }
}
