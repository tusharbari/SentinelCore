package backend.repository;

import backend.entity.IOC;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;

@Repository
public interface IOCRepository extends JpaRepository<IOC, Long> {

    List<IOC> findByTypeContainingIgnoreCase(String type);

    List<IOC> findByRiskLevel(String riskLevel);

    Optional<IOC> findByValue(String value);

}