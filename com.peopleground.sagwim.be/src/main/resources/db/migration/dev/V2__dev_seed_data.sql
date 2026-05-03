-- =====================================================
-- V2: 개발 환경 시드 데이터
-- 운영 환경에서는 flyway.locations에 classpath:db/seed를 추가하지 않으면 실행되지 않음
-- 이 파일은 dev 프로파일에서만 실행하도록 application-dev.yaml에서 제어
-- =====================================================

-- =====================================================
-- 유저 4명 INSERT
-- 비밀번호: Test1234! (BCrypt)
-- =====================================================
INSERT INTO p_user (id, username, password, nickname, user_email, role, address, location, email_verified, provider, created_date, last_modified_date)
VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001',
     'admin',
     '$2b$12$GyTqeqs3nX.UPHJDv/cCEO3m00XtDN.v.UPDbVX0eQOOOrzR8krua',
     '관리자',
     'admin@sagwim.com',
     'ADMIN',
     '서울 강남구 삼성동',
     ST_SetSRID(ST_MakePoint(127.0590, 37.5140), 4326)::geography,
     true,
     'LOCAL',
     NOW(),
     NOW()),

    ('aaaaaaaa-0000-0000-0000-000000000002',
     'user1',
     '$2b$12$GyTqeqs3nX.UPHJDv/cCEO3m00XtDN.v.UPDbVX0eQOOOrzR8krua',
     '유저일',
     'user1@sagwim.com',
     'USER',
     '서울 마포구 합정동',
     ST_SetSRID(ST_MakePoint(126.9134, 37.5498), 4326)::geography,
     true,
     'LOCAL',
     NOW(),
     NOW()),

    ('aaaaaaaa-0000-0000-0000-000000000003',
     'user2',
     '$2b$12$GyTqeqs3nX.UPHJDv/cCEO3m00XtDN.v.UPDbVX0eQOOOrzR8krua',
     '유저이',
     'user2@sagwim.com',
     'USER',
     '서울 송파구 잠실동',
     ST_SetSRID(ST_MakePoint(127.1003, 37.5131), 4326)::geography,
     true,
     'LOCAL',
     NOW(),
     NOW()),

    ('aaaaaaaa-0000-0000-0000-000000000004',
     'user3',
     '$2b$12$GyTqeqs3nX.UPHJDv/cCEO3m00XtDN.v.UPDbVX0eQOOOrzR8krua',
     '유저삼',
     'user3@sagwim.com',
     'USER',
     '서울 종로구 세종로',
     ST_SetSRID(ST_MakePoint(126.9769, 37.5759), 4326)::geography,
     true,
     'LOCAL',
     NOW(),
     NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 게시글 100개 INSERT (유저별 25개)
-- =====================================================

INSERT INTO p_content (body, user_id, like_count, comment_count, view_count, created_by, last_modified_by, created_date, last_modified_date)
SELECT
    '이것은 관리자가 작성한 ' || s || '번째 테스트 게시글입니다.',
    'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
    0, 0, 0, 'admin', 'admin',
    NOW() - (s || ' minutes')::interval,
    NOW() - (s || ' minutes')::interval
FROM generate_series(1, 25) s;

INSERT INTO p_content (body, user_id, like_count, comment_count, view_count, created_by, last_modified_by, created_date, last_modified_date)
SELECT
    '이것은 user1이 작성한 ' || s || '번째 테스트 게시글입니다.',
    'aaaaaaaa-0000-0000-0000-000000000002'::uuid,
    0, 0, 0, 'user1', 'user1',
    NOW() - (s || ' minutes')::interval,
    NOW() - (s || ' minutes')::interval
FROM generate_series(1, 25) s;

INSERT INTO p_content (body, user_id, like_count, comment_count, view_count, created_by, last_modified_by, created_date, last_modified_date)
SELECT
    '이것은 user2가 작성한 ' || s || '번째 테스트 게시글입니다.',
    'aaaaaaaa-0000-0000-0000-000000000003'::uuid,
    0, 0, 0, 'user2', 'user2',
    NOW() - (s || ' minutes')::interval,
    NOW() - (s || ' minutes')::interval
FROM generate_series(1, 25) s;

INSERT INTO p_content (body, user_id, like_count, comment_count, view_count, created_by, last_modified_by, created_date, last_modified_date)
SELECT
    '이것은 user3이 작성한 ' || s || '번째 테스트 게시글입니다.',
    'aaaaaaaa-0000-0000-0000-000000000004'::uuid,
    0, 0, 0, 'user3', 'user3',
    NOW() - (s || ' minutes')::interval,
    NOW() - (s || ' minutes')::interval
FROM generate_series(1, 25) s;
