package com.example.bytemates.skillswap.repository;

import com.example.bytemates.skillswap.entity.SkillRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillRequestRepository extends JpaRepository<SkillRequestEntity, Long> {
    List<SkillRequestEntity> findByUser_UserId(Long userId);
}