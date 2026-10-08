package com.evplatform.auth;

import com.evplatform.user.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {

    Optional<VerificationCode> findFirstByUserAndPurposeAndUsedFalseOrderByIdDesc(
            User user, VerificationCode.Purpose purpose);

    @Modifying
    @Query("update VerificationCode c set c.used = true where c.user = :user and c.purpose = :purpose and c.used = false")
    void invalidateAll(User user, VerificationCode.Purpose purpose);
}
