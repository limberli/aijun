package limberli.tester.web;

import limberli.common.dto.ErrorResponse;
import limberli.common.util.RateLimitSupport;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.retry.NonTransientAiException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Surfaces LLM provider errors (e.g. Groq 429) instead of letting Spring return a generic 500 that
 * hides the cause. Rate limits become HTTP 429 with a {@code Retry-After} header and the provider's
 * message in the body, so the orchestrator can forward an accurate reset time to the UI.
 */
@RestControllerAdvice
@Slf4j
public class LlmErrorAdvice {

    @ExceptionHandler(NonTransientAiException.class)
    public ResponseEntity<ErrorResponse> handle(NonTransientAiException ex) {
        String msg = ex.getMessage();
        boolean rateLimited = RateLimitSupport.isRateLimited(msg);
        Long retryAfter = RateLimitSupport.retryAfterSeconds(msg);
        HttpStatus status = rateLimited ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.SERVICE_UNAVAILABLE;

        log.warn("LLM error {} (rateLimited={}, retryAfter={}s): {}",
                status.value(), rateLimited, retryAfter, msg);

        ResponseEntity.BodyBuilder builder = ResponseEntity.status(status);
        if (retryAfter != null) {
            builder.header(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfter));
        }
        return builder.body(new ErrorResponse(
                rateLimited ? "RATE_LIMIT" : "LLM_ERROR", msg, retryAfter, rateLimited));
    }
}
