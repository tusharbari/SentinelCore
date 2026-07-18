package backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaybookExecutionDto {

    private Long id;
    private Long playbookId;
    private String playbookName;
    private Long incidentId;
    private String incidentTitle;
    private String status; // PENDING, RUNNING, SUCCESS, FAILED
    private String currentStep;
    private Integer currentStepIndex;
    private Integer progress;
    private Long triggeredById;
    private String triggeredByName;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime createdAt;
}
