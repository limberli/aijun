package limberli.host.service;

import limberli.common.exception.DocumentParseException;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.IBodyElement;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.stream.Collectors;

/**
 * Loader/Parser: turns an uploaded .docx requirement document into clean plain text
 * suitable for the LLM agents. Deterministic (no LLM) — runs as a preprocessing step
 * on the orchestrator, not as an A2A agent.
 *
 * Walks the document body in order so paragraphs and tables keep their relative position.
 * Tables are rendered as markdown-like rows ("| a | b |") so the model still sees structure.
 * Embedded images/figures cannot be extracted (they carry no text) and are skipped.
 */
@Service
@Slf4j
public class DocumentParserService {

    /** Hard cap aligned with AnalysisRequest's documentText @Size(max = 50_000). */
    private static final int MAX_TEXT_LENGTH = 50_000;

    /**
     * @param in       the uploaded file stream (.docx / OOXML)
     * @param filename original name, used only for the .docx extension check and messages
     * @return clean plain text (paragraphs + table rows), never blank
     * @throws DocumentParseException if the file is not a readable .docx or yields no text
     */
    public String extractText(InputStream in, String filename) {
        if (filename == null || !filename.toLowerCase().endsWith(".docx")) {
            throw new DocumentParseException(
                    "Only .docx files are supported. Legacy .doc and other formats are not accepted.");
        }

        try (XWPFDocument doc = new XWPFDocument(in)) {
            StringBuilder sb = new StringBuilder();
            for (IBodyElement element : doc.getBodyElements()) {
                if (element instanceof XWPFParagraph paragraph) {
                    appendParagraph(sb, paragraph);
                } else if (element instanceof XWPFTable table) {
                    appendTable(sb, table);
                }
            }

            String text = sb.toString()
                    .replaceAll("[ \\t]+\n", "\n")   // trailing spaces before newlines
                    .replaceAll("\n{3,}", "\n\n")     // collapse runs of blank lines
                    .strip();

            if (text.isBlank()) {
                throw new DocumentParseException("The document contains no extractable text.");
            }
            if (text.length() > MAX_TEXT_LENGTH) {
                text = text.substring(0, MAX_TEXT_LENGTH);
                log.warn("Parsed document truncated to {} chars (file={})", MAX_TEXT_LENGTH, filename);
            }

            log.info("Parsed .docx: file={} chars={}", filename, text.length());
            return text;
        } catch (DocumentParseException e) {
            throw e;
        } catch (IOException | RuntimeException e) {
            throw new DocumentParseException("Could not read the .docx file: " + e.getMessage(), e);
        }
    }

    private void appendParagraph(StringBuilder sb, XWPFParagraph paragraph) {
        String text = paragraph.getText();
        if (text != null && !text.isBlank()) {
            sb.append(text.strip()).append("\n");
        }
    }

    private void appendTable(StringBuilder sb, XWPFTable table) {
        sb.append("\n");
        for (XWPFTableRow row : table.getRows()) {
            String rendered = row.getTableCells().stream()
                    .map(XWPFTableCell::getText)
                    .map(cell -> cell == null ? "" : cell.strip().replace("\n", " "))
                    .collect(Collectors.joining(" | "));
            if (!rendered.isBlank()) {
                sb.append("| ").append(rendered).append(" |\n");
            }
        }
        sb.append("\n");
    }
}
