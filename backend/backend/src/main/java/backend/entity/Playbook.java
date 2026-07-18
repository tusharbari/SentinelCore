package backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "playbooks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Playbook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "trigger_type", nullable = false, length = 50)
    private String triggerType; // ALERT_SEVERITY, ALERT_TYPE, MANUAL, THREAT_DETECTED

    @Column(name = "trigger_value", length = 100)
    private String triggerValue; // e.g., 'Critical' or 'Brute Force'

    @Column(name = "conditions_json", columnDefinition = "TEXT")
    private String conditionsJson;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "playbook", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("stepOrder ASC")
    @Builder.Default
    private List<PlaybookStep> steps = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
