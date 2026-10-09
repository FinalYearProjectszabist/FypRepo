package com.evplatform.auth;

import com.evplatform.auth.dto.AuthDtos.AuthResponse;
import com.evplatform.auth.dto.AuthDtos.EmailRequest;
import com.evplatform.auth.dto.AuthDtos.GoogleLoginRequest;
import com.evplatform.auth.dto.AuthDtos.LoginRequest;
import com.evplatform.auth.dto.AuthDtos.MessageResponse;
import com.evplatform.auth.dto.AuthDtos.MfaLoginRequest;
import com.evplatform.auth.dto.AuthDtos.MfaResendRequest;
import com.evplatform.auth.dto.AuthDtos.ResetPasswordRequest;
import com.evplatform.auth.dto.AuthDtos.SignupRequest;
import com.evplatform.auth.dto.AuthDtos.VerifyEmailRequest;
import com.evplatform.security.AuthUser;
import com.evplatform.user.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse signup(@Valid @RequestBody SignupRequest req) {
        authService.signup(req);
        return new MessageResponse("Account created. We sent a 6-digit verification code to your email.");
    }

    @PostMapping("/verify-email")
    public MessageResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest req) {
        authService.verifyEmail(req);
        return new MessageResponse("Email verified. You can now sign in.");
    }

    @PostMapping("/resend-verification")
    public MessageResponse resend(@Valid @RequestBody EmailRequest req) {
        authService.resendVerification(req.email());
        return new MessageResponse("If the account exists and is not verified, a new code has been sent.");
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/login/mfa")
    public AuthResponse loginMfa(@Valid @RequestBody MfaLoginRequest req) {
        return authService.loginWithMfa(req);
    }

    @PostMapping("/login/mfa/resend")
    public MessageResponse resendMfa(@Valid @RequestBody MfaResendRequest req) {
        authService.resendMfaCode(req);
        return new MessageResponse("A new code has been sent to your email.");
    }

    @PostMapping("/google")
    public AuthResponse google(@Valid @RequestBody GoogleLoginRequest req) {
        return authService.loginWithGoogle(req);
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody EmailRequest req) {
        authService.forgotPassword(req.email());
        return new MessageResponse("If an account exists for this email, a reset code has been sent.");
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return new MessageResponse("Password updated. You can now sign in with your new password.");
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthUser user) {
        return authService.me(user.id());
    }
}
