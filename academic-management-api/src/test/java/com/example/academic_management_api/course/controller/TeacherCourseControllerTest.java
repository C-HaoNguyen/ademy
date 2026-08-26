package com.example.academic_management_api.course.controller;

import com.example.academic_management_api.application.port.ObjectStoragePort;
import com.example.academic_management_api.common.exception.ForbiddenException;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.dto.PresignVideoRequest;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.service.CourseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeacherCourseControllerTest {

    @Mock
    private CourseService courseService;
    @Mock
    private ObjectStoragePort objectStoragePort;
    @Mock
    private Authentication authentication;

    private TeacherCourseController controller;

    @BeforeEach
    void setUp() {
        controller = new TeacherCourseController(courseService, objectStoragePort);
        lenientAuthUsername();
    }

    private void lenientAuthUsername() {
        org.mockito.Mockito.lenient().when(authentication.getName()).thenReturn("teacher1");
    }

    private PresignVideoRequest request(String contentType) {
        return new PresignVideoRequest(contentType);
    }

    @Test
    void presignLessonVideo_notOwner_propagatesForbidden() {
        when(courseService.getOwnCourseDetail(1, "teacher1"))
                .thenThrow(new ForbiddenException("Bạn không có quyền thao tác trên khóa học này"));

        assertThatThrownBy(() -> controller.presignLessonVideo(1, 2, request("video/mp4"), authentication))
                .isInstanceOf(ForbiddenException.class);

        verifyNoInteractions(objectStoragePort);
    }

    @Test
    void presignLessonVideo_courseNotFound_propagatesNotFound() {
        when(courseService.getOwnCourseDetail(1, "teacher1"))
                .thenThrow(new NotFoundException("Không tìm thấy khóa học"));

        assertThatThrownBy(() -> controller.presignLessonVideo(1, 2, request("video/mp4"), authentication))
                .isInstanceOf(NotFoundException.class);

        verifyNoInteractions(objectStoragePort);
    }

    @Test
    void presignLessonVideo_owner_returnsPresignedUploadFromPort() {
        when(courseService.getOwnCourseDetail(1, "teacher1")).thenReturn(new Courses());
        ObjectStoragePort.PresignedUpload upload = new ObjectStoragePort.PresignedUpload(
                "https://r2.example.com/upload?sig=abc",
                "courses/1/lessons/2/video/generated-key",
                "https://videos.example.com/courses/1/lessons/2/video/generated-key",
                Instant.now().plusSeconds(900)
        );
        when(objectStoragePort.generatePresignedUploadUrl(anyString(), eq("video/mp4"))).thenReturn(upload);

        ResponseEntity<?> response = controller.presignLessonVideo(1, 2, request("video/mp4"), authentication);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        verify(objectStoragePort).generatePresignedUploadUrl(keyCaptor.capture(), eq("video/mp4"));
        assertThat(keyCaptor.getValue()).startsWith("courses/1/lessons/2/video/");
    }
}
