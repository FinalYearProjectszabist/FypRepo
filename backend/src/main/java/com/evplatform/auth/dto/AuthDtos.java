package com.evplatform.auth.dto;

import com.evplatform.common.ValidationRules;
import com.evplatform.user.Role;
import com.evplatform.user.UserResponse;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request/response bodies for /api/auth/**. */
public final class AuthDtos {

    private AuthDtos() {}

    public record SignupRequest(
            @NotBlank(message = "Full name is required")
            @Pattern(regexp = ValidationRules.NAME, message = ValidationRules.NAME_MSG)
            String fullName,

            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            @Size(max = 100, message = "Email must be at most 100 characters")
            String email,

            @NotBlank(message = "Password is required")
            @Pattern(regexp = ValidationRules.PASSWORD, message = ValidationRules.PASSWORD_MSG)
            String password,

            @NotBlank(message = "Phone number is required")
            @Pattern(regexp = ValidationRules.PHONE_PK, message = ValidationRules.PHONE_MSG)
            String phone,

            /** Only DRIVER or STATION_OWNER can sign up publicly; ADMIN is seeded. */
            @NotNull(message = "Select an account type")
            Role role) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") String email,
            @NotBlank(message = "Password is required") String password) {}

    public record MfaLoginRequest(
            @NotBlank(message = "MFA session is missing") String mfaToken,
            @NotBlank(message = "Code is required")
            @Pattern(regexp = ValidationRules.OTP, message = ValidationRules.OTP_MSG) String code) {}

    public record VerifyEmailRequest(
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") String email,
            @NotBlank(message = "Code is required")
            @Pattern(regexp = ValidationRules.OTP, message = ValidationRules.OTP_MSG) String code) {}

    public record MfaResendRequest(@NotBlank(message = "MFA session is missing") String mfaToken) {}

    public record EmailRequest(
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") String email) {}

    public record ResetPasswordRequest(
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") String email,
            @NotBlank(message = "Code is required")
            @Pattern(regexp = ValidationRules.OTP, message = ValidationRules.OTP_MSG) String code,
            @NotBlank(message = "New password is required")
            @Pattern(regexp = ValidationRules.PASSWORD, message = ValidationRules.PASSWORD_MSG) String newPassword) {}

    public record GoogleLoginRequest(
            @NotBlank(message = "Google credential is missing") String idToken,
            /** Used only when the Google account is new; defaults to DRIVER. */
            Role role) {}

    /**
     * Login result. Either accessToken+user is set, or mfaRequired=true with an mfaToken
     * that must be sent to /api/auth/login/mfa together with the code emailed to maskedEmail.
     */
    public record AuthResponse(
            String accessToken,
            long expiresIn,
            UserResponse user,
            boolean mfaRequired,
            String mfaToken,
            String maskedEmail) {

        public static AuthResponse success(String token, long expiresIn, UserResponse user) {
            return new AuthResponse(token, expiresIn, user, false, null, null);
        }

        public static AuthResponse mfa(String mfaToken, String maskedEmail) {
            return new AuthResponse(null, 0, null, true, mfaToken, maskedEmail);
        }
    }

    public record MessageResponse(String message) {}
}
