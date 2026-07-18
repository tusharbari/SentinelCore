package backend.service;

import backend.entity.*;
import backend.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
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



    public List<AuditLog> getIncidentLogs(Long incidentId){

        return auditRepository
                .findByIncidentId(incidentId);

    }

}