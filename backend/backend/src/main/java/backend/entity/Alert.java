package backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String severity;

    private String source;

    private String status;

    @Column(length = 1000)
    private String description;

    @Column(name = "occurrence_count")
    private Integer occurrenceCount = 1;

    @Column(name = "last_occurred")
    private LocalDateTime lastOccurred;

    @Column(name = "email_sender")
    private String emailSender;

    @Column(name = "email_recipient")
    private String emailRecipient;

    @Column(name = "email_subject")
    private String emailSubject;

    @Column(name = "email_body", columnDefinition = "TEXT")
    private String emailBody;

    @Column(name = "email_urls", columnDefinition = "TEXT")
    private String emailUrls;

    @Column(name = "email_attachments", columnDefinition = "TEXT")
    private String emailAttachments;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(name = "verdict")
    private String verdict;

    public Alert() {
    }

    public Alert(Long id, String title, String severity,
                 String source, String status,
                 String description,
                 Integer occurrenceCount,
                 LocalDateTime lastOccurred) {

        this.id = id;
        this.title = title;
        this.severity = severity;
        this.source = source;
        this.status = status;
        this.description = description;
        this.occurrenceCount = occurrenceCount;
        this.lastOccurred = lastOccurred;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getOccurrenceCount() {
        return occurrenceCount;
    }

    public void setOccurrenceCount(Integer occurrenceCount) {
        this.occurrenceCount = occurrenceCount;
    }

    public LocalDateTime getLastOccurred() {
        return lastOccurred;
    }

    public void setLastOccurred(LocalDateTime lastOccurred) {
        this.lastOccurred = lastOccurred;
    }

    public String getEmailSender() {
        return emailSender;
    }

    public void setEmailSender(String emailSender) {
        this.emailSender = emailSender;
    }

    public String getEmailRecipient() {
        return emailRecipient;
    }

    public void setEmailRecipient(String emailRecipient) {
        this.emailRecipient = emailRecipient;
    }

    public String getEmailSubject() {
        return emailSubject;
    }

    public void setEmailSubject(String emailSubject) {
        this.emailSubject = emailSubject;
    }

    public String getEmailBody() {
        return emailBody;
    }

    public void setEmailBody(String emailBody) {
        this.emailBody = emailBody;
    }

    public String getEmailUrls() {
        return emailUrls;
    }

    public void setEmailUrls(String emailUrls) {
        this.emailUrls = emailUrls;
    }

    public String getEmailAttachments() {
        return emailAttachments;
    }

    public void setEmailAttachments(String emailAttachments) {
        this.emailAttachments = emailAttachments;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public String getVerdict() {
        return verdict;
    }

    public void setVerdict(String verdict) {
        this.verdict = verdict;
    }
}