-- =====================================================
-- V1: 초기 스키마 생성
-- PostGIS 익스텐션은 initdb 스크립트에서 생성됨
-- =====================================================

-- =====================================================
-- p_user
-- =====================================================
CREATE TABLE IF NOT EXISTS p_user (
    id                   UUID         NOT NULL DEFAULT gen_random_uuid(),
    username             VARCHAR(255) NOT NULL,
    password             VARCHAR(255),
    nickname             VARCHAR(255) NOT NULL,
    user_email           VARCHAR(255) NOT NULL,
    role                 VARCHAR(50),
    address              VARCHAR(255) NOT NULL,
    location             GEOGRAPHY(POINT, 4326) NOT NULL,
    email_verified       BOOLEAN      NOT NULL DEFAULT FALSE,
    profile_image_url    VARCHAR(255),
    provider             VARCHAR(50)  NOT NULL DEFAULT 'LOCAL',
    provider_id          VARCHAR(255),
    created_date         TIMESTAMP    NOT NULL,
    last_modified_date   TIMESTAMP,
    deleted_date         TIMESTAMP,
    CONSTRAINT pk_user PRIMARY KEY (id),
    CONSTRAINT uk_user_username   UNIQUE (username),
    CONSTRAINT uk_user_email      UNIQUE (user_email)
);

-- =====================================================
-- email_verification_token
-- =====================================================
CREATE TABLE IF NOT EXISTS email_verification_token (
    id                   UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id              UUID,
    code                 VARCHAR(255) NOT NULL,
    expires_at           TIMESTAMP    NOT NULL,
    created_at           TIMESTAMP    NOT NULL,
    CONSTRAINT pk_email_verification_token PRIMARY KEY (id),
    CONSTRAINT fk_evt_user FOREIGN KEY (user_id) REFERENCES p_user (id)
);

-- =====================================================
-- email_verification_temp
-- =====================================================
CREATE TABLE IF NOT EXISTS email_verification_temp (
    id                   UUID         NOT NULL DEFAULT gen_random_uuid(),
    email                VARCHAR(255) NOT NULL,
    code                 VARCHAR(255) NOT NULL,
    expires_at           TIMESTAMP    NOT NULL,
    created_at           TIMESTAMP    NOT NULL,
    verified             BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_email_verification_temp PRIMARY KEY (id)
);

-- =====================================================
-- p_group
-- =====================================================
CREATE TABLE IF NOT EXISTS p_group (
    id                   BIGSERIAL,
    name                 VARCHAR(50)  NOT NULL,
    description          TEXT,
    category             VARCHAR(50)  NOT NULL,
    meeting_type         VARCHAR(50)  NOT NULL,
    max_member_count     INTEGER      NOT NULL,
    current_member_count INTEGER      NOT NULL DEFAULT 0,
    image_url            VARCHAR(255),
    region               VARCHAR(50),
    like_count           INTEGER      NOT NULL DEFAULT 0,
    leader_id            UUID         NOT NULL,
    created_by           VARCHAR(50)  NOT NULL,
    last_modified_by     VARCHAR(50),
    deleted_by           VARCHAR(50),
    created_date         TIMESTAMP    NOT NULL,
    last_modified_date   TIMESTAMP,
    deleted_date         TIMESTAMP,
    CONSTRAINT pk_group PRIMARY KEY (id),
    CONSTRAINT fk_group_leader FOREIGN KEY (leader_id) REFERENCES p_user (id)
);

-- =====================================================
-- p_group_member
-- =====================================================
CREATE TABLE IF NOT EXISTS p_group_member (
    id                   BIGSERIAL,
    group_id             BIGINT       NOT NULL,
    user_id              UUID         NOT NULL,
    role                 VARCHAR(50)  NOT NULL,
    created_date         TIMESTAMP    NOT NULL,
    last_modified_date   TIMESTAMP,
    deleted_date         TIMESTAMP,
    CONSTRAINT pk_group_member PRIMARY KEY (id),
    CONSTRAINT uk_group_member_group_user UNIQUE (group_id, user_id),
    CONSTRAINT fk_group_member_group FOREIGN KEY (group_id) REFERENCES p_group (id),
    CONSTRAINT fk_group_member_user  FOREIGN KEY (user_id)  REFERENCES p_user  (id)
);

