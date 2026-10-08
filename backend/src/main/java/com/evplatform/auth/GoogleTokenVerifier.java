package com.evplatform.auth;

import com.evplatform.common.ApiException;
import com.evplatform.config.AppProperties;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Verifies a Google Sign-In ID token (sent by the React app after the Google button)
 * using Google's tokeninfo endpoint, and checks it was issued for our client id.
 */
@Component
public class GoogleTokenVerifier {

    public record GoogleProfile(String email, String name, boolean emailVerified) {}

    private final RestClient restClient = RestClient.create("https://oauth2.googleapis.com");
    private final AppProperties props;

    public GoogleTokenVerifier(AppProperties props) {
        this.props = props;
    }

    public GoogleProfile verify(String idToken) {
        String clientId = props.google().clientId();
        if (!StringUtils.hasText(clientId)) {
            throw ApiException.badRequest("Google sign-in is not configured on the server (GOOGLE_CLIENT_ID)");
        }
        JsonNode info;
        try {
            info = restClient.get()
                    .uri(uri -> uri.path("/tokeninfo").queryParam("id_token", idToken).build())
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            throw ApiException.unauthorized("Google sign-in failed. Please try again.");
        }
        if (info == null || !clientId.equals(info.path("aud").asText())) {
            throw ApiException.unauthorized("Google token was not issued for this application");
        }
        String email = info.path("email").asText(null);
        if (email == null) {
            throw ApiException.unauthorized("Google account has no email");
        }
        return new GoogleProfile(
                email,
                info.path("name").asText(email.substring(0, email.indexOf('@'))),
                "true".equals(info.path("email_verified").asText()));
    }
}
