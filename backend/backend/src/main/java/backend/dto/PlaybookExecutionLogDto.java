package backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaybookExecutionLogDto {

    private Long id;
    private Long executionId;
    private String stepName;
    private String status; // PENDING, RUNNING, SUCCESS, FAILED
    private String logLevel; // INFO, WARN, ERROR
    private String message;
    private LocalDateTime timestamp;
}
