package com.example.academic_management_api.assessment.service;

import com.example.academic_management_api.assessment.dto.*;
import com.example.academic_management_api.audit.annotation.Audited;
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
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizChoiceRepository choiceRepository;
    private final QuizAttemptRepository attemptRepository;
    private final CourseService courseService;
    private final LessonService lessonService;
    private final UserRepository userRepository;
    private final EnrollmentService enrollmentService;

    public QuizService(
            QuizRepository quizRepository,
            QuizQuestionRepository questionRepository,
            QuizChoiceRepository choiceRepository,
            QuizAttemptRepository attemptRepository,
            CourseService courseService,
            LessonService lessonService,
            UserRepository userRepository,
            EnrollmentService enrollmentService
    ) {
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.choiceRepository = choiceRepository;
        this.attemptRepository = attemptRepository;
        this.courseService = courseService;
        this.lessonService = lessonService;
        this.userRepository = userRepository;
        this.enrollmentService = enrollmentService;
    }

    // ---- shared helpers ----

    private Users getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    // Ownership check (course + lesson) đã có sẵn ở CourseService/LessonService — chỉ thêm ràng buộc
    // riêng của assessment (lesson phải đang là content_type=QUIZ) trên kết quả trả về từ đó.
    private Lessons getOwnedQuizLesson(Integer courseId, Integer lessonId, String username) {
        Lessons lesson = lessonService.getOwnedLesson(courseId, lessonId, username);
        if (lesson.getContentType() != LessonContentType.QUIZ) {
            throw new ConflictException("Lesson này không phải loại quiz");
        }
        return lesson;
    }

    private void validateHasCorrectChoice(QuizRequest request) {
        for (QuestionRequest questionRequest : request.getQuestions()) {
            boolean hasCorrectChoice = questionRequest.getChoices().stream()
                    .anyMatch(ChoiceRequest::getIsCorrect);
            if (!hasCorrectChoice) {
                throw new ConflictException(
                        "Câu hỏi \"" + questionRequest.getQuestionText() + "\" chưa có đáp án đúng");
            }
        }
    }

    private Quizzes replaceQuizContent(Quizzes quiz, QuizRequest request) {
        validateHasCorrectChoice(request);

        quiz.setTitle(request.getTitle());
        Quizzes savedQuiz = quizRepository.save(quiz);

        questionRepository.deleteByQuiz_Id(savedQuiz.getId());

        for (QuestionRequest questionRequest : request.getQuestions()) {
            QuizQuestions question = new QuizQuestions();
            question.setQuiz(savedQuiz);
            question.setQuestionText(questionRequest.getQuestionText());
            question.setOrderIndex(questionRequest.getOrderIndex());
            QuizQuestions savedQuestion = questionRepository.save(question);

            for (ChoiceRequest choiceRequest : questionRequest.getChoices()) {
                QuizChoices choice = new QuizChoices();
                choice.setQuestion(savedQuestion);
                choice.setChoiceText(choiceRequest.getChoiceText());
                choice.setCorrect(choiceRequest.getIsCorrect());
                choice.setOrderIndex(choiceRequest.getOrderIndex());
                choiceRepository.save(choice);
            }
        }

        return savedQuiz;
    }

    private Map<Integer, List<QuizChoices>> groupChoicesByQuestion(List<QuizQuestions> questions) {
        if (questions.isEmpty()) {
            return Map.of();
        }
        List<Integer> questionIds = questions.stream().map(QuizQuestions::getId).toList();
        return choiceRepository.findByQuestion_IdInOrderByOrderIndexAsc(questionIds)
                .stream()
                .collect(Collectors.groupingBy(c -> c.getQuestion().getId()));
    }

    private QuizTeacherResponseDto toTeacherDto(Quizzes quiz) {
        List<QuizQuestions> questions = questionRepository.findByQuiz_IdOrderByOrderIndexAsc(quiz.getId());
        Map<Integer, List<QuizChoices>> choicesByQuestion = groupChoicesByQuestion(questions);
        List<TeacherQuestionDto> questionDtos = questions.stream()
                .map(q -> new TeacherQuestionDto(
                        q,
                        choicesByQuestion.getOrDefault(q.getId(), List.of())
                                .stream()
                                .map(TeacherChoiceDto::new)
                                .toList()
                ))
                .toList();
        return new QuizTeacherResponseDto(quiz, questionDtos);
    }

    private QuizStudentResponseDto toStudentDto(Quizzes quiz) {
        List<QuizQuestions> questions = questionRepository.findByQuiz_IdOrderByOrderIndexAsc(quiz.getId());
        Map<Integer, List<QuizChoices>> choicesByQuestion = groupChoicesByQuestion(questions);
        List<StudentQuestionDto> questionDtos = questions.stream()
                .map(q -> new StudentQuestionDto(
                        q,
                        choicesByQuestion.getOrDefault(q.getId(), List.of())
                                .stream()
                                .map(StudentChoiceDto::new)
                                .toList()
                ))
                .toList();
        return new QuizStudentResponseDto(quiz, questionDtos);
    }

    // ---- Teacher: course quiz (test tổng) ----

    public QuizTeacherResponseDto getOwnCourseQuiz(Integer courseId, String username) {
        courseService.getOwnCourseDetail(courseId, username);
        Quizzes quiz = quizRepository.findByCourse_CourseId(courseId)
                .orElseThrow(() -> new NotFoundException("Khóa học chưa có quiz"));
        return toTeacherDto(quiz);
    }

    @Audited(action = "TEACHER_QUIZ_SAVE", targetType = "QUIZ", targetIdExpression = "#result.id")
    @Transactional
    public QuizTeacherResponseDto saveOwnCourseQuiz(Integer courseId, QuizRequest request, String username) {
        Courses course = courseService.getOwnCourseDetail(courseId, username);
        Quizzes quiz = quizRepository.findByCourse_CourseId(courseId).orElseGet(() -> {
            Quizzes q = new Quizzes();
            q.setCourse(course);
            return q;
        });
        try {
            Quizzes saved = replaceQuizContent(quiz, request);
            return toTeacherDto(saved);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Quiz của khóa học này đang được lưu bởi request khác, vui lòng thử lại");
        }
    }

    @Audited(action = "TEACHER_QUIZ_DELETE", targetType = "COURSE", targetIdExpression = "#courseId")
    @Transactional
    public void deleteOwnCourseQuiz(Integer courseId, String username) {
        courseService.getOwnCourseDetail(courseId, username);
        Quizzes quiz = quizRepository.findByCourse_CourseId(courseId)
                .orElseThrow(() -> new NotFoundException("Khóa học chưa có quiz"));
        quizRepository.delete(quiz);
    }

    // ---- Teacher: lesson quiz ----

    public QuizTeacherResponseDto getOwnLessonQuiz(Integer courseId, Integer lessonId, String username) {
        Lessons lesson = getOwnedQuizLesson(courseId, lessonId, username);
        Quizzes quiz = quizRepository.findByLesson_LessonId(lesson.getLessonId())
                .orElseThrow(() -> new NotFoundException("Lesson chưa có quiz"));
        return toTeacherDto(quiz);
    }

    @Audited(action = "TEACHER_QUIZ_SAVE", targetType = "QUIZ", targetIdExpression = "#result.id")
    @Transactional
    public QuizTeacherResponseDto saveOwnLessonQuiz(Integer courseId, Integer lessonId, QuizRequest request, String username) {
        Lessons lesson = getOwnedQuizLesson(courseId, lessonId, username);
        Quizzes quiz = quizRepository.findByLesson_LessonId(lesson.getLessonId()).orElseGet(() -> {
            Quizzes q = new Quizzes();
            q.setLesson(lesson);
            return q;
        });
        try {
            Quizzes saved = replaceQuizContent(quiz, request);
            return toTeacherDto(saved);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Quiz của lesson này đang được lưu bởi request khác, vui lòng thử lại");
        }
    }

    @Audited(action = "TEACHER_QUIZ_DELETE", targetType = "LESSON", targetIdExpression = "#lessonId")
    @Transactional
    public void deleteOwnLessonQuiz(Integer courseId, Integer lessonId, String username) {
        Lessons lesson = getOwnedQuizLesson(courseId, lessonId, username);
        Quizzes quiz = quizRepository.findByLesson_LessonId(lesson.getLessonId())
                .orElseThrow(() -> new NotFoundException("Lesson chưa có quiz"));
        quizRepository.delete(quiz);
    }

    // ---- Student ----

    public QuizStudentResponseDto getCourseQuizForStudent(Integer courseId, String username) {
        Users student = getUser(username);
        if (courseService.getClassDetail(courseId) == null) {
            throw new NotFoundException("Không tìm thấy khóa học");
        }
        if (!enrollmentService.isEnrolled(student.getUserId(), courseId)) {
            throw new ForbiddenException("Bạn chưa mua khóa học này");
        }
        Quizzes quiz = quizRepository.findByCourse_CourseId(courseId)
                .orElseThrow(() -> new NotFoundException("Khóa học chưa có bài test"));
        return toStudentDto(quiz);
    }

    public QuizStudentResponseDto getLessonQuizForStudent(Integer lessonId, String username) {
        Users student = getUser(username);
        Lessons lesson = lessonService.getLessonWithCourse(lessonId);
        Integer courseId = lesson.getCourse().getCourseId();
        boolean allowed = Boolean.TRUE.equals(lesson.getPreview())
                || enrollmentService.isEnrolled(student.getUserId(), courseId);
        if (!allowed) {
            throw new ForbiddenException("Bạn chưa mua khóa học này");
        }
        if (lesson.getContentType() != LessonContentType.QUIZ) {
            throw new NotFoundException("Lesson chưa có bài test");
        }
        Quizzes quiz = quizRepository.findByLesson_LessonId(lessonId)
                .orElseThrow(() -> new NotFoundException("Lesson chưa có bài test"));
        return toStudentDto(quiz);
    }

    @Transactional
    public AttemptResultDto submitAttempt(SubmitAttemptRequest request, String username) {
        Users student = getUser(username);
        Quizzes quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy quiz"));

        boolean allowed;
        if (quiz.getCourse() != null) {
            allowed = enrollmentService.isEnrolled(student.getUserId(), quiz.getCourse().getCourseId());
        } else {
            Lessons lesson = quiz.getLesson();
            if (lesson.getContentType() != LessonContentType.QUIZ) {
                throw new NotFoundException("Không tìm thấy quiz");
            }
            allowed = Boolean.TRUE.equals(lesson.getPreview())
                    || enrollmentService.isEnrolled(student.getUserId(), lesson.getCourse().getCourseId());
        }
        if (!allowed) {
            throw new ForbiddenException("Bạn chưa mua khóa học này");
        }

        List<QuizQuestions> questions = questionRepository.findByQuiz_IdOrderByOrderIndexAsc(quiz.getId());
        if (questions.isEmpty()) {
            throw new ConflictException("Quiz chưa có câu hỏi");
        }

        Map<Integer, Integer> submittedAnswers = request.getAnswers().stream()
                .collect(Collectors.toMap(AnswerRequest::getQuestionId, AnswerRequest::getChoiceId, (a, b) -> b));

        List<Integer> questionIds = questions.stream().map(QuizQuestions::getId).toList();
        Map<Integer, Set<Integer>> correctChoiceIdsByQuestion = choiceRepository
                .findByQuestion_IdInAndIsCorrectTrue(questionIds)
                .stream()
                .collect(Collectors.groupingBy(
                        c -> c.getQuestion().getId(),
                        Collectors.mapping(QuizChoices::getId, Collectors.toSet())
                ));

        int correctCount = 0;
        for (QuizQuestions question : questions) {
            Integer chosenChoiceId = submittedAnswers.get(question.getId());
            if (chosenChoiceId == null) {
                continue;
            }
            Set<Integer> correctChoiceIds = correctChoiceIdsByQuestion.getOrDefault(question.getId(), Set.of());
            if (correctChoiceIds.contains(chosenChoiceId)) {
                correctCount++;
            }
        }

        int total = questions.size();
        BigDecimal score = BigDecimal.valueOf(correctCount)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);

        QuizAttempts attempt = new QuizAttempts();
        attempt.setQuiz(quiz);
        attempt.setStudent(student);
        attempt.setScore(score);
        attempt.setCorrectCount(correctCount);
        attempt.setTotalQuestions(total);

        QuizAttempts saved = attemptRepository.save(attempt);
        return new AttemptResultDto(saved);
    }

    public List<AttemptResultDto> getMyAttempts(Integer quizId, String username) {
        Users student = getUser(username);
        return attemptRepository.findByQuiz_IdAndStudent_UserIdOrderBySubmittedAtDesc(quizId, student.getUserId())
                .stream()
                .map(AttemptResultDto::new)
                .toList();
    }
}
