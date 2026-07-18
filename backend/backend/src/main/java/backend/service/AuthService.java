package backend.service;

import backend.dto.JwtResponse;
import backend.dto.RegisterRequest;
import backend.entity.Role;
import backend.entity.User;
import backend.repository.RoleRepository;
import backend.repository.UserRepository;
import backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // ===========================
    // LOGIN
    // ===========================
    public JwtResponse login(String email, String password) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid Password");
        }

        String role = user.getRole().getName();

        String token = jwtUtil.generateToken(
                user.getEmail(),
                role
        );

        return new JwtResponse(
                token,
                user.getEmail(),
                role,
                "Login Successful"
        );
    }

    // ===========================
    // REGISTER
    // ===========================
    public String register(RegisterRequest request) {

        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        // Assign default role
        Role role = roleRepository.findByName("ANALYST")
                .orElseThrow(() -> new RuntimeException("Role not found"));

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setEnabled(true);

        userRepository.save(user);

        return "Registration Successful";
    }
}