-- =====================================================
-- p_content
-- =====================================================
CREATE TABLE IF NOT EXISTS p_content (
    id                   BIGSERIAL,
    body                 TEXT         NOT NULL,
    user_id              UUID         NOT NULL,
    group_id             BIGINT,
    like_count           INTEGER      NOT NULL DEFAULT 0,
    comment_count        INTEGER      NOT NULL DEFAULT 0,
    view_count           BIGINT       NOT NULL DEFAULT 0,
    created_by           VARCHAR(50)  NOT NULL,
    last_modified_by     VARCHAR(50),
    deleted_by           VARCHAR(50),
    created_date         TIMESTAMP    NOT NULL,
    last_modified_date   TIMESTAMP,
    deleted_date         TIMESTAMP,
    CONSTRAINT pk_content PRIMARY KEY (id),
    CONSTRAINT fk_content_user  FOREIGN KEY (user_id)  REFERENCES p_user  (id),
    CONSTRAINT fk_content_group FOREIGN KEY (group_id) REFERENCES p_group (id)
);

-- FTS 인덱스
CREATE INDEX IF NOT EXISTS idx_content_body_fts
    ON p_content USING GIN (to_tsvector('simple', body));

-- =====================================================
-- p_comment
-- =====================================================
CREATE TABLE IF NOT EXISTS p_comment (
    id                   BIGSERIAL,
    content_id           BIGINT       NOT NULL,
    parent_id            BIGINT,
    author_id            UUID         NOT NULL,
    body                 TEXT         NOT NULL,
    like_count           INTEGER      NOT NULL DEFAULT 0,
    created_by           VARCHAR(50)  NOT NULL,
    last_modified_by     VARCHAR(50),
    deleted_by           VARCHAR(50),
    created_date         TIMESTAMP    NOT NULL,
    last_modified_date   TIMESTAMP,
    deleted_date         TIMESTAMP,
    CONSTRAINT pk_comment PRIMARY KEY (id),
    CONSTRAINT fk_comment_content FOREIGN KEY (content_id) REFERENCES p_content (id),
    CONSTRAINT fk_comment_parent  FOREIGN KEY (parent_id)  REFERENCES p_comment (id),
    CONSTRAINT fk_comment_author  FOREIGN KEY (author_id)  REFERENCES p_user    (id)
);

CREATE INDEX IF NOT EXISTS idx_comment_content_id_parent_id
    ON p_comment (content_id, parent_id);

-- =====================================================
-- p_tag
-- =====================================================
CREATE TABLE IF NOT EXISTS p_tag (
    id                   BIGSERIAL,
    name                 VARCHAR(30)  NOT NULL,
    post_count           INTEGER      NOT NULL DEFAULT 0,
    created_date         TIMESTAMP    NOT NULL,
    last_modified_date   TIMESTAMP,
    deleted_date         TIMESTAMP,
    CONSTRAINT pk_tag PRIMARY KEY (id),
    CONSTRAINT uk_tag_name UNIQUE (name)
);

-- =====================================================
-- p_content_tag
-- =====================================================
CREATE TABLE IF NOT EXISTS p_content_tag (
    id                   BIGSERIAL,
    content_id           BIGINT       NOT NULL,
    tag_id               BIGINT       NOT NULL,
    created_date         TIMESTAMP    NOT NULL,
    CONSTRAINT pk_content_tag PRIMARY KEY (id),
    CONSTRAINT uk_content_tag         UNIQUE (content_id, tag_id),
    CONSTRAINT fk_content_tag_content FOREIGN KEY (content_id) REFERENCES p_content (id),
    CONSTRAINT fk_content_tag_tag     FOREIGN KEY (tag_id)     REFERENCES p_tag     (id)
);

CREATE INDEX IF NOT EXISTS idx_content_tag_tag_id
    ON p_content_tag (tag_id);

-- =====================================================
-- p_content_like
-- =====================================================
CREATE TABLE IF NOT EXISTS p_content_like (
    id                   BIGSERIAL,
    content_id           BIGINT       NOT NULL,
    user_id              UUID         NOT NULL,
    created_date         TIMESTAMP    NOT NULL,
    last_modified_date   TIMESTAMP,
    deleted_date         TIMESTAMP,
    CONSTRAINT pk_content_like PRIMARY KEY (id),
    CONSTRAINT uk_content_like_content_user UNIQUE (content_id, user_id),
    CONSTRAINT fk_content_like_content FOREIGN KEY (content_id) REFERENCES p_content (id),
    CONSTRAINT fk_content_like_user    FOREIGN KEY (user_id)    REFERENCES p_user    (id)
);

