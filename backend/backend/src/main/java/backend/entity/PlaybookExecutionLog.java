package backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "playbook_execution_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaybookExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_id", nullable = false)
    @JsonIgnore
    private PlaybookExecution playbookExecution;

    @Column(name = "step_name", nullable = false, length = 100)
    private String stepName;

    @Column(nullable = false, length = 50)
    private String status; // PENDING, RUNNING, SUCCESS, FAILED

    @Column(name = "log_level", nullable = false, length = 20)
    private String logLevel; // INFO, WARN, ERROR

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
