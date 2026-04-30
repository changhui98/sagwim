package com.peopleground.sagwim.global.presentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.peopleground.sagwim.global.exception.AppException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class AdminStatsControllerTest {

    private final AdminStatsController controller = new AdminStatsController(null);

    @ParameterizedTest
    @ValueSource(ints = {0, -1, 37, 100})
    @DisplayName("months 파라미터가 1~36 범위를 벗어나면 400 오류를 던진다")
    void validateMonths_outOfRange_throwsAppException(int months) {
        assertThatThrownBy(() -> controller.getMonthlySignups(months))
            .isInstanceOf(AppException.class);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, 37, 100})
    @DisplayName("contents 엔드포인트도 months 범위 벗어나면 400 오류를 던진다")
    void validateMonths_contents_outOfRange_throwsAppException(int months) {
        assertThatThrownBy(() -> controller.getMonthlyContentCreations(months))
            .isInstanceOf(AppException.class);
    }
}
