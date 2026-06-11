package limberli.tester.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TableMergerTest {

    private static final String HEADER =
            "| ID | Техника-тест дизайна | Описание проверки | Шаг | Ожидаемый результат |";
    private static final String SEP = "| --- | --- | --- | --- | --- |";

    @Test
    void renumbersCasesContinuouslyAcrossBatches() {
        String batch1 = String.join("\n",
                HEADER, SEP,
                "| TC-001 | Граничные значения | Проверка A | 1. Шаг | ОК |",
                "|  |  |  | 2. Шаг | ОК |",
                "| TC-002 | Эквивалентное разбиение | Проверка B | 1. Шаг | ОК |");
        String batch2 = String.join("\n",
                HEADER, SEP,
                "| TC-001 | Pairwise | Проверка C | 1. Шаг | ОК |",
                "|  |  |  | 2. Шаг | ОК |");

        String merged = TableMerger.merge(List.of(batch1, batch2));

        // Continuous numbering: C becomes TC-003, not TC-001.
        assertThat(merged).contains("TC-001 | Граничные значения | Проверка A");
        assertThat(merged).contains("TC-002 | Эквивалентное разбиение | Проверка B");
        assertThat(merged).contains("TC-003 | Pairwise | Проверка C");
        assertThat(merged).doesNotContain("TC-004");
        // Single header, single separator.
        assertThat(countOccurrences(merged, "Техника-тест дизайна")).isEqualTo(1);
    }

    @Test
    void keepsContinuationRowsOfKeptCases() {
        String batch = String.join("\n",
                HEADER, SEP,
                "| TC-001 | Граничные значения | Проверка A | 1. Открыть | ОК |",
                "|  |  |  | 2. Ввести | Введено |",
                "|  |  |  | 3. Проверить | Готово |");

        String merged = TableMerger.merge(List.of(batch));

        assertThat(merged).contains("1. Открыть");
        assertThat(merged).contains("2. Ввести");
        assertThat(merged).contains("3. Проверить");
    }

    @Test
    void dropsDuplicateCasesByDescription() {
        String batch1 = String.join("\n",
                HEADER, SEP,
                "| TC-001 | Граничные значения | Проверка поиска | 1. Шаг | ОК |");
        String batch2 = String.join("\n",
                HEADER, SEP,
                "| TC-001 | Pairwise | Проверка поиска | 1. Другой шаг | ОК |",
                "| TC-002 | Pairwise | Проверка оценки | 1. Шаг | ОК |");

        String merged = TableMerger.merge(List.of(batch1, batch2));

        // "Проверка поиска" appears once; the duplicate (and its rows) is dropped.
        assertThat(countOccurrences(merged, "Проверка поиска")).isEqualTo(1);
        assertThat(merged).contains("Проверка оценки");
        assertThat(merged).contains("TC-001");
        assertThat(merged).contains("TC-002");
    }

    @Test
    void ignoresProseAroundTables() {
        String batch = String.join("\n",
                "Вот тест-кейсы:", "",
                HEADER, SEP,
                "| TC-001 | Граничные значения | Проверка A | 1. Шаг | ОК |",
                "", "Готово.");

        String merged = TableMerger.merge(List.of(batch));

        assertThat(merged).doesNotContain("Вот тест-кейсы");
        assertThat(merged).doesNotContain("Готово.");
        assertThat(merged).contains("TC-001 | Граничные значения");
    }

    private static int countOccurrences(String haystack, String needle) {
        int count = 0;
        int idx = 0;
        while ((idx = haystack.indexOf(needle, idx)) != -1) {
            count++;
            idx += needle.length();
        }
        return count;
    }
}
