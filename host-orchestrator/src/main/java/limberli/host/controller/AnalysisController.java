package limberli.host.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import limberli.common.a2a.AgentCardDto;
import limberli.common.dto.AnalysisRequest;
import limberli.common.dto.AnalysisResponse;
import limberli.common.dto.ConversationDto;
import limberli.common.dto.ExtractTextResponse;
import limberli.common.exception.DocumentParseException;
import limberli.host.repository.Conversation;
import limberli.host.repository.ConversationRepository;
import limberli.host.service.AgentDiscoveryService;
import limberli.host.service.DocumentParserService;
import limberli.host.service.OrchestrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Validated
@Tag(name = "Analysis", description = "Document analysis and conversation history")
public class AnalysisController {

    private final OrchestrationService orchestrationService;
    private final ConversationRepository conversationRepository;
    private final AgentDiscoveryService discoveryService;
    private final DocumentParserService documentParserService;

    @PostMapping(value = "/extract-text", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Extract plain text from an uploaded .docx requirement document",
            description = "Deterministic Loader/Parser (Apache POI). Returns clean text the user can " +
                    "review/edit before sending it to /analyze. No LLM involved.")
    public ResponseEntity<ExtractTextResponse> extractText(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new DocumentParseException("No file uploaded.");
        }
        try {
            String text = documentParserService.extractText(file.getInputStream(), file.getOriginalFilename());
            return ResponseEntity.ok(new ExtractTextResponse(file.getOriginalFilename(), text.length(), text));
        } catch (IOException e) {
            throw new DocumentParseException("Could not read the uploaded file: " + e.getMessage(), e);
        }
    }

    @PostMapping("/analyze")
    @Operation(summary = "Analyze a requirements document",
            description = "Sends the document to Tester and Analyst agents in parallel via A2A Protocol, " +
                    "aggregates their responses, and persists the conversation.")
    public ResponseEntity<AnalysisResponse> analyze(@Valid @RequestBody AnalysisRequest request) {
        return ResponseEntity.ok(
                orchestrationService.analyze(request.documentText(), null, request.includeRiskAnalysis()));
    }

    @GetMapping("/history")
    @Operation(summary = "Get analysis history (paginated, newest first)")
    public ResponseEntity<Page<ConversationDto>> history(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") @Max(50) int size) {

        Page<ConversationDto> result = conversationRepository
                .findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()))
                .map(this::toDto);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/agents")
    @Operation(summary = "List discovered agents and their capabilities")
    public ResponseEntity<Map<String, AgentCardDto>> agents() {
        return ResponseEntity.ok(discoveryService.getDiscoveredCards());
    }

    private ConversationDto toDto(Conversation c) {
        String preview = c.getDocumentText().length() > 200
                ? c.getDocumentText().substring(0, 200) + "…"
                : c.getDocumentText();
        return new ConversationDto(c.getId(), preview, c.getTesterResponse(), c.getAnalystResponse(), c.getCreatedAt());
    }
}
