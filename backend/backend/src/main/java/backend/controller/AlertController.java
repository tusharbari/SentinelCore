package backend.controller;

import backend.entity.Alert;
import backend.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class AlertController {

    @Autowired
    private AlertService alertService;

    // Get All Alerts
    @GetMapping
    public List<Alert> getAllAlerts() {
        return alertService.getAllAlerts();
    }

    // Get Alert By ID
    @GetMapping("/{id}")
    public Alert getAlertById(@PathVariable Long id) {
        return alertService.getAlertById(id);
    }

    // Get Alerts by Asset ID
    @GetMapping("/asset/{assetId}")
    public List<Alert> getAlertsByAsset(@PathVariable Long assetId) {
        return alertService.getAlertsByAsset(assetId);
    }

    // Add Alert
    @PostMapping
    public Alert addAlert(@RequestBody Alert alert) {
        return alertService.addAlert(alert);
    }

    // Update Alert
    @PutMapping("/{id}")
    public Alert updateAlert(@PathVariable Long id,
                             @RequestBody Alert alert) {
        return alertService.updateAlert(id, alert);
    }

    // Delete Alert
    @DeleteMapping("/{id}")
    public void deleteAlert(@PathVariable Long id) {
        alertService.deleteAlert(id);
    }

    @PutMapping("/{id}/status")
    public Alert updateStatus(@PathVariable Long id,
                              @RequestParam String status) {

        return alertService.updateStatus(id, status);
    }

    @GetMapping("/whoami")
    public Object whoAmI(org.springframework.security.core.Authentication authentication) {
        return authentication.getAuthorities();
    }
}