package backend.controller;

import backend.dto.IncidentDto;
import backend.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;

    // Get All Incidents
    @GetMapping
    public List<IncidentDto> getAllIncidents() {
        return incidentService.getAllIncidents();
    }

    // Get Incident by ID
    @GetMapping("/{id}")
    public IncidentDto getIncidentById(@PathVariable Long id) {
        return incidentService.getIncidentById(id);
    }

    // Create Incident
    @PostMapping
    public IncidentDto createIncident(@Valid @RequestBody IncidentDto dto) {
        return incidentService.createIncident(dto);
    }

    // Update Incident
    @PutMapping("/{id}")
    public IncidentDto updateIncident(@PathVariable Long id, @Valid @RequestBody IncidentDto dto) {
        return incidentService.updateIncident(id, dto);
    }

    // Delete Incident
    @DeleteMapping("/{id}")
    public void deleteIncident(@PathVariable Long id) {
        incidentService.deleteIncident(id);
    }
}
