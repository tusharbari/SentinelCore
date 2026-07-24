package backend.specification;

import backend.entity.Asset;
import org.springframework.data.jpa.domain.Specification;

public class AssetSpecification {

    public static Specification<Asset> hasHostname(String hostname) {
        return (root, query, cb) -> {
            if (hostname == null || hostname.trim().isEmpty()) {
                return null;
            }
            return cb.like(cb.lower(root.get("hostname")), "%" + hostname.trim().toLowerCase() + "%");
        };
    }

    public static Specification<Asset> hasOwner(String owner) {
        return (root, query, cb) -> {
            if (owner == null || owner.trim().isEmpty()) {
                return null;
            }
            return cb.like(cb.lower(root.get("owner")), "%" + owner.trim().toLowerCase() + "%");
        };
    }

    public static Specification<Asset> hasStatus(String status) {
        return (root, query, cb) -> {
            if (status == null || status.trim().isEmpty() || status.equalsIgnoreCase("ALL")) {
                return null;
            }
            return cb.equal(root.get("status"), status.trim().toUpperCase());
        };
    }

    public static Specification<Asset> hasCriticality(String criticality) {
        return (root, query, cb) -> {
            if (criticality == null || criticality.trim().isEmpty() || criticality.equalsIgnoreCase("ALL")) {
                return null;
            }
            return cb.equal(root.get("criticality"), criticality.trim().toUpperCase());
        };
    }

    public static Specification<Asset> hasPatchStatus(String patchStatus) {
        return (root, query, cb) -> {
            if (patchStatus == null || patchStatus.trim().isEmpty() || patchStatus.equalsIgnoreCase("ALL")) {
                return null;
            }
            return cb.equal(root.get("patchStatus"), patchStatus.trim().toUpperCase());
        };
    }
}
