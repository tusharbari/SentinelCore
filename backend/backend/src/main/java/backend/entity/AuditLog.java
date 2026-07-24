package backend.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action;

    private String description;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    @ManyToOne
    @JoinColumn(name = "user_id")
    // Prevents infinite JSON loops and ignores Hibernate proxy handlers during lazy loading
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "role"})
    private User user;

    @ManyToOne
    @JoinColumn(name = "incident_id")
    // Prevents infinite loops if Incident also has a reference to AuditLog
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "auditLogs"})
    private Incident incident;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @ManyToOne
    @JoinColumn(name = "asset_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Asset asset;
}