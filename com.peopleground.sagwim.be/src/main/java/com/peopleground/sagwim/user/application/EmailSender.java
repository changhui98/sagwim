package com.peopleground.sagwim.user.application;

public interface EmailSender {

    void sendVerificationEmail(String toEmail, String code);
}
