package com.example.filmjury.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Criterion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private Integer maxScore;
}
