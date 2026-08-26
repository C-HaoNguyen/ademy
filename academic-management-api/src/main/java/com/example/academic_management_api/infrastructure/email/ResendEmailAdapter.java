package com.example.academic_management_api.infrastructure.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class ResendEmailAdapter extends JavaMailEmailSenderAdapter {

    public ResendEmailAdapter(JavaMailSender mailSender, @Value("${mail.from-address}") String fromAddress) {
        super(mailSender, fromAddress);
    }
}
