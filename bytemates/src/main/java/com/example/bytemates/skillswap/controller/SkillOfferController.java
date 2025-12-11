package com.example.bytemates.skillswap.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.bytemates.skillswap.dto.SkillOfferDto;
import com.example.bytemates.skillswap.entity.SkillOfferEntity;
import com.example.bytemates.skillswap.service.SkillOfferService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/offers")
@RequiredArgsConstructor
public class SkillOfferController {

    private final SkillOfferService skillOfferService;
    @GetMapping
    public ResponseEntity<List<SkillOfferDto>> getAllOffers() {
        return ResponseEntity.ok(skillOfferService.getAllAvailableOffers());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SkillOfferEntity>> getUserOffers(@PathVariable Long userId) {
        return ResponseEntity.ok(skillOfferService.getOffersByUserId(userId));
    }

    @PostMapping("/add")
    public SkillOfferEntity addOffer(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        String skillName = (String) payload.get("skillName");
        String category = (String) payload.get("category");
        String description = (String) payload.get("description");
        String availability = (String) payload.get("availability");
        String lookingFor = (String) payload.get("lookingFor");
        return skillOfferService.createOffer(userId, skillName, category, description, availability, lookingFor);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOffer(@PathVariable Long id) {
        skillOfferService.deleteOffer(id);
        return ResponseEntity.noContent().build();
    }
}