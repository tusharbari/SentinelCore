package backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetDto {

    private Long id;

    private String assetId;

    @NotBlank(message = "Hostname is required")
    private String hostname;

    @NotBlank(message = "Asset Name is required")
    private String assetName;

    @NotBlank(message = "IP Address is required")
    @Pattern(
        regexp = "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
        message = "Invalid IP Address format"
    )
    private String ipAddress;

    @NotBlank(message = "MAC Address is required")
    @Pattern(
        regexp = "^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$",
        message = "Invalid MAC Address format (e.g. 00:50:56:AB:CD:12)"
    )
    private String macAddress;

    @NotBlank(message = "Device Type is required")
    private String deviceType;

    @NotBlank(message = "Operating System is required")
    private String operatingSystem;

    private String osVersion;

    @NotBlank(message = "Owner is required")
    private String owner;

    @NotBlank(message = "Department is required")
    private String department;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Environment is required")
    @Pattern(regexp = "Production|Test|Development", message = "Environment must be Production, Test, or Development")
    private String environment;

    @NotBlank(message = "Criticality is required")
    @Pattern(regexp = "LOW|MEDIUM|HIGH|CRITICAL", message = "Criticality must be LOW, MEDIUM, HIGH, or CRITICAL")
    private String criticality;

    @NotBlank(message = "Patch Status is required")
    @Pattern(regexp = "UPDATED|OUTDATED|UNKNOWN", message = "Patch Status must be UPDATED, OUTDATED, or UNKNOWN")
    private String patchStatus;

    private LocalDate lastPatchDate;

    private LocalDateTime lastSeen;

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "ONLINE|OFFLINE|MAINTENANCE", message = "Status must be ONLINE, OFFLINE, or MAINTENANCE")
    private String status;

    @Min(value = 0, message = "Risk score must be at least 0")
    @Max(value = 100, message = "Risk score cannot exceed 100")
    private Integer riskScore;

    private Double cpuUsage;
    private Double ramUsage;
    private Double diskUsage;
    private Double totalStorage;
    private Double freeStorage;
    private Double totalRam;
    private Boolean agentInstalled;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
