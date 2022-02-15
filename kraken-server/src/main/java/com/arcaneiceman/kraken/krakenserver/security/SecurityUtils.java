package com.arcaneiceman.kraken.krakenserver.security;

import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.zalando.problem.Status;

/**
 * Created by Wali on 13/03/18.
 */
public class SecurityUtils {

    public static String getCurrentUsernameFromContext() {
        try {
            SecurityContext securityContext = SecurityContextHolder.getContext();
            Authentication authentication = securityContext.getAuthentication();
            if (authentication.getPrincipal() instanceof UserDetails) {
                UserDetails springSecurityUser = (UserDetails) authentication.getPrincipal();
                return springSecurityUser.getUsername();
            } else if (authentication.getPrincipal() instanceof String)
                return (String) authentication.getPrincipal();
            else
                throw new Exception();
        } catch (Exception e) {
            throw new SystemException(1, "Failed to retrieve security context", Status.INTERNAL_SERVER_ERROR);
        }
    }

}
