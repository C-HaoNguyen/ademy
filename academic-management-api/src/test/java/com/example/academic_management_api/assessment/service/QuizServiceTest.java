package com.example.academic_management_api.assessment.service;

import com.example.academic_management_api.assessment.dto.AnswerRequest;
import com.example.academic_management_api.assessment.dto.AttemptResultDto;
import com.example.academic_management_api.assessment.dto.ChoiceRequest;
import com.example.academic_management_api.assessment.dto.QuestionRequest;
import com.example.academic_management_api.assessment.dto.QuizRequest;
import com.example.academic_management_api.assessment.dto.QuizStudentResponseDto;
import com.example.academic_management_api.assessment.dto.StudentChoiceDto;
import com.example.academic_management_api.assessment.dto.SubmitAttemptRequest;
import com.example.academic_management_api.assessment.entity.QuizAttempts;
import com.example.academic_management_api.assessment.entity.QuizChoices;
import com.example.academic_management_api.assessment.entity.QuizQuestions;
import com.example.academic_management_api.assessment.entity.Quizzes;
import com.example.academic_management_api.assessment.repository.QuizAttemptRepository;
import com.example.academic_management_api.assessment.repository.QuizChoiceRepository;
import com.example.academic_management_api.assessment.repository.QuizQuestionRepository;
import com.example.academic_management_api.assessment.repository.QuizRepository;
import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.common.exception.ForbiddenException;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.lesson.entity.LessonContentType;
import com.example.academic_management_api.course.lesson.entity.Lessons;
import com.example.academic_management_api.course.lesson.service.LessonService;
import com.example.academic_management_api.course.service.CourseService;
import com.example.academic_management_api.enrollment.service.EnrollmentService;
import com.example.academic_management_api.user.entity.Role;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuizServiceTest {

    @Mock
    private QuizRepository quizRepository;
    @Mock
    private QuizQuestionRepository questionRepository;
    @Mock
    private QuizChoiceRepository choiceRepository;
    @Mock
    private QuizAttemptRepository attemptRepository;
    @Mock
    private CourseService courseService;
    @Mock
    private LessonService lessonService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EnrollmentService enrollmentService;

    private QuizService quizService;

    @BeforeEach
    void setUp() {
        quizService = new QuizService(
                quizRepository, questionRepository, choiceRepository, attemptRepository,
                courseService, lessonService, userRepository, enrollmentService
        );
    }

    private Users user(int id, String username) {
        Users u = new Users();
        u.setUserId(id);
        u.setUsername(username);
        u.setRole(Role.STUDENT);
        return u;
    }

    private Courses course(int id) {
        Courses c = new Courses();
        c.setCourseId(id);
        return c;
    }

    private Lessons lesson(int id, Courses course, LessonContentType contentType, boolean preview) {
        Lessons l = new Lessons();
        l.setLessonId(id);
        l.setCourse(course);
        l.setContentType(contentType);
        l.setPreview(preview);
        return l;
    }

    private QuizChoices choice(int id, QuizQuestions question, boolean correct) {
        QuizChoices c = new QuizChoices();
        c.setId(id);
        c.setQuestion(question);
        c.setCorrect(correct);
        return c;
    }

    // ---- Teacher ownership (delegated to CourseService/LessonService) ----

    @Test
    void getOwnCourseQuiz_notOwner_throwsForbiddenAndDoesNotTouchQuizRepository() {
        when(courseService.getOwnCourseDetail(10, "teacherB"))
                .thenThrow(new ForbiddenException("Bạn không có quyền thao tác trên khóa học này"));

        assertThatThrownBy(() -> quizService.getOwnCourseQuiz(10, "teacherB"))
                .isInstanceOf(ForbiddenException.class);

        verifyNoInteractions(quizRepository);
    }

    @Test
    void getOwnLessonQuiz_lessonNotQuizType_throwsConflict() {
        Lessons lesson = lesson(1, course(10), LessonContentType.VIDEO, false);
        when(lessonService.getOwnedLesson(10, 1, "teacherA")).thenReturn(lesson);

        assertThatThrownBy(() -> quizService.getOwnLessonQuiz(10, 1, "teacherA"))
                .isInstanceOf(ConflictException.class);

        verifyNoInteractions(quizRepository);
    }

    // ---- Teacher save: validation + race condition ----

    @Test
    void saveOwnCourseQuiz_questionWithNoCorrectChoice_throwsConflictAndDoesNotDeleteExistingQuestions() {
        Courses course = course(10);
        when(courseService.getOwnCourseDetail(10, "teacherA")).thenReturn(course);
        when(quizRepository.findByCourse_CourseId(10)).thenReturn(Optional.empty());

        ChoiceRequest wrongOnly = choiceRequest("Sai", false, 1);
        QuestionRequest question = questionRequest("2+2=?", 1, List.of(wrongOnly));
        QuizRequest request = quizRequest("Final test", List.of(question));

        assertThatThrownBy(() -> quizService.saveOwnCourseQuiz(10, request, "teacherA"))
                .isInstanceOf(ConflictException.class);

        verify(questionRepository, never()).deleteByQuiz_Id(anyInt());
    }

    @Test
    void saveOwnCourseQuiz_concurrentInsertRace_throwsConflictInsteadOf500() {
        Courses course = course(10);
        when(courseService.getOwnCourseDetail(10, "teacherA")).thenReturn(course);
        when(quizRepository.findByCourse_CourseId(10)).thenReturn(Optional.empty());
        when(quizRepository.save(any(Quizzes.class)))
                .thenThrow(new DataIntegrityViolationException("unique constraint violated"));

        QuizRequest request = quizRequest("Final test",
                List.of(questionRequest("2+2=?", 1, List.of(choiceRequest("4", true, 1)))));

        assertThatThrownBy(() -> quizService.saveOwnCourseQuiz(10, request, "teacherA"))
                .isInstanceOf(ConflictException.class);
    }

    // ---- Student access control ----

    @Test
    void getCourseQuizForStudent_notEnrolled_throwsForbidden() {
        Users student = user(5, "student1");
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(courseService.getClassDetail(10)).thenReturn(course(10));
        when(enrollmentService.isEnrolled(5, 10)).thenReturn(false);

        assertThatThrownBy(() -> quizService.getCourseQuizForStudent(10, "student1"))
                .isInstanceOf(ForbiddenException.class);

        verifyNoInteractions(quizRepository);
    }

    @Test
    void getCourseQuizForStudent_enrolled_returnsDtoWithoutLeakingCorrectAnswer() {
        Users student = user(5, "student1");
        Quizzes quiz = new Quizzes();
        quiz.setId(100);
        quiz.setTitle("Final test");
        quiz.setCourse(course(10));

        QuizQuestions question = new QuizQuestions();
        question.setId(1);
        question.setQuestionText("2+2=?");
        question.setOrderIndex(1);

        QuizChoices correctChoice = choice(1, question, true);
        correctChoice.setChoiceText("4");
        correctChoice.setOrderIndex(1);

        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(courseService.getClassDetail(10)).thenReturn(course(10));
        when(enrollmentService.isEnrolled(5, 10)).thenReturn(true);
        when(quizRepository.findByCourse_CourseId(10)).thenReturn(Optional.of(quiz));
        when(questionRepository.findByQuiz_IdOrderByOrderIndexAsc(100)).thenReturn(List.of(question));
        when(choiceRepository.findByQuestion_IdInOrderByOrderIndexAsc(List.of(1))).thenReturn(List.of(correctChoice));

        QuizStudentResponseDto dto = quizService.getCourseQuizForStudent(10, "student1");

        assertThat(dto.getQuestions()).hasSize(1);
        StudentChoiceDto choiceDto = dto.getQuestions().get(0).getChoices().get(0);
        assertThat(choiceDto.getChoiceText()).isEqualTo("4");
        // Student-view DTO không có field/method nào tên "correct" -> đáp án đúng không thể lộ dù
        // Jackson serialize toàn bộ object.
        boolean hasCorrectField = List.of(StudentChoiceDto.class.getDeclaredMethods()).stream()
                .anyMatch(m -> m.getName().toLowerCase().contains("correct"));
        assertThat(hasCorrectField).isFalse();
    }

    @Test
    void getLessonQuizForStudent_lessonContentTypeChangedAwayFromQuiz_throwsNotFound() {
        Users student = user(5, "student1");
        Lessons lesson = lesson(1, course(10), LessonContentType.VIDEO, false);

        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(lessonService.getLessonWithCourse(1)).thenReturn(lesson);
        when(enrollmentService.isEnrolled(5, 10)).thenReturn(true);

        assertThatThrownBy(() -> quizService.getLessonQuizForStudent(1, "student1"))
                .isInstanceOf(NotFoundException.class);

        verifyNoInteractions(quizRepository);
    }

    // ---- Auto-grading ----

    @Test
    void submitAttempt_mixOfCorrectAndWrongAnswers_scoresCorrectly() {
        Users student = user(5, "student1");
        Courses course = course(10);

        Quizzes quiz = new Quizzes();
        quiz.setId(100);
        quiz.setCourse(course);

        QuizQuestions q1 = new QuizQuestions();
        q1.setId(1);
        QuizQuestions q2 = new QuizQuestions();
        q2.setId(2);

        QuizChoices correctForQ1 = choice(11, q1, true);
        QuizChoices correctForQ2 = choice(33, q2, true); // học viên chọn 22 (sai) cho q2, không phải 33

        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(quizRepository.findById(100)).thenReturn(Optional.of(quiz));
        when(enrollmentService.isEnrolled(5, 10)).thenReturn(true);
        when(questionRepository.findByQuiz_IdOrderByOrderIndexAsc(100)).thenReturn(List.of(q1, q2));
        when(choiceRepository.findByQuestion_IdInAndIsCorrectTrue(List.of(1, 2)))
                .thenReturn(List.of(correctForQ1, correctForQ2));
        when(attemptRepository.save(any(QuizAttempts.class))).thenAnswer(inv -> {
            QuizAttempts a = inv.getArgument(0);
            a.setId(999);
            return a;
        });

        SubmitAttemptRequest request = new SubmitAttemptRequest();
        setField(request, "quizId", 100);
        setField(request, "answers", List.of(answer(1, 11), answer(2, 22)));

        AttemptResultDto result = quizService.submitAttempt(request, "student1");

        assertThat(result.getCorrectCount()).isEqualTo(1);
        assertThat(result.getTotalQuestions()).isEqualTo(2);
        assertThat(result.getScore()).isEqualByComparingTo(BigDecimal.valueOf(50.00));
    }

    @Test
    void submitAttempt_choiceCorrectForDifferentQuestion_isNotCountedAsCorrect() {
        // choiceId đúng cho q2 nhưng học viên gán nó cho q1 -> không được tính đúng, dù id trùng
        // với 1 đáp án đúng "ở đâu đó" trong quiz. Đây là guard tránh regression khi batch query
        // theo quizId thay vì existsByIdAndQuestion_Id (per-question) như code cũ.
        Users student = user(5, "student1");
        Courses course = course(10);

        Quizzes quiz = new Quizzes();
        quiz.setId(100);
        quiz.setCourse(course);

        QuizQuestions q1 = new QuizQuestions();
        q1.setId(1);
        QuizQuestions q2 = new QuizQuestions();
        q2.setId(2);

        QuizChoices correctForQ2 = choice(50, q2, true);

        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(quizRepository.findById(100)).thenReturn(Optional.of(quiz));
        when(enrollmentService.isEnrolled(5, 10)).thenReturn(true);
        when(questionRepository.findByQuiz_IdOrderByOrderIndexAsc(100)).thenReturn(List.of(q1, q2));
        when(choiceRepository.findByQuestion_IdInAndIsCorrectTrue(List.of(1, 2)))
                .thenReturn(List.of(correctForQ2));
        when(attemptRepository.save(any(QuizAttempts.class))).thenAnswer(inv -> {
            QuizAttempts a = inv.getArgument(0);
            a.setId(999);
            return a;
        });

        SubmitAttemptRequest request = new SubmitAttemptRequest();
        setField(request, "quizId", 100);
        // choiceId=50 đúng cho q2, nhưng ở đây bị gán trả lời cho q1
        setField(request, "answers", List.of(answer(1, 50)));

        AttemptResultDto result = quizService.submitAttempt(request, "student1");

        assertThat(result.getCorrectCount()).isEqualTo(0);
    }

    @Test
    void submitAttempt_answerForQuestionNotInQuiz_isIgnoredNotCounted() {
        Users student = user(5, "student1");
        Courses course = course(10);

        Quizzes quiz = new Quizzes();
        quiz.setId(100);
        quiz.setCourse(course);

        QuizQuestions q1 = new QuizQuestions();
        q1.setId(1);

        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(quizRepository.findById(100)).thenReturn(Optional.of(quiz));
        when(enrollmentService.isEnrolled(5, 10)).thenReturn(true);
        when(questionRepository.findByQuiz_IdOrderByOrderIndexAsc(100)).thenReturn(List.of(q1));
        when(choiceRepository.findByQuestion_IdInAndIsCorrectTrue(List.of(1))).thenReturn(List.of());
        when(attemptRepository.save(any(QuizAttempts.class))).thenAnswer(inv -> {
            QuizAttempts a = inv.getArgument(0);
            a.setId(999);
            return a;
        });

        SubmitAttemptRequest request = new SubmitAttemptRequest();
        setField(request, "quizId", 100);
        // questionId=999 không thuộc quiz này -> bị bỏ qua, không match q1 (id=1)
        setField(request, "answers", List.of(answer(999, 1)));

        AttemptResultDto result = quizService.submitAttempt(request, "student1");

        assertThat(result.getCorrectCount()).isEqualTo(0);
        assertThat(result.getTotalQuestions()).isEqualTo(1);
    }

    @Test
    void submitAttempt_studentNotEnrolled_throwsForbiddenAndDoesNotPersist() {
        Users student = user(5, "student1");
        Courses course = course(10);

        Quizzes quiz = new Quizzes();
        quiz.setId(100);
        quiz.setCourse(course);

        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(quizRepository.findById(100)).thenReturn(Optional.of(quiz));
        when(enrollmentService.isEnrolled(5, 10)).thenReturn(false);

        SubmitAttemptRequest request = new SubmitAttemptRequest();
        setField(request, "quizId", 100);
        setField(request, "answers", List.of(answer(1, 11)));

        assertThatThrownBy(() -> quizService.submitAttempt(request, "student1"))
                .isInstanceOf(ForbiddenException.class);

        verifyNoInteractions(attemptRepository);
    }

    @Test
    void submitAttempt_lessonQuizContentTypeChangedAway_throwsNotFoundAndDoesNotPersist() {
        Users student = user(5, "student1");
        Lessons lesson = lesson(1, course(10), LessonContentType.DOCUMENT, false);

        Quizzes quiz = new Quizzes();
        quiz.setId(100);
        quiz.setLesson(lesson);

        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(quizRepository.findById(100)).thenReturn(Optional.of(quiz));

        SubmitAttemptRequest request = new SubmitAttemptRequest();
        setField(request, "quizId", 100);
        setField(request, "answers", List.of(answer(1, 11)));

        assertThatThrownBy(() -> quizService.submitAttempt(request, "student1"))
                .isInstanceOf(NotFoundException.class);

        verifyNoInteractions(attemptRepository);
    }

    @Test
    void getMyAttempts_returnsHistoryFromRepositoryAsIs() {
        Users student = user(5, "student1");
        Quizzes quiz = new Quizzes();
        quiz.setId(100);

        QuizAttempts newer = new QuizAttempts();
        newer.setId(2);
        newer.setQuiz(quiz);
        newer.setScore(BigDecimal.valueOf(80));
        newer.setCorrectCount(4);
        newer.setTotalQuestions(5);

        QuizAttempts older = new QuizAttempts();
        older.setId(1);
        older.setQuiz(quiz);
        older.setScore(BigDecimal.valueOf(60));
        older.setCorrectCount(3);
        older.setTotalQuestions(5);

        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(attemptRepository.findByQuiz_IdAndStudent_UserIdOrderBySubmittedAtDesc(100, 5))
                .thenReturn(List.of(newer, older));

        List<AttemptResultDto> history = quizService.getMyAttempts(100, "student1");

        assertThat(history).hasSize(2);
        assertThat(history.get(0).getAttemptId()).isEqualTo(2);
        assertThat(history.get(1).getAttemptId()).isEqualTo(1);
    }

    private AnswerRequest answer(int questionId, int choiceId) {
        AnswerRequest a = new AnswerRequest();
        setField(a, "questionId", questionId);
        setField(a, "choiceId", choiceId);
        return a;
    }

    private ChoiceRequest choiceRequest(String text, boolean correct, int orderIndex) {
        ChoiceRequest c = new ChoiceRequest();
        setField(c, "choiceText", text);
        setField(c, "isCorrect", correct);
        setField(c, "orderIndex", orderIndex);
        return c;
    }

    private QuestionRequest questionRequest(String text, int orderIndex, List<ChoiceRequest> choices) {
        QuestionRequest q = new QuestionRequest();
        setField(q, "questionText", text);
        setField(q, "orderIndex", orderIndex);
        setField(q, "choices", choices);
        return q;
    }

    private QuizRequest quizRequest(String title, List<QuestionRequest> questions) {
        QuizRequest r = new QuizRequest();
        setField(r, "title", title);
        setField(r, "questions", questions);
        return r;
    }

    private void setField(Object target, String fieldName, Object value) {
        try {
            var field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }
}
