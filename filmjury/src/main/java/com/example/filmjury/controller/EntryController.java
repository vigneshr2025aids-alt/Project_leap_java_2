package com.example.filmjury.controller;

import com.example.filmjury.model.Entry;
import com.example.filmjury.repository.EntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entries")
public class EntryController {

    @Autowired
    private EntryRepository entryRepository;

    @GetMapping
    public List<Entry> getAllEntries() {
        return entryRepository.findAll();
    }

    @GetMapping("/leaderboard")
    public List<Entry> getLeaderboard() {
        return entryRepository.findAllByOrderByFinalScoreDesc();
    }

    @PostMapping
    public Entry createEntry(@RequestBody Entry entry) {
        entry.setSubmissionStatus("SUBMITTED");
        return entryRepository.save(entry);
    }
}
