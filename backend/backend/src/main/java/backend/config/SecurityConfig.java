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
            AuthenticationConfiguration configuration)
            throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public APIs
                        .requestMatchers("/api/auth/**").permitAll()

                        // User Management
                        .requestMatchers("/api/users/**").hasRole("ADMIN")

                        // Roles
                        .requestMatchers("/api/roles/**").hasRole("ADMIN")

                        // Dashboard
                        .requestMatchers("/api/dashboard/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")

                        // Threat APIs
                        .requestMatchers(HttpMethod.GET, "/api/threats/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                        .requestMatchers(HttpMethod.POST, "/api/threats/**")
                        .hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.PUT, "/api/threats/**")
                        .hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.DELETE, "/api/threats/**")
                        .hasRole("ADMIN")

                        // IOC APIs
                        .requestMatchers(HttpMethod.GET, "/api/ioc/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                        .requestMatchers(HttpMethod.POST, "/api/ioc/**")
                        .hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.PUT, "/api/ioc/**")
                        .hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.DELETE, "/api/ioc/**")
                        .hasRole("ADMIN")

                        // Alert APIs
                        .requestMatchers(HttpMethod.GET, "/api/alerts/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                        .requestMatchers(HttpMethod.POST, "/api/alerts/**")
                        .hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.PUT, "/api/alerts/**")
                        .hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.DELETE, "/api/alerts/**")
                        .hasRole("ADMIN")

                        // Vulnerability APIs
                        .requestMatchers(HttpMethod.GET, "/api/vulnerabilities/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")

                        .requestMatchers(HttpMethod.POST, "/api/vulnerabilities/**")
                        .hasAnyRole("ADMIN", "ANALYST")

                        .requestMatchers(HttpMethod.PUT, "/api/vulnerabilities/**")
                        .hasAnyRole("ADMIN", "ANALYST")

                        // Report APIs
                        .requestMatchers("/api/reports/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")

                        // Playbook APIs
                        .requestMatchers(HttpMethod.GET, "/api/playbooks/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                        .requestMatchers(HttpMethod.POST, "/api/playbooks/**")
                        .hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.PUT, "/api/playbooks/**")
                        .hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.DELETE, "/api/playbooks/**")
                        .hasRole("ADMIN")

                        // Incident APIs
                        .requestMatchers(HttpMethod.GET, "/api/incidents/**")
                        .hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                        .requestMatchers(HttpMethod.POST, "/api/incidents/**")
                        .hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.PUT, "/api/incidents/**")
                        .hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.DELETE, "/api/incidents/**")
                        .hasRole("ADMIN")

                        // Allow Preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**")
                        .permitAll()

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
