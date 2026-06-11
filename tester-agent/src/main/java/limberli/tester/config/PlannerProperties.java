package limberli.tester.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Two-pass (planner → generator) test-case generation settings.
 *
 * A single LLM pass trades breadth for depth: the model caps its total output, so asking for
 * both many cases AND many steps yields one or the other. The planner first extracts the list of
 * functions/branches, then the generator covers them in small batches — so total volume is not
 * bound by a single response (coverage and per-case detail both hold).
 */
@Data
@ConfigurationProperties(prefix = "qa.planner")
public class PlannerProperties {

    /** When false, falls back to the original single-pass generation. */
    private boolean enabled = true;

    /** Functions generated per generator call. Smaller = deeper per case, more calls. */
    private int batchSize = 3;

    /** Below this many extracted features the two-pass overhead isn't worth it → single pass. */
    private int minFeatures = 6;

    /** Safety cap on extracted features to bound the number of generator calls. */
    private int maxFeatures = 30;

    /** Retries per LLM call when the provider returns a rate-limit (429) with a back-off hint. */
    private int maxRetriesPerCall = 4;
}
