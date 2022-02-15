package com.arcaneiceman.kraken.krakenserver.service.utils;

import com.arcaneiceman.kraken.krakenserver.config.OAuthUserServiceConfiguration;
import com.arcaneiceman.kraken.krakenserver.domain.User;
import com.arcaneiceman.kraken.krakenserver.security.AuthoritiesConstants;
import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.zalando.problem.Status;

import javax.annotation.PostConstruct;
import java.util.Map;

@Service
public class OAuthUserService {

    @Autowired
    OAuthUserServiceConfiguration oAuthUserServiceConfiguration;

    @PostConstruct
    public void verifyVariables() {
        if (oAuthUserServiceConfiguration == null)
            throw new IllegalStateException("Recaptcha Configuration could not be found");
    }

    // TODO Integrate Retry Template
    public User findUser(String provider, String accessToken) {
        if (oAuthUserServiceConfiguration.getIsInDebug())
            return new User(null, "test@test.com", "test", "password",
                    AuthoritiesConstants.CONSUMER, true, null, null);
        String url = oAuthUserServiceConfiguration.getProviders().get(provider.toLowerCase());
        if (url == null || url.isEmpty())
            throw new SystemException(6565, "No Authorized URL for provider " + provider, Status.BAD_REQUEST);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + accessToken);
        HttpEntity<String> request = new HttpEntity<>(headers);
        ResponseEntity<Map> recaptchaResponseEntity =
                oAuthUserServiceConfiguration.getRestTemplate().exchange(url, HttpMethod.GET, request, Map.class);
        Map<String, String> responseBody = recaptchaResponseEntity.getBody();
        if (responseBody == null)
            throw new SystemException(3434, "Could not fetch response from " + provider, Status.BAD_REQUEST);

        String email = responseBody.get("email");
        if (email == null || email.isEmpty())
            throw new SystemException(2324, "Could not fetch email from " + provider + " (Is it accessible?)", Status.BAD_REQUEST);
        String name = responseBody.get("name");
        if (name == null || name.isEmpty())
            throw new SystemException(4343, "Could not fetch name from " + provider + " (Is it accessible?)", Status.BAD_REQUEST);
        return new User(null, email, name, null, AuthoritiesConstants.CONSUMER, true, null, null);
    }
}
