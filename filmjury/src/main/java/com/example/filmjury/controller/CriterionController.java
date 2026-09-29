package com.example.filmjury.controller;

import com.example.filmjury.model.Criterion;
import com.example.filmjury.model.ScoreCard;
import com.example.filmjury.repository.CriterionRepository;
import com.example.filmjury.repository.ScoreCardRepository;
import com.example.filmjury.service.FilmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/criteria")
public class CriterionController {
    
    @Autowired
    private CriterionRepository criterionRepository;

    @Autowired
    private ScoreCardRepository scoreCardRepository;

    @Autowired
    private FilmService filmService;

    @GetMapping
    public List<Criterion> getAllCriteria() {
        return criterionRepository.findAll();
    }

    @PostMapping
    public Criterion createCriterion(@RequestBody Criterion criterion) {
        return criterionRepository.save(criterion);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Criterion> updateCriterion(@PathVariable Long id, @RequestBody Criterion updated) {
        return criterionRepository.findById(id)
                .map(existing -> {
                    existing.setName(updated.getName());
                    existing.setDescription(updated.getDescription());
                    existing.setMaxScore(updated.getMaxScore());
                    Criterion saved = criterionRepository.save(existing);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteCriterion(@PathVariable Long id) {
        if (!criterionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        try {
            // Clean up any scorecard references to this criterion
            List<ScoreCard> scoreCards = scoreCardRepository.findAll();
            for (ScoreCard card : scoreCards) {
                if (card.getCriteriaScores() != null && card.getCriteriaScores().containsKey(id)) {
                    card.getCriteriaScores().remove(id);
                    int newTotal = card.getCriteriaScores().values().stream().mapToInt(Integer::intValue).sum();
                    card.setTotalScore(newTotal);
                    scoreCardRepository.save(card);
                    if (card.getEntry() != null) {
                        filmService.recalculateEntryFinalScore(card.getEntry().getId());
                    }
                }
            }
            criterionRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Cannot delete criterion: it is currently referenced by existing scorecards.");
        }
    }
}
