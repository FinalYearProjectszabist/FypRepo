package com.evplatform.config;

import com.evplatform.user.AuthProvider;
import com.evplatform.user.Role;
import com.evplatform.user.User;
import com.evplatform.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Admins never sign up publicly — the first one is created here from app.admin.* settings. */
@Component
public class AdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties props;

    public AdminSeeder(UserRepository users, PasswordEncoder passwordEncoder, AppProperties props) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.existsByRole(Role.ADMIN)) {
            return;
        }
        User admin = new User();
        admin.setFullName(props.admin().name());
        admin.setEmail(props.admin().email().toLowerCase());
        admin.setPasswordHash(passwordEncoder.encode(props.admin().password()));
        admin.setRole(Role.ADMIN);
        admin.setProvider(AuthProvider.LOCAL);
        admin.setEmailVerified(true);
        users.save(admin);
        log.info("Seeded admin account: {} (change the password after first login)", admin.getEmail());
    }
}
