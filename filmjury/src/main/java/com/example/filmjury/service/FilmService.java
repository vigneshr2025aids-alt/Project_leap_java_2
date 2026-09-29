package com.example.filmjury.service;

import com.example.filmjury.model.Entry;
import com.example.filmjury.model.Judge;
import com.example.filmjury.model.ScoreCard;
import com.example.filmjury.repository.EntryRepository;
import com.example.filmjury.repository.JudgeRepository;
import com.example.filmjury.model.Criterion;
import com.example.filmjury.repository.CriterionRepository;
import com.example.filmjury.repository.ScoreCardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FilmService {
    @Autowired
    private EntryRepository entryRepository;

    @Autowired
    private JudgeRepository judgeRepository;

    @Autowired
    private ScoreCardRepository scoreCardRepository;

    @Autowired
    private CriterionRepository criterionRepository;

    @Transactional
    public void assignJudgeToEntry(Long entryId, Long judgeId) {
        Entry entry = entryRepository.findById(entryId).orElseThrow();
        Judge judge = judgeRepository.findById(judgeId).orElseThrow();
        entry.getAssignedJudges().add(judge);
        entryRepository.save(entry);
    }

    @Transactional
    public ScoreCard submitScoreCard(ScoreCard scoreCard) {
        // Validate if judge is assigned and hasn't already submitted
        Long entryId = scoreCard.getEntry().getId();
        Long judgeId = scoreCard.getJudge().getId();

        Entry entry = entryRepository.findById(entryId).orElseThrow();
        boolean isAssigned = entry.getAssignedJudges().stream().anyMatch(j -> j.getId().equals(judgeId));
        if (!isAssigned) {
            throw new RuntimeException("Judge is not assigned to this entry");
        }

        if (scoreCardRepository.findByEntryIdAndJudgeId(entryId, judgeId).isPresent()) {
            throw new RuntimeException("Judge has already submitted a scorecard for this entry");
        }

        // Calculate total score for the card
        int totalScore = scoreCard.getCriteriaScores().values().stream().mapToInt(Integer::intValue).sum();
        scoreCard.setTotalScore(totalScore);

        ScoreCard savedCard = scoreCardRepository.save(scoreCard);

        // Recalculate average score for the entry
        recalculateEntryFinalScore(entryId);

        return savedCard;
    }

    public void recalculateEntryFinalScore(Long entryId) {
        List<ScoreCard> scoreCards = scoreCardRepository.findByEntryId(entryId);
        if (!scoreCards.isEmpty()) {
            Map<Long, Criterion> criteriaMap = criterionRepository.findAll().stream()
                    .collect(Collectors.toMap(Criterion::getId, c -> c, (c1, c2) -> c1));

            List<Double> allNormalizedScores = new ArrayList<>();
            for (ScoreCard card : scoreCards) {
                if (card.getCriteriaScores() != null) {
                    for (Map.Entry<Long, Integer> entryScore : card.getCriteriaScores().entrySet()) {
                        Criterion criterion = criteriaMap.get(entryScore.getKey());
                        int maxScore = (criterion != null && criterion.getMaxScore() != null && criterion.getMaxScore() > 0)
                                ? criterion.getMaxScore()
                                : 10;
                        double normalized = ((double) entryScore.getValue() / maxScore) * 10.0;
                        allNormalizedScores.add(normalized);
                    }
                }
            }

            double avgScore = allNormalizedScores.stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.0);

            avgScore = Math.round(avgScore * 100.0) / 100.0;

            Entry entry = entryRepository.findById(entryId).orElseThrow();
            entry.setFinalScore(avgScore);
            entry.setSubmissionStatus("EVALUATED");
            entryRepository.save(entry);
        }
    }

}
