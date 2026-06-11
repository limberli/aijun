package limberli.common.dto;

/** Result of parsing an uploaded .docx requirement document into plain text. */
public record ExtractTextResponse(
        String filename,
        int charCount,
        String text
) {}
