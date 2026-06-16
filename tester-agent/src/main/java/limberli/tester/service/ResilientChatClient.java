package limberli.tester.service;

import limberli.common.util.RateLimitSupport;
import limberli.tester.config.PlannerProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

/**
 * Wraps {@link ChatClient} with provider rate-limit (HTTP 429) back-off.
 *
 * The two-pass generator fires several calls in quick succession, which on a free Groq tier
 * trips the tokens-per-minute limit. The provider returns a non-retryable 429 that includes
 * "try again in Xs"; here we honour that hint (with a buffer/cap) and retry, so generation
 * completes instead of failing. If the provider asks to wait longer than {@link #MAX_BACKOFF_MS}
 * (e.g. a per-day token limit), we do NOT retry — the 429 (with its reset time) is allowed to
 * propagate so the orchestrator/UI can show an accurate cooldown. No effect on providers without
 * a TPM limit (e.g. local Ollama).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ResilientChatClient {

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

    /** Returns the backoff to wait if {@code e} is a (recoverable) rate-limit error, else 0. */
    private long rateLimitBackoffMs(Throwable e) {
        String msg = e.getMessage();
        if (!RateLimitSupport.isRateLimited(msg)) {
            return 0;
        }
        Long hintSeconds = RateLimitSupport.retryAfterSeconds(msg);
        long base = hintSeconds != null ? hintSeconds * 1_000 : DEFAULT_BACKOFF_MS;
        // Wait too long to be worth holding the request (e.g. per-day limit) — fail fast so the
        // 429 surfaces with its reset time instead of timing out the orchestrator.
        if (base > MAX_BACKOFF_MS) {
            return 0;
        }
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
