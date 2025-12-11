package com.example.bytemates.skillswap.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.bytemates.skillswap.entity.SkillSwapEntity;

@Repository
public interface SkillSwapRepository extends JpaRepository<SkillSwapEntity, Long> {
    List<SkillSwapEntity> findByRequester_UserId(Long userId);
    List<SkillSwapEntity> findByTargetOffer_User_UserId(Long userId);
}