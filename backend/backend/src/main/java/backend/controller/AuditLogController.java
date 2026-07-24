package backend.controller;


import backend.entity.AuditLog;
import backend.service.AuditLogService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/audit")
public class AuditLogController {


    @Autowired
    private AuditLogService service;



   @GetMapping
    public List<AuditLog> getAllSystemLogs() {
        return service.getAllLogs();
    }

    @GetMapping("/incident/{id}")
    public List<AuditLog> getLogs(@PathVariable Long id){
        return service.getIncidentLogs(id);
    }

    @GetMapping("/asset/{id}")
    public List<AuditLog> getAssetLogs(@PathVariable Long id) {
        return service.getAssetLogs(id);
    }

}