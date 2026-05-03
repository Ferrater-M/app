package com.example.bytemates.skillswap.repository;

import com.example.bytemates.skillswap.entity.ReviewEntity;
import com.example.bytemates.skillswap.entity.SkillSwapEntity;
import com.example.bytemates.skillswap.entity.UserEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {
    
    List<ReviewEntity> findByReviewedUser_UserId(Long userId);
    @Query("SELECT AVG(r.rating) FROM ReviewEntity r WHERE r.reviewedUser.userId = :userId")
    Optional<Double> findAverageRatingByReviewedUserId(@Param("userId") Long userId);
    Optional<ReviewEntity> findBySwapAndReviewer(SkillSwapEntity swap, UserEntity reviewer);
    
}