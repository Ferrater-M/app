package com.example.bytemates.skillswap.controller;

import com.example.bytemates.skillswap.entity.SkillRequestEntity;
import com.example.bytemates.skillswap.entity.UserEntity;
import com.example.bytemates.skillswap.repository.SkillRequestRepository;
import com.example.bytemates.skillswap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class SkillRequestController {

    private final SkillRequestRepository requestRepository;
    private final UserRepository userRepository;

    @GetMapping("/user/{userId}")
    public List<SkillRequestEntity> getUserRequests(@PathVariable Long userId) {
        return requestRepository.findByUser_UserId(userId);
    }

    @PostMapping("/add")
    public SkillRequestEntity addRequest(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SkillRequestEntity request = SkillRequestEntity.builder()
                .user(user)
                .skillName((String) payload.get("skillName"))
                .category((String) payload.get("category"))
                .description((String) payload.get("description"))
                .build();

        return requestRepository.save(request);
    }

    @DeleteMapping("/{id}")
    public void deleteRequest(@PathVariable Long id) {
        requestRepository.deleteById(id);
    }
}