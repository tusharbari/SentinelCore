package backend.config;

import backend.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
@Configuration
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {

        return configuration.getAuthenticationManager();

    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http

                .csrf(csrf -> csrf.disable())

                .cors(Customizer.withDefaults())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth

                        // ===========================
                        // Public APIs
                        // ===========================
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/assets/register").permitAll()
                        .requestMatchers("/api/assets/heartbeat").permitAll()
                        .requestMatchers("/api/playbooks/simulate-brute-force").permitAll()
                        .requestMatchers("/api/playbooks/target-status").permitAll()
                        .requestMatchers("/api/playbooks/reset-simulation").permitAll()
                        .requestMatchers("/api/playbooks/simulate-phishing").permitAll()
                        .requestMatchers("/api/playbooks/executions/**").permitAll()

                        // ===========================
                        // WebSocket
                        // ===========================
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/topic/**").permitAll()
                        .requestMatchers("/app/**").permitAll()

                        // ===========================
                        // Users
                        // ===========================
                        .requestMatchers("/api/users/**")
                        .hasRole("ADMIN")

                        // ===========================
                        // Roles
                        // ===========================
                        .requestMatchers("/api/roles/**")
                        .hasRole("ADMIN")

                        // ===========================
                        // Dashboard
                        // ===========================
                        .requestMatchers("/api/dashboard/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")

                        // ===========================
                        // Asset APIs
                        // ===========================
                        .requestMatchers(HttpMethod.GET,
                                "/api/assets/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")

                        .requestMatchers(HttpMethod.POST,
                                "/api/assets/**")
                        .hasAnyRole("ADMIN", "ANALYST")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/assets/**")
                        .hasAnyRole("ADMIN", "ANALYST")

                        .requestMatchers(HttpMethod.DELETE,
                                "/api/assets/**")
                        .hasRole("ADMIN")

                        // ===========================
                        // Threat APIs
                        // ===========================
                        .requestMatchers(HttpMethod.GET,
                                "/api/threats/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")

                        .requestMatchers(HttpMethod.POST,
                                "/api/threats/**")
                        .hasAnyRole("ADMIN", "ANALYST")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/threats/**")
                        .hasAnyRole("ADMIN", "ANALYST")

                        .requestMatchers(HttpMethod.DELETE,
                                "/api/threats/**")
                        .hasRole("ADMIN")

                        // ===========================
                        // IOC APIs
                        // ===========================
                        .requestMatchers(HttpMethod.GET,
                                "/api/ioc/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")

                        .requestMatchers(HttpMethod.POST,
                                "/api/ioc/**")
                        .hasAnyRole("ADMIN", "ANALYST")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/ioc/**")
                        .hasAnyRole("ADMIN", "ANALYST")

                        .requestMatchers(HttpMethod.DELETE,
                                "/api/ioc/**")
                        .hasRole("ADMIN")

                        // ===========================
                        // Alerts
                        // ===========================
                        .requestMatchers(HttpMethod.GET,
                                "/api/alerts/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")

                        .requestMatchers(HttpMethod.POST,
                                "/api/alerts/**")
                        .hasAnyRole("ADMIN", "ANALYST")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/alerts/**")
                        .hasAnyRole("ADMIN", "ANALYST")

                        .requestMatchers(HttpMethod.DELETE,
                                "/api/alerts/**")
                        .hasRole("ADMIN")

                        // ===========================
                        // Notifications
                        // ===========================
                        .requestMatchers(HttpMethod.GET,
                                "/api/notifications/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/notifications/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")

                        .requestMatchers(HttpMethod.DELETE,
                                "/api/notifications/**")
                        .hasRole("ADMIN")

                        // ===========================
                        // Reports
                        // ===========================
                        .requestMatchers("/api/reports/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")

                        // ===========================
                        // Allow OPTIONS
                        // ===========================
                        .requestMatchers(HttpMethod.OPTIONS, "/**")
                        .permitAll()

                        // ===========================
                        // Everything Else
                        // ===========================
                        .anyRequest()
                        .authenticated()

                )

                .httpBasic(httpBasic -> httpBasic.disable())

                .formLogin(form -> form.disable());

        http.addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
        );

        return http.build();

    }

}