CREATE INDEX IF NOT EXISTS idx_content_like_content_id
    ON p_content_like (content_id);

-- =====================================================
-- p_comment_like
-- =====================================================
CREATE TABLE IF NOT EXISTS p_comment_like (
    id                   BIGSERIAL,
    comment_id           BIGINT       NOT NULL,
    user_id              UUID         NOT NULL,
    created_date         TIMESTAMP    NOT NULL,
    last_modified_date   TIMESTAMP,
    deleted_date         TIMESTAMP,
    CONSTRAINT pk_comment_like PRIMARY KEY (id),
    CONSTRAINT uk_comment_like_comment_user UNIQUE (comment_id, user_id),
    CONSTRAINT fk_comment_like_comment FOREIGN KEY (comment_id) REFERENCES p_comment (id),
    CONSTRAINT fk_comment_like_user    FOREIGN KEY (user_id)    REFERENCES p_user    (id)
);

CREATE INDEX IF NOT EXISTS idx_comment_like_comment_id
    ON p_comment_like (comment_id);

-- =====================================================
-- p_group_like
-- =====================================================
CREATE TABLE IF NOT EXISTS p_group_like (
    id                   BIGSERIAL,
    group_id             BIGINT       NOT NULL,
    user_id              UUID         NOT NULL,
    created_date         TIMESTAMP    NOT NULL,
    last_modified_date   TIMESTAMP,
    deleted_date         TIMESTAMP,
    CONSTRAINT pk_group_like PRIMARY KEY (id),
    CONSTRAINT uk_group_like_group_user UNIQUE (group_id, user_id),
    CONSTRAINT fk_group_like_group FOREIGN KEY (group_id) REFERENCES p_group (id),
    CONSTRAINT fk_group_like_user  FOREIGN KEY (user_id)  REFERENCES p_user  (id)
);

CREATE INDEX IF NOT EXISTS idx_group_like_group_id
    ON p_group_like (group_id);

-- =====================================================
-- p_image
-- =====================================================
CREATE TABLE IF NOT EXISTS p_image (
    id                   BIGSERIAL,
    target_type          VARCHAR(50)  NOT NULL,
    target_id            VARCHAR(100) NOT NULL,
    original_filename    VARCHAR(255) NOT NULL,
    stored_filename      VARCHAR(255) NOT NULL,
    file_url             VARCHAR(255) NOT NULL,
    file_size            BIGINT       NOT NULL,
    content_type         VARCHAR(50)  NOT NULL,
    sort_order           INTEGER      NOT NULL DEFAULT 0,
    created_date         TIMESTAMP    NOT NULL,
    last_modified_date   TIMESTAMP,
    deleted_date         TIMESTAMP,
    CONSTRAINT pk_image PRIMARY KEY (id),
    CONSTRAINT uk_image_stored_filename UNIQUE (stored_filename)
);

CREATE INDEX IF NOT EXISTS idx_image_target_type_id
    ON p_image (target_type, target_id);

-- =====================================================
-- p_schedule
-- =====================================================
CREATE TABLE IF NOT EXISTS p_schedule (
    id                   BIGSERIAL,
    group_id             BIGINT       NOT NULL,
    created_by_user_id   UUID         NOT NULL,
    title                VARCHAR(100) NOT NULL,
    start_at             TIMESTAMP    NOT NULL,
    end_at               TIMESTAMP    NOT NULL,
    location             VARCHAR(200),
    description          TEXT,
    created_by           VARCHAR(50)  NOT NULL,
    last_modified_by     VARCHAR(50),
    deleted_by           VARCHAR(50),
    created_date         TIMESTAMP    NOT NULL,
    last_modified_date   TIMESTAMP,
    deleted_date         TIMESTAMP,
    CONSTRAINT pk_schedule PRIMARY KEY (id),
    CONSTRAINT fk_schedule_group FOREIGN KEY (group_id)           REFERENCES p_group (id),
    CONSTRAINT fk_schedule_user  FOREIGN KEY (created_by_user_id) REFERENCES p_user  (id)
);
