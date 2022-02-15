package com.arcaneiceman.kraken.krakenserver.service.utils;

import com.arcaneiceman.kraken.krakenserver.config.EmailConfiguration;
import com.arcaneiceman.kraken.krakenserver.domain.ActiveRequest;
import com.arcaneiceman.kraken.krakenserver.domain.User;
import com.arcaneiceman.kraken.krakenserver.domain.Worker;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.RetryCallback;
import org.springframework.retry.RetryContext;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.zalando.problem.Status;

import javax.annotation.PostConstruct;
import javax.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class EmailService {

    @Autowired
    private EmailConfiguration emailConfiguration;

    @Autowired
    private JavaMailSender client;

    @Autowired
    private TemplateEngine templateEngine;

    @Value("${application.mail.from-address}")
    private String fromEmail;

    @Value("${application.mail.personal}")
    private String personal;

    @Value("${application.mail.web-url}")
    private String webURL;

    @PostConstruct
    public void verifyConfiguration() {
        if (emailConfiguration == null)
            throw new IllegalStateException("Email Configuration could not be found");
        if (templateEngine == null)
            throw new IllegalStateException("Template Engine not found");
    }

    @Async
    public void sendWelcomeEmail(User user) throws UnsupportedEncodingException {
        Context context = createDefaultContext(user);
        Map<String, ClassPathResource> inlineAttachments = createDefaultInlineAttachments();

        if (user.getActivationKey() != null && !user.getActivationKey().isEmpty()) {
            context.setVariable("activation_link", webURL + "activation" + "?" +
                    "email=" + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8.toString())
                    + "&" + "activationKey=" + user.getActivationKey());
            context.setVariable("activation_key", user.getActivationKey());
        }

        sendEmail(user.getEmail(), fromEmail, personal, "Welcome", context,
                "welcome_email.html", inlineAttachments, new HashMap<>());
    }

    @Async
    public void sendNewPasswordEmail(User user, String newPassword) {
        Context context = createDefaultContext(user);
        Map<String, ClassPathResource> inlineAttachments = createDefaultInlineAttachments();

        context.setVariable("new_password", newPassword);

        sendEmail(user.getEmail(), fromEmail, personal, "New Password Requested", context,
                "new_password_requested_email.html", inlineAttachments, new HashMap<>());
    }

    @Async
    public void sendChangedPasswordEmail(User user) {
        Context context = createDefaultContext(user);
        Map<String, ClassPathResource> inlineAttachments = createDefaultInlineAttachments();
        sendEmail(user.getEmail(), fromEmail, personal, "Changed Password", context,
                "changed_password_email.html", inlineAttachments, new HashMap<>());
    }

    @Async
    public void sendWorkerOfflineEmail(User user, Worker worker) {
        Context context = createDefaultContext(user);
        Map<String, ClassPathResource> inlineAttachments = createDefaultInlineAttachments();

        context.setVariable("worker_name", worker.getName());

        sendEmail(user.getEmail(), fromEmail, personal, "Worker Offline", context,
                "worker_offline_email.html", inlineAttachments, new HashMap<>());
    }

    @Async
    public void sendRequestCompleteEmail(User user, ActiveRequest request, TrackingStatus status) {
        Context context = createDefaultContext(user);
        Map<String, ClassPathResource> inlineAttachments = createDefaultInlineAttachments();

        context.setVariable("active_request_name", request.getRequestName());
        context.setVariable("status", status);

        sendEmail(user.getEmail(), fromEmail, personal, "Request Complete", context,
                "request_complete_email.html", inlineAttachments, new HashMap<>());
    }

    private Context createDefaultContext(User user) {
        // Create Context
        Locale locale = Locale.forLanguageTag("en");
        Context context = new Context(locale);

        // Set Text Variables
        context.setVariable("user_name", user.getName());

        // Set Image Variables
        context.setVariable("kraken_logo", "kraken_logo.png");

        return context;
    }

    private Map<String, ClassPathResource> createDefaultInlineAttachments() {
        Map<String, ClassPathResource> inlineAttachments = new HashMap<>();
        inlineAttachments.put("kraken_logo.png", new ClassPathResource("mails/assets/kraken_logo.png"));
        return inlineAttachments;
    }

    /**
     * Send a Thymeleaf based template email
     *
     * @param to                  email address of the receiver
     * @param from                email address of the sender
     * @param personal            personal name of the sender
     * @param subject             email subject
     * @param context             Thymeleaf context variables
     * @param templateName        name of the html template file (most likely in resources) which Thymeleaf will process
     * @param inlineAttachments   Map of inline attachments such as images in the template
     * @param externalAttachments Map of external attachments to send with this email
     */
    private void sendEmail(String to,
                           String from,
                           String personal,
                           String subject,
                           Context context,
                           String templateName,
                           Map<String, ClassPathResource> inlineAttachments,
                           Map<String, ClassPathResource> externalAttachments) {

        if (!emailConfiguration.isConfigured()) {
            emailConfiguration.getLog().warn("Email client is not configured hence email not sent");
            return;
        }

        try {
            // Convert Thymeleaf context to HTML content
            String htmlContent = templateEngine.process(templateName, context);
            // Prepare message using a Spring helper
            MimeMessage mimeMessage = client.createMimeMessage();

            MimeMessageHelper message = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            message.setTo(to);
            message.setFrom(from, personal);
            message.setSubject(subject);
            message.setText(htmlContent, true);

            for (Map.Entry<String, ClassPathResource> entry : inlineAttachments.entrySet())
                message.addInline(entry.getKey(), entry.getValue());

            for (Map.Entry<String, ClassPathResource> entry : externalAttachments.entrySet())
                message.addAttachment(entry.getKey(), entry.getValue());

            emailConfiguration.getRetryTemplate().execute(new RetryCallback<String, Exception>() {
                @Override
                public String doWithRetry(RetryContext context) {
                    if (emailConfiguration.getIsInDebug() != null && emailConfiguration.getIsInDebug())
                        emailConfiguration.getLog().info("Email Service is in debug mode and was not sent");
                    else
                        client.send(mimeMessage);
                    return null;
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
