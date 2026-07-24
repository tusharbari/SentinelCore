package backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assets")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_id", unique = true, nullable = false)
    private String assetId;

    @Column(unique = true, nullable = false)
    private String hostname;

    @Column(name = "asset_name", nullable = false)
    private String assetName;

    @Column(name = "ip_address", unique = true, nullable = false)
    private String ipAddress;

    @Column(name = "mac_address", nullable = false)
    private String macAddress;

    @Column(name = "device_type", nullable = false)
    private String deviceType;

    @Column(name = "operating_system", nullable = false)
    private String operatingSystem;

    @Column(name = "os_version")
    private String osVersion;

    @Column(nullable = false)
    private String owner;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String environment; // Production/Test/Development

    @Column(nullable = false)
    private String criticality; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "patch_status", nullable = false)
    private String patchStatus; // UPDATED, OUTDATED, UNKNOWN

    @Column(name = "last_patch_date")
    private LocalDate lastPatchDate;

    @Column(name = "last_seen")
    private LocalDateTime lastSeen;

    @Column(nullable = false)
    private String status; // ONLINE, OFFLINE

    @Column(name = "risk_score")
    private Integer riskScore;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
