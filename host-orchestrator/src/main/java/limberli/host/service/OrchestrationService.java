package limberli.host.service;

import limberli.common.dto.AnalysisResponse;
import limberli.common.exception.AgentUnavailableException;
import limberli.host.client.A2AAgentClient;
import limberli.host.config.AgentProperties;
import limberli.host.repository.Conversation;
import limberli.host.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

/**
 * Core orchestration logic.
 *
 * Tester and Analyst receive the same document text independently → parallel
 * execution is correct here. Changing to sequential (e.g., if Analyst needed
 * Tester's output as input) requires only replacing allOf() with chained thenCompose().
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrchestrationService {

    private final A2AAgentClient agentClient;
    private final AgentProperties agentProperties;
    private final ConversationRepository conversationRepository;

    public AnalysisResponse analyze(String documentText) {
        return analyze(documentText, null);
    }

    /**
     * @param qaMetadata A2A metadata map (e.g. {@code {"qa": {...}}}) forwarded to the tester agent
     *                   so the UI's preliminary settings drive test-case generation. May be null.
     *                   Risk analysis (analyst agent) runs only when {@code metadata.riskAnalysis}
     *                   is truthy — disabled by default.
     */
    public AnalysisResponse analyze(String documentText, Map<String, Object> qaMetadata) {
        return analyze(documentText, qaMetadata, riskAnalysisEnabled(qaMetadata));
    }

    /**
     * @param includeRiskAnalysis when {@code false}, the analyst agent is skipped entirely and
     *                            {@code analystResponse} is {@code null}. Disabled by default.
     */
    public AnalysisResponse analyze(String documentText, Map<String, Object> qaMetadata, boolean includeRiskAnalysis) {
        log.info("Orchestration started: docLength={} riskAnalysis={}", documentText.length(), includeRiskAnalysis);
        long start = System.currentTimeMillis();

        String testerUrl = agentProperties.tester().url();
        String analystUrl = agentProperties.analyst().url();

        CompletableFuture<String> testerFuture = agentClient.sendTask(testerUrl, documentText, qaMetadata);
        CompletableFuture<String> analystFuture = includeRiskAnalysis
                ? agentClient.sendTask(analystUrl, documentText, null)
                : CompletableFuture.completedFuture(null);

        try {
            CompletableFuture.allOf(testerFuture, analystFuture).join();
        } catch (CompletionException ex) {
            Throwable cause = ex.getCause();
            log.error("Parallel agent call failed after {}ms", System.currentTimeMillis() - start, cause);
            if (cause instanceof AgentUnavailableException aue) throw aue;
            throw new AgentUnavailableException("Agent pipeline failed: " + cause.getMessage(), cause);
        }

        String testerResponse = testerFuture.join();
        String analystResponse = analystFuture.join();

        Conversation saved = conversationRepository.save(Conversation.builder()
                .documentText(documentText)
                .testerResponse(testerResponse)
                .analystResponse(analystResponse)
                .createdAt(Instant.now())
                .build());

        log.info("Orchestration complete: conversationId={} durationMs={}",
                saved.getId(), System.currentTimeMillis() - start);

        return new AnalysisResponse(saved.getId(), testerResponse, analystResponse, saved.getCreatedAt());
    }

    /** Reads the opt-in {@code metadata.riskAnalysis} flag (Boolean or "true"/"false" String). Default false. */
    private boolean riskAnalysisEnabled(Map<String, Object> metadata) {
        if (metadata == null) {
            return false;
        }
        Object flag = metadata.get("riskAnalysis");
        if (flag instanceof Boolean b) {
            return b;
        }
        return flag != null && Boolean.parseBoolean(flag.toString());
    }
}
