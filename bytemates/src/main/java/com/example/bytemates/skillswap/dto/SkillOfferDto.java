package com.example.bytemates.skillswap.dto;

import com.example.bytemates.skillswap.entity.SkillOfferEntity;
import com.example.bytemates.skillswap.entity.SkillEntity;
import com.example.bytemates.skillswap.entity.UserEntity;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
public class SkillOfferDto {
    private Long offerId;
    private UserEntity user;
    private SkillEntity skill;
    private String description;
    private String availability;
    private String lookingFor;
    private LocalDate date; 
    private Double averageRating;

    public SkillOfferDto(SkillOfferEntity entity, Double averageRating) {
        this.offerId = entity.getOfferId();
        this.user = entity.getUser();
        this.skill = entity.getSkill();
        this.description = entity.getDescription();
        this.availability = entity.getAvailability();
        this.lookingFor = entity.getLookingFor();
        
        this.date = entity.getDate(); 
        
        this.averageRating = averageRating;
    }
}