-- Prisma 가 생성한 SQL 에 한글 COMMENT 를 직접 넣었다.
-- Prisma 스키마는 DB 레벨 COMMENT 를 표현하지 못하므로,
-- 스키마를 바꿀 때마다 새 마이그레이션 SQL 에도 COMMENT 를 같이 적어야 한다.

-- CreateTable
CREATE TABLE `track` (
    `id` VARCHAR(50) NOT NULL COMMENT '트랙 식별자 (backend, frontend, infra)',
    `title` VARCHAR(100) NOT NULL COMMENT '화면에 보이는 트랙명',
    `ord` SMALLINT NOT NULL COMMENT '목록 노출 순서',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='최상위 분류, 책 한 권에 해당';

-- CreateTable
CREATE TABLE `chapter` (
    `id` VARCHAR(64) NOT NULL COMMENT '장 식별자 (spring, jpa, kafka)',
    `track_id` VARCHAR(50) NOT NULL COMMENT '소속 트랙 FK',
    `title` VARCHAR(100) NOT NULL COMMENT '장 제목',
    `summary` VARCHAR(300) NOT NULL COMMENT '이 장에서 무엇을 다루는지 한 줄',
    `ord` SMALLINT NOT NULL COMMENT '트랙 안에서의 순서',

    INDEX `chapter_track_id_idx`(`track_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='개념을 묶는 장, 책의 챕터에 해당';

-- CreateTable
CREATE TABLE `concept` (
    `id` VARCHAR(64) NOT NULL COMMENT '개념 식별자, 본문의 [[id]] 표기에 쓰임',
    `chapter_id` VARCHAR(64) NOT NULL COMMENT '소속 장 FK',
    `title` VARCHAR(200) NOT NULL COMMENT '화면에 보이는 개념명',
    `summary` VARCHAR(500) NOT NULL COMMENT '한 문장 요약, 링크 미리보기에 그대로 쓰임',
    `version_note` VARCHAR(100) NULL COMMENT '기준 버전, 예: Spring Boot 3.2',
    `ord` SMALLINT NOT NULL COMMENT '장 안에서의 순서',
    `updated_at` DATETIME(3) NOT NULL COMMENT '마지막 수정 시각',

    INDEX `concept_chapter_id_idx`(`chapter_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='학습 개념 본문의 상위 정보';

-- CreateTable
CREATE TABLE `concept_level` (
    `concept_id` VARCHAR(64) NOT NULL COMMENT '개념 FK',
    `level` ENUM('intro', 'standard', 'deep') NOT NULL COMMENT '난이도 단계 (입문/중급/심화)',
    `body` MEDIUMTEXT NOT NULL COMMENT '마크다운 본문, [[id]] 링크와 visual 펜스 포함',
    `minutes` SMALLINT NOT NULL COMMENT '예상 읽기 시간(분)',

    PRIMARY KEY (`concept_id`, `level`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='개념별 3단계 본문';

-- CreateTable
CREATE TABLE `concept_section` (
    `concept_id` VARCHAR(64) NOT NULL COMMENT '개념 FK',
    `level` ENUM('intro', 'standard', 'deep') NOT NULL COMMENT '난이도 단계',
    `ord` SMALLINT NOT NULL COMMENT '본문 안 절 순서',
    `heading` VARCHAR(200) NOT NULL COMMENT '절 제목, 목차에 그대로 표시',
    `anchor` VARCHAR(100) NOT NULL COMMENT 'URL 앵커, 절로 바로 이동할 때 쓰임',

    PRIMARY KEY (`concept_id`, `level`, `ord`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='본문에서 추출한 목차, import 가 재생성';

-- CreateTable
CREATE TABLE `edge` (
    `from_id` VARCHAR(64) NOT NULL COMMENT '출발 개념',
    `to_id` VARCHAR(64) NOT NULL COMMENT '도착 개념',
    `type` ENUM('prerequisite', 'deepens', 'related') NOT NULL COMMENT '관계 종류 (선행/심화/연관)',

    INDEX `edge_to_id_idx`(`to_id`),
    PRIMARY KEY (`from_id`, `to_id`, `type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='개념 간 관계';

-- CreateTable
CREATE TABLE `concept_visual` (
    `id` VARCHAR(64) NOT NULL COMMENT '시각 자료 식별자, YAML 의 id 값',
    `concept_id` VARCHAR(64) NOT NULL COMMENT '소속 개념 FK',
    `level` ENUM('intro', 'standard', 'deep') NOT NULL COMMENT '어느 난이도 본문에 들어가는지',
    `title` VARCHAR(200) NOT NULL COMMENT '그림 제목, YAML 의 title',
    `kind` ENUM('step', 'sequence', 'structure', 'playground', 'custom') NOT NULL COMMENT '렌더러가 고를 컴포넌트 종류',
    `spec` JSON NOT NULL COMMENT '마크다운 visual 블록의 YAML 을 파싱한 값',
    `ord` SMALLINT NOT NULL COMMENT '본문 안 등장 순서',

    INDEX `concept_visual_concept_id_idx`(`concept_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='본문에 끼우는 조작 가능한 그림, import 가 재생성';

-- CreateTable
CREATE TABLE `prompt_template` (
    `id` VARCHAR(64) NOT NULL COMMENT '템플릿 식별자',
    `name` VARCHAR(100) NOT NULL COMMENT '목록에 보이는 이름',
    `body` TEXT NOT NULL COMMENT '프롬프트 본문, {{변수}} 포함',
    `updated_at` DATETIME(3) NOT NULL COMMENT '마지막 수정 시각',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='개념 추가용 AI 프롬프트 템플릿';

-- CreateTable
CREATE TABLE `note` (
    `concept_id` VARCHAR(64) NOT NULL COMMENT '개념 FK',
    `body` VARCHAR(500) NOT NULL COMMENT '내가 남긴 한줄 메모',
    `updated_at` DATETIME(3) NOT NULL COMMENT '마지막 수정 시각',

    PRIMARY KEY (`concept_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='개념별 개인 메모, 사이트에서 직접 쓰는 유일한 데이터';

-- CreateTable
CREATE TABLE `source` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '일련번호',
    `concept_id` VARCHAR(64) NOT NULL COMMENT '개념 FK',
    `label` VARCHAR(200) NOT NULL COMMENT '출처 이름',
    `url` VARCHAR(500) NOT NULL COMMENT '원문 주소',

    INDEX `source_concept_id_idx`(`concept_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='개념별 원문 링크';

-- AddForeignKey
ALTER TABLE `chapter` ADD CONSTRAINT `chapter_track_id_fkey` FOREIGN KEY (`track_id`) REFERENCES `track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept` ADD CONSTRAINT `concept_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_level` ADD CONSTRAINT `concept_level_concept_id_fkey` FOREIGN KEY (`concept_id`) REFERENCES `concept`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_section` ADD CONSTRAINT `concept_section_concept_id_fkey` FOREIGN KEY (`concept_id`) REFERENCES `concept`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `edge` ADD CONSTRAINT `edge_from_id_fkey` FOREIGN KEY (`from_id`) REFERENCES `concept`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `edge` ADD CONSTRAINT `edge_to_id_fkey` FOREIGN KEY (`to_id`) REFERENCES `concept`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concept_visual` ADD CONSTRAINT `concept_visual_concept_id_fkey` FOREIGN KEY (`concept_id`) REFERENCES `concept`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note` ADD CONSTRAINT `note_concept_id_fkey` FOREIGN KEY (`concept_id`) REFERENCES `concept`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `source` ADD CONSTRAINT `source_concept_id_fkey` FOREIGN KEY (`concept_id`) REFERENCES `concept`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
