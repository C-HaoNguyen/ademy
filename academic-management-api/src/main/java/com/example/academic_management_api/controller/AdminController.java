package com.example.academic_management_api.controller;

import com.example.academic_management_api.dto.course.CreateCourseRequest;
import com.example.academic_management_api.dto.category.CategoryRequest;
import com.example.academic_management_api.entity.Categories;
import com.example.academic_management_api.entity.Courses;
import com.example.academic_management_api.entity.Payments;
import com.example.academic_management_api.entity.Users;
import com.example.academic_management_api.repository.CategoryRepository;
import com.example.academic_management_api.repository.CourseRepository;
import com.example.academic_management_api.repository.PaymentRepository;
import com.example.academic_management_api.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {
    public final UserRepository userRepository;
    public final CourseRepository courseRepository;
    public final CategoryRepository categoryRepository;
    public final PaymentRepository paymentRepository;
    public final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository userRepository, CourseRepository courseRepository, CategoryRepository categoryRepository, PaymentRepository paymentRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.categoryRepository = categoryRepository;
        this.paymentRepository = paymentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/users/add")
    public ResponseEntity<?> createUser(
            @Valid @RequestBody com.example.academic_management_api.dto.user.AdminCreateUserRequest request
    ) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body("Người dùng đã tồn tại. Vui lòng chọn tên khác!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email đã tồn tại. Vui lòng chọn email khác");
        }

        Users user = new Users();
        user.setUsername(request.getUsername());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setActive(request.getActive() != null ? request.getActive() : true);

        Users saved = userRepository.save(user);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/users")
    public List<Users> getAllUsers() {
        List<Users> allUsers = userRepository.findAll();
        return allUsers;
    }

    @PutMapping("/users/{id}/lock")
    public ResponseEntity<?> lockUser(
            @PathVariable Integer id,
            Authentication authentication
    ) {
        Users admin = userRepository
                .findByUsername(authentication.getName())
                .orElseThrow();

        if (admin.getUserId().equals(id)) {
            return ResponseEntity.badRequest()
                    .body("Bạn không thể tự khóa tài khoản của chính mình");
        }

        Users user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        user.setActive(false);
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/unlock")
    public ResponseEntity<?> unlockUser(@PathVariable Integer id) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        user.setActive(true);
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Integer id,
            @Valid @RequestBody com.example.academic_management_api.dto.user.AdminUpdateUserRequest request
    ) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());

        Users saved = userRepository.save(user);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/total-users")
    public ResponseEntity<?> getTotalUsers(Authentication authentication) {
        long totalUsers = userRepository.count();

        return ResponseEntity.ok(
                Map.of("totalUsers", totalUsers)
        );
    }

    @GetMapping("/instructors")
    public List<Users> getAllInstructors() {
        return userRepository.findByRole("INSTRUCTOR");
    }

    @GetMapping("/categories")
    public List<Categories> getAllCategories() {
        return categoryRepository.findAll();
    }

    @GetMapping("/courses")
    public List<Courses> getAllCourses() {
        List<Courses> allCourses = courseRepository.findAll();
        return allCourses;
    }

    @GetMapping("/total-courses")
    public ResponseEntity<?> getTotalCourses(Authentication authentication) {
        long totalCourses = courseRepository.count();

        return ResponseEntity.ok(
                Map.of("totalCourses", totalCourses)
        );
    }

    @PostMapping("/courses/add")
    public ResponseEntity<?> createCourse(
            @Valid @RequestBody CreateCourseRequest request
    ) {
        Users instructor = userRepository.findById(request.getInstructorId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giảng viên"));

        Categories category = null;

        if (request.getCategoryId() == null) {
            return ResponseEntity.badRequest()
                    .body("Danh mục không được để trống");
        }

        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));
        }

        Courses course = new Courses();

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setInstructor(instructor);
        course.setCategory(category);
        course.setThumbnail(request.getThumbnail());
        course.setPrice(request.getPrice());
        course.setLevel(request.getLevel());
        course.setStatus(
                request.getStatus() != null ? request.getStatus() : "draft"
        );

        Courses savedCourse = courseRepository.save(course);

        return ResponseEntity.ok(savedCourse);
    }

    @PutMapping("/courses/{id}")
    public ResponseEntity<?> updateCourse(
            @PathVariable Integer id,
            @Valid @RequestBody CreateCourseRequest request
    ) {
        Courses course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));

        Users instructor = userRepository.findById(request.getInstructorId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giảng viên"));

        if (request.getCategoryId() == null) {
            return ResponseEntity.badRequest()
                    .body("Danh mục không được để trống");
        }

        Categories category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setInstructor(instructor);
        course.setCategory(category);
        course.setThumbnail(request.getThumbnail());
        course.setPrice(request.getPrice());
        course.setLevel(request.getLevel());
        course.setStatus(
                request.getStatus() != null ? request.getStatus() : course.getStatus()
        );

        Courses saved = courseRepository.save(course);

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/categories/add")
    public ResponseEntity<?> createCategory(@Valid @RequestBody CategoryRequest request) {
        Categories category = new Categories();
        category.setCategoryName(request.getCategoryName());
        category.setDescription(request.getDescription());

        Categories saved = categoryRepository.save(category);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable Integer id,
            @Valid @RequestBody CategoryRequest request
    ) {
        Categories category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        category.setCategoryName(request.getCategoryName());
        category.setDescription(request.getDescription());

        Categories saved = categoryRepository.save(category);

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/categories/{id}")
    public void deleteCategory(@PathVariable Integer id) {
        categoryRepository.deleteById(id);
    }

    @GetMapping("/payments")
    public List<Payments> getAllPayments() {
        return paymentRepository.findAll();
    }

    @GetMapping("/total-payments")
    public ResponseEntity<?> getTotalPayments() {
        long totalPayments = paymentRepository.count();

        return ResponseEntity.ok(
                Map.of("totalPayments", totalPayments)
        );
    }

    @DeleteMapping("/deleted-user")
    public void deleteUser(@RequestBody Users user) {
        userRepository.deleteById(user.getUserId());
    }

    @DeleteMapping("/deleted-course/{courseId}")
    public void deleteCourse(@PathVariable Integer courseId) {
        courseRepository.deleteById(courseId);
    }
}
