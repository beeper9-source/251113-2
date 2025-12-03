-- peers 테이블에 이균홍 추가
INSERT INTO peers (name, email)
VALUES ('이균홍', 'kkunong.lee@samsung.com')
ON CONFLICT (name) DO UPDATE SET email = EXCLUDED.email;


