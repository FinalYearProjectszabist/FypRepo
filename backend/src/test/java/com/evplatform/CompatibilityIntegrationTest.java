package com.evplatform;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.evplatform.config.TimeConfig;
import com.evplatform.mail.MailService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** Module 3 against the seeded stations, clock fixed at 12:00 Pakistan time. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CompatibilityIntegrationTest {

    @TestConfiguration
    static class Noon {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(ZonedDateTime.of(2026, 10, 16, 12, 0, 0, 0, TimeConfig.PAKISTAN).toInstant(),
                    TimeConfig.PAKISTAN);
        }
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockitoBean MailService mail;

    private JsonNode call(MockHttpServletRequestBuilder req, String token, String body, int expect) throws Exception {
        if (token != null) req.header("Authorization", "Bearer " + token);
        if (body != null) req.contentType(MediaType.APPLICATION_JSON).content(body);
        String res = mvc.perform(req).andExpect(status().is(expect)).andReturn().getResponse().getContentAsString();
        return res.isEmpty() ? null : mapper.readTree(res);
    }

    private String driver(String email) throws Exception {
        call(post("/api/auth/signup"), null, """
                {"fullName":"Haider Baig","email":"%s","password":"Str0ng@Pass","phone":"03001234567","role":"DRIVER"}
                """.formatted(email), 201);
        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        verify(mail).sendVerificationCode(eq(email), anyString(), code.capture(), anyLong());
        call(post("/api/auth/verify-email"), null, "{\"email\":\"%s\",\"code\":\"%s\"}".formatted(email, code.getValue()), 200);
        return call(post("/api/auth/login"), null, "{\"email\":\"%s\",\"password\":\"Str0ng@Pass\"}".formatted(email), 200)
                .get("accessToken").asText();
    }

    private long vehicle(String token, String json) throws Exception {
        return call(post("/api/vehicles"), token, json, 201).get("id").asLong();
    }

    private static List<JsonNode> results(JsonNode res) {
        List<JsonNode> list = new ArrayList<>();
        res.get("results").forEach(list::add);
        return list;
    }

    @Test
    void engineEndToEnd() throws Exception {
        String token = driver("haider@test.com");
        long leaf = vehicle(token, """
                {"make":"Nissan","model":"Leaf","year":2022,"batteryCapacityKwh":40,"connectorType":"CHADEMO",
                 "additionalConnectors":["TYPE2"],"maxAcPowerKw":6.6,"maxDcPowerKw":50,
                 "rangeKm":270,"currentBatteryPercent":10}
                """);
        long byd = vehicle(token, """
                {"make":"BYD","model":"Atto 3","year":2024,"batteryCapacityKwh":60.48,"connectorType":"CCS2",
                 "maxAcPowerKw":7,"maxDcPowerKw":88,"rangeKm":420,"currentBatteryPercent":60}
                """);

        // Vehicle connector matrix
        JsonNode matrix = call(get("/api/compatibility/vehicles/" + byd), token, null, 200);
        assertThat(matrix.get("vehicle").get("compatibleConnectors").toString()).isEqualTo("[\"CCS2\",\"TYPE2\"]");

        // Auto-filter: every Leaf result has a CHAdeMO or Type 2 charger; CCS2-only stations are gone
        List<JsonNode> leafResults = results(call(get("/api/stations?vehicleId=" + leaf), token, null, 200));
        assertThat(leafResults).isNotEmpty()
                .allMatch(s -> !s.get("compatibility").asText().equals("INCOMPATIBLE"))
                .allMatch(s -> s.get("connectors").toString().matches(".*(CHADEMO|TYPE2).*"))
                .noneMatch(s -> s.get("name").asText().equals("Mall Road Heritage Charging")); // CCS2 only

        // Show incompatible too: Mall Road comes back, tagged INCOMPATIBLE
        List<JsonNode> all = results(call(get("/api/stations?vehicleId=" + leaf + "&hideIncompatible=false&q=mall road"),
                token, null, 200));
        assertThat(all).extracting(s -> s.get("compatibility").asText()).containsExactly("INCOMPATIBLE");

        // BYD at Blue Area: CHAdeMO bay doesn't fit → PARTIAL, speed capped at 88 kW
        JsonNode blue = results(call(get("/api/stations?vehicleId=" + byd + "&q=blue area"), token, null, 200)).get(0);
        assertThat(blue.get("compatibility").asText()).isEqualTo("PARTIAL");
        assertThat(blue.get("compatibleChargers").asInt()).isEqualTo(3);
        assertThat(blue.get("effectiveMaxPowerKw").asDouble()).isEqualTo(88);
        assertThat(blue.get("connectors").toString()).doesNotContain("CHADEMO");

        // Details: per-charger compatibility
        long stationId = blue.get("id").asLong();
        JsonNode detail = call(get("/api/stations/" + stationId + "?vehicleId=" + byd), token, null, 200);
        JsonNode chademoBay = null;
        for (JsonNode c : detail.get("chargers")) {
            if (c.get("connectorType").asText().equals("CHADEMO")) chademoBay = c;
            if (c.get("connectorType").asText().equals("TYPE2")) {
                assertThat(c.get("matchType").asText()).isEqualTo("CCS2_AC_INLET");
            }
        }
        assertThat(chademoBay.get("compatible").asBoolean()).isFalse();

        // Pre-booking: BYD on the CHAdeMO bay → BLOCKED with a recommendation
        JsonNode blocked = call(post("/api/compatibility/pre-booking-check"), token,
                "{\"vehicleId\":%d,\"stationId\":%d,\"chargerId\":%d}".formatted(byd, stationId, chademoBay.get("id").asLong()), 200);
        assertThat(blocked.get("verdict").asText()).isEqualTo("BLOCKED");
        assertThat(blocked.get("recommendedChargerId").isNull()).isFalse();
        assertThat(blocked.get("checks").toString()).contains("CONNECTOR", "BLOCKER");

        // Pre-booking: engine picks the best charger; Leaf on 10% from Lahore can't reach Islamabad
        JsonNode leafCheck = call(post("/api/compatibility/pre-booking-check"), token,
                "{\"vehicleId\":%d,\"stationId\":%d,\"lat\":31.52,\"lng\":74.35}".formatted(leaf, stationId), 200);
        assertThat(leafCheck.get("chargerLabel").asText()).isNotEmpty();
        assertThat(leafCheck.get("verdict").asText()).isEqualTo("WARNING");
        assertThat(leafCheck.get("checks").toString()).contains("RANGE", "may not reach");

        // Station under maintenance → BLOCKED
        long f10 = results(call(get("/api/stations?q=f-10"), token, null, 200)).get(0).get("id").asLong();
        assertThat(call(post("/api/compatibility/pre-booking-check"), token,
                "{\"vehicleId\":%d,\"stationId\":%d}".formatted(byd, f10), 200).get("verdict").asText()).isEqualTo("BLOCKED");

        // Someone else's vehicle is not visible
        String other = driver("other@test.com");
        call(get("/api/stations?vehicleId=" + byd), other, null, 404);
        call(post("/api/compatibility/pre-booking-check"), other,
                "{\"vehicleId\":%d,\"stationId\":%d}".formatted(byd, stationId), 404);
        call(post("/api/compatibility/pre-booking-check"), token, "{\"stationId\":%d}".formatted(stationId), 400);
    }
}
