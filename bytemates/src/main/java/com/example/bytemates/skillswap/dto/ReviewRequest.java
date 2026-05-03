package com.example.bytemates.skillswap.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private Long reviewedUserId;
    private Long reviewerId;
    private Long swapId;
    private int rating;
    private String comment;
}