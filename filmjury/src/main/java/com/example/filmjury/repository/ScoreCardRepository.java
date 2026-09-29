package com.example.filmjury.repository;

import com.example.filmjury.model.ScoreCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreCardRepository extends JpaRepository<ScoreCard, Long> {
    List<ScoreCard> findByEntryId(Long entryId);
    Optional<ScoreCard> findByEntryIdAndJudgeId(Long entryId, Long judgeId);
}
