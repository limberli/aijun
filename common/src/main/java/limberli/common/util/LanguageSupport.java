package limberli.common.util;

/**
 * Output-language selection for agent prompts. The UI sends {@code metadata.lang} ("ru" | "en");
 * agents append {@link #outputDirective(String)} to their system prompt so the model answers in the
 * chosen language. Russian is the default and adds no directive (prompts are already in Russian).
 */
public final class LanguageSupport {

    public static final String DEFAULT = "ru";

    private LanguageSupport() {
    }

    /** Normalises any incoming value to a supported code: "en" or "ru" (default). */
    public static String normalize(Object lang) {
        if (lang == null) {
            return DEFAULT;
        }
        return lang.toString().trim().toLowerCase().startsWith("en") ? "en" : "ru";
    }

    /**
     * Directive appended to the end of a system prompt to force the output language.
     * Empty for Russian (the catalog prompts are already Russian), so existing behaviour is unchanged.
     */
    public static String outputDirective(String lang) {
        if ("en".equals(lang)) {
            return "\n\nOUTPUT LANGUAGE: Write the ENTIRE response in English — including table "
                    + "column headers, all field values, steps, expected results and report text. "
                    + "Keep the required structure, columns and the TC-001 / TC-002 numbering unchanged.";
        }
        return "";
    }
}
