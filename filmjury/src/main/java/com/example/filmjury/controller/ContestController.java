package com.example.filmjury.controller;

import com.example.filmjury.model.ScoreCard;
import com.example.filmjury.service.FilmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contest")
public class ContestController {
    
    @Autowired
    private FilmService filmService;

    @PostMapping("/assign-judge")
    public ResponseEntity<String> assignJudge(@RequestParam Long entryId, @RequestParam Long judgeId) {
        filmService.assignJudgeToEntry(entryId, judgeId);
        return ResponseEntity.ok("Judge assigned successfully");
    }

    @PostMapping("/submit-score")
    public ResponseEntity<?> submitScoreCard(@RequestBody ScoreCard scoreCard) {
        try {
            ScoreCard savedCard = filmService.submitScoreCard(scoreCard);
            return ResponseEntity.ok(savedCard);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
