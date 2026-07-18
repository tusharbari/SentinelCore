package backend.dto;

public class JwtResponse {

    private String token;
    private String refreshToken;
    private String email;
    private String role;
    private String message;

    public JwtResponse() {
    }

    public JwtResponse(String token, String email, String role, String message) {
        this.token = token;
        this.email = email;
        this.role = role;
        this.message = message;
    }

    public JwtResponse(String token, String refreshToken, String email, String role, String message) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.email = email;
        this.role = role;
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}