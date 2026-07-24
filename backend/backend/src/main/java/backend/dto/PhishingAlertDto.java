package backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhishingAlertDto {

    @NotBlank(message = "Title is required")
    private String title;

    private String severity;

    private String source;

    private String status;

    private String description;

    private String emailSender;

    private String emailRecipient;

    private String emailSubject;

    private String emailBody;

    private String emailUrls;

    private String emailAttachments;
}
