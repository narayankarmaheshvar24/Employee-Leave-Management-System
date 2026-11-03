
package com.example.EmployeeLeaveManagement;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordUtil {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String rawPassword = "Admin@123";
        String encodedPassword = encoder.encode(rawPassword);

        System.out.println("Encoded password:");
        System.out.println(encodedPassword);
    }
}
