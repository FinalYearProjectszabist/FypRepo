package com.evplatform.admin;

import com.evplatform.common.ApiException;
import com.evplatform.security.AuthUser;
import com.evplatform.user.User;
import com.evplatform.user.UserRepository;
import com.evplatform.user.UserResponse;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Minimal admin endpoints needed by Module 1 (role check + account enable/disable).
 * The full Admin Panel is a separate module (P2 Final).
 */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserRepository users;

    public AdminUserController(UserRepository users) {
        this.users = users;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return users.findAll(Sort.by("id")).stream().map(UserResponse::from).toList();
    }

    @PatchMapping("/{id}/enabled")
    @Transactional
    public UserResponse setEnabled(@AuthenticationPrincipal AuthUser me, @PathVariable Long id,
                                   @RequestParam boolean value) {
        if (me.id().equals(id)) {
            throw ApiException.badRequest("You cannot disable your own account");
        }
        User user = users.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
        user.setEnabled(value);
        return UserResponse.from(user);
    }
}
