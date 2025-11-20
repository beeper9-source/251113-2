-- peers 테이블에 email 컬럼 추가
ALTER TABLE peers 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 기존 데이터에 대한 설명 (선택사항)
-- 필요시 기존 데이터에 이메일을 업데이트할 수 있습니다:
-- UPDATE peers SET email = 'example@email.com' WHERE name = '이름';

