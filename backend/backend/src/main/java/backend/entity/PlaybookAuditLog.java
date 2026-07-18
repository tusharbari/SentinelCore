package backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "playbook_audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaybookAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType; // CREATE_PLAYBOOK, UPDATE_PLAYBOOK, DELETE_PLAYBOOK, TRIGGER_PLAYBOOK, STEP_EXECUTE

    @Column(name = "entity_id")
    private Long entityId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "performed_by_id")
    private User performedBy;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
