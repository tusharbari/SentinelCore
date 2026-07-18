package backend.dto.request;

import lombok.Data;

@Data
public class IncidentUpdateRequest {

    private String title;

    private String description;

    private String severity;

    private String priority;

    private String status;

    private Long assignedTo;
}