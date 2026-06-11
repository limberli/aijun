package limberli.tester.service;

import limberli.tester.config.QaCatalogProperties;
import limberli.tester.config.QaCatalogProperties.Mode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Planner pass: extracts a flat checklist of functions/branches from a requirement document.
 * The generator then covers these in small batches so coverage isn't bound by a single LLM
 * response. See {@link limberli.tester.config.PlannerProperties}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlannerService {

    private static final String DEFAULT_PLANNER_PROMPT = """
            Проанализируй текст требования и верни ТОЛЬКО нумерованный список
            проверяемых функций и веток поведения, по одной на строку, без пояснений.""";

    private final ResilientChatClient chatClient;
    private final QaCatalogProperties catalog;

    /**
     * @return distinct feature descriptions (order preserved), capped at {@code maxFeatures}.
     *         Empty if the model returns nothing parseable.
     */
    public List<String> extractFeatures(String documentText, String modeId, int maxFeatures) {
        Mode mode = catalog.mode(modeId);
        String plannerPrompt = mode != null && mode.getPlanner() != null
                ? mode.getPlanner()
                : DEFAULT_PLANNER_PROMPT;

        long start = System.currentTimeMillis();
        String content = chatClient.call(plannerPrompt, documentText);

        List<String> features = parseFeatures(content, maxFeatures);
        log.info("Planner extracted {} features, durationMs={}",
                features.size(), System.currentTimeMillis() - start);
        return features;
    }

    /** Parses a numbered/bulleted list into clean feature strings (deduped, capped). */
    static List<String> parseFeatures(String content, int maxFeatures) {
        if (content == null || content.isBlank()) {
            return List.of();
        }
        Set<String> seen = new LinkedHashSet<>();
        for (String raw : content.split("\\R")) {
            String line = raw.strip()
                    // strip leading list markers: "1.", "1)", "-", "*", "•"
                    .replaceFirst("^\\s*(\\d+[.)]|[-*•])\\s*", "")
                    .strip();
            if (!line.isBlank()) {
                seen.add(line);
            }
        }
        List<String> result = new ArrayList<>(seen);
        return result.size() > maxFeatures ? result.subList(0, maxFeatures) : result;
    }
}
