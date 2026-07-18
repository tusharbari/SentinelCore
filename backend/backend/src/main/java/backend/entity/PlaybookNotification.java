package backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "playbook_notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaybookNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_id", nullable = false)
    @JsonIgnore
    private PlaybookExecution playbookExecution;

    @Column(nullable = false)
    private String recipient;

    @Column(nullable = false, length = 50)
    private String channel; // EMAIL, SLACK, IN_APP

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(nullable = false, length = 50)
    private String status; // PENDING, SENT, FAILED

    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }
}
