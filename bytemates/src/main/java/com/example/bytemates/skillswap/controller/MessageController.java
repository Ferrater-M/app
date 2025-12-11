package com.example.bytemates.skillswap.controller;

import com.example.bytemates.skillswap.entity.MessageEntity;
import com.example.bytemates.skillswap.entity.UserEntity;
import com.example.bytemates.skillswap.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping("/send")
    public MessageEntity sendMessage(@RequestBody Map<String, Object> payload) {
        Long senderId = Long.valueOf(payload.get("senderId").toString());
        Long receiverId = Long.valueOf(payload.get("receiverId").toString());
        String content = (String) payload.get("content");
        return messageService.sendMessage(senderId, receiverId, content);
    }

    @GetMapping("/conversation/{user1Id}/{user2Id}")
    public List<MessageEntity> getConversation(@PathVariable Long user1Id, @PathVariable Long user2Id) {
        return messageService.getConversation(user1Id, user2Id);
    }

    @GetMapping("/partners/{myId}")
    public List<UserEntity> getChatPartners(@PathVariable Long myId) {
        return messageService.getChatPartners(myId);
    }
}