package com.evplatform.security;

import com.evplatform.config.AppProperties;
import com.evplatform.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_MFA = "mfa";

    private final SecretKey key;
    private final Duration accessTtl;
    private final Duration mfaTtl;

    public JwtService(AppProperties props) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(props.jwt().secret()));
        this.accessTtl = Duration.ofMinutes(props.jwt().accessTokenMinutes());
        this.mfaTtl = Duration.ofMinutes(props.jwt().mfaTokenMinutes());
    }

    public String createAccessToken(User user) {
        return build(user, TYPE_ACCESS, accessTtl);
    }

    /** Short-lived token proving the password step passed; exchanged for an access token after TOTP. */
    public String createMfaToken(User user) {
        return build(user, TYPE_MFA, mfaTtl);
    }

    public long accessTokenSeconds() {
        return accessTtl.toSeconds();
    }

    /** Returns the user id if the token is valid and of the expected type. */
    public Optional<Long> parse(String token, String expectedType) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            if (!expectedType.equals(claims.get("typ", String.class))) {
                return Optional.empty();
            }
            return Optional.of(Long.valueOf(claims.getSubject()));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private String build(User user, String type, Duration ttl) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("typ", type)
                .claim("role", user.getRole().name())
                .claim("email", user.getEmail())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)))
                .signWith(key)
                .compact();
    }
}
