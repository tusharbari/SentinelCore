package backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaybookDto {

    private Long id;

    @NotBlank(message = "Playbook name is required")
    private String name;

    private String description;

    @NotBlank(message = "Trigger type is required")
    private String triggerType; // ALERT_SEVERITY, ALERT_TYPE, MANUAL, THREAT_DETECTED

    private String triggerValue;
    private String conditionsJson;
    private Boolean isActive;
    private List<PlaybookStepDto> steps;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
