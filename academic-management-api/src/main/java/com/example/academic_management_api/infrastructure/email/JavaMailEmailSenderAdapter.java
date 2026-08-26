package com.example.academic_management_api.infrastructure.email;

import com.example.academic_management_api.application.port.EmailSenderPort;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

/**
 * Logic gửi email dùng chung qua {@link JavaMailSender} — {@link MailpitEmailAdapter} (local) và
 * {@link ResendEmailAdapter} (prod) chỉ khác nhau ở cấu hình SMTP theo profile (Spring Boot tự
 * chọn qua {@code application-{profile}.properties}), không khác gì ở cách tạo/gửi message.
 */
abstract class JavaMailEmailSenderAdapter implements EmailSenderPort {

    private final JavaMailSender mailSender;
    private final String fromAddress;

    protected JavaMailEmailSenderAdapter(JavaMailSender mailSender, String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    @Override
    public void send(String to, String subject, String htmlBody) {
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
        } catch (MessagingException e) {
            throw new MailSendException("Không thể tạo email", e);
        }
        mailSender.send(message);
    }
}
