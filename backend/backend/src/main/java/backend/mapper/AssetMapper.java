package backend.mapper;

import backend.dto.AssetDto;
import backend.entity.Asset;
import org.springframework.stereotype.Component;

@Component
public class AssetMapper {

    public AssetDto toDto(Asset asset) {
        if (asset == null) {
            return null;
        }
        return AssetDto.builder()
                .id(asset.getId())
                .assetId(asset.getAssetId())
                .hostname(asset.getHostname())
                .assetName(asset.getAssetName())
                .ipAddress(asset.getIpAddress())
                .macAddress(asset.getMacAddress())
                .deviceType(asset.getDeviceType())
                .operatingSystem(asset.getOperatingSystem())
                .osVersion(asset.getOsVersion())
                .owner(asset.getOwner())
                .department(asset.getDepartment())
                .location(asset.getLocation())
                .environment(asset.getEnvironment())
                .criticality(asset.getCriticality())
                .patchStatus(asset.getPatchStatus())
                .lastPatchDate(asset.getLastPatchDate())
                .lastSeen(asset.getLastSeen())
                .status(asset.getStatus())
                .riskScore(asset.getRiskScore())
                .cpuUsage(asset.getCpuUsage())
                .ramUsage(asset.getRamUsage())
                .diskUsage(asset.getDiskUsage())
                .totalStorage(asset.getTotalStorage())
                .freeStorage(asset.getFreeStorage())
                .totalRam(asset.getTotalRam())
                .agentInstalled(asset.getAgentInstalled())
                .createdAt(asset.getCreatedAt())
                .updatedAt(asset.getUpdatedAt())
                .build();
    }

    public Asset toEntity(AssetDto dto) {
        if (dto == null) {
            return null;
        }
        return Asset.builder()
                .id(dto.getId())
                .assetId(dto.getAssetId())
                .hostname(dto.getHostname())
                .assetName(dto.getAssetName())
                .ipAddress(dto.getIpAddress())
                .macAddress(dto.getMacAddress())
                .deviceType(dto.getDeviceType())
                .operatingSystem(dto.getOperatingSystem())
                .osVersion(dto.getOsVersion())
                .owner(dto.getOwner())
                .department(dto.getDepartment())
                .location(dto.getLocation())
                .environment(dto.getEnvironment())
                .criticality(dto.getCriticality())
                .patchStatus(dto.getPatchStatus())
                .lastPatchDate(dto.getLastPatchDate())
                .lastSeen(dto.getLastSeen())
                .status(dto.getStatus())
                .riskScore(dto.getRiskScore())
                .cpuUsage(dto.getCpuUsage())
                .ramUsage(dto.getRamUsage())
                .diskUsage(dto.getDiskUsage())
                .totalStorage(dto.getTotalStorage())
                .freeStorage(dto.getFreeStorage())
                .totalRam(dto.getTotalRam())
                .agentInstalled(dto.getAgentInstalled())
                .build();
    }
}
