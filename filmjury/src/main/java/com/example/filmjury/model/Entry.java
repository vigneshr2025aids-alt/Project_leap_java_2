package com.example.filmjury.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@EqualsAndHashCode(exclude = "assignedJudges")
public class Entry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String genre;
    private String videoLink;
    private String teamDetails;
    private String submissionStatus; // e.g., "SUBMITTED", "EVALUATED"

    @ManyToMany
    @JoinTable(
        name = "entry_judge",
        joinColumns = @JoinColumn(name = "entry_id"),
        inverseJoinColumns = @JoinColumn(name = "judge_id")
    )
    private Set<Judge> assignedJudges = new HashSet<>();

    private Double finalScore;
}
