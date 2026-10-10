package com.evplatform.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeConfig {

    /** Opening hours are Pakistan local time. Injected so tests can fix the clock. */
    public static final ZoneId PAKISTAN = ZoneId.of("Asia/Karachi");

    @Bean
    Clock clock() {
        return Clock.system(PAKISTAN);
    }
}
