package com.evplatform.profile;

import com.evplatform.auth.AuthService;
import com.evplatform.common.ApiException;
import com.evplatform.profile.dto.ProfileDtos.ChangePasswordRequest;
import com.evplatform.profile.dto.ProfileDtos.MfaSetupResponse;
import com.evplatform.profile.dto.ProfileDtos.UpdateProfileRequest;
import com.evplatform.security.TotpService;
import com.evplatform.user.User;
import com.evplatform.user.UserRepository;
import com.evplatform.user.UserResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProfileService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TotpService totpService;

    public ProfileService(UserRepository users, PasswordEncoder passwordEncoder, TotpService totpService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.totpService = totpService;
    }

    @Transactional(readOnly = true)
    public UserResponse get(Long userId) {
        return UserResponse.from(load(userId));
    }

    public UserResponse update(Long userId, UpdateProfileRequest req) {
        User user = load(userId);
        user.setFullName(req.fullName().trim());
        user.setPhone(AuthService.normalizePhone(req.phone()));
        return UserResponse.from(user);
    }

    public void changePassword(Long userId, ChangePasswordRequest req) {
        User user = load(userId);
        if (user.getPasswordHash() != null) {
            if (req.currentPassword() == null
                    || !passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
                throw ApiException.badRequest("Current password is incorrect");
            }
            if (passwordEncoder.matches(req.newPassword(), user.getPasswordHash())) {
                throw ApiException.badRequest("New password must be different from the current password");
            }
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
    }

    /** Step 1 of enabling 2-step verification: generate a secret to scan into an authenticator app. */
    public MfaSetupResponse setupMfa(Long userId) {
        User user = load(userId);
        if (user.isMfaEnabled()) {
            throw ApiException.badRequest("Two-step verification is already enabled");
        }
        String secret = totpService.generateSecret();
        user.setMfaSecret(secret);
        return new MfaSetupResponse(secret, totpService.otpauthUrl(secret, user.getEmail()));
    }

    /** Step 2: confirm the user's app produces valid codes, then turn MFA on. */
    public UserResponse enableMfa(Long userId, String code) {
        User user = load(userId);
        if (user.getMfaSecret() == null) {
            throw ApiException.badRequest("Start the setup first");
        }
        if (!totpService.verify(user.getMfaSecret(), code)) {
            throw ApiException.badRequest("Incorrect code. Check your authenticator app and try again.");
        }
        user.setMfaEnabled(true);
        return UserResponse.from(user);
    }

    public UserResponse disableMfa(Long userId, String code) {
        User user = load(userId);
        if (!user.isMfaEnabled()) {
            throw ApiException.badRequest("Two-step verification is not enabled");
        }
        if (!totpService.verify(user.getMfaSecret(), code)) {
            throw ApiException.badRequest("Incorrect code");
        }
        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        return UserResponse.from(user);
    }

    private User load(Long userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
    }
}
