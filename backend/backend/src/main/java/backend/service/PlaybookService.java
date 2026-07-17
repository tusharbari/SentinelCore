package backend.service;

import backend.dto.*;
import backend.entity.*;
import backend.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlaybookService {

        private final PlaybookRepository playbookRepository;
        private final PlaybookStepRepository playbookStepRepository;
        private final PlaybookExecutionRepository playbookExecutionRepository;
        private final PlaybookExecutionLogRepository playbookExecutionLogRepository;
        private final PlaybookAuditLogRepository playbookAuditLogRepository;
        private final PlaybookNotificationRepository playbookNotificationRepository;
        private final IncidentRepository incidentRepository;

        private final ExecutorService executorService = Executors.newCachedThreadPool();

        // ================= Database Seeder =================
        @PostConstruct
        @Transactional
        public void seedDefaultPlaybooks() {
                // Seed sample incidents if empty
                if (incidentRepository.count() == 0) {
                        log.info("Seeding sample security incidents...");
                        Incident incident1 = Incident.builder()
                                        .title("Brute Force Detection on Main Portal")
                                        .description("Detected 15 failed authentication attempts for user 'admin' within 2 minutes from IP 192.168.1.105.")
                                        .severity("High")
                                        .status("Open")
                                        .source("Auth Service")
                                        .build();

                        Incident incident2 = Incident.builder()
                                        .title("Malware Suspect on WS-908")
                                        .description("Unrecognized hash executed in temporary folder. Target: C:\\Users\\Public\\Temp\\backdoor.exe.")
                                        .severity("Critical")
                                        .status("Investigating")
                                        .source("EDR Agent")
                                        .build();

                        incidentRepository.saveAll(List.of(incident1, incident2));
                }

                if (playbookRepository.count() > 0) {
                        return;
                }

                log.info("Seeding default security playbooks...");

                // 1. Brute Force Response Playbook
                Playbook bruteForce = Playbook.builder()
                                .name("Brute Force Response")
                                .description("Triggered when multiple failed login attempts are detected. Automatically blocks malicious IP and locks targeted user account.")
                                .triggerType("ALERT_TYPE")
                                .triggerValue("Brute Force")
                                .conditionsJson("{\"failedAttemptsThreshold\":5}")
                                .isActive(true)
                                .build();

                bruteForce = playbookRepository.save(bruteForce);

                PlaybookStep bfStep1 = PlaybookStep.builder()
                                .playbook(bruteForce)
                                .stepOrder(1)
                                .name("Block Attacking Source IP")
                                .actionType("BLOCK_IP")
                                .parametersJson("{\"firewallRule\":\"Deny\",\"durationMinutes\":1440}")
                                .build();

                PlaybookStep bfStep2 = PlaybookStep.builder()
                                .playbook(bruteForce)
                                .stepOrder(2)
                                .name("Temporarily Lock Compromised Account")
                                .actionType("DISABLE_USER")
                                .parametersJson("{\"lockDurationMinutes\":60}")
                                .build();

                PlaybookStep bfStep3 = PlaybookStep.builder()
                                .playbook(bruteForce)
                                .stepOrder(3)
                                .name("Send SOC Alert Notification")
                                .actionType("SEND_NOTIFICATION")
                                .parametersJson("{\"channel\":\"SLACK\",\"recipient\":\"#soc-alerts\",\"severity\":\"Critical\"}")
                                .build();

                PlaybookStep bfStep4 = PlaybookStep.builder()
                                .playbook(bruteForce)
                                .stepOrder(4)
                                .name("Create Incident Ticket")
                                .actionType("CREATE_INCIDENT")
                                .parametersJson("{\"title\":\"Brute Force Attack Contained\",\"severity\":\"High\"}")
                                .build();

                playbookStepRepository.saveAll(List.of(bfStep1, bfStep2, bfStep3, bfStep4));

                // 2. Malware Containment Playbook
                Playbook malware = Playbook.builder()
                                .name("Malware Containment")
                                .description("Isolates infected host systems from the internal network and disables suspicious user active sessions.")
                                .triggerType("ALERT_SEVERITY")
                                .triggerValue("Critical")
                                .conditionsJson("{\"alertName\":\"Malware Detected\"}")
                                .isActive(true)
                                .build();

                malware = playbookRepository.save(malware);

                PlaybookStep mwStep1 = PlaybookStep.builder()
                                .playbook(malware)
                                .stepOrder(1)
                                .name("Quarantine Host Network Access")
                                .actionType("ISOLATE_HOST")
                                .parametersJson("{\"networkInterface\":\"eth0\",\"vlanId\":666}")
                                .build();

                PlaybookStep mwStep2 = PlaybookStep.builder()
                                .playbook(malware)
                                .stepOrder(2)
                                .name("Disable User Active Sessions")
                                .actionType("DISABLE_USER")
                                .parametersJson("{\"revokeTokens\":true}")
                                .build();

                PlaybookStep mwStep3 = PlaybookStep.builder()
                                .playbook(malware)
                                .stepOrder(3)
                                .name("Notify Incident Response Team")
                                .actionType("SEND_NOTIFICATION")
                                .parametersJson("{\"channel\":\"EMAIL\",\"recipient\":\"incident-response@sentinelcore.com\"}")
                                .build();

                PlaybookStep mwStep4 = PlaybookStep.builder()
                                .playbook(malware)
                                .stepOrder(4)
                                .name("Create Forensic Incident Ticket")
                                .actionType("CREATE_INCIDENT")
                                .parametersJson("{\"title\":\"Infected Host Contained\",\"severity\":\"Critical\"}")
                                .build();

                playbookStepRepository.saveAll(List.of(mwStep1, mwStep2, mwStep3, mwStep4));

                // 3. Privilege Escalation Detection Playbook
                Playbook privEsc = Playbook.builder()
                                .name("Privilege Escalation Detection")
                                .description("Fires when an unauthorized permission elevation is caught. Deactivates credentials immediately.")
                                .triggerType("THREAT_DETECTED")
                                .triggerValue("Privilege Escalation")
                                .isActive(true)
                                .build();

                privEsc = playbookRepository.save(privEsc);

                PlaybookStep peStep1 = PlaybookStep.builder()
                                .playbook(privEsc)
                                .stepOrder(1)
                                .name("Disable Account & Revoke Roles")
                                .actionType("DISABLE_USER")
                                .parametersJson("{\"immediateDeactivation\":true}")
                                .build();

                PlaybookStep peStep2 = PlaybookStep.builder()
                                .playbook(privEsc)
                                .stepOrder(2)
                                .name("Trigger High Priority Notification")
                                .actionType("SEND_NOTIFICATION")
                                .parametersJson("{\"channel\":\"IN_APP\",\"recipient\":\"ADMIN\"}")
                                .build();

                PlaybookStep peStep3 = PlaybookStep.builder()
                                .playbook(privEsc)
                                .stepOrder(3)
                                .name("File Privilege Abuse Incident")
                                .actionType("CREATE_INCIDENT")
                                .parametersJson("{\"title\":\"Unauthorized Privilege Elevation Detected\",\"severity\":\"Critical\"}")
                                .build();

                playbookStepRepository.saveAll(List.of(peStep1, peStep2, peStep3));

                // 4. Vulnerability Scan Automation Playbook
                Playbook vulnScan = Playbook.builder()
                                .name("Vulnerability Scan Automation")
                                .description("Triggers a dynamic vulnerability scan on the network subnet and generates remediation tickets.")
                                .triggerType("MANUAL")
                                .isActive(true)
                                .build();

                vulnScan = playbookRepository.save(vulnScan);

                PlaybookStep vsStep1 = PlaybookStep.builder()
                                .playbook(vulnScan)
                                .stepOrder(1)
                                .name("Trigger Subnet Vulnerability Scan")
                                .actionType("SCAN_VULNERABILITY")
                                .parametersJson("{\"targetSubnet\":\"10.0.1.0/24\",\"scanProfile\":\"Full Discovery\"}")
                                .build();

                PlaybookStep vsStep2 = PlaybookStep.builder()
                                .playbook(vulnScan)
                                .stepOrder(2)
                                .name("Send Scan Summary Report")
                                .actionType("SEND_NOTIFICATION")
                                .parametersJson("{\"channel\":\"EMAIL\",\"recipient\":\"admin@sentinelcore.com\"}")
                                .build();

                PlaybookStep vsStep3 = PlaybookStep.builder()
                                .playbook(vulnScan)
                                .stepOrder(3)
                                .name("Create Remediation Tickets")
                                .actionType("CREATE_INCIDENT")
                                .parametersJson("{\"title\":\"Vulnerability Scan Remediation Tasks\",\"severity\":\"Medium\"}")
                                .build();

                playbookStepRepository.saveAll(List.of(vsStep1, vsStep2, vsStep3));

                log.info("Playbook seeding completed successfully.");
        }

        // ================= Config CRUD Operations =================
        @Transactional(readOnly = true)
        public List<PlaybookDto> getAllPlaybooks() {
                return playbookRepository.findAll().stream()
                                .map(this::convertToDto)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public PlaybookDto getPlaybookById(Long id) {
                Playbook playbook = playbookRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Playbook not found with id: " + id));
                return convertToDto(playbook);
        }

        @Transactional
        public PlaybookDto createPlaybook(PlaybookDto dto) {
                Playbook playbook = Playbook.builder()
                                .name(dto.getName())
                                .description(dto.getDescription())
                                .triggerType(dto.getTriggerType())
                                .triggerValue(dto.getTriggerValue())
                                .conditionsJson(dto.getConditionsJson())
                                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                                .build();

                Playbook savedPlaybook = playbookRepository.save(playbook);

                if (dto.getSteps() != null) {
                        List<PlaybookStep> steps = dto.getSteps().stream()
                                        .map(stepDto -> PlaybookStep.builder()
                                                        .playbook(savedPlaybook)
                                                        .stepOrder(stepDto.getStepOrder())
                                                        .name(stepDto.getName())
                                                        .actionType(stepDto.getActionType())
                                                        .parametersJson(stepDto.getParametersJson())
                                                        .build())
                                        .collect(Collectors.toList());
                        playbookStepRepository.saveAll(steps);
                        savedPlaybook.setSteps(steps);
                }

                // Audit Log
                saveAuditLog("CREATE_PLAYBOOK", savedPlaybook.getId(),
                                "Created playbook configuration: " + savedPlaybook.getName());

                return convertToDto(savedPlaybook);
        }

        @Transactional
        public PlaybookDto updatePlaybook(Long id, PlaybookDto dto) {
                Playbook playbook = playbookRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Playbook not found with id: " + id));

                playbook.setName(dto.getName());
                playbook.setDescription(dto.getDescription());
                playbook.setTriggerType(dto.getTriggerType());
                playbook.setTriggerValue(dto.getTriggerValue());
                playbook.setConditionsJson(dto.getConditionsJson());
                if (dto.getIsActive() != null) {
                        playbook.setIsActive(dto.getIsActive());
                }

                // Recreate steps
                playbookStepRepository.deleteAll(playbook.getSteps());
                playbook.getSteps().clear();

                if (dto.getSteps() != null) {
                        List<PlaybookStep> steps = dto.getSteps().stream()
                                        .map(stepDto -> PlaybookStep.builder()
                                                        .playbook(playbook)
                                                        .stepOrder(stepDto.getStepOrder())
                                                        .name(stepDto.getName())
                                                        .actionType(stepDto.getActionType())
                                                        .parametersJson(stepDto.getParametersJson())
                                                        .build())
                                        .collect(Collectors.toList());
                        playbookStepRepository.saveAll(steps);
                        playbook.setSteps(steps);
                }

                Playbook updated = playbookRepository.save(playbook);

                // Audit Log
                saveAuditLog("UPDATE_PLAYBOOK", updated.getId(),
                                "Updated playbook configuration: " + updated.getName());

                return convertToDto(updated);
        }

        @Transactional
        public PlaybookDto togglePlaybookStatus(Long id) {
                Playbook playbook = playbookRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Playbook not found with id: " + id));
                playbook.setIsActive(!playbook.getIsActive());
                Playbook saved = playbookRepository.save(playbook);

                // Audit Log
                saveAuditLog("UPDATE_PLAYBOOK", saved.getId(),
                                "Toggled active status of playbook: " + saved.getName() + " to " + saved.getIsActive());

                return convertToDto(saved);
        }

        @Transactional
        public void deletePlaybook(Long id) {
                Playbook playbook = playbookRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Playbook not found with id: " + id));
                playbookRepository.delete(playbook);

                // Audit Log
                saveAuditLog("DELETE_PLAYBOOK", id, "Deleted playbook configuration: " + playbook.getName());
        }

        // ================= Playbook Execution Engine =================

        public PlaybookExecutionDto triggerPlaybook(Long playbookId, Long incidentId, User triggeredBy) {
                Playbook playbook = playbookRepository.findById(playbookId)
                                .orElseThrow(() -> new RuntimeException("Playbook not found with id: " + playbookId));

                if (!playbook.getIsActive()) {
                        throw new RuntimeException("Playbook is inactive");
                }

                Incident incident = null;
                if (incidentId != null) {
                        incident = incidentRepository.findById(incidentId).orElse(null);
                }

                PlaybookExecution execution = PlaybookExecution.builder()
                                .playbook(playbook)
                                .playbookName(playbook.getName())
                                .incident(incident)
                                .incidentId(incidentId)
                                .status("PENDING")
                                .currentStep("Queued for execution")
                                .currentStepIndex(0)
                                .progress(0)
                                .triggeredBy(triggeredBy)
                                .startedAt(LocalDateTime.now())
                                .build();

                execution = playbookExecutionRepository.save(execution);

                // Run asynchronously
                runAsyncExecution(execution.getId());

                // Audit Log
                saveAuditLog("TRIGGER_PLAYBOOK", execution.getId(),
                                "Triggered playbook: " + playbook.getName() + " on incident ID: " + incidentId);

                return convertToExecutionDto(execution);
        }

        private void runAsyncExecution(Long executionId) {
                CompletableFuture.runAsync(() -> {
                        try {
                                // Fetch execution in this thread context
                                PlaybookExecution execution = playbookExecutionRepository.findById(executionId)
                                                .orElseThrow(() -> new RuntimeException(
                                                                "Execution not found: " + executionId));

                                List<PlaybookStep> steps = execution.getPlaybook().getSteps();

                                // If playbook has no steps, finish immediately
                                if (steps.isEmpty()) {
                                        execution.setStatus("SUCCESS");
                                        execution.setCurrentStep("No steps defined");
                                        execution.setProgress(100);
                                        execution.setEndedAt(LocalDateTime.now());
                                        playbookExecutionRepository.save(execution);
                                        writeExecutionLog(execution, "System", "SUCCESS", "INFO",
                                                        "Playbook execution completed. No steps to run.");
                                        return;
                                }

                                execution.setStatus("RUNNING");
                                playbookExecutionRepository.save(execution);

                                // Transition incident status to Investigating
                                if (execution.getIncidentId() != null) {
                                        Incident incident = incidentRepository.findById(execution.getIncidentId()).orElse(null);
                                        if (incident != null && "Open".equals(incident.getStatus())) {
                                                incident.setStatus("Investigating");
                                                incidentRepository.save(incident);
                                                writeExecutionLog(execution, "System", "RUNNING", "INFO", 
                                                                "Associated incident status transitioned to 'Investigating'.");
                                        }
                                }

                                writeExecutionLog(execution, "System", "RUNNING", "INFO",
                                                "Starting playbook execution sequence...");

                                for (int i = 0; i < steps.size(); i++) {
                                        PlaybookStep step = steps.get(i);
                                        execution.setCurrentStep(step.getName());
                                        execution.setCurrentStepIndex(i + 1);
                                        int currentProgress = (int) (((double) (i + 1) / steps.size()) * 100);
                                        execution.setProgress(currentProgress);
                                        playbookExecutionRepository.save(execution);

                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                        "Executing Action: " + step.getActionType());

                                        // Simulate execution delay (e.g. 2 seconds)
                                        Thread.sleep(2000);

                                        // Perform action logic
                                        performAction(execution, step);

                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                        "Action successfully finished.");
                                }

                                execution.setStatus("SUCCESS");
                                execution.setProgress(100);
                                execution.setCurrentStep("Execution Completed");
                                execution.setEndedAt(LocalDateTime.now());
                                playbookExecutionRepository.save(execution);

                                // Transition incident status to Resolved on completion
                                if (execution.getIncidentId() != null) {
                                        Incident incident = incidentRepository.findById(execution.getIncidentId()).orElse(null);
                                        if (incident != null) {
                                                incident.setStatus("Resolved");
                                                incident.setDescription(incident.getDescription() +
                                                                "\n\n[Playbook Automation] This incident has been automatically resolved by successful execution of playbook: " +
                                                                execution.getPlaybookName() + " (Execution #" + execution.getId() + ").");
                                                incidentRepository.save(incident);
                                                writeExecutionLog(execution, "System", "SUCCESS", "INFO",
                                                                "Associated incident status updated to '''Resolved''' automatically.");
                                        }
                                }


                                writeExecutionLog(execution, "System", "SUCCESS", "INFO",
                                                "Playbook finished execution with status SUCCESS.");

                        } catch (Exception e) {
                                log.error("Failed executing playbook steps asynchronously", e);
                                PlaybookExecution execution = playbookExecutionRepository.findById(executionId)
                                                .orElse(null);
                                if (execution != null) {
                                        execution.setStatus("FAILED");
                                        execution.setCurrentStep("Failed: " + e.getMessage());
                                        execution.setEndedAt(LocalDateTime.now());
                                        playbookExecutionRepository.save(execution);
                                        writeExecutionLog(execution, "System", "FAILED", "ERROR",
                                                        "Playbook run encountered critical error: " + e.getMessage());
                                }
                        }
                }, executorService);
        }

        private void performAction(PlaybookExecution execution, PlaybookStep step) throws Exception {
                String action = step.getActionType();
                String params = step.getParametersJson();

                switch (action) {
                        case "BLOCK_IP":
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Sending command block to PaloAlto Firewall API...");
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Successfully added firewall entry: Drop traffic from source IP indefinitely.");
                                break;
                        case "ISOLATE_HOST":
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Contacting Endpoint Agent (EDR)...");
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Isolating network interface connection. Only communication allowed is to SentinelCore Agent.");
                                break;
                        case "DISABLE_USER":
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Interfacing Active Directory / LDAP Service...");
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Deactivated user account. Access token keys invalidated.");
                                break;
                        case "SCAN_VULNERABILITY":
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Spinning up target vulnerability profile scan...");
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Vulnerability scan completed. 0 High, 2 Medium vulnerabilities discovered.");
                                break;
                        case "SEND_NOTIFICATION":
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Compiling alert email/Slack template...");
                                PlaybookNotification notif = PlaybookNotification.builder()
                                                .playbookExecution(execution)
                                                .recipient("soc-channel@sentinelcore.com")
                                                .channel("EMAIL")
                                                .message("Automated Action: " + execution.getPlaybookName()
                                                                + " has run step [" + step.getName()
                                                                + "] for Incident #" + execution.getIncidentId())
                                                .status("SENT")
                                                .build();
                                playbookNotificationRepository.save(notif);
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO", "Alert sent to: "
                                                + notif.getRecipient() + " over " + notif.getChannel());
                                break;
                        case "CREATE_INCIDENT":
                                // If triggered on an existing incident, update it instead of creating a duplicate
                                if (execution.getIncidentId() != null) {
                                        Incident existing = incidentRepository.findById(execution.getIncidentId()).orElse(null);
                                        if (existing != null) {
                                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                                "Incident #" + existing.getId() + " already exists. Appending action logs to current ticket.");
                                                existing.setDescription(existing.getDescription() + 
                                                                "\n\n[Playbook Step: " + step.getName() + "] Action parameters: " + params);
                                                incidentRepository.save(existing);
                                                break;
                                        }
                                }

                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Generating ticket details...");
                                Incident incident = Incident.builder()
                                                .title("Auto: " + execution.getPlaybookName() + " Triggered Action")
                                                .description("Automated response incident opened during execution of playbook: "
                                                                + execution.getPlaybookName() + ". Action parameters: "
                                                                + params)
                                                .severity("High")
                                                .status("Open")
                                                .source("Playbook Engine")
                                                .build();
                                incident = incidentRepository.save(incident);

                                // Link this execution to the newly created incident if it was null
                                if (execution.getIncident() == null) {
                                        execution.setIncident(incident);
                                        execution.setIncidentId(incident.getId());
                                }
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Created new Incident ticket record. Ticket ID: #" + incident.getId());
                                break;
                        default:
                                throw new IllegalArgumentException("Unknown playbook step action: " + action);
                }
        }

        private void writeExecutionLog(PlaybookExecution execution, String stepName, String status, String level,
                        String message) {
                PlaybookExecutionLog executionLog = PlaybookExecutionLog.builder()
                                .playbookExecution(execution)
                                .stepName(stepName)
                                .status(status)
                                .logLevel(level)
                                .message(message)
                                .build();
                playbookExecutionLogRepository.save(executionLog);
        }

        private void saveAuditLog(String actionType, Long entityId, String details) {
                PlaybookAuditLog audit = PlaybookAuditLog.builder()
                                .actionType(actionType)
                                .entityId(entityId)
                                .details(details)
                                .build();
                playbookAuditLogRepository.save(audit);
        }

        // ================= History Queries =================
        @Transactional(readOnly = true)
        public List<PlaybookExecutionDto> getExecutionHistory() {
                return playbookExecutionRepository.findAllByOrderByIdDesc().stream()
                                .map(this::convertToExecutionDto)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public PlaybookExecutionDto getExecutionDetails(Long executionId) {
                PlaybookExecution exec = playbookExecutionRepository.findById(executionId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Execution details not found with id: " + executionId));
                return convertToExecutionDto(exec);
        }

        @Transactional(readOnly = true)
        public List<PlaybookExecutionLogDto> getExecutionLogs(Long executionId) {
                return playbookExecutionLogRepository.findByPlaybookExecutionIdOrderByTimestampAsc(executionId).stream()
                                .map(log -> PlaybookExecutionLogDto.builder()
                                                .id(log.getId())
                                                .executionId(executionId)
                                                .stepName(log.getStepName())
                                                .status(log.getStatus())
                                                .logLevel(log.getLogLevel())
                                                .message(log.getMessage())
                                                .timestamp(log.getTimestamp())
                                                .build())
                                .collect(Collectors.toList());
        }

        // ================= Mappers =================
        private PlaybookDto convertToDto(Playbook playbook) {
                List<PlaybookStepDto> steps = playbook.getSteps().stream()
                                .map(step -> PlaybookStepDto.builder()
                                                .id(step.getId())
                                                .stepOrder(step.getStepOrder())
                                                .name(step.getName())
                                                .actionType(step.getActionType())
                                                .parametersJson(step.getParametersJson())
                                                .build())
                                .collect(Collectors.toList());

                return PlaybookDto.builder()
                                .id(playbook.getId())
                                .name(playbook.getName())
                                .description(playbook.getDescription())
                                .triggerType(playbook.getTriggerType())
                                .triggerValue(playbook.getTriggerValue())
                                .conditionsJson(playbook.getConditionsJson())
                                .isActive(playbook.getIsActive())
                                .steps(steps)
                                .createdAt(playbook.getCreatedAt())
                                .updatedAt(playbook.getUpdatedAt())
                                .build();
        }

        private PlaybookExecutionDto convertToExecutionDto(PlaybookExecution exec) {
                return PlaybookExecutionDto.builder()
                                .id(exec.getId())
                                .playbookId(exec.getPlaybook() != null ? exec.getPlaybook().getId() : null)
                                .playbookName(exec.getPlaybookName())
                                .incidentId(exec.getIncidentId())
                                .incidentTitle(exec.getIncident() != null ? exec.getIncident().getTitle() : null)
                                .status(exec.getStatus())
                                .currentStep(exec.getCurrentStep())
                                .currentStepIndex(exec.getCurrentStepIndex())
                                .progress(exec.getProgress())
                                .triggeredById(exec.getTriggeredBy() != null ? exec.getTriggeredBy().getId() : null)
                                .triggeredByName(exec.getTriggeredBy() != null ? exec.getTriggeredBy().getName() : null)
                                .startedAt(exec.getStartedAt())
                                .endedAt(exec.getEndedAt())
                                .createdAt(exec.getCreatedAt())
                                .build();
        }

        // ================= Compatibility Wrapper =================
        // Retains compatibility with the original frontend/controller runPlaybook and
        // updateStatus methods.
        @Transactional
        public PlaybookStatusResponse runPlaybook(Long incidentId) {
                // Run default Malware containment playbook
                Playbook malware = playbookRepository.findByName("Malware Containment")
                                .orElseThrow(() -> new RuntimeException(
                                                "Default Malware Containment playbook not seeded"));

                PlaybookExecutionDto dto = triggerPlaybook(malware.getId(), incidentId, null);
                return new PlaybookStatusResponse(
                                dto.getIncidentId(),
                                dto.getStatus(),
                                dto.getCurrentStep(),
                                dto.getProgress());
        }

        @Transactional
        public PlaybookStatusResponse updateStatus(Long incidentId) {
                PlaybookExecution exec = playbookExecutionRepository.findByIncidentId(incidentId)
                                .orElseThrow(() -> new RuntimeException(
                                                "No execution found for incident: " + incidentId));

                return new PlaybookStatusResponse(
                                exec.getIncidentId(),
                                exec.getStatus(),
                                exec.getCurrentStep(),
                                exec.getProgress());
        }
}