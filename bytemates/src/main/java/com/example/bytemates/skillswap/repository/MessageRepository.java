package com.example.bytemates.skillswap.repository;

import com.example.bytemates.skillswap.entity.MessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {
    @Query("SELECT m FROM MessageEntity m WHERE " +
           "(m.sender.userId = :user1Id AND m.receiver.userId = :user2Id) OR " +
           "(m.sender.userId = :user2Id AND m.receiver.userId = :user1Id) " +
           "ORDER BY m.timestamp ASC")
    List<MessageEntity> findConversation(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
    @Query("SELECT DISTINCT m.sender.userId FROM MessageEntity m WHERE m.receiver.userId = :myId")
    List<Long> findSendersToMe(@Param("myId") Long myId);
    
    @Query("SELECT DISTINCT m.receiver.userId FROM MessageEntity m WHERE m.sender.userId = :myId")
    List<Long> findReceiversFromMe(@Param("myId") Long myId);
}