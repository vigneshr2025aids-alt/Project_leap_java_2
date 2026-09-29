package com.example.filmjury.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Entity
@Data
public class ScoreCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "entry_id")
    private Entry entry;

    @ManyToOne
    @JoinColumn(name = "judge_id")
    private Judge judge;

    @ElementCollection
    @CollectionTable(name = "scorecard_criteria_scores", joinColumns = @JoinColumn(name = "scorecard_id"))
    @MapKeyColumn(name = "criterion_id")
    @Column(name = "score")
    private Map<Long, Integer> criteriaScores = new HashMap<>();

    private Integer totalScore;
}
