package limberli.host.service;

import limberli.common.exception.DocumentParseException;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DocumentParserServiceTest {

    private final DocumentParserService service = new DocumentParserService();

    @Test
    void givenDocxWithParagraphsAndTable_whenExtract_thenReturnsCleanText() throws Exception {
        byte[] docx = buildDocx(doc -> {
            doc.createParagraph().createRun().setText("Требование 1.1: поле «Email» обязательно.");
            XWPFTable table = doc.createTable(2, 2);
            table.getRow(0).getCell(0).setText("Поле");
            table.getRow(0).getCell(1).setText("Тип");
            table.getRow(1).getCell(0).setText("Email");
            table.getRow(1).getCell(1).setText("string");
        });

        String text = service.extractText(new ByteArrayInputStream(docx), "req.docx");

        assertThat(text).contains("Требование 1.1");
        assertThat(text).contains("| Поле | Тип |");
        assertThat(text).contains("| Email | string |");
    }

    @Test
    void givenNonDocxFilename_whenExtract_thenThrows() {
        InputStream any = new ByteArrayInputStream(new byte[]{1, 2, 3});

        assertThatThrownBy(() -> service.extractText(any, "requirements.pdf"))
                .isInstanceOf(DocumentParseException.class)
                .hasMessageContaining(".docx");
    }

    @Test
    void givenEmptyDocx_whenExtract_thenThrows() throws Exception {
        byte[] empty = buildDocx(doc -> { /* no content */ });

        assertThatThrownBy(() -> service.extractText(new ByteArrayInputStream(empty), "empty.docx"))
                .isInstanceOf(DocumentParseException.class)
                .hasMessageContaining("no extractable text");
    }

    @Test
    void givenCorruptStream_whenExtract_thenThrows() {
        InputStream garbage = new ByteArrayInputStream("not a real docx".getBytes());

        assertThatThrownBy(() -> service.extractText(garbage, "broken.docx"))
                .isInstanceOf(DocumentParseException.class);
    }

    private interface DocxBuilder {
        void build(XWPFDocument doc);
    }

    private byte[] buildDocx(DocxBuilder builder) throws Exception {
        try (XWPFDocument doc = new XWPFDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            builder.build(doc);
            doc.write(out);
            return out.toByteArray();
        }
    }
}
