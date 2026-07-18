package backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    // Secret Key (minimum 32 characters)
    private static final String SECRET =
            "SentinelCoreSecretKey12345678901234567890";

    private final SecretKey secretKey = Keys.hmacShaKeyFor(SECRET.getBytes());

    // 24 Hours
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 24;

    // ================= Generate Token =================

    public String generateToken(String email, String role) {

        Map<String, Object> claims = new HashMap<>();

        claims.put("role", role);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // ================= Extract Email =================

    public String extractUsername(String token) {

        return extractClaims(token).getSubject();

    }

    // ================= Extract Role =================

    public String extractRole(String token) {

        return extractClaims(token).get("role", String.class);

    }

    // ================= Validate Token =================

    public boolean validateToken(String token, String email) {

        return email.equals(extractUsername(token))
                && !isTokenExpired(token);

    }

    // ================= Check Expiration =================

    private boolean isTokenExpired(String token) {

        return extractClaims(token)
                .getExpiration()
                .before(new Date());

    }

    // ================= Extract Claims =================

    private Claims extractClaims(String token) {

        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

    }

}