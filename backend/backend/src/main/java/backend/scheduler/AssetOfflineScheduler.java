package backend.scheduler;

import backend.entity.Asset;
import backend.repository.AssetRepository;
import backend.service.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AssetOfflineScheduler {

    private final AssetRepository assetRepository;
    private final AssetService assetService;

    @Scheduled(cron = "0 * * * * *") // Every minute
    public void detectOfflineAssets() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(2);
        List<Asset> assets = assetRepository.findAll();
        for (Asset asset : assets) {
            // Check only assets that are supposed to have agent active (ONLINE)
            if ("ONLINE".equals(asset.getStatus()) && asset.getAgentInstalled() != null && asset.getAgentInstalled()) {
                if (asset.getLastSeen() != null && asset.getLastSeen().isBefore(threshold)) {
                    try {
                        assetService.markAssetOffline(asset);
                    } catch (Exception e) {
                        System.err.println("Failed to mark asset offline: " + asset.getHostname() + " - " + e.getMessage());
                    }
                }
            }
        }
    }
}
