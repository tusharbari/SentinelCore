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
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class PlaybookService {

        private static final Set<String> blockedIps = Collections.synchronizedSet(new HashSet<>());
        private static final Set<String> lockedUsers = Collections.synchronizedSet(new HashSet<>());

        private final PlaybookRepository playbookRepository;
        private final PlaybookStepRepository playbookStepRepository;
        private final PlaybookExecutionRepository playbookExecutionRepository;
        private final PlaybookExecutionLogRepository playbookExecutionLogRepository;
        private final PlaybookAuditLogRepository playbookAuditLogRepository;
        private final PlaybookNotificationRepository playbookNotificationRepository;
        private final NotificationService notificationService;
        private final IncidentRepository incidentRepository;
        private final AlertRepository alertRepository;
        private final IOCRepository iocRepository;

        private final ExecutorService executorService = Executors.newCachedThreadPool();

        // ================= Database Seeder =================
        @PostConstruct
        @Transactional
        public void seedDefaultPlaybooks() {
                // Seed sample incidents idempotently
                seedIncident("Brute Force Detection on Main Portal",
                                "Detected 15 failed authentication attempts for user 'admin' within 2 minutes from IP 192.168.1.105.",
                                "High", "Open", "Auth Service");

                seedIncident("Malware Suspect on WS-908",
                                "Unrecognized hash executed in temporary folder. Target: C:\\Users\\Public\\Temp\\backdoor.exe.",
                                "Critical", "Investigating", "EDR Agent");

                seedIncident("Privilege Escalation on Domain Controller",
                                "Unusual privilege elevation detected for user 'service_account_temp' on domain controller.",
                                "Critical", "Open", "Active Directory");

                seedIncident("Vulnerability Scan Required for Web Server Subnet",
                                "Scheduled scan failed to complete due to timeout. Manual intervention or re-triggering required.",
                                "Medium", "Open", "Vulnerability Scanner");

                // Seed playbooks & steps idempotently
                seedBruteForcePlaybook();
                seedMalwarePlaybook();
                seedPrivEscPlaybook();
                seedVulnScanPlaybook();
                seedPhishingPlaybook();

                // Resolve any stuck PENDING executions on startup
                List<PlaybookExecution> stuckExecs = playbookExecutionRepository.findAll();
                for (PlaybookExecution exec : stuckExecs) {
                        if ("PENDING".equalsIgnoreCase(exec.getStatus()) || "RUNNING".equalsIgnoreCase(exec.getStatus())) {
                                exec.setStatus("SUCCESS");
                                exec.setProgress(100);
                                exec.setCurrentStep("Execution Completed");
                                playbookExecutionRepository.save(exec);
                        }
                }

                log.info("Playbook and incident seeding completed successfully.");
        }

        private void seedIncident(String title, String description, String severity, String status, String source) {
                if (incidentRepository.findByTitle(title).isEmpty()) {
                        log.info("Seeding incident: {}", title);
                        Incident incident = Incident.builder()
                                        .title(title)
                                        .description(description)
                                        .severity(severity)
                                        .status(status)
                                        .source(source)
                                        .build();
                        incidentRepository.save(incident);
                }
        }

        private void seedBruteForcePlaybook() {
                if (playbookRepository.findByName("Brute Force Response").isEmpty()) {
                        log.info("Seeding Brute Force Response playbook...");
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
                }
        }

        private void seedMalwarePlaybook() {
                if (playbookRepository.findByName("Malware Containment").isEmpty()) {
                        log.info("Seeding Malware Containment playbook...");
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
                }
        }

        private void seedPrivEscPlaybook() {
                if (playbookRepository.findByName("Privilege Escalation Detection").isEmpty()) {
                        log.info("Seeding Privilege Escalation Detection playbook...");
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
                }
        }

        private void seedVulnScanPlaybook() {
                if (playbookRepository.findByName("Vulnerability Scan Automation").isEmpty()) {
                        log.info("Seeding Vulnerability Scan Automation playbook...");
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
                }

                log.info("Playbook seeding completed successfully.");
        }

        private void seedPhishingPlaybook() {
                if (playbookRepository.findByName("Phishing Email Response").isEmpty()) {
                        log.info("Seeding Phishing Email Response playbook...");
                        Playbook phishing = Playbook.builder()
                                        .name("Phishing Email Response")
                                        .description("Triggered when a phishing email is detected. Automatically validates the message, checks sender reputation, scans URLs and attachments, calculates risk, and contains the threat.")
                                        .triggerType("ALERT_TYPE")
                                        .triggerValue("Phishing")
                                        .conditionsJson("{\"reputationThreshold\":\"LOW\"}")
                                        .isActive(true)
                                        .build();

                        phishing = playbookRepository.save(phishing);

                        PlaybookStep step1 = PlaybookStep.builder()
                                        .playbook(phishing)
                                        .stepOrder(1)
                                        .name("Validate Email format and headers")
                                        .actionType("VALIDATE_EMAIL")
                                        .parametersJson("{}")
                                        .build();

                        PlaybookStep step2 = PlaybookStep.builder()
                                        .playbook(phishing)
                                        .stepOrder(2)
                                        .name("Check Sender Reputation (Blacklists)")
                                        .actionType("CHECK_SENDER_REPUTATION")
                                        .parametersJson("{}")
                                        .build();

                        PlaybookStep step3 = PlaybookStep.builder()
                                        .playbook(phishing)
                                        .stepOrder(3)
                                        .name("Scan embedded URLs")
                                        .actionType("SCAN_URLS")
                                        .parametersJson("{}")
                                        .build();

                        PlaybookStep step4 = PlaybookStep.builder()
                                        .playbook(phishing)
                                        .stepOrder(4)
                                        .name("Scan attachments (Simulation)")
                                        .actionType("SCAN_ATTACHMENTS")
                                        .parametersJson("{}")
                                        .build();

                        PlaybookStep step5 = PlaybookStep.builder()
                                        .playbook(phishing)
                                        .stepOrder(5)
                                        .name("Calculate Risk Score")
                                        .actionType("CALCULATE_RISK_SCORE")
                                        .parametersJson("{}")
                                        .build();

                        PlaybookStep step6 = PlaybookStep.builder()
                                        .playbook(phishing)
                                        .stepOrder(6)
                                        .name("Enforce Playbook Decision Rules")
                                        .actionType("DECISION_CONTAINMENT")
                                        .parametersJson("{}")
                                        .build();

                        playbookStepRepository.saveAll(List.of(step1, step2, step3, step4, step5, step6));
                }
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
                        if (incident != null) {
                                if ("Resolved".equalsIgnoreCase(incident.getStatus()) || "Closed".equalsIgnoreCase(incident.getStatus())) {
                                        throw new RuntimeException("Cannot run playbook on a resolved or closed incident");
                                }
                                if (!isPlaybookRelevant(playbook, incident)) {
                                        throw new RuntimeException("This playbook is not relevant to this incident. Please select the relevant playbook.");
                                }
                        }
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
                runAsyncExecution(execution.getId(), playbook.getId());

                // Audit Log
                saveAuditLog("TRIGGER_PLAYBOOK", execution.getId(),
                                "Triggered playbook: " + playbook.getName() + " on incident ID: " + incidentId);

                return convertToExecutionDto(execution);
        }

        private void runAsyncExecution(Long executionId, Long playbookId) {
                CompletableFuture.runAsync(() -> {
                        try {
                                // Fetch execution in this thread context
                                PlaybookExecution execution = playbookExecutionRepository.findById(executionId)
                                                .orElseThrow(() -> new RuntimeException(
                                                                                "Execution not found: " + executionId));

                                List<PlaybookStep> steps = playbookStepRepository.findByPlaybookIdOrderByStepOrderAsc(playbookId);

                                Incident targetIncident = null;
                                if (execution.getIncidentId() != null) {
                                        targetIncident = incidentRepository.findById(execution.getIncidentId()).orElse(null);
                                }
                                boolean isSecondary = false;
                                if (targetIncident != null && execution.getPlaybook() != null) {
                                        String relation = getPlaybookRelation(execution.getPlaybook(), targetIncident);
                                        isSecondary = "SECONDARY".equalsIgnoreCase(relation);
                                }

                                // If playbook has no steps, finish immediately
                                if (steps.isEmpty()) {
                                        execution.setStatus("SUCCESS");
                                        execution.setCurrentStep("No steps defined");
                                        execution.setProgress(isSecondary ? 70 : 100);
                                        execution.setEndedAt(LocalDateTime.now());
                                        playbookExecutionRepository.save(execution);
                                        writeExecutionLog(execution, "System", "SUCCESS", "INFO",
                                                        "Playbook execution completed. No steps to run.");
                                        return;
                                }

                                execution.setStatus("RUNNING");
                                playbookExecutionRepository.save(execution);

                                // Transition incident status to Investigating
                                if (targetIncident != null && "Open".equals(targetIncident.getStatus())) {
                                        targetIncident.setStatus("Investigating");
                                        incidentRepository.save(targetIncident);
                                        writeExecutionLog(execution, "System", "RUNNING", "INFO", 
                                                        "Associated incident status transitioned to 'Investigating'.");
                                }

                                writeExecutionLog(execution, "System", "RUNNING", "INFO",
                                                "Starting playbook execution sequence...");

                                int maxProgress = isSecondary ? 70 : 100;
                                for (int i = 0; i < steps.size(); i++) {
                                        PlaybookStep step = steps.get(i);
                                        execution.setCurrentStep(step.getName());
                                        execution.setCurrentStepIndex(i + 1);
                                        int currentProgress = (int) (((double) (i + 1) / steps.size()) * maxProgress);
                                        execution.setProgress(currentProgress);
                                        playbookExecutionRepository.save(execution);

                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                        "Executing Action: " + step.getActionType());

                                        // Execution delay (300ms for fast responsive execution)
                                        Thread.sleep(300);

                                        // Perform action logic
                                        performAction(execution, step);

                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                        "Action successfully finished.");
                                }

                                execution.setStatus("SUCCESS");
                                execution.setProgress(isSecondary ? 70 : 100);
                                execution.setCurrentStep("Execution Completed");
                                execution.setEndedAt(LocalDateTime.now());
                                playbookExecutionRepository.save(execution);

                                // Transition incident status to Resolved or Investigating (Partially Resolved) on completion
                                if (targetIncident != null) {
                                        if (isSecondary) {
                                                targetIncident.setStatus("Investigating");
                                                targetIncident.setDescription(targetIncident.getDescription() +
                                                                "\n\n[Playbook Automation] This incident has been partially resolved (70%) by successful execution of secondary playbook: " +
                                                                execution.getPlaybookName() + " (Execution #" + execution.getId() + ").");
                                                incidentRepository.save(targetIncident);
                                                writeExecutionLog(execution, "System", "SUCCESS", "INFO",
                                                                "Associated incident status updated to '''Investigating''' (Partially Resolved) automatically.");
                                        } else {
                                                targetIncident.setStatus("Resolved");
                                                targetIncident.setDescription(targetIncident.getDescription() +
                                                                "\n\n[Playbook Automation] This incident has been automatically resolved by successful execution of playbook: " +
                                                                execution.getPlaybookName() + " (Execution #" + execution.getId() + ").");
                                                incidentRepository.save(targetIncident);
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
                        case "CHECK_DOMAIN":
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Verifying sender domain reputation against Threat Intel lists...");
                                Thread.sleep(200);
                                if (execution.getIncident() != null && execution.getIncident().getDescription() != null) {
                                        String desc = execution.getIncident().getDescription().toLowerCase();
                                        boolean hasSuspiciousDomain = java.util.List.of("fakebank.com", "paypai.com", "secure-login.net", "verify-account.com")
                                                        .stream().anyMatch(desc::contains);
                                        if (hasSuspiciousDomain) {
                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "WARN",
                                                                "Domain check failed: Sender domain listed in active blacklist!");
                                        } else {
                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                                "Domain check complete: Sender domain reputation is clean.");
                                        }
                                } else {
                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                        "Domain check complete.");
                                }
                                break;
                        case "SCAN_KEYWORDS":
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Scanning email body content for lexical anomalies and suspicious keywords...");
                                Thread.sleep(200);
                                if (execution.getIncident() != null && execution.getIncident().getDescription() != null) {
                                        String desc = execution.getIncident().getDescription().toLowerCase();
                                        java.util.List<String> matched = java.util.List.of(
                                                "verify your account", "urgent", "click here", "password expired", 
                                                "login immediately", "update payment", "free gift"
                                        ).stream().filter(desc::contains).collect(Collectors.toList());
                                        if (!matched.isEmpty()) {
                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "WARN",
                                                                "Suspicious keywords matching threshold. Patterns: " + String.join(", ", matched));
                                        } else {
                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                                "Lexical check complete: No suspicious patterns found.");
                                        }
                                } else {
                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                        "Lexical check complete.");
                                }
                                break;
                        case "QUARANTINE_EMAIL":
                                if (execution.getIncident() != null && "Low".equalsIgnoreCase(execution.getIncident().getSeverity())) {
                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                        "Clean email detected. Bypassing quarantine isolation policy.");
                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                        "Delivery authorized. Inbound message released to recipient inbox.");
                                } else {
                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                        "Triggering automated quarantine procedure...");
                                        Thread.sleep(200);
                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                        "Email isolated in secure quarantine store at /var/quarantine/mail/.");
                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                        "Quarantine isolation completed. Inbound routing block established.");
                                }
                                break;
                        case "BLOCK_IP":
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Sending command block to PaloAlto Firewall API...");
                                blockedIps.add("192.168.1.105");
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Successfully added firewall entry: Drop traffic from source IP 192.168.1.105 indefinitely.");
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
                                lockedUsers.add("admin@acme.com");
                                lockedUsers.add("admin");
                                lockedUsers.add("admin@sentinelcore.com");
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Deactivated user account admin@acme.com. Access token keys invalidated.");
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

                                if (notificationService != null) {
                                        notificationService.saveNotification(
                                                        "Automated Playbook Action: " + execution.getPlaybookName(),
                                                        "High",
                                                        "Playbook executed automatically for Incident #" + execution.getIncidentId() + ": Containment rules enforced."
                                        );
                                }

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
                        case "VALIDATE_EMAIL":
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Step 1: Validating email formatting, domains, and headers...");
                                Thread.sleep(200);
                                String sender = "";
                                String recipient = "";
                                if (execution.getAlert() != null) {
                                        sender = execution.getAlert().getEmailSender();
                                        recipient = execution.getAlert().getEmailRecipient();
                                } else if (execution.getIncident() != null) {
                                        java.util.Map<String, String> details = parseIncidentEmailDetails(execution.getIncident().getDescription());
                                        sender = details.get("sender");
                                        recipient = details.get("recipient");
                                }
                                if (sender != null && sender.contains("@") && recipient != null && recipient.contains("@")) {
                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                        "Email structure and headers validated successfully.");
                                } else {
                                        writeExecutionLog(execution, step.getName(), "FAILED", "WARN",
                                                        "Validation warning: Invalid sender or recipient format.");
                                }
                                break;
                        case "CHECK_SENDER_REPUTATION":
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Step 2: Checking sender reputation in threat databases...");
                                Thread.sleep(200);
                                String checkSender = "";
                                if (execution.getAlert() != null) {
                                        checkSender = execution.getAlert().getEmailSender();
                                } else if (execution.getIncident() != null) {
                                        java.util.Map<String, String> details = parseIncidentEmailDetails(execution.getIncident().getDescription());
                                        checkSender = details.get("sender");
                                }
                                String checkDomain = "";
                                if (checkSender != null && checkSender.contains("@")) {
                                        checkDomain = checkSender.split("@")[1].toLowerCase().trim();
                                }
                                java.util.List<String> blacklist = java.util.List.of("fakebank.com", "paypai.com", "secure-login.net", "verify-account.com", "malicious-domain.xyz");
                                boolean isDomainBlacklisted = blacklist.contains(checkDomain);
                                boolean inIocDb = false;
                                if (checkSender != null) {
                                        inIocDb = iocRepository.findByValue(checkSender).isPresent() || iocRepository.findByValue(checkDomain).isPresent();
                                }
                                if (isDomainBlacklisted || inIocDb) {
                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "WARN",
                                                        "Sender check completed: Sender domain '" + checkDomain + "' is listed in active blacklists!");
                                } else {
                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                        "Sender check completed: Sender domain has a neutral reputation score.");
                                }
                                break;
                        case "SCAN_URLS":
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Step 3: Extracting and scanning embedded URLs...");
                                Thread.sleep(200);
                                String urls = "";
                                if (execution.getAlert() != null) {
                                        urls = execution.getAlert().getEmailUrls();
                                } else if (execution.getIncident() != null) {
                                        String desc = execution.getIncident().getDescription();
                                        java.util.List<String> urlsList = new java.util.ArrayList<>();
                                        if (desc != null) {
                                                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("https?://[^\\s]+");
                                                java.util.regex.Matcher matcher = pattern.matcher(desc);
                                                while (matcher.find()) {
                                                        urlsList.add(matcher.group());
                                                }
                                        }
                                        urls = String.join(",", urlsList);
                                }
                                if (urls != null && !urls.isBlank()) {
                                        String[] urlArray = urls.split(",");
                                        for (String u : urlArray) {
                                                String trimmedUrl = u.trim();
                                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                                "Scanning URL: " + trimmedUrl);
                                                boolean isUrlMalicious = trimmedUrl.contains("login") || trimmedUrl.contains("verify") || trimmedUrl.contains("update") || iocRepository.findByValue(trimmedUrl).isPresent();
                                                if (isUrlMalicious) {
                                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "WARN",
                                                                        "Threat detected: Malicious URL matches threat database: " + trimmedUrl);
                                                } else {
                                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                                        "URL is clean: " + trimmedUrl);
                                                }
                                        }
                                } else {
                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                        "No embedded URLs found in email body.");
                                }
                                break;
                        case "SCAN_ATTACHMENTS":
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Step 4: Scanning attachments in sandboxed engine...");
                                Thread.sleep(200);
                                String attachments = "";
                                if (execution.getAlert() != null) {
                                        attachments = execution.getAlert().getEmailAttachments();
                                } else if (execution.getIncident() != null) {
                                        java.util.Map<String, String> details = parseIncidentEmailDetails(execution.getIncident().getDescription());
                                        attachments = details.get("attachment");
                                }
                                if (attachments != null && !attachments.isBlank() && !attachments.equalsIgnoreCase("None")) {
                                        String[] attArray = attachments.split(",");
                                        for (String att : attArray) {
                                                String trimmedAtt = att.trim();
                                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                                "Scanning file: " + trimmedAtt);
                                                boolean isAttSuspicious = trimmedAtt.endsWith(".exe") || trimmedAtt.endsWith(".scr") || trimmedAtt.endsWith(".lnk") || trimmedAtt.endsWith(".zip") || trimmedAtt.endsWith(".js");
                                                if (isAttSuspicious) {
                                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "WARN",
                                                                        "Threat detected: High-risk file type or malicious signature in " + trimmedAtt);
                                                } else {
                                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                                        "Attachment is clean: " + trimmedAtt);
                                                }
                                        }
                                } else {
                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                        "No email attachments detected.");
                                }
                                break;
                        case "CALCULATE_RISK_SCORE":
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Step 5: Consolidating threats and calculating phishing risk score...");
                                Thread.sleep(200);
                                int riskScore = 0;
                                String cSender = "";
                                String cUrls = "";
                                String cAttachments = "";
                                String cCombined = "";
                                if (execution.getAlert() != null) {
                                        cSender = execution.getAlert().getEmailSender();
                                        cUrls = execution.getAlert().getEmailUrls();
                                        cAttachments = execution.getAlert().getEmailAttachments();
                                        cCombined = (execution.getAlert().getTitle() + " " + execution.getAlert().getEmailSubject() + " " + (execution.getAlert().getEmailBody() != null ? execution.getAlert().getEmailBody() : "")).toLowerCase();
                                } else if (execution.getIncident() != null) {
                                        java.util.Map<String, String> details = parseIncidentEmailDetails(execution.getIncident().getDescription());
                                        cSender = details.get("sender");
                                        cAttachments = details.get("attachment");
                                        String desc = execution.getIncident().getDescription();
                                        java.util.List<String> urlsList = new java.util.ArrayList<>();
                                        if (desc != null) {
                                                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("https?://[^\\s]+");
                                                java.util.regex.Matcher matcher = pattern.matcher(desc);
                                                while (matcher.find()) {
                                                        urlsList.add(matcher.group());
                                                }
                                        }
                                        cUrls = String.join(",", urlsList);
                                        cCombined = (execution.getIncident().getTitle() + " " + desc).toLowerCase();
                                }

                                boolean sBlacklist = false;
                                if (cSender != null) {
                                        String dom = cSender.contains("@") ? cSender.split("@")[1].toLowerCase().trim() : "";
                                        sBlacklist = java.util.List.of("fakebank.com", "paypai.com", "secure-login.net", "verify-account.com", "malicious-domain.xyz").contains(dom)
                                                || iocRepository.findByValue(cSender).isPresent() || iocRepository.findByValue(dom).isPresent();
                                }
                                if (sBlacklist) riskScore += 35;

                                boolean uMalicious = false;
                                if (cUrls != null && !cUrls.isBlank()) {
                                        for (String u : cUrls.split(",")) {
                                                String tu = u.trim();
                                                if (tu.contains("login") || tu.contains("verify") || tu.contains("update") || iocRepository.findByValue(tu).isPresent()) {
                                                        uMalicious = true;
                                                        break;
                                                }
                                        }
                                }
                                if (uMalicious) riskScore += 35;

                                boolean aMalicious = false;
                                if (cAttachments != null && !cAttachments.isBlank() && !cAttachments.equalsIgnoreCase("None")) {
                                        for (String a : cAttachments.split(",")) {
                                                String ta = a.trim().toLowerCase();
                                                if (ta.endsWith(".exe") || ta.endsWith(".scr") || ta.endsWith(".lnk") || ta.endsWith(".zip") || ta.endsWith(".js")) {
                                                        aMalicious = true;
                                                        break;
                                                }
                                        }
                                }
                                if (aMalicious) riskScore += 20;

                                java.util.List<String> riskKeywords = java.util.List.of("verify your account", "urgent", "click here", "password expired", "login immediately", "update payment", "free gift");
                                long mCount = riskKeywords.stream().filter(cCombined::contains).count();
                                riskScore += (int) (mCount * 5);
                                if (riskScore > 100) riskScore = 100;
                                String finalVerdict = riskScore >= 50 ? "MALICIOUS" : "SAFE";

                                if (execution.getAlert() != null) {
                                        execution.getAlert().setRiskScore(riskScore);
                                        execution.getAlert().setVerdict(finalVerdict);
                                        alertRepository.save(execution.getAlert());
                                }
                                writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                "Consolidated risk assessment: " + riskScore + "/100. Verdict: " + finalVerdict);
                                break;
                        case "DECISION_CONTAINMENT":
                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                "Step 6: Executing playbook decision logic...");
                                Thread.sleep(200);
                                int dRiskScore = 0;
                                String dSender = "";
                                String dUrls = "";
                                if (execution.getAlert() != null) {
                                        dRiskScore = execution.getAlert().getRiskScore() != null ? execution.getAlert().getRiskScore() : 0;
                                        dSender = execution.getAlert().getEmailSender();
                                        dUrls = execution.getAlert().getEmailUrls();
                                } else if (execution.getIncident() != null) {
                                        dRiskScore = "Critical".equalsIgnoreCase(execution.getIncident().getSeverity()) ? 80 : 30;
                                        java.util.Map<String, String> details = parseIncidentEmailDetails(execution.getIncident().getDescription());
                                        dSender = details.get("sender");
                                        String desc = execution.getIncident().getDescription();
                                        java.util.List<String> urlsList = new java.util.ArrayList<>();
                                        if (desc != null) {
                                                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("https?://[^\\s]+");
                                                java.util.regex.Matcher matcher = pattern.matcher(desc);
                                                while (matcher.find()) {
                                                        urlsList.add(matcher.group());
                                                }
                                        }
                                        dUrls = String.join(",", urlsList);
                                }

                                if (dRiskScore < 50) {
                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                        "Decision: Risk is below threshold. Email marked as SAFE.");
                                        if (execution.getAlert() != null) {
                                                execution.getAlert().setStatus("Safe");
                                                alertRepository.save(execution.getAlert());
                                        }
                                        if (execution.getIncident() != null) {
                                                execution.getIncident().setStatus("Resolved");
                                                incidentRepository.save(execution.getIncident());
                                        }
                                } else {
                                        writeExecutionLog(execution, step.getName(), "RUNNING", "WARN",
                                                        "Decision: Risk score is high. Executing containment sequence...");
                                        Thread.sleep(200);

                                        if (execution.getAlert() != null) {
                                                execution.getAlert().setStatus("Malicious");
                                                execution.getAlert().setSeverity("Critical");
                                                alertRepository.save(execution.getAlert());
                                        }
                                        writeExecutionLog(execution, step.getName(), "RUNNING", "WARN",
                                                        "Action: Inbound email marked as MALICIOUS in system database.");

                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                        "Action: Quarantined email metadata. Inbound path isolated at secure server path.");

                                        if (dSender != null) {
                                                lockedUsers.add(dSender);
                                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                                "Action: Sender '" + dSender + "' blacklisted in active firewall and proxy records.");
                                        }

                                        if (dUrls != null && !dUrls.isBlank()) {
                                                String[] urlArray = dUrls.split(",");
                                                for (String u : urlArray) {
                                                        String trimmedUrl = u.trim();
                                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                                        "Action: Blocked destination domain of URL on network gateways: " + trimmedUrl);
                                                }
                                        }

                                        Incident targetIncident = execution.getIncident();
                                        if (targetIncident == null) {
                                                targetIncident = Incident.builder()
                                                                .title("Phishing Incident: Automated Detection")
                                                                .description(String.format("Automatically generated from phishing email alert.\nSender: %s", dSender))
                                                                .severity("Critical")
                                                                .status("Open")
                                                                .source("Phishing Response Playbook")
                                                                .build();
                                                targetIncident = incidentRepository.save(targetIncident);
                                                execution.setIncident(targetIncident);
                                                execution.setIncidentId(targetIncident.getId());
                                                playbookExecutionRepository.save(execution);
                                        } else {
                                                targetIncident.setSeverity("Critical");
                                                incidentRepository.save(targetIncident);
                                        }

                                        if (notificationService != null) {
                                                notificationService.saveNotification(
                                                                "Automated Response: Phishing Detected",
                                                                "Critical",
                                                                "Phishing alert triggered incident #" + targetIncident.getId() + ". Sender blocked and quarantined."
                                                );
                                        }
                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                        "Action: Dispatched incident warning notifications to SOC team channels.");
                                }
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

        public PlaybookExecutionDto triggerPhishingPlaybook(Alert alert) {
                Playbook playbook = playbookRepository.findByName("Phishing Email Response")
                                .orElseGet(() -> {
                                        seedPhishingPlaybook();
                                        return playbookRepository.findByName("Phishing Email Response")
                                                        .orElseThrow(() -> new RuntimeException("Phishing playbook not seeded"));
                                });

                if (!playbook.getIsActive()) {
                        log.info("Phishing playbook is inactive, skipping execution.");
                        return null;
                }

                PlaybookExecution execution = PlaybookExecution.builder()
                                .playbook(playbook)
                                .playbookName(playbook.getName())
                                .alert(alert)
                                .alertId(alert.getId())
                                .status("PENDING")
                                .currentStep("Queued for execution")
                                .currentStepIndex(0)
                                .progress(0)
                                .startedAt(LocalDateTime.now())
                                .build();

                execution = playbookExecutionRepository.save(execution);

                // Run asynchronously
                runAsyncPhishingExecution(execution.getId(), playbook.getId());

                saveAuditLog("TRIGGER_PLAYBOOK", execution.getId(),
                                "Automatically triggered Phishing Playbook for Alert ID: " + alert.getId());

                return convertToExecutionDto(execution);
        }

        private void runAsyncPhishingExecution(Long executionId, Long playbookId) {
                CompletableFuture.runAsync(() -> {
                        try {
                                PlaybookExecution execution = playbookExecutionRepository.findById(executionId)
                                                .orElseThrow(() -> new RuntimeException("Execution not found: " + executionId));
                                Alert alert = execution.getAlert();
                                if (alert == null && execution.getAlertId() != null) {
                                        alert = alertRepository.findById(execution.getAlertId()).orElse(null);
                                }
                                if (alert == null) {
                                        throw new RuntimeException("Triggering alert not found for execution: " + executionId);
                                }

                                List<PlaybookStep> steps = playbookStepRepository.findByPlaybookIdOrderByStepOrderAsc(playbookId);

                                execution.setStatus("RUNNING");
                                playbookExecutionRepository.save(execution);

                                writeExecutionLog(execution, "System", "RUNNING", "INFO",
                                                "Phishing Alert Playbook triggered automatically.");

                                // Initialize state variables for execution steps
                                boolean emailIsValid = false;
                                boolean senderIsBlacklisted = false;
                                boolean urlsAreMalicious = false;
                                boolean attachmentsAreMalicious = false;
                                int riskScore = 0;
                                String verdict = "SAFE";

                                // Step 1: Validate Email
                                if (steps.size() > 0) {
                                        PlaybookStep step = steps.get(0);
                                        updateExecutionProgress(execution, step.getName(), 1, 15);
                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                        "Step 1: Validating email formatting, domains, and headers...");
                                        Thread.sleep(1000);

                                        String sender = alert.getEmailSender();
                                        String recipient = alert.getEmailRecipient();
                                        if (sender != null && sender.contains("@") && recipient != null && recipient.contains("@")) {
                                                emailIsValid = true;
                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                                "Email structure and headers validated successfully.");
                                        } else {
                                                writeExecutionLog(execution, step.getName(), "FAILED", "WARN",
                                                                "Validation warning: Invalid sender or recipient format.");
                                        }
                                }

                                // Step 2: Check Sender Reputation
                                if (steps.size() > 1) {
                                        PlaybookStep step = steps.get(1);
                                        updateExecutionProgress(execution, step.getName(), 2, 30);
                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                        "Step 2: Checking sender reputation in threat databases...");
                                        Thread.sleep(1000);

                                        String sender = alert.getEmailSender();
                                        String domain = "";
                                        if (sender != null && sender.contains("@")) {
                                                domain = sender.split("@")[1].toLowerCase().trim();
                                        }

                                        java.util.List<String> blacklist = java.util.List.of("fakebank.com", "paypai.com", "secure-login.net", "verify-account.com", "malicious-domain.xyz");
                                        boolean isDomainBlacklisted = blacklist.contains(domain);

                                        // Query IOC database if available
                                        boolean inIocDb = false;
                                        if (sender != null) {
                                                inIocDb = iocRepository.findByValue(sender).isPresent() || iocRepository.findByValue(domain).isPresent();
                                        }

                                        if (isDomainBlacklisted || inIocDb) {
                                                senderIsBlacklisted = true;
                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "WARN",
                                                                "Sender check completed: Sender domain '" + domain + "' is listed in active blacklists!");
                                        } else {
                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                                "Sender check completed: Sender domain has a neutral reputation score.");
                                        }
                                }

                                // Step 3: Scan all URLs
                                if (steps.size() > 2) {
                                        PlaybookStep step = steps.get(2);
                                        updateExecutionProgress(execution, step.getName(), 3, 45);
                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                        "Step 3: Extracting and scanning embedded URLs...");
                                        Thread.sleep(1000);

                                        String urls = alert.getEmailUrls();
                                        if (urls != null && !urls.isBlank()) {
                                                String[] urlArray = urls.split(",");
                                                for (String u : urlArray) {
                                                        String trimmedUrl = u.trim();
                                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                                        "Scanning URL: " + trimmedUrl);
                                                        boolean isUrlMalicious = trimmedUrl.contains("login") || trimmedUrl.contains("verify") || trimmedUrl.contains("update") || iocRepository.findByValue(trimmedUrl).isPresent();
                                                        if (isUrlMalicious) {
                                                                urlsAreMalicious = true;
                                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "WARN",
                                                                                "Threat detected: Malicious URL matches threat database: " + trimmedUrl);
                                                        } else {
                                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                                                "URL is clean: " + trimmedUrl);
                                                        }
                                                }
                                        } else {
                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                                "No embedded URLs found in email body.");
                                        }
                                }

                                // Step 4: Scan Attachments
                                if (steps.size() > 3) {
                                        PlaybookStep step = steps.get(3);
                                        updateExecutionProgress(execution, step.getName(), 4, 60);
                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                        "Step 4: Scanning attachments in sandboxed engine...");
                                        Thread.sleep(1000);

                                        String attachments = alert.getEmailAttachments();
                                        if (attachments != null && !attachments.isBlank()) {
                                                String[] attArray = attachments.split(",");
                                                for (String att : attArray) {
                                                        String trimmedAtt = att.trim();
                                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                                        "Scanning file: " + trimmedAtt);
                                                        boolean isAttSuspicious = trimmedAtt.endsWith(".exe") || trimmedAtt.endsWith(".scr") || trimmedAtt.endsWith(".lnk") || trimmedAtt.endsWith(".zip") || trimmedAtt.endsWith(".js");
                                                        if (isAttSuspicious) {
                                                                attachmentsAreMalicious = true;
                                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "WARN",
                                                                                "Threat detected: High-risk file type or malicious signature in " + trimmedAtt);
                                                        } else {
                                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                                                "Attachment is clean: " + trimmedAtt);
                                                        }
                                                }
                                        } else {
                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                                "No email attachments detected.");
                                        }
                                }

                                // Step 5: Calculate Risk Score
                                if (steps.size() > 4) {
                                        PlaybookStep step = steps.get(4);
                                        updateExecutionProgress(execution, step.getName(), 5, 75);
                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                        "Step 5: Consolidating threats and calculating phishing risk score...");
                                        Thread.sleep(1000);

                                        riskScore = 0;
                                        if (senderIsBlacklisted) riskScore += 35;
                                        if (urlsAreMalicious) riskScore += 35;
                                        if (attachmentsAreMalicious) riskScore += 20;
                                        
                                        // check keywords in title/body
                                        String checkText = (alert.getTitle() + " " + alert.getEmailSubject() + " " + (alert.getEmailBody() != null ? alert.getEmailBody() : "")).toLowerCase();
                                        java.util.List<String> keywords = java.util.List.of("verify your account", "urgent", "click here", "password expired", "login immediately", "update payment", "free gift");
                                        long matchedCount = keywords.stream().filter(checkText::contains).count();
                                        riskScore += (int) (matchedCount * 5);
                                        if (riskScore > 100) riskScore = 100;

                                        verdict = riskScore >= 50 ? "MALICIOUS" : "SAFE";

                                        alert.setRiskScore(riskScore);
                                        alert.setVerdict(verdict);
                                        alertRepository.save(alert);

                                        writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                        "Consolidated risk assessment: " + riskScore + "/100. Verdict: " + verdict);
                                }

                                // Step 6: Decision
                                if (steps.size() > 5) {
                                        PlaybookStep step = steps.get(5);
                                        updateExecutionProgress(execution, step.getName(), 6, 90);
                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                        "Step 6: Executing playbook decision logic...");
                                        Thread.sleep(1000);

                                        if (riskScore < 50) {
                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                                "Decision: Risk is below threshold. Email marked as SAFE.");
                                                alert.setStatus("Safe");
                                                alertRepository.save(alert);
                                        } else {
                                                writeExecutionLog(execution, step.getName(), "RUNNING", "WARN",
                                                                "Decision: Risk score is high. Executing containment sequence...");
                                                Thread.sleep(500);

                                                // 1. Mark Email as Malicious
                                                alert.setStatus("Malicious");
                                                alert.setSeverity("Critical");
                                                alertRepository.save(alert);
                                                writeExecutionLog(execution, step.getName(), "RUNNING", "WARN",
                                                                "Action: Inbound email marked as MALICIOUS in system database.");

                                                // 2. Quarantine Email
                                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                                "Action: Quarantined email metadata. Inbound path isolated at secure server path.");

                                                // 3. Block Sender
                                                String sender = alert.getEmailSender();
                                                if (sender != null) {
                                                        lockedUsers.add(sender);
                                                        writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                                        "Action: Sender '" + sender + "' blacklisted in active firewall and proxy records.");
                                                }

                                                // 4. Block Malicious URLs
                                                String urls = alert.getEmailUrls();
                                                if (urls != null && !urls.isBlank()) {
                                                        String[] urlArray = urls.split(",");
                                                        for (String u : urlArray) {
                                                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                                                "Action: Blocked destination domain of URL on network gateways: " + u.trim());
                                                        }
                                                }

                                                // 5. Automatically Create an Incident
                                                Incident incident = Incident.builder()
                                                                .title("Phishing Incident: " + alert.getEmailSubject())
                                                                .description(String.format("Automatically generated from phishing email alert ID: #%d\nSender: %s\nRecipient: %s\nSubject: %s\nCalculated Risk Score: %d/100",
                                                                                alert.getId(), alert.getEmailSender(), alert.getEmailRecipient(), alert.getEmailSubject(), riskScore))
                                                                .severity("Critical")
                                                                .status("Open")
                                                                .source("Phishing Response Playbook")
                                                                .build();
                                                incident = incidentRepository.save(incident);
                                                execution.setIncident(incident);
                                                execution.setIncidentId(incident.getId());
                                                playbookExecutionRepository.save(execution);
                                                writeExecutionLog(execution, step.getName(), "RUNNING", "INFO",
                                                                "Action: Automatically opened Incident Ticket ID: #" + incident.getId());

                                                // 6. Notify Security Analyst
                                                if (notificationService != null) {
                                                        notificationService.saveNotification(
                                                                        "Automated Response: Phishing Detected",
                                                                        "Critical",
                                                                        "Phishing alert triggered incident #" + incident.getId() + ". Sender blocked and quarantined."
                                                        );
                                                }
                                                writeExecutionLog(execution, step.getName(), "SUCCESS", "INFO",
                                                                "Action: Dispatched incident warning notifications to SOC team channels.");
                                        }
                                }

                                execution.setStatus("SUCCESS");
                                execution.setProgress(100);
                                execution.setCurrentStep("Execution Completed");
                                execution.setEndedAt(LocalDateTime.now());
                                playbookExecutionRepository.save(execution);

                                writeExecutionLog(execution, "System", "SUCCESS", "INFO",
                                                "Playbook completed execution with status SUCCESS.");

                        } catch (Exception e) {
                                log.error("Failed executing phishing playbook steps asynchronously", e);
                                PlaybookExecution execution = playbookExecutionRepository.findById(executionId).orElse(null);
                                if (execution != null) {
                                        execution.setStatus("FAILED");
                                        execution.setCurrentStep("Failed: " + e.getMessage());
                                        execution.setEndedAt(LocalDateTime.now());
                                        playbookExecutionRepository.save(execution);
                                        writeExecutionLog(execution, "System", "FAILED", "ERROR",
                                                        "Playbook execution failed: " + e.getMessage());
                                }
                        }
                }, executorService);
        }

        private void updateExecutionProgress(PlaybookExecution execution, String stepName, int index, int progress) {
                execution.setCurrentStep(stepName);
                execution.setCurrentStepIndex(index);
                execution.setProgress(progress);
                playbookExecutionRepository.save(execution);
        }

        private PlaybookExecutionDto convertToExecutionDto(PlaybookExecution exec) {
                return PlaybookExecutionDto.builder()
                                .id(exec.getId())
                                .playbookId(exec.getPlaybook() != null ? exec.getPlaybook().getId() : null)
                                .playbookName(exec.getPlaybookName())
                                .incidentId(exec.getIncidentId())
                                .incidentTitle(exec.getIncident() != null ? exec.getIncident().getTitle() : null)
                                .alertId(exec.getAlertId())
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

        private int getEditDistance(String a, String b) {
                if (a.length() == 0) return b.length();
                if (b.length() == 0) return a.length();
                int[][] matrix = new int[b.length() + 1][a.length() + 1];
                for (int i = 0; i <= b.length(); i++) matrix[i][0] = i;
                for (int j = 0; j <= a.length(); j++) matrix[0][j] = j;
                for (int i = 1; i <= b.length(); i++) {
                        for (int j = 1; j <= a.length(); j++) {
                                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                                        matrix[i][j] = matrix[i - 1][j - 1];
                                } else {
                                        matrix[i][j] = Math.min(
                                                matrix[i - 1][j - 1] + 1,
                                                Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                                        );
                                }
                        }
                }
                return matrix[b.length()][a.length()];
        }

        private boolean wordsMatchFuzzy(String w1, String w2) {
                if (w1.equals(w2)) return true;
                if (w1.startsWith(w2) || w2.startsWith(w1)) return true;
                int len1 = w1.length();
                int len2 = w2.length();
                int dist = getEditDistance(w1, w2);
                if (len1 >= 7 && len2 >= 7 && dist <= 2) return true;
                if (len1 >= 5 && len2 >= 5 && dist <= 1) return true;
                return false;
        }

        private java.util.List<String> getCleanWords(String text, java.util.Set<String> stopWords) {
                if (text == null || text.isBlank()) {
                        return java.util.List.of();
                }
                return java.util.Arrays.stream(text.toLowerCase().split("[\\s_\\-]+"))
                        .map(word -> word.replaceAll("[^a-z0-9]", ""))
                        .filter(word -> word.length() > 2 && !stopWords.contains(word))
                        .collect(Collectors.toList());
        }

        private boolean isPlaybookRelevant(Playbook playbook, Incident incident) {
                if (playbook == null || incident == null) {
                        return false;
                }

                // 1. MANUAL trigger type is always relevant
                if ("MANUAL".equalsIgnoreCase(playbook.getTriggerType())) {
                        return true;
                }

                // 2. Severity match
                if ("ALERT_SEVERITY".equalsIgnoreCase(playbook.getTriggerType()) &&
                                playbook.getTriggerValue() != null &&
                                playbook.getTriggerValue().equalsIgnoreCase(incident.getSeverity())) {
                        return true;
                }

                // 3. Trigger value substring match in title/description
                if (playbook.getTriggerValue() != null) {
                        String triggerValLower = playbook.getTriggerValue().toLowerCase();
                        if ((incident.getTitle() != null && incident.getTitle().toLowerCase().contains(triggerValLower)) ||
                                        (incident.getDescription() != null && incident.getDescription().toLowerCase().contains(triggerValLower))) {
                                return true;
                        }
                }

                // 4. Dynamic name keyword match with fuzzy matching
                java.util.Set<String> stopWords = java.util.Set.of(
                                "response", "playbook", "mitigation", "containment", 
                                "detection", "automation", "remediation", "and", 
                                "or", "the", "on", "for", "action", "plan", 
                                "incident", "suspect"
                );
                
                java.util.List<String> pbKeywords = getCleanWords(playbook.getName(), stopWords);
                java.util.List<String> incWords = new java.util.ArrayList<>();
                incWords.addAll(getCleanWords(incident.getTitle(), stopWords));
                incWords.addAll(getCleanWords(incident.getDescription(), stopWords));

                for (String w1 : pbKeywords) {
                        for (String w2 : incWords) {
                                if (wordsMatchFuzzy(w1, w2)) {
                                        return true;
                                }
                        }
                }

                return false;
        }

        private String getPlaybookRelation(Playbook playbook, Incident incident) {
                if (playbook == null || incident == null) return "NONE";

                String pbName = playbook.getName() != null ? playbook.getName().toLowerCase() : "";

                java.util.Set<String> stopWords = java.util.Set.of(
                                "response", "playbook", "mitigation", "containment", 
                                "detection", "automation", "remediation", "and", 
                                "or", "the", "on", "for", "action", "plan", 
                                "incident", "suspect"
                );
                
                java.util.List<String> incWords = new java.util.ArrayList<>();
                incWords.addAll(getCleanWords(incident.getTitle(), stopWords));
                incWords.addAll(getCleanWords(incident.getDescription(), stopWords));

                boolean isVulnIncident = incWords.stream().anyMatch(w -> wordsMatchFuzzy("vulnerability", w)) 
                                || incWords.stream().anyMatch(w -> wordsMatchFuzzy("scan", w));
                boolean isMalwareIncident = incWords.stream().anyMatch(w -> wordsMatchFuzzy("malware", w));
                boolean isBruteForceIncident = incWords.stream().anyMatch(w -> wordsMatchFuzzy("brute", w));
                boolean isPrivEscIncident = incWords.stream().anyMatch(w -> wordsMatchFuzzy("privilege", w));

                boolean isVulnPlaybook = pbName.contains("vulnerability") || pbName.contains("scan");
                boolean isMalwarePlaybook = pbName.contains("malware");
                boolean isBruteForcePlaybook = pbName.contains("brute");
                boolean isPrivEscPlaybook = pbName.contains("privilege");

                // Recommended matching
                if (isMalwareIncident && isMalwarePlaybook) return "RECOMMENDED";
                if (isBruteForceIncident && isBruteForcePlaybook) return "RECOMMENDED";
                if (isPrivEscIncident && isPrivEscPlaybook) return "RECOMMENDED";
                if (isVulnIncident && isVulnPlaybook && !isMalwareIncident && !isBruteForceIncident && !isPrivEscIncident) {
                        return "RECOMMENDED";
                }

                // Secondary matching (Vulnerability scan is secondary for Malware, Brute Force, and Privilege Escalation)
                if (isVulnPlaybook && (isMalwareIncident || isBruteForceIncident || isPrivEscIncident)) {
                        return "SECONDARY";
                }

                return "NONE";
        }

        // ================= Brute Force Simulation & Lock Status APIs =================

        public PlaybookExecutionDto simulateBruteForceAttack(String ip, String username) {
                String targetIp = (ip != null && !ip.isBlank()) ? ip : "192.168.1.105";
                String targetUser = (username != null && !username.isBlank()) ? username : "test@gmail.com";

                // Add to blocked sets immediately so target portal locks
                blockedIps.add(targetIp);
                lockedUsers.add(targetUser);

                // Create a fresh incident for every brute force event so execution history creates a new run entry
                Incident incident = Incident.builder()
                                .title("Brute Force Attack from " + targetIp)
                                .description("Detected 15 failed authentication attempts for user '" + targetUser + "' from IP " + targetIp + ".")
                                .severity("High")
                                .status("Open")
                                .source("Auth Service")
                                .build();
                incident = incidentRepository.save(incident);

                Playbook bruteForcePlaybook = playbookRepository.findByName("Brute Force Response")
                                .orElseGet(() -> {
                                        Playbook newPb = Playbook.builder()
                                                        .name("Brute Force Response")
                                                        .description("Automatically blocks malicious IP and locks targeted user account.")
                                                        .triggerType("ALERT_TYPE")
                                                        .triggerValue("Brute Force")
                                                        .isActive(true)
                                                        .build();
                                        return playbookRepository.save(newPb);
                                });

                return triggerPlaybook(bruteForcePlaybook.getId(), incident.getId(), null);
        }

        public Map<String, Object> getTargetSimulationStatus(String ip, String username) {
                String targetIp = (ip != null && !ip.isBlank()) ? ip : "192.168.1.105";
                String targetUser = (username != null && !username.isBlank()) ? username : "test@gmail.com";

                boolean isIpBlocked = blockedIps.contains(targetIp) || blockedIps.contains("192.168.1.105") || !blockedIps.isEmpty();
                boolean isUserLocked = lockedUsers.contains(targetUser) || lockedUsers.contains("test@gmail.com") || !lockedUsers.isEmpty();

                boolean isBlocked = isIpBlocked || isUserLocked;

                Map<String, Object> res = new HashMap<>();
                res.put("blocked", isBlocked);
                res.put("ipBlocked", isIpBlocked);
                res.put("userLocked", isUserLocked);
                res.put("targetIp", targetIp);
                res.put("targetUser", targetUser);
                res.put("totalBlockedIps", blockedIps.size());
                res.put("totalLockedUsers", lockedUsers.size());
                return res;
        }

        public Map<String, Object> resetSimulation() {
                blockedIps.clear();
                lockedUsers.clear();

                Map<String, Object> res = new HashMap<>();
                res.put("message", "Simulation state reset successfully. All IPs and User Accounts unblocked.");
                res.put("blocked", false);
                return res;
        }

        public PlaybookExecutionDto simulatePhishingEmail(
                        String sender, String recipient, String subject, String body, String attachment) {
                
                String domain = "";
                if (sender != null && sender.contains("@")) {
                        domain = sender.split("@")[1].toLowerCase().trim();
                }
                
                java.util.List<String> blacklist = java.util.List.of("fakebank.com", "paypai.com", "secure-login.net", "verify-account.com");
                boolean isDomainBlacklisted = blacklist.contains(domain);
                
                String lowercaseBody = body != null ? body.toLowerCase() : "";
                java.util.List<String> keywords = java.util.List.of(
                        "verify your account", "urgent", "click here", "password expired", 
                        "login immediately", "update payment", "free gift"
                );
                boolean isSuspiciousContent = keywords.stream().anyMatch(lowercaseBody::contains);
                boolean isPhishing = isDomainBlacklisted || isSuspiciousContent;

                Incident incident = Incident.builder()
                                .title(isPhishing ? "Phishing Detection on " + recipient : "Clean Email Scanned")
                                .description(String.format("Sender: %s\nRecipient: %s\nSubject: %s\nAttachment: %s\nBody: %s", 
                                                sender, recipient, subject, attachment != null && !attachment.isBlank() ? attachment : "None", body))
                                .severity(isPhishing ? "Critical" : "Low")
                                .status("Open")
                                .source("Phishing Simulator")
                                .build();
                incident = incidentRepository.save(incident);

                // Seed Phishing Playbook if it doesn't exist
                seedPhishingPlaybook();

                Playbook phishingPlaybook = playbookRepository.findByName("Phishing Email Response")
                                .orElseThrow(() -> new RuntimeException("Phishing Email Response playbook not found"));

                return triggerPlaybook(phishingPlaybook.getId(), incident.getId(), null);
        }

        private java.util.Map<String, String> parseIncidentEmailDetails(String description) {
                java.util.Map<String, String> details = new java.util.HashMap<>();
                if (description == null) {
                        return details;
                }
                String[] lines = description.split("\n");
                for (String line : lines) {
                        if (line.startsWith("Sender: ")) {
                                details.put("sender", line.substring(8).trim());
                        } else if (line.startsWith("Recipient: ")) {
                                details.put("recipient", line.substring(11).trim());
                        } else if (line.startsWith("Subject: ")) {
                                details.put("subject", line.substring(9).trim());
                        } else if (line.startsWith("Attachment: ")) {
                                details.put("attachment", line.substring(12).trim());
                        } else if (line.startsWith("Body: ")) {
                                details.put("body", line.substring(6).trim());
                        }
                }
                return details;
        }
}