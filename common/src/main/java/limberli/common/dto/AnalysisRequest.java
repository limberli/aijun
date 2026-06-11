package limberli.common.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnalysisRequest(
        @NotBlank(message = "documentText must not be blank")
        @Size(max = 50_000, message = "documentText must not exceed 50 000 characters")
        String documentText,

        /** Opt-in risk analysis (analyst agent). Disabled by default. */
        boolean includeRiskAnalysis
) {
    /** Backwards-compatible constructor: risk analysis disabled. */
    public AnalysisRequest(String documentText) {
        this(documentText, false);
    }
}
