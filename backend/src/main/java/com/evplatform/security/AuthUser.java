package com.evplatform.security;

import com.evplatform.user.Role;

/** Principal stored in the SecurityContext. Inject in controllers with @AuthenticationPrincipal. */
public record AuthUser(Long id, String email, Role role) {}
