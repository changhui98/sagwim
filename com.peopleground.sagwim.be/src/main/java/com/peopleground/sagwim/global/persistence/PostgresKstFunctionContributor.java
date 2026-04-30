package com.peopleground.sagwim.global.persistence;

import org.hibernate.boot.model.FunctionContributions;
import org.hibernate.boot.model.FunctionContributor;
import org.hibernate.type.StandardBasicTypes;

/**
 * Hibernate 7 의 HQL 파서는 `to_char(expr, 'pattern')` 처럼 함수 인자 내부에
 * 벤더 특화 표현식을 섞어 쓰면 파싱이 실패하는 경우가 많다.
 * 따라서 PostgreSQL 전용 SQL 조각을 커스텀 HQL 함수로 등록하여 HQL 레벨에서는
 * 단일 함수 호출만 보이도록 한다.
 * <p>
 * 등록 함수:
 * <ul>
 *     <li>{@code to_char_kst_month(timestamp)}
 *     → KST 기준으로 저장된 timestamp 를 {@code 'YYYY-MM'} 문자열로 포맷</li>
 * </ul>
 * <p>
 * 시간 기준 정책: 본 서비스는 한국 사용자 전용이며 모든 도메인 시각은 Asia/Seoul 로
 * 저장된다(JVM TZ + hibernate.jdbc.time_zone + BaseEntity.Clock 모두 KST 통일).
 * 따라서 별도 타임존 변환 없이 그대로 포맷팅한다.
 * <p>
 * 향후 일/주 등 다른 버킷이 필요해지면 동일 패턴으로 {@code to_char_kst_day} 등을 추가한다.
 * <p>
 * 등록 경로: {@code META-INF/services/org.hibernate.boot.model.FunctionContributor}
 */
public class PostgresKstFunctionContributor implements FunctionContributor {

    private static final String KST_MONTH_SQL = "to_char(?1, 'YYYY-MM')";

    @Override
    public void contributeFunctions(FunctionContributions functionContributions) {

        functionContributions.getFunctionRegistry()
            .registerPattern(
                "to_char_kst_month",
                KST_MONTH_SQL,
                functionContributions.getTypeConfiguration()
                    .getBasicTypeRegistry()
                    .resolve(StandardBasicTypes.STRING)
            );
    }
}
