package com.evplatform.mail;

import com.evplatform.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Sends emails through JavaMail. When app.mail.enabled=false (default for local dev)
 * the message is printed to the console instead, so you can copy the code from the logs.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender sender;
    private final AppProperties props;

    public MailService(JavaMailSender sender, AppProperties props) {
        this.sender = sender;
        this.props = props;
    }

    @Async
    public void send(String to, String subject, String body) {
        if (!props.mail().enabled()) {
            log.info("""

                    ======== EMAIL (mail disabled, printed instead) ========
                    To: {}
                    Subject: {}

                    {}
                    ========================================================""", to, subject, body);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(props.mail().from());
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            sender.send(msg);
        } catch (Exception e) {
            log.error("Failed to send email to {}", to, e);
        }
    }

    public void sendVerificationCode(String to, String name, String code, long minutes) {
        send(to, "Verify your EV Platform account",
                "Hi " + name + ",\n\nYour verification code is: " + code
                        + "\n\nIt expires in " + minutes + " minutes.\n\n— EV Charging Platform");
    }

    public void sendPasswordResetCode(String to, String name, String code, long minutes) {
        send(to, "Reset your EV Platform password",
                "Hi " + name + ",\n\nYour password reset code is: " + code
                        + "\n\nIt expires in " + minutes + " minutes. If you did not request this, ignore this email."
                        + "\n\n— EV Charging Platform");
    }
}
