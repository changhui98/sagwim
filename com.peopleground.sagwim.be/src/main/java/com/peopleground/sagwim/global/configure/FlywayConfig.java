package com.peopleground.sagwim.global.configure;

import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring Boot 4.x에서 FlywayAutoConfiguration이 제거됨에 따라
 * Flyway를 직접 Bean으로 등록하여 JPA EntityManagerFactory 초기화 이전에
 * DB 마이그레이션이 실행되도록 보장한다.
 *
 * <p>application.yaml의 spring.flyway.* 설정값을 @Value로 주입받아 사용한다.</p>
 */
@Configuration
public class FlywayConfig {

    @Value("${spring.flyway.locations:classpath:db/migration}")
    private String[] locations;

    @Value("${spring.flyway.baseline-on-migrate:false}")
    private boolean baselineOnMigrate;

    @Value("${spring.flyway.baseline-version:1}")
    private String baselineVersion;

    @Value("${spring.flyway.validate-on-migrate:true}")
    private boolean validateOnMigrate;

    // "latest" → Flyway 기본값(모든 버전 적용), 숫자 지정 시 해당 버전까지만 적용
    @Value("${spring.flyway.target:latest}")
    private String target;

    @Bean(initMethod = "migrate")
    public Flyway flyway(DataSource dataSource) {
        return Flyway.configure()
                .dataSource(dataSource)
                .locations(locations)
                .baselineOnMigrate(baselineOnMigrate)
                .baselineVersion(baselineVersion)
                .validateOnMigrate(validateOnMigrate)
                .target(org.flywaydb.core.api.MigrationVersion.fromVersion(target))
                .load();
    }
}
