package com.arcaneiceman.kraken.krakenserver.service.utils;

import com.arcaneiceman.kraken.krakenserver.config.RecaptchaConfiguration;
import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.zalando.problem.Status;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

@Service
public class RecaptchaService {

    @Autowired
    RecaptchaConfiguration recaptchaConfiguration;

    @PostConstruct
    public void verifyVariables() {
        if (recaptchaConfiguration == null)
            throw new IllegalStateException("Recaptcha Configuration could not be found");
    }

    // TODO : Add retry template to this
    public void verifyRecaptcha(String recaptchaResponse) {
        if (recaptchaConfiguration.getIsInDebug() || !recaptchaConfiguration.isConfigured())
            return;
        if (recaptchaResponse.isEmpty())
            throw new SystemException(231, "Please fill the captcha", Status.BAD_REQUEST);
        Map<String, String> body = new HashMap<>();
        body.put("secret", recaptchaConfiguration.getRecaptchaSecret());
        body.put("response", recaptchaResponse);
        ResponseEntity<Map> recaptchaResponseEntity = recaptchaConfiguration.getRestTemplate()
                .postForEntity(recaptchaConfiguration.getRecaptchaSecret() + "?secret={secret}&response={response}", body, Map.class, body);
        Map<String, Object> responseBody = recaptchaResponseEntity.getBody();
        if (responseBody != null && responseBody.get("success") != null && (Boolean) responseBody.get("success"))
            return;
        else
            throw new SystemException(232, "Could not validate captcha", Status.UNAUTHORIZED);
    }


}
