package backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetHeartbeatDto {
    private String hostname;
    private String macAddress;
    private Double cpuUsage;
    private Double ramUsage;
    private Double diskUsage;
}
