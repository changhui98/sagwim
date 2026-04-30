package com.peopleground.sagwim.global.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.global.dto.MonthlyStatsPoint;
import com.peopleground.sagwim.global.dto.MonthlyStatsResponse;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminStatsServiceTest {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @Mock
    private UserRepository userRepository;

    @Mock
    private ContentRepository contentRepository;

    @InjectMocks
    private AdminStatsService adminStatsService;

    @Test
    @DisplayName("기본 12개월 구간 - 사용자 월별 가입 통계를 반환한다")
    void getMonthlySignups_default12Months() {
        // given
        YearMonth now = YearMonth.now(KST);
        Map<String, Long> dbResult = new LinkedHashMap<>();
        dbResult.put(now.toString(), 5L);
        dbResult.put(now.minusMonths(1).toString(), 10L);

        given(userRepository.countMonthlySignups(any(LocalDateTime.class))).willReturn(dbResult);

        // when
        MonthlyStatsResponse response = adminStatsService.getMonthlySignups(12);

        // then
        assertThat(response.timezone()).isEqualTo("Asia/Seoul");
        assertThat(response.points()).hasSize(12);
        assertThat(response.points().getFirst().month()).isEqualTo(now.minusMonths(11).toString());
        assertThat(response.points().getLast().month()).isEqualTo(now.toString());
    }

    @Test
    @DisplayName("사용자 지정 구간(3개월) - 사용자 월별 가입 통계를 반환한다")
    void getMonthlySignups_customMonths() {
        // given
        YearMonth now = YearMonth.now(KST);
        Map<String, Long> dbResult = new LinkedHashMap<>();
        dbResult.put(now.toString(), 3L);

        given(userRepository.countMonthlySignups(any(LocalDateTime.class))).willReturn(dbResult);

        // when
        MonthlyStatsResponse response = adminStatsService.getMonthlySignups(3);

        // then
        assertThat(response.points()).hasSize(3);
        assertThat(response.points().getFirst().month()).isEqualTo(now.minusMonths(2).toString());
        assertThat(response.points().getLast().month()).isEqualTo(now.toString());
        assertThat(response.points().getLast().count()).isEqualTo(3L);
    }

    @Test
    @DisplayName("0건인 달도 backfill하여 count 0으로 포함한다")
    void getMonthlySignups_backfillZeroMonths() {
        // given
        YearMonth now = YearMonth.now(KST);
        Map<String, Long> dbResult = new LinkedHashMap<>();
        // 첫 달과 마지막 달만 데이터 있음
        dbResult.put(now.minusMonths(5).toString(), 2L);
        dbResult.put(now.toString(), 7L);

        given(userRepository.countMonthlySignups(any(LocalDateTime.class))).willReturn(dbResult);

        // when
        MonthlyStatsResponse response = adminStatsService.getMonthlySignups(6);

        // then
        assertThat(response.points()).hasSize(6);

        // 중간 달은 0건
        for (int i = 1; i < 5; i++) {
            assertThat(response.points().get(i).count()).isZero();
        }

        assertThat(response.points().getFirst().count()).isEqualTo(2L);
        assertThat(response.points().getLast().count()).isEqualTo(7L);
    }

    @Test
    @DisplayName("soft delete된 사용자는 제외 - DB에서 이미 필터됨을 검증")
    void getMonthlySignups_softDeleteExcluded() {
        // given
        // DB 쿼리에서 deleted_date IS NULL 조건이 적용되므로
        // 반환값에는 soft delete 된 데이터가 이미 제외됨
        YearMonth now = YearMonth.now(KST);
        Map<String, Long> dbResult = new LinkedHashMap<>();
        dbResult.put(now.toString(), 3L); // soft delete 제외 후 3건

        given(userRepository.countMonthlySignups(any(LocalDateTime.class))).willReturn(dbResult);

        // when
        MonthlyStatsResponse response = adminStatsService.getMonthlySignups(1);

        // then
        assertThat(response.points()).hasSize(1);
        assertThat(response.points().getFirst().count()).isEqualTo(3L);
    }

    @Test
    @DisplayName("KST 타임존 기준 월 버킷팅 - 응답에 Asia/Seoul 타임존이 포함된다")
    void getMonthlySignups_kstTimezone() {
        // given
        given(userRepository.countMonthlySignups(any(LocalDateTime.class)))
            .willReturn(new LinkedHashMap<>());

        // when
        MonthlyStatsResponse response = adminStatsService.getMonthlySignups(1);

        // then
        assertThat(response.timezone()).isEqualTo("Asia/Seoul");
        assertThat(response.points()).hasSize(1);

        YearMonth now = YearMonth.now(KST);
        assertThat(response.points().getFirst().month()).isEqualTo(now.toString());
    }

    @Test
    @DisplayName("기본 12개월 구간 - 게시글 월별 생성 통계를 반환한다")
    void getMonthlyContentCreations_default12Months() {
        // given
        YearMonth now = YearMonth.now(KST);
        Map<String, Long> dbResult = new LinkedHashMap<>();
        dbResult.put(now.toString(), 15L);

        given(contentRepository.countMonthlyCreations(any(LocalDateTime.class))).willReturn(dbResult);

        // when
        MonthlyStatsResponse response = adminStatsService.getMonthlyContentCreations(12);

        // then
        assertThat(response.timezone()).isEqualTo("Asia/Seoul");
        assertThat(response.points()).hasSize(12);
        assertThat(response.points().getLast().count()).isEqualTo(15L);
    }

    @Test
    @DisplayName("게시글 통계에서도 0건인 달이 backfill된다")
    void getMonthlyContentCreations_backfillZeroMonths() {
        // given
        given(contentRepository.countMonthlyCreations(any(LocalDateTime.class)))
            .willReturn(new LinkedHashMap<>());

        // when
        MonthlyStatsResponse response = adminStatsService.getMonthlyContentCreations(6);

        // then
        assertThat(response.points()).hasSize(6);
        for (MonthlyStatsPoint point : response.points()) {
            assertThat(point.count()).isZero();
        }
    }
}
