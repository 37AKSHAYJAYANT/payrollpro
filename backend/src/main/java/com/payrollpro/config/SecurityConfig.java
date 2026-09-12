package com.payrollpro.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    // Only true in the dev/default profile; the prod profile sets this to false.
    @Value("${spring.h2.console.enabled:false}")
    private boolean h2ConsoleEnabled;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .headers(headers -> {
                    if (h2ConsoleEnabled) {
                        // H2 console (dev only) renders inside a same-origin iframe.
                        headers.frameOptions(frame -> frame.sameOrigin());
                    }
                    // Otherwise keep the default X-Frame-Options: DENY (clickjacking protection).
                })
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers("/api/auth/login", "/api/auth/register", "/error").permitAll();

                    // H2 console is only reachable when explicitly enabled (dev profile).
                    if (h2ConsoleEnabled) {
                        auth.requestMatchers("/h2-console/**").permitAll();
                    }

                    // Health check is public (used by cloud platform probes);
                    // all other actuator endpoints require authentication.
                    auth.requestMatchers("/actuator/health").permitAll();
                    auth.requestMatchers("/actuator/**").authenticated();

                    // Public static frontend assets & SPA routes.
                    auth.requestMatchers(
                            "/",
                            "/index.html",
                            "/assets/**",
                            "/*.ico",
                            "/*.png",
                            "/*.svg",
                            "/*.js",
                            "/*.css",
                            "/login",
                            "/register",
                            "/dashboard",
                            "/dashboard/**",
                            "/employees",
                            "/employees/**",
                            "/leaves",
                            "/leaves/**",
                            "/loans",
                            "/loans/**",
                            "/expenses",
                            "/expenses/**",
                            "/settlements",
                            "/settlements/**",
                            "/tax",
                            "/tax/**",
                            "/attendance",
                            "/attendance/**",
                            "/payroll",
                            "/payroll/**",
                            "/employee/**",
                            "/my-payslips",
                            "/my-payslips/**"
                    ).permitAll();

                    auth.requestMatchers("/api/**").authenticated();

                    // Fail closed: anything not explicitly matched above is denied.
                    auth.anyRequest().denyAll();
                })
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
