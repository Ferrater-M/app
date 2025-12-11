package com.example.bytemates.skillswap.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.bytemates.skillswap.entity.UserEntity;
import com.example.bytemates.skillswap.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserEntity registerUser(UserEntity user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already taken");
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        user.setDateJoined(LocalDate.now());
        
        return userRepository.save(user);
    }

    public List<UserEntity> getAllUsers() {
        return userRepository.findAll();
    }

    public UserEntity getUserById(Long id) {
        Long safeId = Objects.requireNonNull(id, "User ID cannot be null");

        return userRepository.findById(safeId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}