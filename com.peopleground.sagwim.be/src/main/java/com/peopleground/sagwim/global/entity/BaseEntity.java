package com.peopleground.sagwim.global.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import lombok.Getter;

@Getter
@MappedSuperclass
public class BaseEntity {

    /**
     * 한국 사용자 대상 서비스이므로 도메인 시간 기준을 Asia/Seoul 로 통일한다.
     * JVM 기본 타임존 설정(SagwimApplication)과 별개로, 운영 환경의 TZ 변수에 흔들리지 않도록
     * 명시적으로 KST Clock 을 사용한다.
     */
    protected static final Clock KST_CLOCK = Clock.system(ZoneId.of("Asia/Seoul"));

    @Column(name = "created_date", nullable = false, updatable = false)
    protected LocalDateTime createdDate;

    @Column(name = "last_modified_date")
    protected LocalDateTime lastModifiedDate;

    @Column(name = "deleted_date")
    protected LocalDateTime deletedDate;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now(KST_CLOCK);
        this.createdDate = now;
        this.lastModifiedDate = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.lastModifiedDate = LocalDateTime.now(KST_CLOCK);
    }

    public void delete() {
        this.deletedDate = LocalDateTime.now(KST_CLOCK);
    }

    public boolean isDeleted() {
        return this.deletedDate != null;
    }

}
