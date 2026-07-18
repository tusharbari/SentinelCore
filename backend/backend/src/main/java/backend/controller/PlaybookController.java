package backend.controller;

import backend.dto.PlaybookStatusResponse;
import backend.service.PlaybookService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/playbooks")
@RequiredArgsConstructor
public class PlaybookController {

    private final PlaybookService playbookService;

    @PostMapping("/run/{incidentId}")
    public PlaybookStatusResponse runPlaybook(
            @PathVariable Long incidentId){

        return playbookService.runPlaybook(incidentId);
    }

    @GetMapping("/status/{incidentId}")
    public PlaybookStatusResponse getStatus(
            @PathVariable Long incidentId){

        return playbookService.updateStatus(incidentId);
    }

}