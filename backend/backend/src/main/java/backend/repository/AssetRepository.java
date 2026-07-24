package backend.repository;

import backend.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long>, JpaSpecificationExecutor<Asset> {

    Optional<Asset> findByHostname(String hostname);

    Optional<Asset> findByIpAddress(String ipAddress);

    Optional<Asset> findFirstByOrderByIdDesc();

    long countByCriticality(String criticality);

    long countByStatus(String status);

    long countByPatchStatus(String patchStatus);
}
