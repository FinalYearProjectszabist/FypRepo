package com.evplatform.common;

import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;

/**
 * Uniform error body: { status, error, code, message, fieldErrors, timestamp }.
 * {@code code} is a machine-readable reason (e.g. EMAIL_NOT_VERIFIED) the frontend can branch on.
 */
public record ApiError(int status, String error, String code, String message, Map<String, String> fieldErrors,
                       Instant timestamp) {

    public static ApiError of(HttpStatus status, String message) {
        return new ApiError(status.value(), status.getReasonPhrase(), null, message, Map.of(), Instant.now());
    }

    public static ApiError of(HttpStatus status, String code, String message) {
        return new ApiError(status.value(), status.getReasonPhrase(), code, message, Map.of(), Instant.now());
    }

    public static ApiError of(HttpStatus status, String message, Map<String, String> fieldErrors) {
        return new ApiError(status.value(), status.getReasonPhrase(), "VALIDATION_FAILED", message, fieldErrors,
                Instant.now());
    }
}
