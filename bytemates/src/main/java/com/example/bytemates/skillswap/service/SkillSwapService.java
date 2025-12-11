package com.example.bytemates.skillswap.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.bytemates.skillswap.entity.OfferStatus;
import com.example.bytemates.skillswap.entity.SkillOfferEntity;
import com.example.bytemates.skillswap.entity.SkillSwapEntity;
import com.example.bytemates.skillswap.entity.SwapStatus;
import com.example.bytemates.skillswap.entity.UserEntity;
import com.example.bytemates.skillswap.repository.SkillOfferRepository;
import com.example.bytemates.skillswap.repository.SkillSwapRepository;
import com.example.bytemates.skillswap.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SkillSwapService {

    private final SkillSwapRepository skillSwapRepository;
    private final UserRepository userRepository;
    private final SkillOfferRepository skillOfferRepository;

    public SkillSwapEntity proposeSwap(Long requesterId, Long offerId, String message) {
        UserEntity requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("Requester not found"));
        
        SkillOfferEntity offer = skillOfferRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));

        if(offer.getUser().getUserId().equals(requesterId)) {
            throw new RuntimeException("You cannot swap with yourself!");
        }

        SkillSwapEntity swap = SkillSwapEntity.builder()
                .requester(requester)
                .targetOffer(offer)
                .message(message)
                .date(LocalDate.now())
                .status(SwapStatus.PENDING)
                .build();

        return skillSwapRepository.save(swap);
    }

    public List<SkillSwapEntity> getMyRequestedSwaps(Long userId) {
        return skillSwapRepository.findByRequester_UserId(userId);
    }

    public List<SkillSwapEntity> getIncomingRequests(Long userId) {
        return skillSwapRepository.findByTargetOffer_User_UserId(userId);
    }

    @Transactional 
    public void updateSwapStatus(Long swapId, SwapStatus newStatus) {
        SkillSwapEntity swap = skillSwapRepository.findById(swapId)
                .orElseThrow(() -> new RuntimeException("Swap not found with ID: " + swapId));
        
        SwapStatus currentStatus = swap.getStatus();

        if (currentStatus == SwapStatus.REJECTED || currentStatus == SwapStatus.COMPLETED) {
            throw new RuntimeException("Cannot change status of a " + currentStatus + " swap.");
        }
        
        swap.setStatus(newStatus);
        if (newStatus == SwapStatus.COMPLETED) {
            swap.setCompletionDate(LocalDate.now()); 
        }
        skillSwapRepository.save(swap);

        SkillOfferEntity offer = swap.getTargetOffer();
        
        if (newStatus == SwapStatus.ACCEPTED) {
            offer.setStatus(OfferStatus.ACTIVE);
            skillOfferRepository.save(offer);

            List<SkillSwapEntity> otherRequests = skillSwapRepository.findAllByTargetOfferAndStatus(
                offer, 
                SwapStatus.PENDING
            );

            System.out.println("Found " + otherRequests.size() + " other requests to reject."); // Debug Log

            for (SkillSwapEntity otherSwap : otherRequests) {
                // Reject everyone who is NOT the person we just accepted
                if (!otherSwap.getSwapId().equals(swapId)) {
                    otherSwap.setStatus(SwapStatus.REJECTED);
                    skillSwapRepository.save(otherSwap);
                    System.out.println("Auto-rejected swap ID: " + otherSwap.getSwapId()); // Debug Log
                }
            }
        } 
        else if (newStatus == SwapStatus.COMPLETED) {
            offer.setStatus(OfferStatus.COMPLETED);
            skillOfferRepository.save(offer);
        }
        else if (newStatus == SwapStatus.REJECTED) {
            // Only set to AVAILABLE if it was previously ACTIVE (don't reset if it was just PENDING)
            if (offer.getStatus() == OfferStatus.ACTIVE) {
                offer.setStatus(OfferStatus.AVAILABLE);
                skillOfferRepository.save(offer);
            }
        }
    }
}