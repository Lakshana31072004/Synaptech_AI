package com.aseos.backend.repository;

import com.aseos.backend.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
 
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("DELETE FROM PasswordResetToken p WHERE p.user = :user")
    void deleteByUser(@org.springframework.data.repository.query.Param("user") com.aseos.backend.model.User user);
}