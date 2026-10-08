package com.evplatform.auth;

import com.evplatform.auth.dto.AuthDtos.AuthResponse;
import com.evplatform.auth.dto.AuthDtos.GoogleLoginRequest;
import com.evplatform.auth.dto.AuthDtos.LoginRequest;
import com.evplatform.auth.dto.AuthDtos.MfaLoginRequest;
import com.evplatform.auth.dto.AuthDtos.ResetPasswordRequest;
import com.evplatform.auth.dto.AuthDtos.SignupRequest;
import com.evplatform.auth.dto.AuthDtos.VerifyEmailRequest;
import com.evplatform.common.ApiException;
import com.evplatform.config.AppProperties;
import com.evplatform.mail.MailService;
import com.evplatform.security.JwtService;
import com.evplatform.security.TotpService;
import com.evplatform.user.AuthProvider;
import com.evplatform.user.Role;
import com.evplatform.user.User;
import com.evplatform.user.UserRepository;
import com.evplatform.user.UserResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// noRollbackFor: failed-attempt counters must be saved even though we then throw.
@Service
@Transactional(noRollbackFor = ApiException.class)
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TotpService totpService;
    private final VerificationCodeService codes;
    private final MailService mailService;
    private final GoogleTokenVerifier googleVerifier;
    private final AppProperties props;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService,
                       TotpService totpService, VerificationCodeService codes, MailService mailService,
                       GoogleTokenVerifier googleVerifier, AppProperties props) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.totpService = totpService;
        this.codes = codes;
        this.mailService = mailService;
        this.googleVerifier = googleVerifier;
        this.props = props;
    }

    // ---------- Signup ----------

    public void signup(SignupRequest req) {
        if (req.role() == Role.ADMIN) {
            throw ApiException.badRequest("Admin accounts cannot be created through signup");
        }
        String email = normalize(req.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = new User();
        user.setFullName(req.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setPhone(normalizePhone(req.phone()));
        user.setRole(req.role());
        user.setProvider(AuthProvider.LOCAL);
        users.save(user);
        sendVerification(user);
    }

    public void verifyEmail(VerifyEmailRequest req) {
        User user = users.findByEmailIgnoreCase(normalize(req.email()))
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired code. Please request a new one."));
        if (user.isEmailVerified()) {
            return;
        }
        codes.consume(user, VerificationCode.Purpose.EMAIL_VERIFICATION, req.code());
        user.setEmailVerified(true);
    }

    public void resendVerification(String email) {
        // Silently ignore unknown/verified emails so we don't reveal which accounts exist.
        users.findByEmailIgnoreCase(normalize(email))
                .filter(u -> !u.isEmailVerified())
                .ifPresent(this::sendVerification);
    }

    // ---------- Signin ----------

    public AuthResponse login(LoginRequest req) {
        User user = users.findByEmailIgnoreCase(normalize(req.email()))
                .orElseThrow(() -> ApiException.unauthorized("Incorrect email or password"));

        if (user.isLocked()) {
            throw new ApiException(HttpStatus.LOCKED, "ACCOUNT_LOCKED",
                    "Too many failed attempts. Account locked, try again after " + props.security().lockMinutes()
                            + " minutes.");
        }
        if (user.getPasswordHash() == null) {
            throw ApiException.unauthorized("This account uses Google sign-in. Use 'Continue with Google'.");
        }
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            registerFailedLogin(user);
            throw ApiException.unauthorized("Incorrect email or password");
        }
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);

        if (!user.isEnabled()) {
            throw ApiException.forbidden("Your account has been disabled. Contact support.");
        }
        if (!user.isEmailVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "Please verify your email before signing in.");
        }
        if (user.isMfaEnabled()) {
            return AuthResponse.mfa(jwtService.createMfaToken(user));
        }
        return issueTokens(user);
    }

    /** Second step of Two-Way Verification: authenticator app code. */
    public AuthResponse loginWithMfa(MfaLoginRequest req) {
        Long userId = jwtService.parse(req.mfaToken(), JwtService.TYPE_MFA)
                .orElseThrow(() -> ApiException.unauthorized("Verification session expired. Please sign in again."));
        User user = users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Verification session expired. Please sign in again."));
        if (user.isLocked()) {
            throw new ApiException(HttpStatus.LOCKED, "Too many failed attempts. Try again later.");
        }
        if (!totpService.verify(user.getMfaSecret(), req.code())) {
            registerFailedLogin(user);
            throw ApiException.unauthorized("Incorrect authenticator code");
        }
        user.setFailedLoginAttempts(0);
        return issueTokens(user);
    }

    // ---------- Social Media Sign-in (Google) ----------

    public AuthResponse loginWithGoogle(GoogleLoginRequest req) {
        GoogleTokenVerifier.GoogleProfile profile = googleVerifier.verify(req.idToken());
        if (!profile.emailVerified()) {
            throw ApiException.unauthorized("Your Google email is not verified");
        }
        User user = users.findByEmailIgnoreCase(normalize(profile.email())).orElseGet(() -> {
            Role role = req.role() == Role.STATION_OWNER ? Role.STATION_OWNER : Role.DRIVER;
            User u = new User();
            u.setFullName(sanitizeName(profile.name()));
            u.setEmail(normalize(profile.email()));
            u.setRole(role);
            u.setProvider(AuthProvider.GOOGLE);
            u.setEmailVerified(true);
            return users.save(u);
        });
        if (!user.isEnabled()) {
            throw ApiException.forbidden("Your account has been disabled. Contact support.");
        }
        // Google already verified the email address.
        user.setEmailVerified(true);
        if (user.isMfaEnabled()) {
            return AuthResponse.mfa(jwtService.createMfaToken(user));
        }
        return issueTokens(user);
    }

    // ---------- Recover Password ----------

    public void forgotPassword(String email) {
        users.findByEmailIgnoreCase(normalize(email)).ifPresent(user -> {
            String code = codes.issue(user, VerificationCode.Purpose.PASSWORD_RESET);
            mailService.sendPasswordResetCode(user.getEmail(), user.getFullName(), code, codes.ttlMinutes());
        });
    }

    public void resetPassword(ResetPasswordRequest req) {
        User user = users.findByEmailIgnoreCase(normalize(req.email()))
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired code. Please request a new one."));
        codes.consume(user, VerificationCode.Purpose.PASSWORD_RESET, req.code());
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        // Receiving the code by email proves ownership, so the address is verified and any lock is lifted.
        user.setEmailVerified(true);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        return users.findById(userId).map(UserResponse::from)
                .orElseThrow(() -> ApiException.unauthorized("Please sign in to continue"));
    }

    // ---------- helpers ----------

    private AuthResponse issueTokens(User user) {
        return AuthResponse.success(jwtService.createAccessToken(user), jwtService.accessTokenSeconds(),
                UserResponse.from(user));
    }

    private void registerFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= props.security().maxFailedLogins()) {
            user.setLockedUntil(Instant.now().plus(Duration.ofMinutes(props.security().lockMinutes())));
            user.setFailedLoginAttempts(0);
        }
    }

    private void sendVerification(User user) {
        String code = codes.issue(user, VerificationCode.Purpose.EMAIL_VERIFICATION);
        mailService.sendVerificationCode(user.getEmail(), user.getFullName(), code, codes.ttlMinutes());
    }

    static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    /** Store phones in one format: +923XXXXXXXXX */
    public static String normalizePhone(String phone) {
        String p = phone.trim();
        return p.startsWith("0") ? "+92" + p.substring(1) : p;
    }

    private static String sanitizeName(String name) {
        String cleaned = name == null ? "" : name.replaceAll("[^A-Za-z .'-]", "").trim();
        if (cleaned.length() < 3) {
            cleaned = "EV User";
        }
        return cleaned.length() > 60 ? cleaned.substring(0, 60) : cleaned;
    }
}
