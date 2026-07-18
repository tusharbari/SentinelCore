package backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlaybookTriggerRequest {

    @NotNull(message = "Playbook ID is required")
    private Long playbookId;

    private Long incidentId;
}
