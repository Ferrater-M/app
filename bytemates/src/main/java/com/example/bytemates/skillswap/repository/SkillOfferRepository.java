package com.example.bytemates.skillswap.repository;

import com.example.bytemates.skillswap.entity.SkillOfferEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface SkillOfferRepository extends JpaRepository<SkillOfferEntity, Long> {
    List<SkillOfferEntity> findByUser_UserId(Long userId);
    @Query("SELECT o FROM SkillOfferEntity o WHERE o.offerId NOT IN (" +
           "    SELECT s.targetOffer.offerId FROM SkillSwapEntity s WHERE s.status = 'COMPLETED'" +
           ")")
    List<SkillOfferEntity> findAvailableOffers();
}