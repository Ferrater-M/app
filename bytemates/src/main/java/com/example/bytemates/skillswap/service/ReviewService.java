package com.example.bytemates.skillswap.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.example.bytemates.skillswap.dto.ReviewRequest;
import com.example.bytemates.skillswap.entity.ReviewEntity;
import com.example.bytemates.skillswap.entity.SkillSwapEntity;
import com.example.bytemates.skillswap.entity.UserEntity;
import com.example.bytemates.skillswap.repository.ReviewRepository;
import com.example.bytemates.skillswap.repository.SkillSwapRepository;
import com.example.bytemates.skillswap.repository.UserRepository;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final SkillSwapRepository skillSwapRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         UserRepository userRepository,
                         SkillSwapRepository skillSwapRepository) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.skillSwapRepository = skillSwapRepository;
    }

    public ResponseEntity<?> submitReview(ReviewRequest request) {

        UserEntity reviewedUser = userRepository.findById(request.getReviewedUserId())
                .orElseThrow(() -> new RuntimeException("Reviewed user not found"));

        UserEntity reviewer = userRepository.findById(request.getReviewerId())
                .orElseThrow(() -> new RuntimeException("Reviewer not found"));

        SkillSwapEntity swap = skillSwapRepository.findById(request.getSwapId())
                .orElseThrow(() -> new RuntimeException("Swap not found"));

        // Prevent duplicate review per swap and reviewer
        if (reviewRepository.findBySwapAndReviewer(swap, reviewer).isPresent()) {
            return ResponseEntity.badRequest().body("You already reviewed this swap.");
        }

        ReviewEntity review = ReviewEntity.builder()
                .reviewedUser(reviewedUser)
                .reviewer(reviewer)
                .swap(swap)
                .rating(request.getRating())
                .comment(request.getComment())
                .date(LocalDate.now())
                .build();

        reviewRepository.save(review);

        return ResponseEntity.ok("Review submitted successfully");
    }

    public ResponseEntity<?> getReviewsForUser(Long userId) {
        List<ReviewEntity> reviews = reviewRepository.findByReviewedUser_UserId(userId);
        return ResponseEntity.ok(reviews);
    }
}