package limberli.tester.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PlannerServiceParseTest {

    @Test
    void parsesNumberedAndBulletedMarkers() {
        String content = """
                1. Открытие страницы детального вопроса
                2) Поиск по содержимому документов
                - Очистка результатов поиска
                * Оценка детального вопроса
                • Заполнение комментария
                """;

        List<String> features = PlannerService.parseFeatures(content, 30);

        assertThat(features).containsExactly(
                "Открытие страницы детального вопроса",
                "Поиск по содержимому документов",
                "Очистка результатов поиска",
                "Оценка детального вопроса",
                "Заполнение комментария");
    }

    @Test
    void dedupesAndSkipsBlankLines() {
        String content = "1. Поиск\n\n2. Поиск\n3. Оценка\n   \n";

        List<String> features = PlannerService.parseFeatures(content, 30);

        assertThat(features).containsExactly("Поиск", "Оценка");
    }

    @Test
    void capsAtMaxFeatures() {
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 50; i++) {
            sb.append(i).append(". Функция ").append(i).append("\n");
        }

        List<String> features = PlannerService.parseFeatures(sb.toString(), 30);

        assertThat(features).hasSize(30);
    }

    @Test
    void returnsEmptyForBlankContent() {
        assertThat(PlannerService.parseFeatures("", 30)).isEmpty();
        assertThat(PlannerService.parseFeatures(null, 30)).isEmpty();
    }
}
