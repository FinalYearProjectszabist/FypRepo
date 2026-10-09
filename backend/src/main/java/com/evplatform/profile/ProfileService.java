package com.evplatform.profile;

import com.evplatform.auth.AuthService;
import com.evplatform.common.ApiException;
import com.evplatform.profile.dto.ProfileDtos.ChangePasswordRequest;
import com.evplatform.profile.dto.ProfileDtos.UpdateProfileRequest;
import com.evplatform.auth.VerificationCode;
import com.evplatform.auth.VerificationCodeService;
import com.evplatform.mail.MailService;
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
    private final VerificationCodeService codes;
    private final MailService mailService;

    public ProfileService(UserRepository users, PasswordEncoder passwordEncoder, VerificationCodeService codes,
                          MailService mailService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.codes = codes;
        this.mailService = mailService;
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

    /** Emails a code that confirms turning two-step verification on or off. */
    public void sendMfaSettingsCode(Long userId) {
        User user = load(userId);
        String code = codes.issue(user, VerificationCode.Purpose.MFA_SETTINGS);
        mailService.sendMfaSettingsCode(user.getEmail(), user.getFullName(), code, codes.ttlMinutes());
    }

    // noRollbackFor: a wrong code must still count as a failed attempt.
    @Transactional(noRollbackFor = ApiException.class)
    public UserResponse setMfaEnabled(Long userId, boolean enabled, String code) {
        User user = load(userId);
        if (user.isMfaEnabled() == enabled) {
            throw ApiException.badRequest("Two-step verification is already " + (enabled ? "enabled" : "disabled"));
        }
        codes.consume(user, VerificationCode.Purpose.MFA_SETTINGS, code);
        user.setMfaEnabled(enabled);
        return UserResponse.from(user);
    }

    private User load(Long userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
    }
}
