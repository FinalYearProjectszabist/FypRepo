package com.evplatform.auth;

import com.evplatform.common.ApiException;
import com.evplatform.config.AppProperties;
import com.evplatform.user.User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VerificationCodeService {

    private static final int MAX_ATTEMPTS = 5;

    private final VerificationCodeRepository repository;
    private final Duration ttl;
    private final SecureRandom random = new SecureRandom();

    public VerificationCodeService(VerificationCodeRepository repository, AppProperties props) {
        this.repository = repository;
        this.ttl = Duration.ofMinutes(props.security().otpMinutes());
    }

    /** Creates a fresh code (old ones of the same purpose are invalidated) and returns the plain code. */
    @Transactional
    public String issue(User user, VerificationCode.Purpose purpose) {
        repository.invalidateAll(user, purpose);
        String code = String.format("%06d", random.nextInt(1_000_000));
        repository.save(new VerificationCode(user, purpose, hash(code), Instant.now().plus(ttl)));
        return code;
    }

    /** Throws if the code is wrong/expired; marks it used on success. */
    @Transactional(noRollbackFor = ApiException.class)
    public void consume(User user, VerificationCode.Purpose purpose, String code) {
        VerificationCode vc = repository.findFirstByUserAndPurposeAndUsedFalseOrderByIdDesc(user, purpose)
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired code. Please request a new one."));
        if (vc.isExpired() || vc.getAttempts() >= MAX_ATTEMPTS) {
            vc.setUsed(true);
            throw ApiException.badRequest("Code has expired. Please request a new one.");
        }
        if (!MessageDigest.isEqual(vc.getCodeHash().getBytes(StandardCharsets.US_ASCII),
                hash(code).getBytes(StandardCharsets.US_ASCII))) {
            vc.setAttempts(vc.getAttempts() + 1);
            throw ApiException.badRequest("Incorrect code");
        }
        vc.setUsed(true);
    }

    public long ttlMinutes() {
        return ttl.toMinutes();
    }

    private static String hash(String code) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(code.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
