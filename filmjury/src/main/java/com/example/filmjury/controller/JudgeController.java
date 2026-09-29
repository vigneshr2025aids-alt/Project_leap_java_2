package com.example.filmjury.controller;

import com.example.filmjury.model.Judge;
import com.example.filmjury.repository.JudgeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/judges")
public class JudgeController {
    
    @Autowired
    private JudgeRepository judgeRepository;

    @GetMapping
    public List<Judge> getAllJudges() {
        return judgeRepository.findAll();
    }

    @PostMapping
    public Judge createJudge(@RequestBody Judge judge) {
        return judgeRepository.save(judge);
    }
}
