package com.evplatform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Small one-off fixes for databases created by earlier versions (ddl-auto=update never removes
 * old constraints/columns). Each statement is idempotent and safe to run on every start.
 */
@Component
@Order(0)
public class SchemaFixes implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaFixes.class);

    private static final String[] STATEMENTS = {
            // Old check constraint only allowed EMAIL_VERIFICATION / PASSWORD_RESET
            "ALTER TABLE verification_codes DROP CONSTRAINT IF EXISTS verification_codes_purpose_check",
            // TOTP secret is no longer used (two-step verification is now by email)
            "ALTER TABLE users DROP COLUMN IF EXISTS mfa_secret",
    };

    private final JdbcTemplate jdbc;

    public SchemaFixes(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (String sql : STATEMENTS) {
            try {
                jdbc.execute(sql);
            } catch (Exception e) {
                log.warn("Schema fix skipped ({}): {}", sql, e.getMessage());
            }
        }
    }
}
