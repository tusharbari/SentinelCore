package backend.repository;

import backend.entity.PlaybookExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlaybookExecutionLogRepository extends JpaRepository<PlaybookExecutionLog, Long> {
    List<PlaybookExecutionLog> findByPlaybookExecutionIdOrderByTimestampAsc(Long executionId);
}
