package backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "playbook_executions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaybookExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "playbook_id")
    private Playbook playbook;

    @Column(name = "playbook_name", length = 100)
    private String playbookName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "incident_id", insertable = false, updatable = false)
    private Incident incident;

    @Column(name = "incident_id")
    private Long incidentId;

    @Column(nullable = false, length = 50)
    private String status; // PENDING, RUNNING, SUCCESS, FAILED

    @Column(name = "current_step", length = 100)
    private String currentStep;

    @Column(name = "current_step_index", nullable = false)
    @Builder.Default
    private Integer currentStepIndex = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer progress = 0;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "triggered_by_id")
    private User triggeredBy;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
    }
}
