package com.example.bytemates.skillswap.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.bytemates.skillswap.entity.OfferStatus;
import com.example.bytemates.skillswap.entity.SkillOfferEntity;

public interface SkillOfferRepository extends JpaRepository<SkillOfferEntity, Long> {
    
    List<SkillOfferEntity> findByUser_UserId(Long userId);

    List<SkillOfferEntity> findByStatus(OfferStatus status);
    @Query("SELECT o FROM SkillOfferEntity o WHERE o.offerId NOT IN (" +
           "    SELECT s.targetOffer.offerId FROM SkillSwapEntity s WHERE s.status = 'COMPLETED'" +
           ")")
    List<SkillOfferEntity> findAvailableOffers();
}