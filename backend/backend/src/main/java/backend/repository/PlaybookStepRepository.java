package backend.repository;

import backend.entity.PlaybookStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlaybookStepRepository extends JpaRepository<PlaybookStep, Long> {
    List<PlaybookStep> findByPlaybookIdOrderByStepOrderAsc(Long playbookId);
}
