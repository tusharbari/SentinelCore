package backend;

import backend.entity.Role;
import backend.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	CommandLineRunner ensureDefaultRoles(RoleRepository roleRepository, backend.service.VulnerabilityService vulnerabilityService) {
		return args -> {
			for (String roleName : new String[]{"ADMIN", "ANALYST"}) {
				if (roleRepository.findByName(roleName).isEmpty()) {
					roleRepository.save(Role.builder().name(roleName).build());
				}
			}

			if (roleRepository.findByName("VIEWER").isEmpty()) {
				Role viewerRole = roleRepository.findByName("USER")
						.orElseGet(() -> Role.builder().build());
				viewerRole.setName("VIEWER");
				roleRepository.save(viewerRole);
			}

			if (vulnerabilityService.getAllVulnerabilities().isEmpty()) {
				vulnerabilityService.triggerScan();
			}
		};
	}

}
