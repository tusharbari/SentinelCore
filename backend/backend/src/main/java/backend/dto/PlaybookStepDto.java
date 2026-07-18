package backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaybookStepDto {

    private Long id;

    @NotNull(message = "Step order is required")
    @Min(value = 1, message = "Step order must be at least 1")
    private Integer stepOrder;

    @NotBlank(message = "Step name is required")
    private String name;

    @NotBlank(message = "Action type is required")
    private String actionType; // ISOLATE_HOST, BLOCK_IP, DISABLE_USER, SCAN_VULNERABILITY, SEND_NOTIFICATION, CREATE_INCIDENT

    private String parametersJson;
}
