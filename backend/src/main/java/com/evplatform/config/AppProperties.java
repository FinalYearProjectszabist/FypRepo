package com.evplatform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String frontendUrl,
        Jwt jwt,
        Crypto crypto,
        Mail mail,
        Google google,
        Security security,
        Admin admin) {

    public record Jwt(String secret, long accessTokenMinutes, long mfaTokenMinutes) {}

    public record Crypto(String aesKey) {}

    public record Mail(boolean enabled, String from) {}

    public record Google(String clientId) {}

    public record Security(int maxFailedLogins, long lockMinutes, long otpMinutes) {}

    public record Admin(String email, String password, String name) {}
}
