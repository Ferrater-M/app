package com.example.bytemates.skillswap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reviews")
public class ReviewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "reviewed_user_id", nullable = false) 
    private UserEntity reviewedUser;

    @ManyToOne
    @JoinColumn(name = "reviewer_id", nullable = false) 
    private UserEntity reviewer;

    @OneToOne
    @JoinColumn(name = "swap_id")
    private SkillSwapEntity swap;

    private int rating;
    private String comment;
    private LocalDate date;
}