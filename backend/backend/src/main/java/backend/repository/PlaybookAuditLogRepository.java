package backend.repository;

import backend.entity.PlaybookAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlaybookAuditLogRepository extends JpaRepository<PlaybookAuditLog, Long> {
    List<PlaybookAuditLog> findAllByOrderByTimestampDesc();
}
