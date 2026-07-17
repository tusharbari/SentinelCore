package backend.controller;
import backend.dto.RegisterRequest;
import backend.dto.JwtResponse;
import backend.dto.LoginRequest;
import backend.dto.TokenRefreshRequest;
import backend.dto.TokenRefreshResponse;
import backend.entity.RefreshToken;
import backend.security.JwtUtil;
import backend.service.AuthService;
import backend.service.RefreshTokenService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public JwtResponse login(@RequestBody LoginRequest request) {

        return authService.login(
                request.getEmail(),
                request.getPassword()
        );

    }

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {

        return authService.register(request);

    }

    @PostMapping("/refreshtoken")
    public ResponseEntity<?> refreshtoken(@Valid @RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String role = user.getRole().getName();
                    if ("USER".equalsIgnoreCase(role)) {
                        role = "VIEWER";
                    }
                    String token = jwtUtil.generateToken(user.getEmail(), role);
                    return ResponseEntity.ok(new TokenRefreshResponse(token, requestRefreshToken));
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(@RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        if (requestRefreshToken != null) {
            refreshTokenService.findByToken(requestRefreshToken)
                    .ifPresent(token -> refreshTokenService.deleteByUser(token.getUser()));
        }
        return ResponseEntity.ok("Log out successful");
    }
}