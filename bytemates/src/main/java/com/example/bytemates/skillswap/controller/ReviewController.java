package com.example.bytemates.skillswap.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.bytemates.skillswap.dto.ReviewRequest;
import com.example.bytemates.skillswap.service.ReviewService;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitReview(@RequestBody ReviewRequest request) {
        System.out.println("REQUEST: " + request);
        return reviewService.submitReview(request);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getReviewsForUser(@PathVariable Long userId) {
        return reviewService.getReviewsForUser(userId);
    }
}