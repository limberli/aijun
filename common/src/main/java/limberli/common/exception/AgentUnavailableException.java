package limberli.common.exception;

/**
 * Raised when a downstream A2A agent (or its LLM) is unavailable. Optionally carries the provider's
 * reset hint ({@code retryAfterSeconds}) and whether the cause was a rate/token limit, so the
 * orchestrator can forward an accurate Retry-After to clients.
 */
public class AgentUnavailableException extends RuntimeException {

    private final Long retryAfterSeconds;
    private final boolean rateLimited;

    public AgentUnavailableException(String message) {
        this(message, null, null, false);
    }

    public AgentUnavailableException(String message, Throwable cause) {
        this(message, cause, null, false);
    }

    public AgentUnavailableException(String message, Throwable cause, Long retryAfterSeconds, boolean rateLimited) {
        super(message, cause);
        this.retryAfterSeconds = retryAfterSeconds;
        this.rateLimited = rateLimited;
    }

    /** Seconds until the provider limit resets, when known; otherwise {@code null}. */
    public Long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }

    /** True when the cause is a provider token/rate limit. */
    public boolean isRateLimited() {
        return rateLimited;
    }
}
