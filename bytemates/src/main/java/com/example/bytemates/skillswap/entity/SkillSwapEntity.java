package com.example.bytemates.skillswap.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "skill_swaps")
public class SkillSwapEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long swapId;

    @Enumerated(EnumType.STRING)
    private SwapStatus status;

    private LocalDate date;
    private LocalDate completionDate;
    
    @Column(columnDefinition = "TEXT")
    private String message;

    @ManyToOne
    @JoinColumn(name = "requester_id", nullable = false)
    private UserEntity requester;

    @ManyToOne
    @JoinColumn(name = "offer_id", nullable = false)
    private SkillOfferEntity targetOffer;
}