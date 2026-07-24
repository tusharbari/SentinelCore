package backend.service;

import backend.entity.*;
import backend.repository.AuditLogRepository;
import org.springframework.stereotype.Service;


import java.time.LocalDateTime;
import java.util.List;


@Service
public class AuditLogService {

    private final AuditLogRepository auditRepository;

    public AuditLogService(AuditLogRepository auditRepository) {
        this.auditRepository = auditRepository;
    }

    // Add this method to your AuditLogService class
public List<AuditLog> getAllLogs() {
    return auditRepository.findAll(); // Must explicitly hit the repository find method loop
}

    public void createLog(
            String action,
            String description,
            User user,
            Incident incident){


        AuditLog log = new AuditLog();


        log.setAction(action);

        log.setDescription(description);

        log.setUser(user);

        log.setIncident(incident);

        log.setTimestamp(LocalDateTime.now());


        auditRepository.save(log);

    }

    public void createLog(
            String action,
            String description,
            User user) {

        AuditLog log = new AuditLog();

        log.setAction(action);

        log.setDescription(description);

        log.setUser(user);

        log.setTimestamp(LocalDateTime.now());

        auditRepository.save(log);
    }



    public List<AuditLog> getIncidentLogs(Long incidentId){

        return auditRepository
                .findByIncidentId(incidentId);

    }

    public List<AuditLog> getAssetLogs(Long assetId) {
        return auditRepository.findByAssetId(assetId);
    }

    public void createAssetLog(String action, String description, Asset asset, String oldValue, String newValue) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setDescription(description);
        log.setAsset(asset);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setTimestamp(LocalDateTime.now());
        auditRepository.save(log);
    }

}