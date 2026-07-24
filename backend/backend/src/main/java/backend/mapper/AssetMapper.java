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
                .build();
    }
}
