-- Prisma Migrate 는 마이그레이션을 검증할 때 shadow 데이터베이스를 임시로 만든다.
-- study 사용자에게는 기본적으로 study 스키마 권한만 있어서 생성이 거부된다(P3014).
-- 로컬 개발용 컨테이너이므로 전역 권한을 준다.
GRANT ALL PRIVILEGES ON *.* TO 'study'@'%';
FLUSH PRIVILEGES;
