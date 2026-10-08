package com.evplatform.profile.dto;

import com.evplatform.common.ValidationRules;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public final class ProfileDtos {

    private ProfileDtos() {}

    public record UpdateProfileRequest(
            @NotBlank(message = "Full name is required")
            @Pattern(regexp = ValidationRules.NAME, message = ValidationRules.NAME_MSG)
            String fullName,

            @NotBlank(message = "Phone number is required")
            @Pattern(regexp = ValidationRules.PHONE_PK, message = ValidationRules.PHONE_MSG)
            String phone) {}

    public record ChangePasswordRequest(
            /** Not required for Google accounts that have never set a password. */
            String currentPassword,
            @NotBlank(message = "New password is required")
            @Pattern(regexp = ValidationRules.PASSWORD, message = ValidationRules.PASSWORD_MSG)
            String newPassword) {}

    public record MfaSetupResponse(String secret, String otpauthUrl) {}

    public record MfaCodeRequest(
            @NotBlank(message = "Code is required")
            @Pattern(regexp = ValidationRules.OTP, message = ValidationRules.OTP_MSG)
            String code) {}
}
