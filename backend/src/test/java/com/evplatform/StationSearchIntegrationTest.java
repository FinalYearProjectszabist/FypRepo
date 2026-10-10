package com.evplatform;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.evplatform.config.TimeConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** Runs against the seeded demo stations, with the clock fixed at 23:00 Pakistan time. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StationSearchIntegrationTest {

    @TestConfiguration
    static class FixedClock {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(ZonedDateTime.of(2026, 10, 10, 23, 0, 0, 0, TimeConfig.PAKISTAN).toInstant(),
                    TimeConfig.PAKISTAN);
        }
    }

    // Blue Area, Islamabad
    private static final String ISB = "lat=33.7086&lng=73.0551";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    private String token;

    @BeforeEach
    void login() throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@evplatform.local\",\"password\":\"Admin@12345\"}"))
                .andReturn().getResponse().getContentAsString();
        token = mapper.readTree(body).get("accessToken").asText();
    }

    private JsonNode search(String query) throws Exception {
        String body = mvc.perform(get("/api/stations?" + query).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(body);
    }

    private static List<JsonNode> results(JsonNode res) {
        List<JsonNode> list = new ArrayList<>();
        res.get("results").forEach(list::add);
        return list;
    }

    @Test
    void requiresSignIn() throws Exception {
        mvc.perform(get("/api/stations")).andExpect(status().isUnauthorized());
    }

    @Test
    void locationSearchIsWithinRadiusAndSortedByDistance() throws Exception {
        JsonNode res = search(ISB + "&radiusKm=15");
        List<JsonNode> list = results(res);
        assertThat(list).isNotEmpty();
        assertThat(res.get("sort").asText()).isEqualTo("DISTANCE");
        assertThat(list.get(0).get("name").asText()).isEqualTo("Blue Area Supercharge Hub");
        double prev = -1;
        for (JsonNode s : list) {
            double d = s.get("distanceKm").asDouble();
            assertThat(d).isLessThanOrEqualTo(15).isGreaterThanOrEqualTo(prev);
            assertThat(s.get("city").asText()).isIn("Islamabad", "Rawalpindi");
            prev = d;
        }
        // Lahore is ~270 km away
        assertThat(list).noneMatch(s -> s.get("city").asText().equals("Lahore"));
    }

    @Test
    void categoryAndTextSearch() throws Exception {
        assertThat(results(search("category=HOME")))
                .isNotEmpty().allMatch(s -> s.get("category").asText().equals("HOME"));
        assertThat(results(search("q=liberty")))
                .extracting(s -> s.get("name").asText()).containsExactly("Liberty Market Supercharge");
        assertThat(results(search("city=karachi")))
                .isNotEmpty().allMatch(s -> s.get("city").asText().equals("Karachi"));
    }

    @Test
    void connectorPowerAndPriceFilters() throws Exception {
        List<JsonNode> chademo = results(search("connectors=CHADEMO"));
        assertThat(chademo).isNotEmpty().allMatch(s -> s.get("connectors").toString().equals("[\"CHADEMO\"]"));

        assertThat(results(search("minPowerKw=150")))
                .isNotEmpty().allMatch(s -> s.get("maxPowerKw").asDouble() >= 150);

        List<JsonNode> cheap = results(search("maxPrice=60&sort=PRICE"));
        assertThat(cheap).isNotEmpty().allMatch(s -> s.get("minPricePerKwh").asDouble() <= 60);
        for (int i = 1; i < cheap.size(); i++) {
            assertThat(cheap.get(i).get("minPricePerKwh").asDouble())
                    .isGreaterThanOrEqualTo(cheap.get(i - 1).get("minPricePerKwh").asDouble());
        }
    }

    @Test
    void availabilityStatusAndOpenNow() throws Exception {
        // 23:00 — F-7 café (closes 23:30) is open; Centaurus (closes 22:00) is closed
        List<JsonNode> available = results(search("availableOnly=true"));
        assertThat(available).isNotEmpty()
                .allMatch(s -> s.get("availability").asText().equals("AVAILABLE") && s.get("availableChargers").asInt() > 0);
        assertThat(available).extracting(s -> s.get("name").asText())
                .contains("F-7 Markaz Café Charge").doesNotContain("Centaurus Mall EV Point");

        assertThat(results(search("openNow=true")))
                .allMatch(s -> s.get("openNow").asBoolean());

        assertThat(results(search("statuses=MAINTENANCE,OFFLINE")))
                .extracting(s -> s.get("availability").asText()).containsOnly("UNAVAILABLE");
    }

    @Test
    void ratingFacilitiesAndSort() throws Exception {
        List<JsonNode> res = results(search("minRating=4.5&facilities=WIFI,CAFE&sort=RATING"));
        assertThat(res).isNotEmpty();
        for (JsonNode s : res) {
            assertThat(s.get("rating").asDouble()).isGreaterThanOrEqualTo(4.5);
            assertThat(s.get("facilities").toString()).contains("WIFI", "CAFE");
        }
        for (int i = 1; i < res.size(); i++) {
            assertThat(res.get(i).get("rating").asDouble())
                    .isLessThanOrEqualTo(res.get(i - 1).get("rating").asDouble());
        }

        List<JsonNode> power = results(search(ISB + "&radiusKm=50&sort=POWER"));
        assertThat(power.get(0).get("maxPowerKw").asDouble()).isEqualTo(150);
    }

    @Test
    void detailsAndValidation() throws Exception {
        long id = results(search("q=bhera")).get(0).get("id").asLong();
        mvc.perform(get("/api/stations/" + id + "?" + ISB).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chargers.length()").value(3))
                .andExpect(jsonPath("$.summary.distanceKm").isNumber());

        mvc.perform(get("/api/stations/999999").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/stations?lat=33.7").header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/stations?" + ISB + "&radiusKm=9999").header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.radiusKm").exists());

        mvc.perform(get("/api/stations/filters").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cities").isArray());
    }
}
