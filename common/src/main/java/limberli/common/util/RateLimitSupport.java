package limberli.common.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Helpers for recognising LLM-provider rate-limit errors and extracting the reset delay from the
 * provider's message (e.g. Groq's "Please try again in 26m53.952s"). Pure Java, no Spring/AI deps,
 * so it is shared by the agents (which classify the LLM exception) and the orchestrator (which
 * forwards the result to the UI).
 */
public final class RateLimitSupport {

    // "try again in 26m53.952s", "try again in 30s", "try again in 1m"
    private static final Pattern TRY_AGAIN =
            Pattern.compile("try again in\\s+(?:(\\d+)\\s*m)?\\s*([0-9.]+)?\\s*s", Pattern.CASE_INSENSITIVE);

    private RateLimitSupport() {
    }

    /** True when the message looks like a provider token/rate limit (vs a generic failure). */
    public static boolean isRateLimited(String message) {
        if (message == null) {
            return false;
        }
        String m = message.toLowerCase();
        return m.contains("429")
                || m.contains("rate limit")
                || m.contains("rate_limit")
                || m.contains("tokens per")
                || m.contains("quota");
    }

    /** Seconds to wait per the provider hint (rounded up); {@code null} if no hint is present. */
    public static Long retryAfterSeconds(String message) {
        if (message == null) {
            return null;
        }
        Matcher m = TRY_AGAIN.matcher(message);
        if (m.find()) {
            long minutes = m.group(1) != null ? Long.parseLong(m.group(1)) : 0;
            double seconds = m.group(2) != null ? Double.parseDouble(m.group(2)) : 0;
            long total = (long) Math.ceil(minutes * 60 + seconds);
            if (total > 0) {
                return total;
            }
        }
        return null;
    }
}
