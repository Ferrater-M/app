package com.example.bytemates.skillswap.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.bytemates.skillswap.dto.SkillOfferDto;
import com.example.bytemates.skillswap.entity.SkillEntity;
import com.example.bytemates.skillswap.entity.SkillOfferEntity;
import com.example.bytemates.skillswap.entity.UserEntity;
import com.example.bytemates.skillswap.repository.ReviewRepository;
import com.example.bytemates.skillswap.repository.SkillOfferRepository;
import com.example.bytemates.skillswap.repository.SkillRepository;
import com.example.bytemates.skillswap.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SkillOfferService {

    private final SkillOfferRepository skillOfferRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final ReviewRepository reviewRepository; 

    public List<SkillOfferDto> getAllAvailableOffers() {
        List<SkillOfferEntity> offers = skillOfferRepository.findAvailableOffers(); 
        
        return offers.stream().map(offer -> {
            Long userId = offer.getUser().getUserId();
            
            Double avgRating = reviewRepository.findAverageRatingByReviewedUserId(userId)
                                              .orElse(0.0);
            
            return new SkillOfferDto(offer, avgRating);
        }).collect(Collectors.toList());
    }

    public List<SkillOfferEntity> getOffersByUserId(Long userId) {
        return skillOfferRepository.findByUser_UserId(userId);
    }
    
    public void deleteOffer(Long offerId) {
        skillOfferRepository.deleteById(offerId); 
    }

    public SkillOfferEntity createOffer(Long userId, String skillName, String category, String description, String availability, String lookingFor) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SkillEntity skill = skillRepository.findByNameAndCategory(skillName, category)
                .orElseGet(() -> {
                    SkillEntity newSkill = SkillEntity.builder()
                        .name(skillName)
                        .category(category)
                        .build();
                    return skillRepository.save(newSkill);
                });

        SkillOfferEntity offer = SkillOfferEntity.builder()
                .user(user)
                .skill(skill)
                .description(description)
                .availability(availability)
                .lookingFor(lookingFor)
                .date(LocalDate.now()) 
                .build();

        return skillOfferRepository.save(offer);
    }
}