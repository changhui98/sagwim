package com.peopleground.sagwim.global.entity;

import com.peopleground.sagwim.user.domain.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import java.time.LocalDateTime;
import lombok.Getter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public class AuditingEntity extends BaseEntity {

    // KST_CLOCK 은 BaseEntity 에서 상속 (중복 선언 제거)

    @CreatedBy
    @Column(name = "created_by", nullable = false, length = 50)
    protected String createdBy;

    @LastModifiedBy
    @Column(name = "last_modified_by", length = 50)
    protected String lastModifiedBy;

    @Column(name = "deleted_by", length = 50)
    protected String deletedBy;

    public void deleteBy(User user) {
        this.deletedDate = LocalDateTime.now(KST_CLOCK);
        this.deletedBy = user.getUsername();
    }

}
