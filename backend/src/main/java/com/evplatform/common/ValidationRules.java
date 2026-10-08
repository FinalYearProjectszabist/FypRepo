package com.evplatform.common;

/**
 * Central input validation rules (Module 1: "Input Validation Rules").
 * The frontend mirrors these in src/utils/validation.js — keep both in sync.
 */
public final class ValidationRules {

    private ValidationRules() {}

    /** Letters, spaces, dots, apostrophes and hyphens; 3–60 chars. */
    public static final String NAME = "^[A-Za-z][A-Za-z .'-]{2,59}$";
    public static final String NAME_MSG = "Name must be 3-60 letters (spaces, . ' - allowed)";

    /** 8–64 chars with upper, lower, digit and special character; no spaces. */
    public static final String PASSWORD = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9])\\S{8,64}$";
    public static final String PASSWORD_MSG =
            "Password must be 8-64 characters with uppercase, lowercase, number and special character";

    /** Pakistani mobile: 03XXXXXXXXX or +923XXXXXXXXX. */
    public static final String PHONE_PK = "^(\\+92|0)3\\d{9}$";
    public static final String PHONE_MSG = "Phone must be a valid Pakistani mobile number (03XXXXXXXXX or +923XXXXXXXXX)";

    public static final String OTP = "^\\d{6}$";
    public static final String OTP_MSG = "Code must be 6 digits";

    /** e.g. ABC-123, LEA-2024, ICT-AB-123 */
    public static final String LICENSE_PLATE = "^[A-Za-z]{2,4}-?([A-Za-z]{1,2}-?)?\\d{1,4}$";
    public static final String LICENSE_PLATE_MSG = "Registration number must look like ABC-123";
}
