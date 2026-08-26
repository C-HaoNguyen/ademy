package com.example.academic_management_api.application.port;

public interface EmailSenderPort {

    void send(String to, String subject, String htmlBody);
}
