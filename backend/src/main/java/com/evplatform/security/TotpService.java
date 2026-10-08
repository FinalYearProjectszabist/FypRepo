package com.evplatform.security;

import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.apache.commons.codec.binary.Base32;
import org.springframework.stereotype.Service;

/**
 * RFC 6238 TOTP (Google Authenticator / Microsoft Authenticator compatible):
 * 6 digits, 30 second step, HMAC-SHA1. Accepts one step of clock drift either way.
 */
@Service
public class TotpService {

    private static final String ISSUER = "EV Charging Platform";
    private static final int DIGITS = 6;
    private static final long STEP_SECONDS = 30;

    private final SecureRandom random = new SecureRandom();
    private final Base32 base32 = new Base32();

    public String generateSecret() {
        byte[] bytes = new byte[20];
        random.nextBytes(bytes);
        return base32.encodeToString(bytes).replace("=", "");
    }

    public String otpauthUrl(String secret, String accountEmail) {
        String label = URLEncoder.encode(ISSUER + ":" + accountEmail, StandardCharsets.UTF_8).replace("+", "%20");
        String issuer = URLEncoder.encode(ISSUER, StandardCharsets.UTF_8).replace("+", "%20");
        return "otpauth://totp/" + label + "?secret=" + secret + "&issuer=" + issuer
                + "&algorithm=SHA1&digits=" + DIGITS + "&period=" + STEP_SECONDS;
    }

    public boolean verify(String secret, String code) {
        if (secret == null || code == null || !code.matches("\\d{" + DIGITS + "}")) {
            return false;
        }
        long counter = System.currentTimeMillis() / 1000 / STEP_SECONDS;
        for (long drift = -1; drift <= 1; drift++) {
            String expected = generateCode(secret, counter + drift);
            if (MessageDigest.isEqual(expected.getBytes(StandardCharsets.US_ASCII),
                    code.getBytes(StandardCharsets.US_ASCII))) {
                return true;
            }
        }
        return false;
    }

    String generateCode(String secret, long counter) {
        try {
            byte[] key = base32.decode(secret);
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(counter).array());
            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            int otp = binary % (int) Math.pow(10, DIGITS);
            return String.format("%0" + DIGITS + "d", otp);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("TOTP generation failed", e);
        }
    }

    /** Current code — used by tests. */
    public String currentCode(String secret) {
        return generateCode(secret, System.currentTimeMillis() / 1000 / STEP_SECONDS);
    }
}
