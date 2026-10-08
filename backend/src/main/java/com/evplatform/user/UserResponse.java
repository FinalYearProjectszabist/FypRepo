package com.evplatform.user;

import java.time.Instant;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        Role role,
        AuthProvider provider,
        boolean emailVerified,
        boolean mfaEnabled,
        boolean enabled,
        Instant createdAt) {

    public static UserResponse from(User u) {
        return new UserResponse(
                u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getRole(),
                u.getProvider(), u.isEmailVerified(), u.isMfaEnabled(), u.isEnabled(), u.getCreatedAt());
    }
}
