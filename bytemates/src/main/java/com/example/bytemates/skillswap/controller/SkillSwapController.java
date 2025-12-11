package com.example.bytemates.skillswap.controller;

import com.example.bytemates.skillswap.entity.SkillSwapEntity;
import com.example.bytemates.skillswap.entity.SwapStatus;
import com.example.bytemates.skillswap.service.SkillSwapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/swaps")
@RequiredArgsConstructor
public class SkillSwapController {

    private final SkillSwapService skillSwapService;

    // Endpoint for proposing a new swap request
    @PostMapping("/propose")
    public ResponseEntity<SkillSwapEntity> proposeSwap(@RequestBody Map<String, Object> payload) {
        Long requesterId = Long.valueOf(payload.get("requesterId").toString());
        Long offerId = Long.valueOf(payload.get("offerId").toString());
        String message = (String) payload.get("message");

        return ResponseEntity.ok(skillSwapService.proposeSwap(requesterId, offerId, message));
    }

    // Endpoint to get swaps requested BY the user (Sent Swaps)
    @GetMapping("/sent/{userId}")
    public ResponseEntity<List<SkillSwapEntity>> getSentSwaps(@PathVariable Long userId) {
        return ResponseEntity.ok(skillSwapService.getMyRequestedSwaps(userId));
    }

    // Endpoint to get swaps requested AGAINST the user (Received Swaps/Notifications)
    @GetMapping("/received/{userId}")
    public ResponseEntity<List<SkillSwapEntity>> getReceivedSwaps(@PathVariable Long userId) {
        return ResponseEntity.ok(skillSwapService.getIncomingRequests(userId));
    }

    // ENDPOINT: ACCEPT Swap Request 
    @PutMapping("/{swapId}/accept")
    public ResponseEntity<Void> acceptSwap(@PathVariable Long swapId) {
        skillSwapService.updateSwapStatus(swapId, SwapStatus.ACCEPTED);
        return ResponseEntity.ok().build();
    }

    // ENDPOINT: REJECT Swap Request 
    @PutMapping("/{swapId}/reject")
    public ResponseEntity<Void> rejectSwap(@PathVariable Long swapId) {
        skillSwapService.updateSwapStatus(swapId, SwapStatus.REJECTED);
        return ResponseEntity.ok().build();
    }

    // ENDPOINT: Mark Swap as Complete 
    @PutMapping("/{swapId}/complete")
    public ResponseEntity<Void> completeSwap(@PathVariable Long swapId) {
        skillSwapService.updateSwapStatus(swapId, SwapStatus.COMPLETED);
        return ResponseEntity.ok().build();
    }
}