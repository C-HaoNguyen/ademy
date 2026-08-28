package com.example.academic_management_api.payment.coupon.service;

import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.payment.coupon.dto.CouponRequest;
import com.example.academic_management_api.payment.coupon.dto.CouponResponse;
import com.example.academic_management_api.payment.coupon.entity.CouponDiscountType;
import com.example.academic_management_api.payment.coupon.entity.Coupons;
import com.example.academic_management_api.payment.coupon.repository.CouponRedemptionRepository;
import com.example.academic_management_api.payment.coupon.repository.CouponRepository;
import com.example.academic_management_api.payment.entity.Payments;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock
    private CouponRepository couponRepository;
    @Mock
    private CouponRedemptionRepository couponRedemptionRepository;
    @Mock
    private CourseRepository courseRepository;

    private CouponService couponService;

    @BeforeEach
    void setUp() {
        couponService = new CouponService(couponRepository, couponRedemptionRepository, courseRepository);
    }

    private Coupons coupon() {
        Coupons coupon = new Coupons();
        coupon.setId(1);
        coupon.setCode("SALE10");
        coupon.setDiscountType(CouponDiscountType.PERCENTAGE);
        coupon.setDiscountValue(new BigDecimal("10"));
        coupon.setActive(true);
        return coupon;
    }

    // ------------------------------------------------------------------
    // resolveValidCoupon — validate hết hạn/hết lượt/scope tại đúng thời điểm checkout
    // ------------------------------------------------------------------

    @Test
    void resolveValidCoupon_activeNotExpiredNoScopeNoLimit_returnsCoupon() {
        Coupons coupon = coupon();
        when(couponRepository.findByCode("SALE10")).thenReturn(Optional.of(coupon));

        Coupons resolved = couponService.resolveValidCoupon("SALE10", 5);

        assertThat(resolved).isEqualTo(coupon);
    }

    @Test
    void resolveValidCoupon_codeNotFound_throwsNotFoundException() {
        when(couponRepository.findByCode("UNKNOWN")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> couponService.resolveValidCoupon("UNKNOWN", 5))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void resolveValidCoupon_deactivated_throwsConflictException() {
        Coupons coupon = coupon();
        coupon.setActive(false);
        when(couponRepository.findByCode("SALE10")).thenReturn(Optional.of(coupon));

        assertThatThrownBy(() -> couponService.resolveValidCoupon("SALE10", 5))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void resolveValidCoupon_expired_throwsConflictException() {
        Coupons coupon = coupon();
        coupon.setExpiresAt(LocalDateTime.now().minusDays(1));
        when(couponRepository.findByCode("SALE10")).thenReturn(Optional.of(coupon));

        assertThatThrownBy(() -> couponService.resolveValidCoupon("SALE10", 5))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void resolveValidCoupon_notExpiredYet_isAccepted() {
        Coupons coupon = coupon();
        coupon.setExpiresAt(LocalDateTime.now().plusDays(1));
        when(couponRepository.findByCode("SALE10")).thenReturn(Optional.of(coupon));

        Coupons resolved = couponService.resolveValidCoupon("SALE10", 5);

        assertThat(resolved).isEqualTo(coupon);
    }

    @Test
    void resolveValidCoupon_wrongCourseScope_throwsConflictException() {
        Coupons coupon = coupon();
        Courses scopedCourse = new Courses();
        scopedCourse.setCourseId(1);
        coupon.setCourse(scopedCourse);
        when(couponRepository.findByCode("SALE10")).thenReturn(Optional.of(coupon));

        assertThatThrownBy(() -> couponService.resolveValidCoupon("SALE10", 2))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void resolveValidCoupon_matchingCourseScope_isAccepted() {
        Coupons coupon = coupon();
        Courses scopedCourse = new Courses();
        scopedCourse.setCourseId(1);
        coupon.setCourse(scopedCourse);
        when(couponRepository.findByCode("SALE10")).thenReturn(Optional.of(coupon));

        Coupons resolved = couponService.resolveValidCoupon("SALE10", 1);

        assertThat(resolved).isEqualTo(coupon);
    }

    @Test
    void resolveValidCoupon_maxRedemptionsReached_throwsConflictException() {
        Coupons coupon = coupon();
        coupon.setMaxRedemptions(5);
        coupon.setRedemptionCount(5);
        when(couponRepository.findByCode("SALE10")).thenReturn(Optional.of(coupon));

        assertThatThrownBy(() -> couponService.resolveValidCoupon("SALE10", 5))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void resolveValidCoupon_underMaxRedemptions_isAccepted() {
        Coupons coupon = coupon();
        coupon.setMaxRedemptions(5);
        coupon.setRedemptionCount(4);
        when(couponRepository.findByCode("SALE10")).thenReturn(Optional.of(coupon));

        Coupons resolved = couponService.resolveValidCoupon("SALE10", 5);

        assertThat(resolved).isEqualTo(coupon);
    }

    // ------------------------------------------------------------------
    // consumeRedemption — atomic increment, tránh race 2 checkout đồng thời vượt max_redemptions
    // ------------------------------------------------------------------

    @Test
    void consumeRedemption_incrementSucceeds_recordsRedemptionAndReturnsTrue() {
        Coupons coupon = coupon();
        Payments payment = new Payments();
        when(couponRepository.incrementRedemptionIfAllowed(eq(1), any(LocalDateTime.class))).thenReturn(1);

        boolean consumed = couponService.consumeRedemption(coupon, payment, new BigDecimal("50000.00"));

        assertThat(consumed).isTrue();
        verify(couponRedemptionRepository).save(any());
    }

    @Test
    void consumeRedemption_raceLostConcurrentCheckoutExhaustedLimit_returnsFalseWithoutRecordingRedemption() {
        Coupons coupon = coupon();
        Payments payment = new Payments();
        when(couponRepository.incrementRedemptionIfAllowed(eq(1), any(LocalDateTime.class))).thenReturn(0);

        boolean consumed = couponService.consumeRedemption(coupon, payment, new BigDecimal("50000.00"));

        assertThat(consumed).isFalse();
        verify(couponRedemptionRepository, never()).save(any());
    }

    // ------------------------------------------------------------------
    // Admin CRUD
    // ------------------------------------------------------------------

    @Test
    void createCoupon_duplicateCode_throwsConflictException() {
        CouponRequest request = new CouponRequest();
        request.setCode("SALE10");
        request.setDiscountType(CouponDiscountType.PERCENTAGE);
        request.setDiscountValue(new BigDecimal("10"));
        when(couponRepository.existsByCode("SALE10")).thenReturn(true);

        assertThatThrownBy(() -> couponService.createCoupon(request))
                .isInstanceOf(ConflictException.class);

        verify(couponRepository, never()).save(any());
    }

    @Test
    void createCoupon_platformWide_savesWithoutCourse() {
        CouponRequest request = new CouponRequest();
        request.setCode("SALE10");
        request.setDiscountType(CouponDiscountType.PERCENTAGE);
        request.setDiscountValue(new BigDecimal("10"));
        when(couponRepository.existsByCode("SALE10")).thenReturn(false);
        when(couponRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        CouponResponse response = couponService.createCoupon(request);

        assertThat(response.getCode()).isEqualTo("SALE10");
        assertThat(response.getCourseId()).isNull();
        verifyNoInteractions(courseRepository);
    }

    @Test
    void createCoupon_scopedToCourse_notFound_throwsNotFoundException() {
        CouponRequest request = new CouponRequest();
        request.setCode("SALE10");
        request.setDiscountType(CouponDiscountType.PERCENTAGE);
        request.setDiscountValue(new BigDecimal("10"));
        request.setCourseId(99);
        when(couponRepository.existsByCode("SALE10")).thenReturn(false);
        when(courseRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> couponService.createCoupon(request))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void deactivateCoupon_existing_setsActiveFalse() {
        Coupons coupon = coupon();
        when(couponRepository.findById(1)).thenReturn(Optional.of(coupon));

        couponService.deactivateCoupon(1);

        assertThat(coupon.isActive()).isFalse();
        verify(couponRepository).save(coupon);
    }

    @Test
    void deactivateCoupon_notFound_throwsNotFoundException() {
        when(couponRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> couponService.deactivateCoupon(99))
                .isInstanceOf(NotFoundException.class);
    }
}
