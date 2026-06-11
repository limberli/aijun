package limberli.tester.service;

import limberli.tester.config.PlannerProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Wraps {@link ChatClient} with provider rate-limit (HTTP 429) back-off.
 *
 * The two-pass generator fires several calls in quick succession, which on a free Groq tier
 * trips the tokens-per-minute limit. The provider returns a non-retryable 429 that includes
 * "try again in Xs"; here we honour that hint (with a buffer/cap) and retry, so generation
 * completes instead of failing. No effect on providers without a TPM limit (e.g. local Ollama).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ResilientChatClient {

    private static final Pattern RETRY_AFTER = Pattern.compile("try again in ([0-9.]+)s");
    private static final long DEFAULT_BACKOFF_MS = 5_000;
    private static final long MAX_BACKOFF_MS = 35_000;

    private final ChatClient chatClient;
    private final PlannerProperties properties;

    /** Calls the model with the given system + user prompt, retrying on rate-limit (429). */
    public String call(String systemPrompt, String userText) {
        int attempts = 0;
        while (true) {
            try {
                return chatClient.prompt()
                        .system(systemPrompt)
                        .user(userText)
                        .call()
                        .content();
            } catch (RuntimeException e) {
                long backoffMs = rateLimitBackoffMs(e);
                attempts++;
                if (backoffMs <= 0 || attempts > properties.getMaxRetriesPerCall()) {
                    throw e;
                }
                log.warn("Rate limited (attempt {}/{}), backing off {}ms",
                        attempts, properties.getMaxRetriesPerCall(), backoffMs);
                sleep(backoffMs);
            }
        }
    }

    /** Returns the backoff to wait if {@code e} is a rate-limit error, else 0. */
    private long rateLimitBackoffMs(Throwable e) {
        String msg = e.getMessage();
        if (msg == null) {
            return 0;
        }
        boolean rateLimited = msg.contains("429")
                || msg.toLowerCase().contains("rate limit")
                || msg.contains("rate_limit");
        if (!rateLimited) {
            return 0;
        }
        Matcher m = RETRY_AFTER.matcher(msg);
        long base = m.find() ? (long) (Double.parseDouble(m.group(1)) * 1000) : DEFAULT_BACKOFF_MS;
        return Math.min(base + 1_000, MAX_BACKOFF_MS); // small buffer, capped
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while backing off from rate limit", ie);
        }
    }
}
