package com.example.academic_management_api.assessment.controller;

import com.example.academic_management_api.assessment.dto.AttemptResultDto;
import com.example.academic_management_api.assessment.dto.QuizAttemptSummaryDto;
import com.example.academic_management_api.assessment.dto.SubmitAttemptRequest;
import com.example.academic_management_api.assessment.service.QuizService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quiz-attempts")
public class QuizAttemptController {

    private final QuizService quizService;

    public QuizAttemptController(QuizService quizService) {
        this.quizService = quizService;
    }

    @PostMapping
    public ResponseEntity<AttemptResultDto> submit(@Valid @RequestBody SubmitAttemptRequest request, Authentication authentication) {
        return ResponseEntity.ok(quizService.submitAttempt(request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<AttemptResultDto>> getHistory(@RequestParam Integer quizId, Authentication authentication) {
        return ResponseEntity.ok(quizService.getMyAttempts(quizId, authentication.getName()));
    }

    // Phase 28 — Dashboard/LearningProfile: tổng số bài test đã làm + điểm trung bình, gộp trên
    // mọi khóa học (khác getHistory() ở trên vốn cần quizId cụ thể).
    @GetMapping("/me/summary")
    public ResponseEntity<QuizAttemptSummaryDto> getMySummary(Authentication authentication) {
        return ResponseEntity.ok(quizService.getMyAttemptSummary(authentication.getName()));
    }
}
