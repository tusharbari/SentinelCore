package backend.repository;

import backend.entity.Playbook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlaybookRepository extends JpaRepository<Playbook, Long> {
    Optional<Playbook> findByName(String name);
    List<Playbook> findByTriggerTypeAndIsActiveTrue(String triggerType);
}
