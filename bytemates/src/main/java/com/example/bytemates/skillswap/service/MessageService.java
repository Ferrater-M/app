package com.example.bytemates.skillswap.service;

import com.example.bytemates.skillswap.entity.MessageEntity;
import com.example.bytemates.skillswap.entity.UserEntity;
import com.example.bytemates.skillswap.repository.MessageRepository;
import com.example.bytemates.skillswap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageEntity sendMessage(Long senderId, Long receiverId, String content) {
        UserEntity sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        UserEntity receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        MessageEntity message = MessageEntity.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .timestamp(LocalDateTime.now())
                .build();

        return messageRepository.save(message);
    }

    public List<MessageEntity> getConversation(Long user1Id, Long user2Id) {
        return messageRepository.findConversation(user1Id, user2Id);
    }
    
    public List<UserEntity> getChatPartners(Long myId) {
        List<Long> senderIds = messageRepository.findSendersToMe(myId);
        List<Long> receiverIds = messageRepository.findReceiversFromMe(myId);
        
        Set<Long> allPartnerIds = new HashSet<>();
        allPartnerIds.addAll(senderIds);
        allPartnerIds.addAll(receiverIds);

        return userRepository.findAllById(allPartnerIds);
    }
}