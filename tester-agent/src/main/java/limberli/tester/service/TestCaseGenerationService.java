package limberli.tester.service;

import limberli.tester.config.PlannerProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Generates structured QA test cases from a requirements document via Ollama/Spring AI.
 *
 * Two modes (see {@link PlannerProperties}):
 *  - <b>two-pass</b> (default): a planner extracts the list of functions, then the generator
 *    covers them in small batches; tables are merged with continuous TC numbering. This breaks
 *    the single-pass output ceiling, so coverage (many cases) and per-case detail both hold.
 *  - <b>single-pass</b> (fallback / short requirements): one call, original behaviour.
 *
 * The system prompt is composed at request time by {@link QaPromptBuilder} from qa-prompts.yml
 * + the caller's {@link QaSettings}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TestCaseGenerationService {

    private final ResilientChatClient chatClient;
    private final QaPromptBuilder promptBuilder;
    private final PlannerService plannerService;
    private final PlannerProperties plannerProperties;

    public String generateTestCases(String documentText, QaSettings settings) {
        String modeId = settings != null && settings.mode() != null
                ? settings.mode()
                : QaPromptBuilder.DEFAULT_MODE;

        if (plannerProperties.isEnabled()) {
            List<String> features =
                    plannerService.extractFeatures(documentText, modeId, plannerProperties.getMaxFeatures());
            if (features.size() >= plannerProperties.getMinFeatures()) {
                return generateTwoPass(documentText, settings, features);
            }
            log.info("Planner: {} features (< minFeatures={}), using single pass",
                    features.size(), plannerProperties.getMinFeatures());
        }
        return generateSinglePass(documentText, settings);
    }

    private String generateSinglePass(String documentText, QaSettings settings) {
        String systemPrompt = promptBuilder.build(settings);
        log.info("Single-pass generation, documentLength={} promptLength={}",
                documentText.length(), systemPrompt.length());
        long start = System.currentTimeMillis();

        String result = chatClient.call(systemPrompt, documentText);

        log.info("Single-pass complete, durationMs={} responseLength={}",
                System.currentTimeMillis() - start, result.length());
        return result;
    }

    private String generateTwoPass(String documentText, QaSettings settings, List<String> features) {
        String baseSystem = promptBuilder.build(settings);
        List<List<String>> batches = partition(features, plannerProperties.getBatchSize());
        log.info("Two-pass generation: {} features in {} batches (size={})",
                features.size(), batches.size(), plannerProperties.getBatchSize());
        long start = System.currentTimeMillis();

        List<String> batchTables = new ArrayList<>();
        for (int i = 0; i < batches.size(); i++) {
            List<String> batch = batches.get(i);
            String systemPrompt = baseSystem + focusInstruction(batch);
            String table = chatClient.call(systemPrompt, documentText);
            batchTables.add(table);
            log.debug("Batch {}/{} generated ({} features, responseLength={})",
                    i + 1, batches.size(), batch.size(), table != null ? table.length() : 0);
        }

        String merged = TableMerger.merge(batchTables);
        log.info("Two-pass complete, durationMs={} responseLength={}",
                System.currentTimeMillis() - start, merged.length());
        return merged;
    }

    /** Tells the generator to cover only this batch's functions; merging fixes numbering. */
    private String focusInstruction(List<String> batch) {
        StringBuilder sb = new StringBuilder("\n\nСГЕНЕРИРУЙ ТЕСТ-КЕЙСЫ ТОЛЬКО ДЛЯ СЛЕДУЮЩИХ ФУНКЦИЙ "
                + "(не для всех функций требования сразу):\n");
        for (String feature : batch) {
            sb.append("- ").append(feature).append("\n");
        }
        sb.append("Нумеруй кейсы с TC-001 — сквозную нумерацию между частями выставит система. "
                + "Соблюдай заданную детализацию шагов для каждого кейса.");
        return sb.toString();
    }

    private static <T> List<List<T>> partition(List<T> items, int size) {
        int batchSize = Math.max(1, size);
        List<List<T>> batches = new ArrayList<>();
        for (int i = 0; i < items.size(); i += batchSize) {
            batches.add(new ArrayList<>(items.subList(i, Math.min(i + batchSize, items.size()))));
        }
        return batches;
    }
}
