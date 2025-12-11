package com.example.bytemates.skillswap.service;

import com.example.bytemates.skillswap.entity.*;
import com.example.bytemates.skillswap.repository.SkillOfferRepository;
import com.example.bytemates.skillswap.repository.SkillSwapRepository;
import com.example.bytemates.skillswap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

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

    public void updateSwapStatus(Long swapId, SwapStatus newStatus) {
        SkillSwapEntity swap = skillSwapRepository.findById(swapId)
                .orElseThrow(() -> new RuntimeException("Swap not found with ID: " + swapId));
        
        SwapStatus currentStatus = swap.getStatus();

        if (currentStatus == SwapStatus.REJECTED || currentStatus == SwapStatus.COMPLETED) {
            throw new RuntimeException("Cannot change status of a " + currentStatus + " swap.");
        }
        
        if (newStatus == SwapStatus.ACCEPTED && currentStatus != SwapStatus.PENDING) {
            throw new RuntimeException("Cannot ACCEPT a swap that is not PENDING.");
        }
        
        if (newStatus == SwapStatus.COMPLETED && currentStatus != SwapStatus.ACCEPTED) {
            throw new RuntimeException("Cannot COMPLETE a swap that is not ACCEPTED (Active).");
        }

        swap.setStatus(newStatus);
        
        if (newStatus == SwapStatus.COMPLETED) {
            swap.setCompletionDate(LocalDate.now()); 
        }
        
        skillSwapRepository.save(swap);
    }
}