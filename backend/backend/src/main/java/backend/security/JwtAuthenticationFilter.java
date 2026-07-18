package backend.security;

import backend.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;


    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {


        // Debug: Check if filter is called
        System.out.println(
                "JWT FILTER CALLED: "
                + request.getMethod()
                + " "
                + request.getRequestURI()
        );


        String authHeader = request.getHeader("Authorization");

        System.out.println("Authorization Header: " + authHeader);


        String token = null;
        String email = null;


        // Extract JWT token
        if (authHeader != null && authHeader.startsWith("Bearer ")) {

            token = authHeader.substring(7);

            try {
                email = jwtUtil.extractUsername(token);
            }
            catch (Exception e) {
                System.out.println("Invalid JWT Token");
            }
        }


        // Authenticate user
        if (email != null &&
                SecurityContextHolder.getContext().getAuthentication() == null) {


            UserDetails userDetails =
                    userDetailsService.loadUserByUsername(email);


            System.out.println("JWT Email: " + email);
            System.out.println("Database Authority: "
                    + userDetails.getAuthorities());


            if (jwtUtil.validateToken(token, userDetails.getUsername())) {


                String role = jwtUtil.extractRole(token);


                System.out.println("JWT Role: " + role);


                if (role != null && !role.isBlank()) {


                    String authority = role.toUpperCase();


                    // Avoid ROLE_ROLE_ADMIN problem
                    if (!authority.startsWith("ROLE_")) {
                        authority = "ROLE_" + authority;
                    }


                    userDetails =
                            org.springframework.security.core.userdetails.User
                                    .withUsername(userDetails.getUsername())
                                    .password(userDetails.getPassword())
                                    .authorities(authority)
                                    .build();
                }


                System.out.println(
                        "Final Authority: "
                        + userDetails.getAuthorities()
                );


                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );


                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );


                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);


                System.out.println("JWT Authentication Successful");

            }
            else {
                System.out.println("JWT Validation Failed");
            }

        }
        else {

            if(email == null) {
                System.out.println("No valid JWT email found");
            }

        }


        filterChain.doFilter(request, response);

    }
}