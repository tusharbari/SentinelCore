package backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentDto {

    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Severity is required")
    @Pattern(regexp = "Low|Medium|High|Critical", message = "Severity must be Low, Medium, High, or Critical")
    private String severity;

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "Open|Investigating|Resolved|Closed", message = "Status must be Open, Investigating, Resolved, or Closed")
    private String status;

    @NotBlank(message = "Source is required")
    private String source;

    private Long assignedToId;
    private String assignedToName;
    private String priority;
    private Boolean escalated;
    private LocalDateTime slaDeadline;
    private Long assetId;
    private String assetName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
