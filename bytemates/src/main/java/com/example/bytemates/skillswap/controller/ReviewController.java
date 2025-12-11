package com.example.bytemates.skillswap.controller;

import com.example.bytemates.skillswap.entity.ReviewEntity;
import com.example.bytemates.skillswap.entity.SkillSwapEntity;
import com.example.bytemates.skillswap.entity.UserEntity;
import com.example.bytemates.skillswap.repository.ReviewRepository;
import com.example.bytemates.skillswap.repository.SkillSwapRepository;
import com.example.bytemates.skillswap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final SkillSwapRepository skillSwapRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewEntity>> getReviewsForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewRepository.findByReviewedUser_UserId(userId));
    }

    @PostMapping("/submit")
    public ResponseEntity<ReviewEntity> submitReview(@RequestBody Map<String, Object> payload) {
        
        Long reviewedUserId = Long.valueOf(payload.get("reviewedUserId").toString());
        Long reviewerId = Long.valueOf(payload.get("reviewerId").toString());
        
        int rating = ((Number) payload.get("rating")).intValue(); 
        String comment = (String) payload.get("comment");
        
        Long swapId = payload.get("swapId") != null ? Long.valueOf(payload.get("swapId").toString()) : null;
        
        UserEntity reviewedUser = userRepository.findById(reviewedUserId)
                .orElseThrow(() -> new RuntimeException("Reviewed user not found"));
        
        UserEntity reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("Reviewer not found"));

        SkillSwapEntity swap = null;
        if (swapId != null) {
            swap = skillSwapRepository.findById(swapId)
                   .orElseThrow(() -> new RuntimeException("Swap not found with ID: " + swapId));
        }

        ReviewEntity review = ReviewEntity.builder()
                .reviewedUser(reviewedUser)
                .reviewer(reviewer)
                .swap(swap)
                .rating(rating)
                .comment(comment)
                .date(LocalDate.now())
                .build();
        
        return ResponseEntity.ok(reviewRepository.save(review));
    }
}