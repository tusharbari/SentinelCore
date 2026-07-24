package backend.service;

import backend.dto.AssetDto;
import backend.entity.Asset;
import backend.entity.User;
import backend.exception.DuplicateResourceException;
import backend.exception.ResourceNotFoundException;
import backend.mapper.AssetMapper;
import backend.repository.AssetRepository;
import backend.repository.UserRepository;
import backend.specification.AssetSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AssetService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final AssetMapper assetMapper;
    private final AuditLogService auditLogService;

    // Get paginated and filtered assets
    public Page<AssetDto> getAssets(String hostname, String owner, String status,
                                   String criticality, String patchStatus, Pageable pageable) {
        Specification<Asset> spec = Specification.where(AssetSpecification.hasHostname(hostname))
                .and(AssetSpecification.hasOwner(owner))
                .and(AssetSpecification.hasStatus(status))
                .and(AssetSpecification.hasCriticality(criticality))
                .and(AssetSpecification.hasPatchStatus(patchStatus));

        return assetRepository.findAll(spec, pageable).map(assetMapper::toDto);
    }

    // Get asset by ID
    public AssetDto getAssetById(Long id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + id));
        return assetMapper.toDto(asset);
    }

    // Create asset
    @Transactional
    public AssetDto createAsset(AssetDto dto) {
        // Validate unique constraints
        if (assetRepository.findByHostname(dto.getHostname()).isPresent()) {
            throw new DuplicateResourceException("Asset with hostname '" + dto.getHostname() + "' already exists");
        }
        if (assetRepository.findByIpAddress(dto.getIpAddress()).isPresent()) {
            throw new DuplicateResourceException("Asset with IP Address '" + dto.getIpAddress() + "' already exists");
        }

        Asset asset = assetMapper.toEntity(dto);
        asset.setAssetId(generateAssetId());

        if (asset.getLastSeen() == null) {
            asset.setLastSeen(LocalDateTime.now());
        }

        Asset savedAsset = assetRepository.save(asset);

        auditLogService.createLog(
                "CREATE",
                "Asset created: " + savedAsset.getAssetName() + " (" + savedAsset.getAssetId() + ")",
                getCurrentUser()
        );

        return assetMapper.toDto(savedAsset);
    }

    // Update asset
    @Transactional
    public AssetDto updateAsset(Long id, AssetDto dto) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + id));

        // Validate unique constraints if changed
        Optional<Asset> optHost = assetRepository.findByHostname(dto.getHostname());
        if (optHost.isPresent() && !optHost.get().getId().equals(id)) {
            throw new DuplicateResourceException("Asset with hostname '" + dto.getHostname() + "' already exists");
        }

        Optional<Asset> optIp = assetRepository.findByIpAddress(dto.getIpAddress());
        if (optIp.isPresent() && !optIp.get().getId().equals(id)) {
            throw new DuplicateResourceException("Asset with IP Address '" + dto.getIpAddress() + "' already exists");
        }

        // Apply changes
        asset.setHostname(dto.getHostname());
        asset.setAssetName(dto.getAssetName());
        asset.setIpAddress(dto.getIpAddress());
        asset.setMacAddress(dto.getMacAddress());
        asset.setDeviceType(dto.getDeviceType());
        asset.setOperatingSystem(dto.getOperatingSystem());
        asset.setOsVersion(dto.getOsVersion());
        asset.setOwner(dto.getOwner());
        asset.setDepartment(dto.getDepartment());
        asset.setLocation(dto.getLocation());
        asset.setEnvironment(dto.getEnvironment());
        asset.setCriticality(dto.getCriticality().toUpperCase());
        asset.setPatchStatus(dto.getPatchStatus().toUpperCase());
        asset.setLastPatchDate(dto.getLastPatchDate());
        asset.setStatus(dto.getStatus().toUpperCase());
        asset.setRiskScore(dto.getRiskScore());
        if (dto.getLastSeen() != null) {
            asset.setLastSeen(dto.getLastSeen());
        }

        Asset updatedAsset = assetRepository.save(asset);

        auditLogService.createLog(
                "UPDATE",
                "Asset updated: " + updatedAsset.getAssetName() + " (" + updatedAsset.getAssetId() + ")",
                getCurrentUser()
        );

        return assetMapper.toDto(updatedAsset);
    }

    // Delete asset
    @Transactional
    public void deleteAsset(Long id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + id));

        auditLogService.createLog(
                "DELETE",
                "Asset deleted: " + asset.getAssetName() + " (" + asset.getAssetId() + ")",
                getCurrentUser()
        );

        assetRepository.delete(asset);
    }

    // Search Assets (Non-paginated)
    public List<AssetDto> searchAssets(String hostname, String owner, String status,
                                      String criticality, String patchStatus) {
        Specification<Asset> spec = Specification.where(AssetSpecification.hasHostname(hostname))
                .and(AssetSpecification.hasOwner(owner))
                .and(AssetSpecification.hasStatus(status))
                .and(AssetSpecification.hasCriticality(criticality))
                .and(AssetSpecification.hasPatchStatus(patchStatus));

        return assetRepository.findAll(spec).stream()
                .map(assetMapper::toDto)
                .collect(Collectors.toList());
    }

    // Dashboard Stats
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        long total = assetRepository.count();
        long critical = assetRepository.countByCriticality("CRITICAL");
        long online = assetRepository.countByStatus("ONLINE");
        long offline = assetRepository.countByStatus("OFFLINE");
        long outdated = assetRepository.countByPatchStatus("OUTDATED");

        stats.put("totalAssets", total);
        stats.put("criticalAssets", critical);
        stats.put("onlineAssets", online);
        stats.put("offlineAssets", offline);
        stats.put("outdatedAssets", outdated);

        // Distributions for Recharts charts
        List<Map<String, Object>> riskDist = new ArrayList<>();
        for (String crit : new String[]{"CRITICAL", "HIGH", "MEDIUM", "LOW"}) {
            riskDist.add(Map.of("name", crit, "value", assetRepository.countByCriticality(crit)));
        }
        stats.put("riskDistribution", riskDist);

        // Device Type Distribution
        Map<String, Long> deviceCounts = assetRepository.findAll().stream()
                .collect(Collectors.groupingBy(Asset::getDeviceType, Collectors.counting()));
        List<Map<String, Object>> deviceDist = deviceCounts.entrySet().stream()
                .map(e -> Map.of("name", e.getKey(), "value", (Object) e.getValue()))
                .collect(Collectors.toList());
        stats.put("deviceTypeDistribution", deviceDist);

        // Patch Status Distribution
        List<Map<String, Object>> patchDist = new ArrayList<>();
        for (String ps : new String[]{"UPDATED", "OUTDATED", "UNKNOWN"}) {
            patchDist.add(Map.of("name", ps, "value", assetRepository.countByPatchStatus(ps)));
        }
        stats.put("patchStatusDistribution", patchDist);

        // Latest Assets
        List<AssetDto> latest = assetRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent().stream().map(assetMapper::toDto).collect(Collectors.toList());
        stats.put("latestAssets", latest);

        // Recently Updated Assets
        List<AssetDto> recentlyUpdated = assetRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "updatedAt"))
        ).getContent().stream().map(assetMapper::toDto).collect(Collectors.toList());
        stats.put("recentlyUpdatedAssets", recentlyUpdated);

        return stats;
    }

    // CSV Exporter
    public byte[] exportAssetsToCsv() {
        List<Asset> assets = assetRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
        StringBuilder sb = new StringBuilder();
        // Header
        sb.append("hostname,assetName,ipAddress,macAddress,deviceType,operatingSystem,osVersion,owner,department,location,environment,criticality,patchStatus,lastPatchDate,lastSeen,status,riskScore\n");

        for (Asset a : assets) {
            sb.append(escapeCsvField(a.getHostname())).append(",")
              .append(escapeCsvField(a.getAssetName())).append(",")
              .append(escapeCsvField(a.getIpAddress())).append(",")
              .append(escapeCsvField(a.getMacAddress())).append(",")
              .append(escapeCsvField(a.getDeviceType())).append(",")
              .append(escapeCsvField(a.getOperatingSystem())).append(",")
              .append(escapeCsvField(a.getOsVersion())).append(",")
              .append(escapeCsvField(a.getOwner())).append(",")
              .append(escapeCsvField(a.getDepartment())).append(",")
              .append(escapeCsvField(a.getLocation())).append(",")
              .append(escapeCsvField(a.getEnvironment())).append(",")
              .append(escapeCsvField(a.getCriticality())).append(",")
              .append(escapeCsvField(a.getPatchStatus())).append(",")
              .append(a.getLastPatchDate() != null ? a.getLastPatchDate().toString() : "").append(",")
              .append(a.getLastSeen() != null ? a.getLastSeen().toString() : "").append(",")
              .append(escapeCsvField(a.getStatus())).append(",")
              .append(a.getRiskScore() != null ? a.getRiskScore().toString() : "").append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    // CSV Importer
    @Transactional
    public int importAssetsFromCsv(InputStream is) throws IOException {
        int count = 0;
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String headerLine = br.readLine();
            if (headerLine == null) {
                return 0;
            }

            // Parse headers
            List<String> headers = parseCsvLine(headerLine);
            Map<String, Integer> headerMap = new HashMap<>();
            for (int i = 0; i < headers.size(); i++) {
                headerMap.put(headers.get(i).trim(), i);
            }

            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) {
                    continue;
                }
                List<String> fields = parseCsvLine(line);
                if (fields.size() < headers.size()) {
                    // Pad with empty strings if CSV has short rows
                    while (fields.size() < headers.size()) {
                        fields.add("");
                    }
                }

                String hostname = getCsvValue(fields, headerMap, "hostname");
                String ipAddress = getCsvValue(fields, headerMap, "ipAddress");

                if (hostname == null || hostname.isEmpty() || ipAddress == null || ipAddress.isEmpty()) {
                    continue; // Skip invalid rows
                }

                // Check for existing asset by hostname or ip
                Optional<Asset> existingOpt = assetRepository.findByHostname(hostname);
                if (existingOpt.isEmpty()) {
                    existingOpt = assetRepository.findByIpAddress(ipAddress);
                }

                Asset asset;
                boolean isNew = false;
                if (existingOpt.isPresent()) {
                    asset = existingOpt.get();
                } else {
                    asset = new Asset();
                    asset.setAssetId(generateAssetId());
                    asset.setHostname(hostname);
                    asset.setIpAddress(ipAddress);
                    isNew = true;
                }

                // Update fields
                asset.setAssetName(getCsvValueOrDefault(fields, headerMap, "assetName", "Asset-" + hostname));
                asset.setMacAddress(getCsvValueOrDefault(fields, headerMap, "macAddress", "00:00:00:00:00:00"));
                asset.setDeviceType(getCsvValueOrDefault(fields, headerMap, "deviceType", "Server"));
                asset.setOperatingSystem(getCsvValueOrDefault(fields, headerMap, "operatingSystem", "Unknown"));
                asset.setOsVersion(getCsvValue(fields, headerMap, "osVersion"));
                asset.setOwner(getCsvValueOrDefault(fields, headerMap, "owner", "Unassigned"));
                asset.setDepartment(getCsvValueOrDefault(fields, headerMap, "department", "IT"));
                asset.setLocation(getCsvValueOrDefault(fields, headerMap, "location", "Unknown"));
                
                String env = getCsvValueOrDefault(fields, headerMap, "environment", "Production");
                // Capitalize first letter to match Validation (Production, Test, Development)
                if (env.equalsIgnoreCase("production")) env = "Production";
                if (env.equalsIgnoreCase("test")) env = "Test";
                if (env.equalsIgnoreCase("development")) env = "Development";
                asset.setEnvironment(env);

                asset.setCriticality(getCsvValueOrDefault(fields, headerMap, "criticality", "MEDIUM").toUpperCase());
                asset.setPatchStatus(getCsvValueOrDefault(fields, headerMap, "patchStatus", "UNKNOWN").toUpperCase());

                String lpdStr = getCsvValue(fields, headerMap, "lastPatchDate");
                if (lpdStr != null && !lpdStr.isEmpty()) {
                    try {
                        asset.setLastPatchDate(LocalDate.parse(lpdStr));
                    } catch (DateTimeParseException e) {
                        // ignore
                    }
                }

                String lsStr = getCsvValue(fields, headerMap, "lastSeen");
                if (lsStr != null && !lsStr.isEmpty()) {
                    try {
                        asset.setLastSeen(LocalDateTime.parse(lsStr));
                    } catch (DateTimeParseException e) {
                        asset.setLastSeen(LocalDateTime.now());
                    }
                } else {
                    asset.setLastSeen(LocalDateTime.now());
                }

                asset.setStatus(getCsvValueOrDefault(fields, headerMap, "status", "ONLINE").toUpperCase());

                String rsStr = getCsvValue(fields, headerMap, "riskScore");
                if (rsStr != null && !rsStr.isEmpty()) {
                    try {
                        asset.setRiskScore(Integer.parseInt(rsStr));
                    } catch (NumberFormatException e) {
                        asset.setRiskScore(0);
                    }
                } else {
                    asset.setRiskScore(0);
                }

                assetRepository.save(asset);
                count++;

                auditLogService.createLog(
                        isNew ? "CREATE" : "UPDATE",
                        "Asset imported/upserted via CSV: " + asset.getAssetName() + " (" + asset.getAssetId() + ")",
                        getCurrentUser()
                );
            }
        }
        return count;
    }

    // Helper to generate next AST ID sequentially
    private synchronized String generateAssetId() {
        return assetRepository.findFirstByOrderByIdDesc()
                .map(lastAsset -> {
                    String lastIdStr = lastAsset.getAssetId();
                    if (lastIdStr != null && lastIdStr.startsWith("AST-")) {
                        try {
                            int numericPart = Integer.parseInt(lastIdStr.substring(4));
                            return String.format("AST-%04d", numericPart + 1);
                        } catch (NumberFormatException e) {
                            // ignore and fall through
                        }
                    }
                    return "AST-0001";
                })
                .orElse("AST-0001");
    }

    private String getCsvValue(List<String> fields, Map<String, Integer> headerMap, String key) {
        Integer index = headerMap.get(key);
        if (index == null || index >= fields.size()) {
            return null;
        }
        return fields.get(index);
    }

    private String getCsvValueOrDefault(List<String> fields, Map<String, Integer> headerMap, String key, String defaultValue) {
        String val = getCsvValue(fields, headerMap, key);
        return (val == null || val.trim().isEmpty()) ? defaultValue : val;
    }

    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                values.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        values.add(sb.toString().trim());
        return values;
    }

    private String escapeCsvField(String field) {
        if (field == null) return "";
        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }
}
