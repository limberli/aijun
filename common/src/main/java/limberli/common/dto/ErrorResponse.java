package limberli.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Standard API error body. {@code retryAfterSeconds} and {@code rateLimited} are populated for
 * provider rate-limit errors so clients can show an accurate countdown; they are omitted from the
 * JSON when not applicable.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        String code,
        String message,
        Long retryAfterSeconds,
        Boolean rateLimited,
        Instant timestamp
) {
    public ErrorResponse(String code, String message) {
        this(code, message, null, null, Instant.now());
    }

    public ErrorResponse(String code, String message, Long retryAfterSeconds, Boolean rateLimited) {
        this(code, message, retryAfterSeconds, rateLimited, Instant.now());
    }
}
