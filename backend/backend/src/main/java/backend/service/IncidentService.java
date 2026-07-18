package backend.service;

import backend.dto.IncidentDto;
import backend.entity.Incident;
import backend.entity.User;
import backend.repository.IncidentRepository;
import backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;

    // Get All Incidents
    public List<IncidentDto> getAllIncidents() {
        return incidentRepository.findAllByOrderByIdDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // Get Incident by ID
    public IncidentDto getIncidentById(Long id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found with id: " + id));
        return convertToDto(incident);
    }

    // Create Incident
    @Transactional
    public IncidentDto createIncident(IncidentDto dto) {
        Incident incident = convertToEntity(dto);
        Incident savedIncident = incidentRepository.save(incident);
        return convertToDto(savedIncident);
    }

    // Update Incident
    @Transactional
    public IncidentDto updateIncident(Long id, IncidentDto dto) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found with id: " + id));

        incident.setTitle(dto.getTitle());
        incident.setDescription(dto.getDescription());
        incident.setSeverity(dto.getSeverity());
        incident.setStatus(dto.getStatus());
        incident.setSource(dto.getSource());

        if (dto.getAssignedToId() != null) {
            User user = userRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + dto.getAssignedToId()));
            incident.setAssignedTo(user);
        } else {
            incident.setAssignedTo(null);
        }

        Incident updatedIncident = incidentRepository.save(incident);
        return convertToDto(updatedIncident);
    }

    // Delete Incident
    @Transactional
    public void deleteIncident(Long id) {
        if (!incidentRepository.existsById(id)) {
            throw new RuntimeException("Incident not found with id: " + id);
        }
        incidentRepository.deleteById(id);
    }

    // Entity to DTO mapper
    public IncidentDto convertToDto(Incident incident) {
        IncidentDto.IncidentDtoBuilder builder = IncidentDto.builder()
                .id(incident.getId())
                .title(incident.getTitle())
                .description(incident.getDescription())
                .severity(incident.getSeverity())
                .status(incident.getStatus())
                .source(incident.getSource())
                .createdAt(incident.getCreatedAt())
                .updatedAt(incident.getUpdatedAt());

        if (incident.getAssignedTo() != null) {
            builder.assignedToId(incident.getAssignedTo().getId())
                   .assignedToName(incident.getAssignedTo().getName());
        }

        return builder.build();
    }

    // DTO to Entity mapper
    private Incident convertToEntity(IncidentDto dto) {
        Incident.IncidentBuilder builder = Incident.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .severity(dto.getSeverity())
                .status(dto.getStatus())
                .source(dto.getSource());

        if (dto.getAssignedToId() != null) {
            User user = userRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + dto.getAssignedToId()));
            builder.assignedTo(user);
        }

        return builder.build();
    }
}
