package com.arcaneiceman.kraken.krakenserver.service;

import com.arcaneiceman.kraken.krakenserver.domain.User;
import com.arcaneiceman.kraken.krakenserver.repository.UserRepository;
import com.arcaneiceman.kraken.krakenserver.security.AuthoritiesConstants;
import com.arcaneiceman.kraken.krakenserver.security.SecurityUtils;
import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import org.hibernate.Session;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import javax.persistence.EntityManager;
import java.util.Date;
import java.util.Objects;

import static org.zalando.problem.Status.BAD_REQUEST;
import static org.zalando.problem.Status.NOT_FOUND;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    @Value("${spring.security.user.name}")
    private String systemAdminEmail;

    @Value("${spring.security.user.password}")
    private String systemAdminPassword;

    @Autowired
    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       EntityManager entityManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.entityManager = entityManager;
    }

    @PostConstruct
    public void checkVariables() {
        if (systemAdminEmail == null)
            throw new IllegalStateException("User Service - System Admin Email not found");
        if (systemAdminPassword == null)
            throw new IllegalStateException("User Service - System Admin Password not found");
    }

    @EventListener({ContextRefreshedEvent.class})
    public void createSystemAdmin() {
        if (!getUserExistsByEmail(systemAdminEmail))
            createUser(systemAdminEmail, "system-admin", systemAdminPassword,
                    AuthoritiesConstants.SYSTEM_ADMIN, true, null);
    }

    @EventListener({ContextRefreshedEvent.class})
    @Profile("local")
    public void createLocalUser() {
        if (!getUserExistsByEmail("local@local"))
            createUser("local@local", "Kraken Admin", "admin",
                    AuthoritiesConstants.CONSUMER, true, null);
    }

    public User createUser(String email, String name, String password, String authority, Boolean isActive, String activationKey) {
        return userRepository.save(new User(null, email, name, password != null ? passwordEncoder.encode(password) : null,
                authority, isActive, activationKey, new Date().getTime()));
    }

    public User activateUser(String email, String activationKey) {
        User user = getUserByEmail(email);
        if (Objects.equals(user.getActivationKey(), activationKey))
            user.setIsActive(true);
        else
            throw new SystemException(1321, "Activation Key is incorrect", BAD_REQUEST);
        return userRepository.save(user);
    }

    public void changePassword(String oldPassword, String newPassword) {
        User user = getUserOrThrow();
        if (Objects.equals(newPassword, oldPassword))
            throw new SystemException(95, "Old password and new password cannot be the same", BAD_REQUEST);

        String encryptedPassword = passwordEncoder.encode(newPassword);

        user.setPassword(encryptedPassword);
        userRepository.save(user);

        // Remove From Cache
        Session session = entityManager.unwrap(Session.class);
        session.getSessionFactory().getCache().evictEntityData(User.class, user.getId());
    }

    public User requestPasswordReset(String email, String password) {
        User user = getUserByEmail(email);
        String encryptedPassword = passwordEncoder.encode(password);
        user.setPassword(encryptedPassword);
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User getUserOrThrow() {
        return userRepository.findByUsername(SecurityUtils.getCurrentUsernameFromContext())
                .orElseThrow(() -> new SystemException(6, "Could not recover current user from repository", NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findUserByEmail(email)
                .orElseThrow(() -> new SystemException(32, "Did not find user", NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public boolean getUserExistsByEmail(String email) {
        return userRepository.findUserByEmail(email).isPresent();
    }

}



