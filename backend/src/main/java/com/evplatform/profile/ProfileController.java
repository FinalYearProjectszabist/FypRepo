package com.evplatform.profile;

import com.evplatform.auth.dto.AuthDtos.MessageResponse;
import com.evplatform.profile.dto.ProfileDtos.ChangePasswordRequest;
import com.evplatform.profile.dto.ProfileDtos.MfaCodeRequest;
import com.evplatform.profile.dto.ProfileDtos.MfaSetupResponse;
import com.evplatform.profile.dto.ProfileDtos.UpdateProfileRequest;
import com.evplatform.security.AuthUser;
import com.evplatform.user.UserResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Profile management for every role (Driver, Station Owner, Admin). */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public UserResponse get(@AuthenticationPrincipal AuthUser me) {
        return profileService.get(me.id());
    }

    @PutMapping
    public UserResponse update(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody UpdateProfileRequest req) {
        return profileService.update(me.id(), req);
    }

    @PutMapping("/password")
    public MessageResponse changePassword(@AuthenticationPrincipal AuthUser me,
                                          @Valid @RequestBody ChangePasswordRequest req) {
        profileService.changePassword(me.id(), req);
        return new MessageResponse("Password changed successfully");
    }

    @PostMapping("/mfa/setup")
    public MfaSetupResponse setupMfa(@AuthenticationPrincipal AuthUser me) {
        return profileService.setupMfa(me.id());
    }

    @PostMapping("/mfa/enable")
    public UserResponse enableMfa(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody MfaCodeRequest req) {
        return profileService.enableMfa(me.id(), req.code());
    }

    @PostMapping("/mfa/disable")
    public UserResponse disableMfa(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody MfaCodeRequest req) {
        return profileService.disableMfa(me.id(), req.code());
    }
}
