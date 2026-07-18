package backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "playbook_steps", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"playbook_id", "step_order"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaybookStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playbook_id", nullable = false)
    @JsonIgnore
    private Playbook playbook;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType; // ISOLATE_HOST, BLOCK_IP, DISABLE_USER, SCAN_VULNERABILITY, SEND_NOTIFICATION, CREATE_INCIDENT

    @Column(name = "parameters_json", columnDefinition = "TEXT")
    private String parametersJson;

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
