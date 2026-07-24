package backend.repository;

import backend.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findAllByOrderByIdDesc();
    List<Incident> findByAssetId(Long assetId);
    long countByStatus(String status);
    long countBySeverity(String severity);
    Optional<Incident> findByTitle(String title);
}

