package com.example.academic_management_api.seeder;

import com.example.academic_management_api.entity.Users;
import com.example.academic_management_api.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Configuration
public class AdminSeeder {
    @Bean
    CommandLineRunner initAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (userRepository.existsByRole("ADMIN")) {
                return;
            }

            Users admin = new Users();
            admin.setUsername("admin");
            admin.setFullName("System Administrator");
            admin.setEmail("admin@ademy.com");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            admin.setActive(true);

            userRepository.save(admin);

            System.out.println("Default admin account created");
        };
    }
}
