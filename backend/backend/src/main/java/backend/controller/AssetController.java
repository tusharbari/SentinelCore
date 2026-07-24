package backend.controller;

import backend.dto.AssetDto;
import backend.service.AssetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    // Get paginated, sorted, and filtered assets
    @GetMapping
    public Page<AssetDto> getAssets(
            @RequestParam(required = false) String hostname,
            @RequestParam(required = false) String owner,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String criticality,
            @RequestParam(required = false) String patchStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return assetService.getAssets(hostname, owner, status, criticality, patchStatus, PageRequest.of(page, size, sort));
    }

    // Get Asset by ID
    @GetMapping("/{id}")
    public AssetDto getAssetById(@PathVariable Long id) {
        return assetService.getAssetById(id);
    }

    // Create Asset
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AssetDto createAsset(@Valid @RequestBody AssetDto dto) {
        return assetService.createAsset(dto);
    }

    // Update Asset
    @PutMapping("/{id}")
    public AssetDto updateAsset(@PathVariable Long id, @Valid @RequestBody AssetDto dto) {
        return assetService.updateAsset(id, dto);
    }

    // Delete Asset
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAsset(@PathVariable Long id) {
        assetService.deleteAsset(id);
    }

    // Search Assets (Non-paginated)
    @GetMapping("/search")
    public List<AssetDto> searchAssets(
            @RequestParam(required = false) String hostname,
            @RequestParam(required = false) String owner,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String criticality,
            @RequestParam(required = false) String patchStatus) {
        return assetService.searchAssets(hostname, owner, status, criticality, patchStatus);
    }

    // Get Dashboard Stats
    @GetMapping("/dashboard")
    public Map<String, Object> getDashboardStats() {
        return assetService.getDashboardStats();
    }

    // Import CSV
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> importAssets(@RequestParam("file") MultipartFile file) {
        try {
            int importedCount = assetService.importAssetsFromCsv(file.getInputStream());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Successfully imported " + importedCount + " assets",
                    "count", importedCount
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Failed to parse CSV file: " + e.getMessage()
            ));
        }
    }

    // Export CSV
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAssets() {
        byte[] csvData = assetService.exportAssetsToCsv();
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sentinelcore_assets.csv");
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
    }
}
