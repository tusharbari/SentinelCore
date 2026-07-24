package backend.service;

import backend.entity.Alert;
import backend.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@SuppressWarnings("null")
public class AlertService {

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private PlaybookService playbookService;

    // Get All Alerts
    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }

    // Get Alert By ID
    public Alert getAlertById(Long id) {
        return alertRepository.findById(id).orElse(null);
    }

    // Add Alert
    public Alert addAlert(Alert alert) {
        if (alert.getStatus() == null) {
            alert.setStatus("Open");
        }
        Alert savedAlert = alertRepository.save(alert);
        if (savedAlert.getTitle() != null && 
            (savedAlert.getTitle().toLowerCase().contains("phishing") || 
             "Phishing Simulator".equalsIgnoreCase(savedAlert.getSource()) || 
             "Email Gateway".equalsIgnoreCase(savedAlert.getSource()))) {
            try {
                playbookService.triggerPhishingPlaybook(savedAlert);
            } catch (Exception e) {
                System.err.println("Failed to trigger phishing playbook automatically: " + e.getMessage());
            }
        }
        return savedAlert;
    }

    // Update Alert
    public Alert updateAlert(Long id, Alert updatedAlert) {

        Alert alert = alertRepository.findById(id).orElse(null);

        if (alert != null) {

            alert.setTitle(updatedAlert.getTitle());
            alert.setSeverity(updatedAlert.getSeverity());
            alert.setSource(updatedAlert.getSource());
            alert.setStatus(updatedAlert.getStatus());
            alert.setDescription(updatedAlert.getDescription());

            return alertRepository.save(alert);
        }

        return null;
    }

    // Delete Alert
    public void deleteAlert(Long id) {
        alertRepository.deleteById(id);
    }

    public Alert updateStatus(Long id, String status) {

        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found"));

        alert.setStatus(status);

        return alertRepository.save(alert);
    }
}