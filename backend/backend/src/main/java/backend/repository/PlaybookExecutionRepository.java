package backend.repository;

import backend.entity.PlaybookExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlaybookExecutionRepository extends JpaRepository<PlaybookExecution, Long> {
    Optional<PlaybookExecution> findByIncidentId(Long incidentId);
    List<PlaybookExecution> findByPlaybookIdOrderByIdDesc(Long playbookId);
    List<PlaybookExecution> findAllByOrderByIdDesc();
}
