package limberli.tester.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Merges the markdown tables produced by separate generator batches into one table:
 *  - keeps a single header,
 *  - renumbers case ids (TC-001, TC-002, …) continuously across batches,
 *  - drops duplicate cases (same "Описание проверки") in case a batch over-generates.
 *
 * A "case" is a header row (first cell matches TC-\d+) followed by its continuation rows
 * (rows whose first cell is empty). Continuation rows inherit the kept/skipped decision of
 * their case header.
 */
final class TableMerger {

    private static final Pattern CASE_ID = Pattern.compile("(?i)^TC[-\\s]?\\d+$");
    private static final Pattern SEPARATOR_CELL = Pattern.compile("^:?-{2,}:?$");
    private static final String DEFAULT_HEADER =
            "| ID | Техника-тест дизайна | Описание проверки | Шаг | Ожидаемый результат |";

    private TableMerger() {
    }

    static String merge(List<String> batchTables) {
        String header = null;
        List<String> bodyRows = new ArrayList<>();
        Set<String> seenDescriptions = new LinkedHashSet<>();
        int caseCounter = 0;
        boolean currentCaseKept = false;

        for (String table : batchTables) {
            if (table == null) {
                continue;
            }
            for (String raw : table.split("\\R")) {
                String line = raw.strip();
                if (!line.startsWith("|")) {
                    continue;
                }
                List<String> cells = splitRow(line);
                if (cells.isEmpty()) {
                    continue;
                }
                if (isHeader(cells)) {
                    if (header == null) {
                        header = line;
                    }
                    continue;
                }
                if (isSeparator(cells)) {
                    continue;
                }

                String first = cells.get(0).strip();
                if (CASE_ID.matcher(first).matches()) {
                    // New case header — decide keep vs duplicate.
                    String description = cells.size() > 2 ? normalize(cells.get(2)) : "";
                    if (!description.isBlank() && !seenDescriptions.add(description)) {
                        currentCaseKept = false;
                        continue;
                    }
                    currentCaseKept = true;
                    caseCounter++;
                    cells.set(0, String.format("TC-%03d", caseCounter));
                    bodyRows.add(renderRow(cells));
                } else if (currentCaseKept) {
                    // Continuation row of a kept case.
                    bodyRows.add(renderRow(cells));
                }
            }
        }

        if (bodyRows.isEmpty()) {
            // Nothing parseable — return the batches as-is so the user still sees raw output.
            return String.join("\n\n", batchTables).strip();
        }

        String head = header != null ? header : DEFAULT_HEADER;
        StringBuilder sb = new StringBuilder();
        sb.append(head).append("\n");
        sb.append(separatorFor(head)).append("\n");
        for (String row : bodyRows) {
            sb.append(row).append("\n");
        }
        return sb.toString().strip();
    }

    /** Splits "| a | b | c |" into [a, b, c] (outer empties from edge pipes removed). */
    private static List<String> splitRow(String line) {
        String[] parts = line.split("\\|", -1);
        List<String> cells = new ArrayList<>();
        for (String p : parts) {
            cells.add(p.strip());
        }
        // Drop the empty leading/trailing tokens created by the outer pipes.
        if (!cells.isEmpty() && cells.get(0).isEmpty()) {
            cells.remove(0);
        }
        if (!cells.isEmpty() && cells.get(cells.size() - 1).isEmpty()) {
            cells.remove(cells.size() - 1);
        }
        return cells;
    }

    private static boolean isHeader(List<String> cells) {
        return !cells.isEmpty() && cells.get(0).equalsIgnoreCase("ID");
    }

    private static boolean isSeparator(List<String> cells) {
        boolean sawDash = false;
        for (String c : cells) {
            if (c.isEmpty()) {
                continue;
            }
            if (!SEPARATOR_CELL.matcher(c).matches()) {
                return false;
            }
            sawDash = true;
        }
        return sawDash;
    }

    private static String renderRow(List<String> cells) {
        return "| " + String.join(" | ", cells) + " |";
    }

    private static String separatorFor(String header) {
        int columns = splitRow(header).size();
        StringBuilder sb = new StringBuilder("|");
        for (int i = 0; i < columns; i++) {
            sb.append(" --- |");
        }
        return sb.toString();
    }

    private static String normalize(String s) {
        return s.toLowerCase().replaceAll("\\s+", " ").strip();
    }
}
