package backend.controller;

import backend.dto.*;
import backend.entity.User;
import backend.repository.UserRepository;
import backend.service.PlaybookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/playbooks")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
@RequiredArgsConstructor
public class PlaybookController {

    private final PlaybookService playbookService;
    private final UserRepository userRepository;

    // ================= Config CRUD APIs =================

    @GetMapping
    public List<PlaybookDto> getAllPlaybooks() {
        return playbookService.getAllPlaybooks();
    }

    @GetMapping("/{id}")
    public PlaybookDto getPlaybookById(@PathVariable Long id) {
        return playbookService.getPlaybookById(id);
    }

    @PostMapping
    public PlaybookDto createPlaybook(@Valid @RequestBody PlaybookDto dto) {
        return playbookService.createPlaybook(dto);
    }

    @PutMapping("/{id}")
    public PlaybookDto updatePlaybook(@PathVariable Long id, @Valid @RequestBody PlaybookDto dto) {
        return playbookService.updatePlaybook(id, dto);
    }

    @PostMapping("/{id}/toggle")
    public PlaybookDto togglePlaybookStatus(@PathVariable Long id) {
        return playbookService.togglePlaybookStatus(id);
    }

    @DeleteMapping("/{id}")
    public void deletePlaybook(@PathVariable Long id) {
        playbookService.deletePlaybook(id);
    }

    // ================= Playbook Execution & Trigger APIs =================

    @PostMapping("/trigger")
    public PlaybookExecutionDto triggerPlaybook(@Valid @RequestBody PlaybookTriggerRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElse(null);
        return playbookService.triggerPlaybook(request.getPlaybookId(), request.getIncidentId(), user);
    }

    @GetMapping("/executions")
    public List<PlaybookExecutionDto> getExecutionHistory() {
        return playbookService.getExecutionHistory();
    }

    @GetMapping("/executions/{id}")
    public PlaybookExecutionDto getExecutionDetails(@PathVariable Long id) {
        return playbookService.getExecutionDetails(id);
    }

    @GetMapping("/executions/{id}/logs")
    public List<PlaybookExecutionLogDto> getExecutionLogs(@PathVariable Long id) {
        return playbookService.getExecutionLogs(id);
    }

    // ================= Legacy Mapped Endpoints (Compatibility) =================

    @PostMapping("/run/{incidentId}")
    public PlaybookStatusResponse runPlaybook(@PathVariable Long incidentId) {
        return playbookService.runPlaybook(incidentId);
    }

    @GetMapping("/status/{incidentId}")
    public PlaybookStatusResponse getStatus(@PathVariable Long incidentId) {
        return playbookService.updateStatus(incidentId);
    }

    // ================= Brute Force Target Simulation Endpoints =================

    @PostMapping("/simulate-brute-force")
    public PlaybookExecutionDto simulateBruteForce(
            @RequestParam(required = false) String ip,
            @RequestParam(required = false) String username) {
        return playbookService.simulateBruteForceAttack(ip, username);
    }

    @GetMapping("/target-status")
    public Map<String, Object> getTargetStatus(
            @RequestParam(required = false) String ip,
            @RequestParam(required = false) String username) {
        return playbookService.getTargetSimulationStatus(ip, username);
    }

    @PostMapping("/reset-simulation")
    public Map<String, Object> resetSimulation() {
        return playbookService.resetSimulation();
    }

    @PostMapping("/simulate-phishing")
    public PlaybookExecutionDto simulatePhishing(@RequestBody java.util.Map<String, String> request) {
        return playbookService.simulatePhishingEmail(
                request.get("sender"),
                request.get("recipient"),
                request.get("subject"),
                request.get("body"),
                request.get("attachment")
        );
    }
}