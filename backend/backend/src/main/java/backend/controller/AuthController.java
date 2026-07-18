package backend.controller;
import backend.dto.RegisterRequest;
import backend.dto.JwtResponse;
import backend.dto.LoginRequest;
import backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
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
}