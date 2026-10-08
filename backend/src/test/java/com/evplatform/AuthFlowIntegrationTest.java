package com.evplatform;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.evplatform.mail.MailService;
import com.evplatform.security.TotpService;
import com.evplatform.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired TotpService totp;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean MailService mail;

    private static final String PASSWORD = "Str0ng@Pass";

    @Test
    void fullDriverFlow() throws Exception {
        String email = "driver1@test.com";

        // Signup
        call(post("/api/auth/signup"), """
                {"fullName":"Ali Khan","email":"%s","password":"%s","phone":"03001234567","role":"DRIVER"}
                """.formatted(email, PASSWORD)).andExpect(status().isCreated());

        // Duplicate email
        call(post("/api/auth/signup"), """
                {"fullName":"Ali Khan","email":"%s","password":"%s","phone":"03001234567","role":"DRIVER"}
                """.formatted(email.toUpperCase(), PASSWORD)).andExpect(status().isConflict());

        // Login before verification is blocked
        call(post("/api/auth/login"), login(email, PASSWORD))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("EMAIL_NOT_VERIFIED"));

        // Verify email with the mailed code
        String code = capturedVerificationCode(email);
        call(post("/api/auth/verify-email"), "{\"email\":\"%s\",\"code\":\"000000\"}".formatted(email))
                .andExpect(status().isBadRequest());
        call(post("/api/auth/verify-email"), "{\"email\":\"%s\",\"code\":\"%s\"}".formatted(email, code))
                .andExpect(status().isOk());

        // Phone is stored encrypted
        String rawPhone = jdbc.queryForObject("select phone from users where email = ?", String.class, email);
        assertThat(rawPhone).doesNotContain("3001234567");

        // Login works
        String token = json(call(post("/api/auth/login"), login(email, PASSWORD))
                .andExpect(status().isOk())).get("accessToken").asText();

        call(get("/api/auth/me").header("Authorization", "Bearer " + token), null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("DRIVER"))
                .andExpect(jsonPath("$.phone").value("+923001234567"));

        // Vehicles
        call(post("/api/vehicles").header("Authorization", "Bearer " + token), """
                {"make":"BYD","model":"Atto 3","year":2024,"batteryCapacityKwh":60.48,"connectorType":"CCS2",
                 "rangeKm":420,"currentBatteryPercent":50,"licensePlate":"lea-1234"}
                """).andExpect(status().isCreated())
                .andExpect(jsonPath("$.primaryVehicle").value(true))
                .andExpect(jsonPath("$.estimatedRangeLeftKm").value(210))
                .andExpect(jsonPath("$.licensePlate").value("LEA-1234"));

        call(post("/api/vehicles").header("Authorization", "Bearer " + token), """
                {"make":"","model":"X","year":1999,"batteryCapacityKwh":5,"connectorType":"CCS2",
                 "rangeKm":10,"currentBatteryPercent":150}
                """).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.make").exists())
                .andExpect(jsonPath("$.fieldErrors.year").exists())
                .andExpect(jsonPath("$.fieldErrors.currentBatteryPercent").exists());

        JsonNode second = json(call(post("/api/vehicles").header("Authorization", "Bearer " + token), """
                {"make":"MG","model":"ZS EV","year":2023,"batteryCapacityKwh":51,"connectorType":"TYPE2",
                 "rangeKm":320,"currentBatteryPercent":80,"primaryVehicle":true}
                """).andExpect(status().isCreated()));
        long secondId = second.get("id").asLong();

        call(get("/api/vehicles").header("Authorization", "Bearer " + token), null)
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(secondId))
                .andExpect(jsonPath("$[1].primaryVehicle").value(false));

        call(delete("/api/vehicles/" + secondId).header("Authorization", "Bearer " + token), null)
                .andExpect(status().isNoContent());
        call(get("/api/vehicles").header("Authorization", "Bearer " + token), null)
                .andExpect(jsonPath("$[0].primaryVehicle").value(true));

        // Driver cannot reach admin API
        call(get("/api/admin/users").header("Authorization", "Bearer " + token), null)
                .andExpect(status().isForbidden());

        // Enable MFA
        String secret = json(call(post("/api/profile/mfa/setup").header("Authorization", "Bearer " + token), null)
                .andExpect(status().isOk())).get("secret").asText();
        call(post("/api/profile/mfa/enable").header("Authorization", "Bearer " + token),
                "{\"code\":\"%s\"}".formatted(totp.currentCode(secret)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mfaEnabled").value(true));

        // Login now needs a second step
        JsonNode first = json(call(post("/api/auth/login"), login(email, PASSWORD)).andExpect(status().isOk()));
        assertThat(first.get("mfaRequired").asBoolean()).isTrue();
        assertThat(first.get("accessToken").isNull()).isTrue();
        String mfaToken = first.get("mfaToken").asText();

        // MFA token cannot be used as an access token
        call(get("/api/auth/me").header("Authorization", "Bearer " + mfaToken), null)
                .andExpect(status().isUnauthorized());

        call(post("/api/auth/login/mfa"), "{\"mfaToken\":\"%s\",\"code\":\"%s\"}"
                .formatted(mfaToken, totp.currentCode(secret)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    void passwordResetAndLockout() throws Exception {
        String email = "owner1@test.com";
        call(post("/api/auth/signup"), """
                {"fullName":"Sara Ahmed","email":"%s","password":"%s","phone":"+923211234567","role":"STATION_OWNER"}
                """.formatted(email, PASSWORD)).andExpect(status().isCreated());
        call(post("/api/auth/verify-email"), "{\"email\":\"%s\",\"code\":\"%s\"}"
                .formatted(email, capturedVerificationCode(email))).andExpect(status().isOk());

        // Station owner cannot manage vehicles
        String token = json(call(post("/api/auth/login"), login(email, PASSWORD))).get("accessToken").asText();
        call(get("/api/vehicles").header("Authorization", "Bearer " + token), null)
                .andExpect(status().isForbidden());

        // 5 wrong passwords lock the account
        for (int i = 0; i < 5; i++) {
            call(post("/api/auth/login"), login(email, "Wrong@Pass1")).andExpect(status().isUnauthorized());
        }
        call(post("/api/auth/login"), login(email, PASSWORD)).andExpect(status().isLocked());

        // Reset password unlocks
        call(post("/api/auth/forgot-password"), "{\"email\":\"%s\"}".formatted(email)).andExpect(status().isOk());
        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(mail).sendPasswordResetCode(eq(email), anyString(), codeCaptor.capture(), anyLong());

        call(post("/api/auth/reset-password"), """
                {"email":"%s","code":"%s","newPassword":"weak"}
                """.formatted(email, codeCaptor.getValue()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.newPassword").exists());
        call(post("/api/auth/reset-password"), """
                {"email":"%s","code":"%s","newPassword":"N3w@Password"}
                """.formatted(email, codeCaptor.getValue())).andExpect(status().isOk());

        call(post("/api/auth/login"), login(email, "N3w@Password")).andExpect(status().isOk());
    }

    @Test
    void signupValidationAndAdminRules() throws Exception {
        call(post("/api/auth/signup"), """
                {"fullName":"A1","email":"bad","password":"short","phone":"12345","role":"DRIVER"}
                """).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.fullName").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists())
                .andExpect(jsonPath("$.fieldErrors.phone").exists());

        call(post("/api/auth/signup"), """
                {"fullName":"Evil Admin","email":"evil@test.com","password":"%s","phone":"03001234567","role":"ADMIN"}
                """.formatted(PASSWORD)).andExpect(status().isBadRequest());

        // Seeded admin can sign in and list users
        String token = json(call(post("/api/auth/login"), login("admin@evplatform.local", "Admin@12345"))
                .andExpect(status().isOk())).get("accessToken").asText();
        call(get("/api/admin/users").header("Authorization", "Bearer " + token), null)
                .andExpect(status().isOk());

        call(get("/api/profile"), null).andExpect(status().isUnauthorized());
    }

    private String capturedVerificationCode(String email) {
        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(mail, org.mockito.Mockito.atLeastOnce())
                .sendVerificationCode(eq(email), anyString(), captor.capture(), anyLong());
        return captor.getValue();
    }

    private static String login(String email, String password) {
        return "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password);
    }

    private ResultActions call(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder req,
                               String body) throws Exception {
        if (body != null) {
            req.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mvc.perform(req);
    }

    private JsonNode json(ResultActions result) throws Exception {
        return mapper.readTree(result.andReturn().getResponse().getContentAsString());
    }
}
